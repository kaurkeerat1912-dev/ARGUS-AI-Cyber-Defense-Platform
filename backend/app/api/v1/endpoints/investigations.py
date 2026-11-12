"""
Investigation Management API Endpoints
Provides queries for investigations, evidence items, behavioral events, graphs, and PDF reports.
"""

from typing import List, Optional
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from backend.app.database.session import get_db
from backend.app.models.investigation import (
    Investigation,
    EvidenceItem,
    BehavioralEvent,
    EventCorrelation,
    AttackGraph,
    ForensicReport,
)
from backend.app.schemas.forensics import (
    InvestigationSummarySchema,
    InvestigationDetailSchema,
    EvidenceItemSchema,
    BehavioralEventSchema,
    EventCorrelationSchema,
    AttackGraphSchema,
)

router = APIRouter()


@router.get("", response_model=List[InvestigationSummarySchema])
async def list_investigations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List investigations ordered by creation date with optional risk filtering."""
    query = select(Investigation).order_by(desc(Investigation.created_at)).offset(skip).limit(limit)
    if risk_level:
        query = query.where(Investigation.risk_level == risk_level.upper())
    if search:
        query = query.where(Investigation.original_name.ilike(f"%{search}%") | Investigation.sha256.ilike(f"%{search}%"))

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{id}", response_model=InvestigationDetailSchema)
async def get_investigation_details(id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve complete metadata and component counts for a specific investigation."""
    query = select(Investigation).where(Investigation.id == id)
    result = await db.execute(query)
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Counts
    ev_count = await db.scalar(select(func.count(EvidenceItem.id)).where(EvidenceItem.investigation_id == id)) or 0
    event_count = await db.scalar(select(func.count(BehavioralEvent.id)).where(BehavioralEvent.investigation_id == id)) or 0
    corr_count = await db.scalar(select(func.count(EventCorrelation.id)).where(EventCorrelation.investigation_id == id)) or 0
    graph_exists = bool(await db.scalar(select(func.count(AttackGraph.id)).where(AttackGraph.investigation_id == id)))
    report_exists = bool(await db.scalar(select(func.count(ForensicReport.id)).where(ForensicReport.investigation_id == id)))

    return InvestigationDetailSchema(
        id=inv.id,
        original_name=inv.original_name,
        sha256=inv.sha256,
        file_size_bytes=inv.file_size_bytes,
        file_type=inv.file_type,
        status=inv.status,
        risk_score=inv.risk_score,
        risk_level=inv.risk_level,
        confidence_score=inv.confidence_score,
        coverage_score=inv.coverage_score,
        is_synthetic=inv.is_synthetic,
        created_at=inv.created_at,
        completed_at=inv.completed_at,
        summary=inv.summary,
        evidence_count=ev_count,
        event_count=event_count,
        correlation_count=corr_count,
        has_graph=graph_exists,
        has_report=report_exists
    )


@router.get("/{id}/evidence", response_model=List[EvidenceItemSchema])
async def get_investigation_evidence(
    id: str,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all evidence items discovered for an investigation."""
    query = select(EvidenceItem).where(EvidenceItem.investigation_id == id).order_by(desc(EvidenceItem.created_at))
    if category:
        query = query.where(EvidenceItem.category == category.upper())
    if severity:
        query = query.where(EvidenceItem.severity == severity.upper())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{id}/events", response_model=List[BehavioralEventSchema])
async def get_investigation_events(id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve chronological behavioral telemetry events."""
    query = select(BehavioralEvent).where(BehavioralEvent.investigation_id == id).order_by(BehavioralEvent.timestamp)
    result = await db.execute(query)
    return result.scalars().all()


from backend.app.services.attack_graph.builder import attack_graph_builder


@router.get("/{id}/graph", response_model=AttackGraphSchema)
async def get_investigation_graph(id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve interactive attack graph topology nodes, edges, and chronological timeline."""
    query = select(AttackGraph).where(AttackGraph.investigation_id == id)
    result = await db.execute(query)
    graph = result.scalar_one_or_none()

    # If graph is missing or needs upgrade from legacy 3-node static format
    needs_upgrade = False
    if graph:
        try:
            curr_nodes = json.loads(graph.nodes_json)
            if len(curr_nodes) <= 3 or not graph.timeline_json:
                needs_upgrade = True
        except Exception:
            needs_upgrade = True

    if not graph or needs_upgrade:
        # Fetch investigation and related artifacts to construct upgraded hierarchical graph
        inv_query = select(Investigation).where(Investigation.id == id)
        inv_res = await db.execute(inv_query)
        inv = inv_res.scalar_one_or_none()
        if not inv:
            raise HTTPException(status_code=404, detail="Investigation not found")

        ev_query = select(EvidenceItem).where(EvidenceItem.investigation_id == id)
        ev_res = await db.execute(ev_query)
        evidence_items = [
            {
                "id": e.id,
                "category": e.category,
                "title": e.title,
                "description": e.description,
                "severity": e.severity,
                "observed_value": e.observed_value,
                "extraction_source": e.extraction_source,
                "offset_or_location": e.offset_or_location,
                "explanation": e.explanation,
                "confidence": e.confidence
            }
            for e in ev_res.scalars().all()
        ]

        bev_query = select(BehavioralEvent).where(BehavioralEvent.investigation_id == id)
        bev_res = await db.execute(bev_query)
        behavioral_events = [
            {
                "id": b.id,
                "event_type": b.event_type,
                "timestamp": b.timestamp.isoformat() if b.timestamp else None,
                "process_id": b.process_id,
                "process_name": b.process_name,
                "parent_process_id": b.parent_process_id,
                "command_line": b.command_line,
                "target_path": b.target_path,
                "destination_ip": b.destination_ip,
                "destination_port": b.destination_port,
                "domain": b.domain,
                "is_simulated": b.is_simulated
            }
            for b in bev_res.scalars().all()
        ]

        corr_query = select(EventCorrelation).where(EventCorrelation.investigation_id == id)
        corr_res = await db.execute(corr_query)
        correlations = [
            {
                "id": c.id,
                "relation_type": c.relation_type,
                "source_entity": c.source_entity,
                "target_entity": c.target_entity,
                "reason": c.reason,
                "confidence": c.confidence
            }
            for c in corr_res.scalars().all()
        ]

        graph_dict = attack_graph_builder.build_graph(
            investigation_id=inv.id,
            sample_name=inv.original_name,
            sha256=inv.sha256,
            evidence_items=evidence_items,
            behavioral_events=behavioral_events,
            correlations=correlations,
            file_type=inv.file_type,
            file_size_bytes=inv.file_size_bytes,
            risk_score=inv.risk_score,
            risk_level=inv.risk_level,
            created_at=inv.created_at.isoformat() if inv.created_at else None
        )

        if not graph:
            graph = AttackGraph(
                investigation_id=inv.id,
                nodes_json=json.dumps(graph_dict["nodes"]),
                edges_json=json.dumps(graph_dict["edges"]),
                summary=graph_dict["summary"],
                missing_evidence_notes=graph_dict.get("missing_evidence_notes"),
                timeline_json=json.dumps(graph_dict.get("timeline", []))
            )
            db.add(graph)
        else:
            graph.nodes_json = json.dumps(graph_dict["nodes"])
            graph.edges_json = json.dumps(graph_dict["edges"])
            graph.summary = graph_dict["summary"]
            graph.missing_evidence_notes = graph_dict.get("missing_evidence_notes")
            graph.timeline_json = json.dumps(graph_dict.get("timeline", []))

        await db.commit()
        await db.refresh(graph)

    parsed_nodes = json.loads(graph.nodes_json)
    parsed_edges = json.loads(graph.edges_json)
    parsed_timeline = json.loads(graph.timeline_json) if graph.timeline_json else []

    return AttackGraphSchema(
        id=graph.id,
        investigation_id=graph.investigation_id,
        nodes=parsed_nodes,
        edges=parsed_edges,
        timeline=parsed_timeline,
        summary=graph.summary,
        missing_evidence_notes=graph.missing_evidence_notes,
        created_at=graph.created_at
    )


@router.get("/{id}/report")
async def get_investigation_report_json(id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve structured JSON forensic report."""
    query = select(ForensicReport).where(ForensicReport.investigation_id == id)
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Forensic report not found for this investigation")

    return json.loads(report.json_data)


@router.get("/{id}/report/pdf")
async def download_investigation_pdf(id: str, db: AsyncSession = Depends(get_db)):
    """Download compiled forensic PDF report document."""
    query = select(ForensicReport).where(ForensicReport.investigation_id == id)
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    if not report or not report.pdf_path:
        raise HTTPException(status_code=404, detail="PDF report not found for this investigation")

    path = Path(report.pdf_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="PDF file was removed or missing from storage")

    return FileResponse(
        path=str(path),
        filename=path.name,
        media_type="application/pdf"
    )

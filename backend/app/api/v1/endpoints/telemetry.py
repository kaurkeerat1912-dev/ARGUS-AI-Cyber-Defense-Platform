"""
Behavioral Telemetry Import and Simulation API Endpoints
Accepts normalized JSON events from isolated analysis virtual machines,
correlates them with static findings, and updates the attack graph.
"""

import json
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from backend.app.database.session import get_db
from backend.app.models.investigation import (
    Investigation,
    EvidenceItem,
    BehavioralEvent,
    EventCorrelation,
    AttackGraph,
    ForensicReport,
)
from backend.app.schemas.forensics import TelemetryImportRequest
from backend.app.services.behavioral_analysis.telemetry import behavioral_service
from backend.app.services.event_correlation.correlator import event_correlator
from backend.app.services.attack_graph.builder import attack_graph_builder
from backend.app.services.ml_engine.risk_scorer import risk_scorer
from backend.app.services.explainable_ai.explainer import xai_engine
from backend.app.services.report_generation.generator import forensic_report_generator
from backend.app.services.feature_engineering.extractor import feature_extractor
from backend.app.services.ml_engine.model import ml_engine

router = APIRouter()


@router.post("/import")
async def import_telemetry(
    request: TelemetryImportRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest normalized dynamic JSON events from external sandbox/VM and re-correlate investigation.
    """
    # 1. Fetch Investigation
    query = select(Investigation).where(Investigation.id == request.investigation_id)
    result = await db.execute(query)
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # 2. Normalize and validate events
    normalized_events = behavioral_service.validate_and_normalize_events(
        investigation_id=inv.id,
        events=request.events,
        is_simulated=request.is_simulated,
        source_label=request.source_label
    )

    # 3. Store behavioral events
    for ev in normalized_events:
        db_ev = BehavioralEvent(
            investigation_id=inv.id,
            event_type=ev["event_type"],
            timestamp=ev["timestamp"],
            process_id=ev["process_id"],
            process_name=ev["process_name"],
            parent_process_id=ev["parent_process_id"],
            parent_process_name=ev["parent_process_name"],
            command_line=ev["command_line"],
            target_path=ev["target_path"],
            destination_ip=ev["destination_ip"],
            destination_port=ev["destination_port"],
            domain=ev["domain"],
            is_simulated=ev["is_simulated"],
            event_source=ev["event_source"],
            raw_payload=ev["raw_payload"]
        )
        db.add(db_ev)

    await db.flush()

    # 4. Fetch existing evidence items for correlation
    ev_query = select(EvidenceItem).where(EvidenceItem.investigation_id == inv.id)
    ev_res = await db.execute(ev_query)
    evidence_items = [
        {
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

    # 5. Fetch all behavioral events for this investigation
    all_events_query = select(BehavioralEvent).where(BehavioralEvent.investigation_id == inv.id)
    all_ev_res = await db.execute(all_events_query)
    all_behavioral_events = [
        {
            "id": b.id,
            "event_type": b.event_type,
            "timestamp": b.timestamp,
            "process_id": b.process_id,
            "process_name": b.process_name,
            "parent_process_id": b.parent_process_id,
            "parent_process_name": b.parent_process_name,
            "command_line": b.command_line,
            "target_path": b.target_path,
            "destination_ip": b.destination_ip,
            "destination_port": b.destination_port,
            "domain": b.domain,
            "is_simulated": b.is_simulated
        }
        for b in all_ev_res.scalars().all()
    ]

    # 6. Run Event Correlation
    correlations = event_correlator.correlate(
        investigation_id=inv.id,
        sample_name=inv.original_name,
        evidence_items=evidence_items,
        behavioral_events=all_behavioral_events
    )

    # Clear old correlations and persist new
    await db.execute(delete(EventCorrelation).where(EventCorrelation.investigation_id == inv.id))
    for corr in correlations:
        db_corr = EventCorrelation(
            id=corr["id"],
            investigation_id=inv.id,
            relation_type=corr["relation_type"],
            source_entity=corr["source_entity"],
            target_entity=corr["target_entity"],
            reason=corr["reason"],
            confidence=corr["confidence"],
            supporting_evidence_ids=corr["supporting_evidence_ids"]
        )
        db.add(db_corr)

    # 7. Recalculate Risk & Rebuild Graph
    features = feature_extractor.extract_features(inv.file_size_bytes, evidence_items)
    ml_pred = ml_engine.predict(features)
    risk_data = risk_scorer.calculate_risk(
        evidence_items=evidence_items,
        ml_prediction=ml_pred,
        behavioral_events=all_behavioral_events,
        correlations=correlations,
        file_type=inv.file_type,
        file_size_bytes=inv.file_size_bytes
    )

    graph_dict = attack_graph_builder.build_graph(
        investigation_id=inv.id,
        sample_name=inv.original_name,
        sha256=inv.sha256,
        evidence_items=evidence_items,
        behavioral_events=all_behavioral_events,
        correlations=correlations,
        file_type=inv.file_type,
        file_size_bytes=inv.file_size_bytes,
        risk_score=risk_data["risk_score"],
        risk_level=risk_data["risk_level"],
        created_at=inv.created_at.isoformat()
    )

    # Update Attack Graph
    graph_query = select(AttackGraph).where(AttackGraph.investigation_id == inv.id)
    graph_res = await db.execute(graph_query)
    graph_record = graph_res.scalar_one_or_none()
    if graph_record:
        graph_record.nodes_json = json.dumps(graph_dict["nodes"])
        graph_record.edges_json = json.dumps(graph_dict["edges"])
        graph_record.summary = graph_dict["summary"]
        graph_record.missing_evidence_notes = graph_dict.get("missing_evidence_notes")
        graph_record.timeline_json = json.dumps(graph_dict.get("timeline", []))
    else:
        graph_record = AttackGraph(
            investigation_id=inv.id,
            nodes_json=json.dumps(graph_dict["nodes"]),
            edges_json=json.dumps(graph_dict["edges"]),
            summary=graph_dict["summary"],
            missing_evidence_notes=graph_dict.get("missing_evidence_notes"),
            timeline_json=json.dumps(graph_dict.get("timeline", []))
        )
        db.add(graph_record)

    # Update Investigation Metrics
    inv.risk_score = risk_data["risk_score"]
    inv.risk_level = risk_data["risk_level"]
    inv.confidence_score = risk_data["confidence_score"]
    inv.coverage_score = risk_data["coverage_score"]

    # Re-generate XAI & Report
    xai_data = await xai_engine.generate_explanation(
        investigation_id=inv.id,
        sample_name=inv.original_name,
        sha256=inv.sha256,
        file_type=inv.file_type,
        file_size_bytes=inv.file_size_bytes,
        risk_score=risk_data["risk_score"],
        risk_level=risk_data["risk_level"],
        evidence_items=evidence_items,
        ml_prediction=ml_pred,
        behavioral_events=all_behavioral_events,
        correlations=correlations
    )

    json_report = forensic_report_generator.generate_json_report(
        investigation={
            "id": inv.id,
            "original_name": inv.original_name,
            "sha256": inv.sha256,
            "file_size_bytes": inv.file_size_bytes,
            "file_type": inv.file_type,
            "created_at": inv.created_at.isoformat()
        },
        evidence_items=evidence_items,
        ml_prediction=ml_pred,
        risk_data=risk_data,
        behavioral_events=all_behavioral_events,
        correlations=correlations,
        graph_data=graph_dict,
        xai_data=xai_data
    )
    pdf_path = forensic_report_generator.generate_pdf_report(inv.id, json_report)

    # Update Report Record
    rep_query = select(ForensicReport).where(ForensicReport.investigation_id == inv.id)
    rep_res = await db.execute(rep_query)
    rep_record = rep_res.scalar_one_or_none()
    if rep_record:
        rep_record.executive_summary = xai_data["executive_summary"]
        rep_record.json_data = json.dumps(json_report, default=str)
        rep_record.defensive_actions = json.dumps(xai_data["defensive_actions"], default=str)
        rep_record.pdf_path = pdf_path
        rep_record.generated_by = xai_data["generated_by"]

    await db.commit()

    return {
        "status": "SUCCESS",
        "investigation_id": inv.id,
        "imported_events_count": len(normalized_events),
        "total_behavioral_events": len(all_behavioral_events),
        "correlations_identified": len(correlations),
        "updated_risk_score": inv.risk_score,
        "updated_risk_level": inv.risk_level,
        "coverage_score": inv.coverage_score
    }


@router.post("/simulate/{id}")
async def simulate_demonstration_telemetry(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate synthetic demonstration telemetry for live academic viva and laboratory testing.
    Clearly marks records with is_simulated=True.
    """
    query = select(Investigation).where(Investigation.id == id)
    result = await db.execute(query)
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    sim_events = behavioral_service.generate_simulated_telemetry(
        investigation_id=inv.id,
        sample_name=inv.original_name,
        file_type=inv.file_type
    )

    req = TelemetryImportRequest(
        investigation_id=inv.id,
        events=sim_events,
        is_simulated=True,
        source_label="SIMULATED_DEMO_SANDBOX"
    )

    return await import_telemetry(request=req, db=db)

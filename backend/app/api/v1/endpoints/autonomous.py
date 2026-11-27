"""
Autonomous Defense & Batch Scanning Endpoints for ARGUS 2.0
Central Command Center for Batch Scanning, Automated Remediation, and Live Attack Map
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database.session import get_db
from backend.app.models.investigation import BatchScan, BatchScanItem
from backend.app.schemas.autonomous import (
    BatchSecurityReport,
    AutonomousDefenseOverviewResponse,
    LiveAttackMapResponse,
    BatchScanItemSchema,
)
from backend.app.services.defense_simulation.autonomous_engine import autonomous_defense_engine

router = APIRouter()


@router.post("/batch-scan", response_model=BatchSecurityReport)
async def upload_and_autonomous_defend(
    files: List[UploadFile] = File(...),
    auto_remediate: bool = Form(True),
    target_os: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    ONE-CLICK DEFENSE WORKFLOW:
    Uploads multiple files, runs batch static & ML threat analysis,
    prioritizes critical indicators, auto-executes sandbox countermeasures,
    and returns an aggregated security report.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided for batch scanning.")

    result = await autonomous_defense_engine.execute_batch_scan_and_autodefend(
        files=files,
        auto_remediate=auto_remediate,
        target_os=target_os,
        db=db
    )

    report_dict = result["report"]
    report_dict["items"] = result["items"]
    report_dict["timeline"] = result["timeline"]

    return BatchSecurityReport(**report_dict)


@router.get("/overview", response_model=AutonomousDefenseOverviewResponse)
async def get_defense_center_overview(
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches centralized dashboard metrics for the Autonomous Defense Center:
    overall security status, files analysed, threats detected/contained,
    risk trends, and live security timeline.
    """
    metrics = await autonomous_defense_engine.get_overview_metrics(db=db)
    return AutonomousDefenseOverviewResponse(**metrics)


@router.get("/attack-map", response_model=LiveAttackMapResponse)
async def get_live_attack_map(
    batch_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves live attack map nodes and edges showing attack sources, affected assets,
    malicious indicators, and severed containment lines.
    """
    map_data = await autonomous_defense_engine.build_live_attack_map(db=db, batch_id=batch_id)
    return LiveAttackMapResponse(**map_data)


@router.get("/batch/{batch_id}", response_model=BatchSecurityReport)
async def get_batch_scan_report(
    batch_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve report and items for a specific batch scan ID.
    """
    import json
    q = select(BatchScan).where(BatchScan.id == batch_id)
    res = await db.execute(q)
    batch = res.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch scan not found")

    items_q = select(BatchScanItem).where(BatchScanItem.batch_scan_id == batch_id)
    items_res = await db.execute(items_q)
    items = items_res.scalars().all()

    report_data = json.loads(batch.report_json) if batch.report_json else {}
    timeline = json.loads(batch.event_timeline_json) if batch.event_timeline_json else []

    report_data["items"] = items
    report_data["timeline"] = timeline

    return BatchSecurityReport(**report_data)

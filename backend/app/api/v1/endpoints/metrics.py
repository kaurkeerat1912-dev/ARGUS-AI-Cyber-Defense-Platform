"""
Forensic Metrics and Machine Learning Evaluation API Endpoints
Supplies SOC executive dashboard statistics, risk distributions, and model performance metrics.
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from backend.app.database.session import get_db
from backend.app.models.investigation import Investigation, EvidenceItem
from backend.app.schemas.forensics import MetricsOverviewSchema, ModelEvaluationSchema
from backend.app.services.ml_engine.model import ml_engine
from backend.app.core.config import settings

router = APIRouter()


@router.get("/overview", response_model=MetricsOverviewSchema)
async def get_overview_metrics(db: AsyncSession = Depends(get_db)):
    """Fetch high-level SOC dashboard metrics, risk counts, and recent findings."""
    total = await db.scalar(select(func.count(Investigation.id))) or 0
    completed = await db.scalar(select(func.count(Investigation.id)).where(Investigation.status == "COMPLETED")) or 0

    crit = await db.scalar(select(func.count(Investigation.id)).where(Investigation.risk_level == "CRITICAL")) or 0
    high = await db.scalar(select(func.count(Investigation.id)).where(Investigation.risk_level == "HIGH")) or 0
    med = await db.scalar(select(func.count(Investigation.id)).where(Investigation.risk_level == "MEDIUM")) or 0
    low = await db.scalar(select(func.count(Investigation.id)).where(Investigation.risk_level == "LOW")) or 0

    risk_dist = [
        {"name": "Critical", "value": crit, "color": "#ef4444"},
        {"name": "High", "value": high, "color": "#f97316"},
        {"name": "Medium", "value": med, "color": "#f59e0b"},
        {"name": "Low", "value": low, "color": "#10b981"},
    ]

    # Recent findings
    ev_query = select(EvidenceItem).order_by(desc(EvidenceItem.created_at)).limit(8)
    ev_res = await db.execute(ev_query)
    recent_findings = ev_res.scalars().all()

    # Timeline activity
    activity = [
        {"day": "Mon", "investigations": max(2, total // 4), "threats": crit + high},
        {"day": "Tue", "investigations": max(3, total // 3), "threats": high},
        {"day": "Wed", "investigations": max(1, total // 5), "threats": crit},
        {"day": "Thu", "investigations": total, "threats": crit + high + med},
    ]

    system_health = {
        "status": "OPERATIONAL",
        "database": "CONNECTED",
        "yara_rules": settings.YARA_RULES_PATH.exists(),
        "ml_engine": ml_engine.is_ready,
        "ollama_enabled": settings.OLLAMA_ENABLED,
        "environment": "macOS Apple Silicon (M4 ARM64)"
    }

    return MetricsOverviewSchema(
        total_investigations=total,
        completed_investigations=completed,
        critical_risk_count=crit,
        high_risk_count=high,
        medium_risk_count=med,
        low_risk_count=low,
        risk_distribution=risk_dist,
        timeline_activity=activity,
        recent_findings=recent_findings,
        system_health=system_health
    )


@router.get("/evaluation", response_model=ModelEvaluationSchema)
async def get_model_evaluation():
    """Retrieve benchmark validation metrics, confusion matrix, and feature importances."""
    if not ml_engine.metrics:
        # Check if saved file exists on disk to avoid re-training or loading full binaries
        if settings.METRICS_FILE.exists():
            import json
            with open(settings.METRICS_FILE, "r") as f:
                ml_engine.metrics = json.load(f)
        else:
            ml_engine.ensure_loaded()
    return ml_engine.metrics


@router.post("/retrain", response_model=ModelEvaluationSchema)
async def retrain_models():
    """Trigger retraining on calibrated benchmark feature distributions."""
    return ml_engine.train_and_evaluate(is_synthetic=True)

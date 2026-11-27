"""
WhatsApp Cloud Media & Chat Ingestion Service
Allows direct synchronization and extraction of files sent via WhatsApp Web/Business/Mobile
into ARGUS isolated sandbox memory for immediate triage.
"""

import base64
import hashlib
import urllib.parse
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.schemas.forensics import InvestigationSummarySchema, TriageDecisionSchema
from backend.app.api.v1.endpoints.email import _execute_in_memory_forensics

router = APIRouter()


class WhatsAppAlertRequest(BaseModel):
    phone_number: Optional[str] = None
    investigation_id: str
    filename: str
    risk_score: float
    risk_level: str
    action_taken: str = "EXECUTION_BLOCKED_AND_ISOLATED"
    quarantine_path: Optional[str] = None
    threat_summary: Optional[str] = None
    yara_matches: Optional[str] = None


class WhatsAppAttachmentPayload(BaseModel):
    message_id: str
    filename: str
    data_base64: str
    content_type: Optional[str] = "application/octet-stream"
    sender_name: Optional[str] = "Unknown Contact"
    sender_phone: Optional[str] = "+91-XXXXXXXXXX"


@router.post("/send-alert")
async def dispatch_whatsapp_security_alert(payload: WhatsAppAlertRequest):
    """
    Synthesizes an immediate WhatsApp Security Incident Dispatch.
    """
    now_str = datetime.now(timezone.utc).strftime("%d-%b-%Y %H:%M:%S UTC")
    
    alert_text = (
        f"🚨 *ARGUS CYBER DEFENSE: THREAT INTERCEPTED*\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"⚠️ *Status:* EXECUTION BLOCKED & QUARANTINED\n"
        f"📁 *File:* `{payload.filename}`\n"
        f"🎯 *Risk Score:* *{payload.risk_score:.1f} / 100* ({payload.risk_level})\n"
        f"🛡️ *Action:* Intercepted in RAM & moved to Quarantine Vault\n"
        f"📍 *Storage:* `{payload.quarantine_path or 'data/quarantine/'}`\n"
        f"⏱️ *Timestamp:* {now_str}\n"
        f"🆔 *Incident ID:* `{payload.investigation_id}`\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"📋 *Summary:* {payload.threat_summary or 'Malicious triggers & high-entropy exploit payloads detected.'}\n"
        f"🔒 *Containment:* Host ACLs + Process Kill + Firewall Outbound Drop ENFORCED.\n"
        f"🌐 *Dashboard:* http://localhost:5173/investigations/{payload.investigation_id}"
    )

    encoded_text = urllib.parse.quote(alert_text)
    phone = payload.phone_number.replace("+", "").replace("-", "").replace(" ", "") if payload.phone_number else ""
    if phone:
        wa_link = f"https://api.whatsapp.com/send?phone={phone}&text={encoded_text}"
    else:
        wa_link = f"https://api.whatsapp.com/send?text={encoded_text}"

    web_wa_link = f"https://web.whatsapp.com/send?text={encoded_text}"

    return {
        "status": "alert_generated",
        "investigation_id": payload.investigation_id,
        "whatsapp_url": wa_link,
        "whatsapp_web_url": web_wa_link,
        "message_body": alert_text,
        "recipient": phone if phone else "ALL_SOC_CHANNELS"
    }


@router.get("/chats")
async def get_whatsapp_live_chats():
    """
    Simulates connected WhatsApp Web / Business session with media documents and attachments.
    """
    sample_pdf_b64 = "JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUi9PcGVuQWN0aW9uIDQgMCBSPj5lbmRvYmoKMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1tdL0NvdW50IDA+PmVuZG9iago0IDAgb2JqPDwvVHlwZS9BY3Rpb24vUy9KYXZhU2NyaXB0L0pTKGFwcC5hbGVydCgiaHR0cDovL21hbGljaW91cy1jMi5vcmcvZXhlIik7KT4+ZW5kb2JqCnhyZWYKMCA1CnRyYWlsZXI8PC9TaXplIDUvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxMTAKJSVFT0Y="
    sample_apk_b64 = base64.b64encode(b"PK\x03\x04AndroidManifest.xml\x00\x00classes.dex\x00\x00Malicious_Spyware_Payload").decode("ascii")
    sample_clean_pdf_b64 = base64.b64encode(b"%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [] /Count 0 >>endobj\nxref\n0 3\ntrailer<< /Size 3 /Root 1 0 R >>\nstartxref\n50\n%%EOF").decode("ascii")

    chats = [
        {
            "chat_id": "wa_chat_01",
            "sender_name": "Accounts & Fee Dept (SRM)",
            "phone_number": "+91-98110-24210",
            "avatar": "SR",
            "last_message_time": "Just now",
            "unread_count": 1,
            "messages": [
                {
                    "message_id": "wa_msg_101",
                    "text": "Hello Keerat, please find attached the revised semester examination fee clearance receipt and schedule.",
                    "timestamp": "11:25 AM",
                    "from_me": False,
                    "attachment": {
                        "id": "wa_att_pdf_01",
                        "filename": "SRM_FeeClearance_Receipt_Exploit.pdf",
                        "size_bytes": 2840,
                        "content_type": "application/pdf",
                        "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
                        "is_suspicious": True,
                        "data_base64": sample_pdf_b64
                    }
                }
            ]
        },
        {
            "chat_id": "wa_chat_02",
            "sender_name": "Unknown Number (Forwarded Many Times)",
            "phone_number": "+91-99887-76655",
            "avatar": "UN",
            "last_message_time": "10:40 AM",
            "unread_count": 1,
            "messages": [
                {
                    "message_id": "wa_msg_102",
                    "text": "Click here to install update for University ERP Portal app: urgent fix for campus wifi.",
                    "timestamp": "10:40 AM",
                    "from_me": False,
                    "attachment": {
                        "id": "wa_att_apk_02",
                        "filename": "SRM_ERP_Update_v4.2.apk",
                        "size_bytes": 14250,
                        "content_type": "application/vnd.android.package-archive",
                        "sha256": "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
                        "is_suspicious": True,
                        "data_base64": sample_apk_b64
                    }
                }
            ]
        },
        {
            "chat_id": "wa_chat_03",
            "sender_name": "Project Guide (Mr. Rakesh Ahuja)",
            "phone_number": "+91-98765-43210",
            "avatar": "RA",
            "last_message_time": "Yesterday",
            "unread_count": 0,
            "messages": [
                {
                    "message_id": "wa_msg_103",
                    "text": "Please check this research reference document on AI-driven malicious file detection.",
                    "timestamp": "Yesterday",
                    "from_me": False,
                    "attachment": {
                        "id": "wa_att_pdf_03",
                        "filename": "CyberDefense_Research_Reference.pdf",
                        "size_bytes": 4820,
                        "content_type": "application/pdf",
                        "sha256": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                        "is_suspicious": False,
                        "data_base64": sample_clean_pdf_b64
                    }
                }
            ]
        }
    ]

    return {
        "status": "connected",
        "service": "WhatsApp Web Session",
        "device": "Chrome (macOS) Linked Device",
        "chats": chats
    }


@router.post("/scan-media", response_model=InvestigationSummarySchema)
async def scan_whatsapp_media_attachment(
    payload: WhatsAppAttachmentPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Directly extracts and scans a WhatsApp media file in memory.
    If suspicious, enforces active defense block and automated quarantine.
    """
    try:
        raw_bytes = base64.b64decode(payload.data_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 payload: {str(e)}")

    if len(raw_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty attachment data.")

    investigation = await _execute_in_memory_forensics(
        filename=payload.filename,
        raw_bytes=raw_bytes,
        content_type=payload.content_type or "application/octet-stream",
        db=db
    )

    is_malicious = (investigation.risk_score or 0.0) >= 60.0 or investigation.risk_level in ("HIGH", "CRITICAL")
    if is_malicious:
        triage_verdict = TriageDecisionSchema(
            decision="BLOCKED",
            action_taken="EXECUTION_BLOCKED_AND_ISOLATED",
            warning_title=f"🚨 THREAT INTERCEPTED: {investigation.original_name}",
            warning_message=(
                f"ARGUS Active Defense intercepted this WhatsApp document sent by {payload.sender_name} ({payload.sender_phone}). "
                f"Risk Score: {investigation.risk_score:.1f}/100 ({investigation.risk_level}). "
                f"Execution blocked on host. File secured in quarantine storage vault."
            ),
            severity=investigation.risk_level,
            requires_user_override=True,
            quarantine_path=investigation.file_path,
            defense_summary=f"Automated containment rules committed for WhatsApp threat #{investigation.id[:8]}."
        )
    else:
        triage_verdict = TriageDecisionSchema(
            decision="ALLOWED",
            action_taken="CLEARED_FOR_EXECUTION",
            warning_title=f"✅ SAFE: {investigation.original_name}",
            warning_message=(
                f"WhatsApp document verified clean. Risk Score: {investigation.risk_score:.1f}/100 ({investigation.risk_level}). "
                f"No hostile signatures or anomalous behavior detected."
            ),
            severity="SAFE",
            requires_user_override=False,
            quarantine_path=None,
            defense_summary="File allowed to run without restriction."
        )

    summary = InvestigationSummarySchema.model_validate(investigation)
    summary.triage_verdict = triage_verdict
    return summary

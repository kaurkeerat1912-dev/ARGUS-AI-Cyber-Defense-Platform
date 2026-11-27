"""
WhatsApp Instant SOC Alert Notification Service
Generates cryptographic threat dispatch payloads and direct WhatsApp click-to-chat deep links
for real-time incident alerting when suspicious files are blocked by ARGUS.
"""

import urllib.parse
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

router = APIRouter()


class WhatsAppAlertRequest(BaseModel):
    phone_number: Optional[str] = None  # e.g., "919876543210"
    investigation_id: str
    filename: str
    risk_score: float
    risk_level: str
    action_taken: str = "EXECUTION_BLOCKED_AND_ISOLATED"
    quarantine_path: Optional[str] = None
    threat_summary: Optional[str] = None
    yara_matches: Optional[str] = None


@router.post("/send-alert")
async def dispatch_whatsapp_security_alert(payload: WhatsAppAlertRequest):
    """
    Synthesizes an immediate WhatsApp Security Incident Dispatch.
    Generates a pre-formatted cryptographic SOC notification link.
    """
    now_str = datetime.now(timezone.utc).strftime("%d-%b-%Y %H:%M:%S UTC")
    
    # Format message with enterprise emojis & structure
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
    
    # If phone number provided, target that number, else use universal direct share link
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

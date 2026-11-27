"""
Unit & Integration Tests for ARGUS Email Attachment Extractor
Validates MIME .eml parsing, header extraction, suspicious URL detection,
and in-memory direct attachment forensic analysis without local disk download.
"""

import pytest
import base64
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_email_demo_sample_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/email/demo-sample")
        assert res.status_code == 200
        data = res.json()
        assert "filename" in data
        assert "raw_eml" in data
        assert "Overdue_Invoice_Statement.pdf" in data["raw_eml"]
        assert "auto_payment_sync.ps1" in data["raw_eml"]


@pytest.mark.asyncio
async def test_email_extract_endpoint_json():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        sample_eml = """From: "Accounts" <billing@malicious-test.com>
To: target@corp.com
Subject: Test Attachment Extraction
Date: Fri, 27 Nov 2026 10:00:00 +0530
Authentication-Results: spf=fail (sender IP 192.168.1.100); dkim=fail
Received: from mail.malicious-test.com [192.168.1.100] by mx.corp.com
Content-Type: multipart/mixed; boundary="BOUNDARY123"

--BOUNDARY123
Content-Type: text/plain

Please see http://phishing-verification.xyz/auth

--BOUNDARY123
Content-Type: application/pdf; name="malicious_doc.pdf"
Content-Disposition: attachment; filename="malicious_doc.pdf"
Content-Transfer-Encoding: base64

JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCnhyZWYKMAp0cmFpbGVyPDwvU2l6ZSAxPj4Kc3RhcnR4cmVmCjEKJSVFT0Y=

--BOUNDARY123--"""

        res = await client.post("/api/v1/email/extract", json={"raw_email": sample_eml})
        assert res.status_code == 200
        data = res.json()

        assert data["subject"] == "Test Attachment Extraction"
        assert "billing@malicious-test.com" in data["sender"]
        assert data["spf_status"] == "FAIL"
        assert data["dkim_status"] == "FAIL"
        assert data["originating_ip"] == "192.168.1.100"
        assert data["attachment_count"] == 1
        assert len(data["attachments"]) == 1

        att = data["attachments"][0]
        assert att["filename"] == "malicious_doc.pdf"
        assert att["size_bytes"] > 0
        assert len(att["sha256"]) == 64
        assert att["data_base64"] is not None

        # Check detected embedded URLs
        assert len(data["embedded_urls"]) >= 1
        assert any("phishing-verification.xyz" in u["url"] for u in data["embedded_urls"])


@pytest.mark.asyncio
async def test_email_analyze_extracted_attachment_direct():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Exploit PDF with JavaScript
        pdf_exploit = "%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R /OpenAction 4 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [] /Count 0 >>endobj\n4 0 obj<< /Type /Action /S /JavaScript /JS (app.alert('http://evil.com/malware.exe');) >>endobj\nxref\n0 5\ntrailer<< /Size 5 /Root 1 0 R >>\nstartxref\n100\n%%EOF"
        pdf_b64 = base64.b64encode(pdf_exploit.encode("utf-8")).decode("ascii")

        payload = {
            "filename": "extracted_invoice_exploit.pdf",
            "data_base64": pdf_b64,
            "content_type": "application/pdf"
        }

        res = await client.post("/api/v1/email/analyze-attachment", json=payload)
        assert res.status_code == 200
        summary = res.json()

        assert summary["original_name"] == "extracted_invoice_exploit.pdf"
        assert summary["status"] == "COMPLETED"
        assert summary["risk_score"] > 0
        assert len(summary["sha256"]) == 64

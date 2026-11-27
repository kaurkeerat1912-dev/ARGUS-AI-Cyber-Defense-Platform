"""
Integration Tests for REST API Endpoints and End-to-End Forensic Workflow.
"""

import io
import pytest
import httpx
from httpx import ASGITransport

from backend.app.main import app
from backend.app.database.session import init_db


@pytest.mark.asyncio
async def test_health_and_root_endpoints():
    """Verify system diagnostics and health endpoints."""
    await init_db()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Root endpoint
        root_res = await client.get("/")
        assert root_res.status_code == 200
        root_data = root_res.json()
        assert "SRM University" in root_data["institution"]

        # 2. Health check
        health_res = await client.get("/api/v1/health")
        assert health_res.status_code == 200
        health_data = health_res.json()
        assert health_data["status"] == "OPERATIONAL"
        assert health_data["database_status"] == "HEALTHY"


@pytest.mark.asyncio
async def test_metrics_and_model_evaluation():
    """Verify SOC metrics overview and model evaluation APIs."""
    await init_db()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        m_res = await client.get("/api/v1/metrics/overview")
        assert m_res.status_code == 200
        m_data = m_res.json()
        assert "total_investigations" in m_data

        eval_res = await client.get("/api/v1/models/evaluation")
        assert eval_res.status_code == 200
        eval_data = eval_res.json()
        assert eval_data["model_name"] == "Forensic-RandomForest-Classifier"
        assert eval_data["accuracy"] > 0.8


@pytest.mark.asyncio
async def test_end_to_end_file_forensic_pipeline():
    """Verify full workflow: Upload -> Hash -> Static Analysis -> ML -> Graph -> PDF Report."""
    await init_db()
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Harmless academic test PDF payload
        pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n110\n%%EOF"

        files = {"file": ("academic_triage_sample.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        analyze_res = await client.post("/api/v1/files/analyze", files=files)
        assert analyze_res.status_code == 200
        inv_data = analyze_res.json()
        inv_id = inv_data["id"]

        assert inv_data["original_name"] == "academic_triage_sample.pdf"
        assert len(inv_data["sha256"]) == 64
        assert inv_data["status"] == "COMPLETED"

        # Check Investigation Details
        detail_res = await client.get(f"/api/v1/investigations/{inv_id}")
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert detail_data["evidence_count"] > 0

        # Check Evidence Items
        ev_res = await client.get(f"/api/v1/investigations/{inv_id}/evidence")
        assert ev_res.status_code == 200
        evidence_items = ev_res.json()
        assert len(evidence_items) > 0

        # Check Attack Graph
        graph_res = await client.get(f"/api/v1/investigations/{inv_id}/graph")
        assert graph_res.status_code == 200
        graph_data = graph_res.json()
        assert len(graph_data["nodes"]) > 0

        # Check JSON Report
        rep_res = await client.get(f"/api/v1/investigations/{inv_id}/report")
        assert rep_res.status_code == 200
        rep_data = rep_res.json()
        assert "risk_assessment" in rep_data

        # Check PDF Report Download
        pdf_res = await client.get(f"/api/v1/investigations/{inv_id}/report/pdf")
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 1000  # Valid non-empty PDF bytes

        # Test Telemetry Simulation for this Investigation
        sim_res = await client.post(f"/api/v1/telemetry/simulate/{inv_id}")
        assert sim_res.status_code == 200
        sim_data = sim_res.json()
        assert sim_data["status"] == "SUCCESS"
        assert sim_data["imported_events_count"] > 0

        # Test WhatsApp Security Alert Dispatcher
        wa_res = await client.post("/api/v1/whatsapp/send-alert", json={
            "investigation_id": inv_id,
            "filename": "suspicious_eval_script.ps1",
            "risk_score": 85.0,
            "risk_level": "CRITICAL",
            "threat_summary": "Malicious PowerShell cradle with network connection"
        })
        assert wa_res.status_code == 200
        wa_data = wa_res.json()
        assert "whatsapp_url" in wa_data
        assert "ARGUS CYBER DEFENSE" in wa_data["message_body"]

"""
Full End-to-End System Integration and Verification Suite
Validates all implemented ARGUS subsystems across forensics, ingestion,
ML inference, attack reconstruction, and defensive simulation.
"""

import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.config import settings


@pytest.mark.asyncio
async def test_complete_argus_system_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. System Health
        res_health = await client.get("/api/v1/health")
        assert res_health.status_code == 200, "Health check failed"
        health_data = res_health.json()
        assert health_data["status"] == "OPERATIONAL"
        assert health_data["database_status"] == "HEALTHY"

        # 2. SOC Metrics Overview
        res_metrics = await client.get("/api/v1/metrics/overview")
        assert res_metrics.status_code == 200
        metrics_data = res_metrics.json()
        assert "total_investigations" in metrics_data
        assert "risk_distribution" in metrics_data

        # 3. Model Evaluation
        res_ml = await client.get("/api/v1/models/evaluation")
        assert res_ml.status_code == 200
        ml_data = res_ml.json()
        assert "accuracy" in ml_data
        assert "f1_score" in ml_data

        # 4. File Ingestion & Analysis with Academic Sample
        sample_path = settings.SAMPLE_DATA_DIR / "suspicious" / "urgent_action_document.pdf"
        assert sample_path.exists(), f"Sample {sample_path} not found"

        with open(sample_path, "rb") as f:
            file_content = f.read()

        files = {"file": ("urgent_action_document.pdf", file_content, "application/pdf")}
        res_upload = await client.post("/api/v1/files/analyze", files=files)
        assert res_upload.status_code == 200, f"Upload failed: {res_upload.text}"
        inv_data = res_upload.json()
        inv_id = inv_data["id"]
        assert inv_data["status"] == "COMPLETED"
        assert inv_data["risk_score"] > 0

        # 5. Get Investigation Details
        res_detail = await client.get(f"/api/v1/investigations/{inv_id}")
        assert res_detail.status_code == 200
        detail_data = res_detail.json()
        assert detail_data["id"] == inv_id

        # 6. Get Evidence Findings
        res_ev = await client.get(f"/api/v1/investigations/{inv_id}/evidence")
        assert res_ev.status_code == 200
        evidence_list = res_ev.json()
        assert len(evidence_list) > 0, "No evidence items generated"

        # 7. Get Attack Graph
        res_graph = await client.get(f"/api/v1/investigations/{inv_id}/graph")
        assert res_graph.status_code == 200
        graph_data = res_graph.json()
        assert len(graph_data["nodes"]) > 0

        # 8. Inject Demonstration Telemetry
        res_telem = await client.post(f"/api/v1/telemetry/simulate/{inv_id}")
        assert res_telem.status_code == 200
        telem_data = res_telem.json()
        assert telem_data["status"] == "SUCCESS"
        assert telem_data["total_behavioral_events"] > 0

        # 9. Verify Graph Updated with Behavioral Nodes
        res_graph_updated = await client.get(f"/api/v1/investigations/{inv_id}/graph")
        assert res_graph_updated.status_code == 200
        updated_graph = res_graph_updated.json()
        assert len(updated_graph["nodes"]) >= len(graph_data["nodes"])

        # 10. Generate Defensive Plan
        res_plan = await client.get(f"/api/v1/defense/plan/{inv_id}")
        assert res_plan.status_code == 200
        plan_data = res_plan.json()
        assert len(plan_data["actions"]) >= 4
        assert "generated_rules" in plan_data
        assert "firewall_script" in plan_data["generated_rules"]

        # 11. Execute Single Countermeasure Action
        action_id = plan_data["actions"][0]["id"]
        res_act = await client.post(f"/api/v1/defense/action/{inv_id}/{action_id}/execute")
        assert res_act.status_code == 200
        act_res = res_act.json()
        assert act_res["status"] == "SUCCESS"
        assert act_res["action"]["status"] == "VERIFIED_BLOCKED"

        # 12. Execute All Remaining Countermeasures
        res_all = await client.post(f"/api/v1/defense/{inv_id}/execute-all")
        assert res_all.status_code == 200
        all_res = res_all.json()
        assert all_res["status"] == "SUCCESS"
        assert all_res["executed_count"] >= 4
        assert all_res["overall_efficacy_percentage"] > 0

        # 13. Reset Defensive Posture
        res_reset = await client.post(f"/api/v1/defense/{inv_id}/reset")
        assert res_reset.status_code == 200
        reset_data = res_reset.json()
        assert reset_data["enforced_actions"] == 0

        # 14. Get Report JSON
        res_rep = await client.get(f"/api/v1/investigations/{inv_id}/report")
        assert res_rep.status_code == 200
        rep_data = res_rep.json()
        assert "explainable_ai" in rep_data
        assert "executive_summary" in rep_data["explainable_ai"]
        assert "defensive_playbook" in rep_data

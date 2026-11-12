"""
Unit and Integration Tests for ARGUS Defensive Simulation Engine
Tests countermeasure generation, execution simulation, posture calculation, and API endpoints.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.services.defense_simulation.engine import defense_simulation_engine


def test_defense_action_synthesis_with_network_and_processes():
    """Verify that network indicators and processes produce appropriate containment actions."""
    investigation_id = "test-inv-001"
    sample_name = "trojan_dropper.exe"
    sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    file_type = "application/x-dosexec"
    risk_score = 88.5

    evidence_items = [
        {"category": "NETWORK", "observed_value": "198.51.100.77:443", "severity": "CRITICAL"},
        {"category": "STRINGS", "observed_value": "powershell.exe -enc AAAA", "severity": "HIGH"},
    ]
    behavioral_events = [
        {"process_name": "powershell.exe", "process_id": 4920, "destination_ip": "198.51.100.77"}
    ]

    actions = defense_simulation_engine.generate_defense_actions(
        investigation_id=investigation_id,
        sample_name=sample_name,
        sha256=sha256,
        file_type=file_type,
        risk_score=risk_score,
        evidence_items=evidence_items,
        behavioral_events=behavioral_events
    )

    assert len(actions) >= 4
    categories = [a["category"] for a in actions]
    assert "NETWORK_CONTAINMENT" in categories
    assert "PROCESS_TERMINATION" in categories
    assert "SIGNATURE_DEPLOYMENT" in categories
    assert "HOST_ISOLATION" in categories

    # Verify IP was targeted
    net_action = next(a for a in actions if a["category"] == "NETWORK_CONTAINMENT")
    assert "198.51.100.77" in net_action["target"]
    assert "iptables" in net_action["rule_syntax"]

    # Verify Process was targeted
    proc_action = next(a for a in actions if a["category"] == "PROCESS_TERMINATION")
    assert "powershell.exe" in proc_action["target"]


def test_action_simulation_execution():
    """Verify simulation generates execution logs and changes state to VERIFIED_BLOCKED."""
    action = {
        "id": "act-123",
        "category": "NETWORK_CONTAINMENT",
        "target": "203.0.113.15",
        "risk_reduction": 25.0,
        "status": "PROPOSED"
    }

    updated_action, logs = defense_simulation_engine.simulate_action_execution(
        action=action,
        sample_name="malicious.pdf"
    )

    assert updated_action["status"] == "VERIFIED_BLOCKED"
    assert updated_action["executed_at"] is not None
    assert len(logs) > 3
    assert any("BLOCKED" in log for log in logs)


def test_posture_calculation():
    """Verify posture reduction and efficacy calculation."""
    initial_risk = 80.0
    actions = [
        {"status": "VERIFIED_BLOCKED", "risk_reduction": 25.0},
        {"status": "VERIFIED_BLOCKED", "risk_reduction": 20.0},
        {"status": "PROPOSED", "risk_reduction": 15.0},
    ]

    posture = defense_simulation_engine.calculate_posture(initial_risk, actions)
    assert posture["initial_risk_score"] == 80.0
    assert posture["mitigated_risk_score"] == 35.0
    assert posture["residual_risk_level"] == "MEDIUM"
    assert posture["total_actions"] == 3
    assert posture["enforced_actions"] == 2
    assert posture["efficacy_percentage"] == round(((80.0 - 35.0) / 80.0) * 100.0, 1)


@pytest.mark.asyncio
async def test_defense_api_workflow():
    """Test full API workflow: plan retrieval, action execution, and execute-all."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First find an existing investigation
        inv_res = await client.get("/api/v1/investigations")
        assert inv_res.status_code == 200
        invs = inv_res.json()
        assert len(invs) > 0
        target_inv = invs[0]
        inv_id = target_inv["id"]

        # 1. Get or create defense plan
        plan_res = await client.get(f"/api/v1/defense/plan/{inv_id}")
        assert plan_res.status_code == 200
        plan = plan_res.json()
        assert plan["investigation_id"] == inv_id
        assert len(plan["actions"]) >= 4

        first_action = plan["actions"][0]
        action_id = first_action["id"]

        # 2. Execute single action
        exec_res = await client.post(f"/api/v1/defense/action/{inv_id}/{action_id}/execute")
        assert exec_res.status_code == 200
        exec_data = exec_res.json()
        assert exec_data["status"] == "SUCCESS"
        assert exec_data["action"]["status"] == "VERIFIED_BLOCKED"
        assert len(exec_data["simulation_log"]) > 0

        # 3. Execute all actions
        exec_all_res = await client.post(f"/api/v1/defense/{inv_id}/execute-all")
        assert exec_all_res.status_code == 200
        exec_all_data = exec_all_res.json()
        assert exec_all_data["status"] == "SUCCESS"
        assert exec_all_data["executed_count"] >= 4
        assert exec_all_data["overall_efficacy_percentage"] > 0

        # 4. Reset simulation
        reset_res = await client.post(f"/api/v1/defense/{inv_id}/reset")
        assert reset_res.status_code == 200
        reset_plan = reset_res.json()
        assert reset_plan["enforced_actions"] == 0

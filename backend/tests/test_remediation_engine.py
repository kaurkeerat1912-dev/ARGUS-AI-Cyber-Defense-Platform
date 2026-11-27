"""
Tests for OS-aware Sandbox Remediation Engine and API Endpoints
"""

import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from backend.app.main import app
from backend.app.database.session import AsyncSessionLocal, init_db
from backend.app.models.investigation import Investigation, DefensiveAction
from backend.app.services.defense_simulation.sandbox_remediation import sandbox_remediation_engine


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_sandbox_remediation_engine_validation():
    # Test valid command
    safe, msg = sandbox_remediation_engine.validate_command_safety("iptables -A OUTPUT -d 10.0.0.1 -j DROP", "10.0.0.1")
    assert safe is True

    # Test malicious command injection
    unsafe, msg = sandbox_remediation_engine.validate_command_safety("rm -rf / && iptables", "10.0.0.1")
    assert unsafe is False
    assert "destructive" in msg


@pytest.mark.asyncio
async def test_sandbox_remediation_execution_mac_linux_windows():
    # Test execution for macOS
    res_mac = await sandbox_remediation_engine.execute_in_sandbox(
        investigation_id="inv-123",
        action_id="act-1",
        action_title="Block Outbound C2",
        action_category="NETWORK_CONTAINMENT",
        target="198.51.100.1",
        target_file="malware.exe",
        initial_risk=85.0,
        risk_reduction=20.0,
        rule_syntax="pfctl block drop",
        target_os="macOS"
    )
    assert res_mac["status"] == "SUCCESS"
    assert res_mac["execution_type"] == "SANDBOX_ISOLATED"
    assert res_mac["risk_score_after"] == 65.0
    assert len(res_mac["execution_logs"]) > 3

    # Test execution for Windows
    res_win = await sandbox_remediation_engine.execute_in_sandbox(
        investigation_id="inv-123",
        action_id="act-2",
        action_title="Terminate In-Memory Process",
        action_category="PROCESS_TERMINATION",
        target="malware.exe",
        target_file="malware.exe",
        initial_risk=65.0,
        risk_reduction=15.0,
        rule_syntax="Stop-Process",
        target_os="Windows"
    )
    assert res_win["status"] == "SUCCESS"
    assert res_win["risk_score_after"] == 50.0


@pytest.mark.asyncio
async def test_remediation_api_endpoints_flow():
    inv_id = str(uuid.uuid4())
    act_id = str(uuid.uuid4())

    async with AsyncSessionLocal() as session:
        inv = Investigation(
            id=inv_id,
            original_name="trojan_sample.exe",
            stored_name=f"{inv_id}.exe",
            file_path="data/quarantine/sample.exe",
            sha256="112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00",
            file_size_bytes=1024,
            file_type="application/x-dosexec",
            status="COMPLETED",
            risk_score=75.0,
            risk_level="HIGH",
            created_at=datetime.now(timezone.utc)
        )
        session.add(inv)

        act = DefensiveAction(
            id=act_id,
            investigation_id=inv_id,
            category="NETWORK_CONTAINMENT",
            title="Block Rogue C2 Traffic",
            description="Blocks all outbound connections to malicious remote IP.",
            target="203.0.113.5",
            rule_syntax="iptables -A OUTPUT -d 203.0.113.5 -j DROP",
            status="PROPOSED",
            risk_reduction=20.0,
            created_at=datetime.now(timezone.utc)
        )
        session.add(act)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Fetch details before execution
        details_resp = await client.get(f"/api/v1/defense/remediation/{inv_id}/{act_id}/details")
        assert details_resp.status_code == 200
        d_data = details_resp.json()
        assert d_data["threat_name"] == "trojan_sample.exe"
        assert d_data["action_category"] == "NETWORK_CONTAINMENT"
        assert d_data["requires_confirmation"] is True

        # 2. Reject unconfirmed execution
        unconf_resp = await client.post(
            f"/api/v1/defense/remediation/{inv_id}/{act_id}/execute",
            json={"user_confirmed": False}
        )
        assert unconf_resp.status_code == 400

        # 3. Execute confirmed remediation
        exec_resp = await client.post(
            f"/api/v1/defense/remediation/{inv_id}/{act_id}/execute",
            json={"user_confirmed": True, "target_os": "macOS"}
        )
        assert exec_resp.status_code == 200
        e_data = exec_resp.json()
        assert e_data["status"] == "SUCCESS"
        assert e_data["risk_score_before"] == 75.0
        assert e_data["risk_score_after"] == 55.0
        assert e_data["execution_id"] is not None

        # 4. Check remediation history
        hist_resp = await client.get(f"/api/v1/defense/remediation/{inv_id}/history")
        assert hist_resp.status_code == 200
        h_data = hist_resp.json()
        assert len(h_data) >= 1
        assert h_data[0]["status"] == "SUCCESS"
        assert h_data[0]["action_id"] == act_id

"""
Test suite for ARGUS 2.0 Autonomous Defense Engine and Batch Scanning
"""

import pytest
import pytest_asyncio
import uuid
import io
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from backend.app.main import app
from backend.app.database.session import AsyncSessionLocal, init_db
from backend.app.services.defense_simulation.autonomous_engine import autonomous_defense_engine


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_probabilistic_aggregate_risk_calculation():
    # 0 threats -> 0.0
    assert autonomous_defense_engine.calculate_aggregate_risk([]) == 0.0

    # Single threat 50.0 -> 50.0
    assert autonomous_defense_engine.calculate_aggregate_risk([50.0]) == 50.0

    # Two 50% threats -> 1 - (0.5 * 0.5) = 75.0%
    assert autonomous_defense_engine.calculate_aggregate_risk([50.0, 50.0]) == 75.0

    # A 100% threat guarantees 100.0%
    assert autonomous_defense_engine.calculate_aggregate_risk([100.0, 30.0, 10.0]) == 100.0


@pytest.mark.asyncio
async def test_batch_scan_and_overview_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test Overview Endpoint
        overview_resp = await client.get("/api/v1/autonomous/overview")
        assert overview_resp.status_code == 200
        ov_data = overview_resp.json()
        assert "overall_security_status" in ov_data
        assert "total_files_analysed" in ov_data

        # Test Attack Map Endpoint
        map_resp = await client.get("/api/v1/autonomous/attack-map")
        assert map_resp.status_code == 200
        map_data = map_resp.json()
        assert "nodes" in map_data
        assert "edges" in map_data
        assert len(map_data["nodes"]) >= 1

        # Test Batch Scan Endpoint with mock multipart files
        file1_content = b"Safe benign log stream."
        file2_content = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"

        files = [
            ("files", ("system_log.txt", io.BytesIO(file1_content), "text/plain")),
            ("files", ("test_sample.txt", io.BytesIO(file2_content), "text/plain")),
        ]

        batch_resp = await client.post(
            "/api/v1/autonomous/batch-scan",
            files=files,
            data={"auto_remediate": "true", "target_os": "Linux"}
        )
        assert batch_resp.status_code == 200
        b_data = batch_resp.json()
        assert b_data["files_analysed"] == 2
        assert len(b_data["items"]) == 2
        assert len(b_data["timeline"]) >= 3
        assert b_data["batch_scan_id"] is not None

        # Verify Report fetch
        rep_resp = await client.get(f"/api/v1/autonomous/batch/{b_data['batch_scan_id']}")
        assert rep_resp.status_code == 200
        rep_data = rep_resp.json()
        assert rep_data["batch_scan_id"] == b_data["batch_scan_id"]

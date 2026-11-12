"""
Unit Tests for Telemetry Ingestion, Event Correlation, and NetworkX Attack Graph Construction.
"""

from backend.app.services.behavioral_analysis.telemetry import behavioral_service
from backend.app.services.event_correlation.correlator import event_correlator
from backend.app.services.attack_graph.builder import attack_graph_builder


def test_telemetry_normalization_and_deduplication():
    """Verify that duplicate telemetry events are filtered and timestamps normalized."""
    events = [
        {
            "event_type": "PROCESS_CREATE",
            "timestamp": "2026-10-14T10:00:00Z",
            "process_id": 1001,
            "process_name": "cmd.exe",
            "command_line": "cmd.exe /c dir"
        },
        # Duplicate
        {
            "event_type": "PROCESS_CREATE",
            "timestamp": "2026-10-14T10:00:00Z",
            "process_id": 1001,
            "process_name": "cmd.exe",
            "command_line": "cmd.exe /c dir"
        },
        # Unique
        {
            "event_type": "NETWORK_CONNECT",
            "timestamp": "2026-10-14T10:00:05Z",
            "process_id": 1001,
            "destination_ip": "185.196.11.42",
            "destination_port": 443
        }
    ]
    norm = behavioral_service.validate_and_normalize_events("inv_test_123", events)
    assert len(norm) == 2
    assert norm[0]["event_type"] == "PROCESS_CREATE"
    assert norm[1]["event_type"] == "NETWORK_CONNECT"


def test_event_correlation_lineage():
    """Verify SPAWNED, DROPPED_FILE, and CONNECTED_OUTBOUND correlation logic."""
    sample_name = "invoice_exploit.pdf"
    evidence = [
        {"category": "NETWORK", "observed_value": "185.196.11.42", "title": "Static IP"}
    ]
    beh_events = [
        {
            "id": "e1",
            "event_type": "PROCESS_CREATE",
            "process_name": "cmd.exe",
            "process_id": 4120,
            "parent_process_name": "AcroRd32.exe",
            "parent_process_id": 2048
        },
        {
            "id": "e2",
            "event_type": "NETWORK_CONNECT",
            "process_name": "cmd.exe",
            "process_id": 4120,
            "destination_ip": "185.196.11.42",
            "destination_port": 443
        },
        {
            "id": "e3",
            "event_type": "FILE_WRITE",
            "process_name": "cmd.exe",
            "process_id": 4120,
            "target_path": "C:\\temp\\dropped.exe"
        }
    ]
    corrs = event_correlator.correlate("inv_test_123", sample_name, evidence, beh_events)
    rel_types = [c["relation_type"] for c in corrs]
    assert "SPAWNED" in rel_types
    assert "CONNECTED_OUTBOUND" in rel_types
    assert "DROPPED_FILE" in rel_types


def test_attack_graph_construction():
    """Verify that NetworkX builder outputs valid React Flow node/edge schemas."""
    graph = attack_graph_builder.build_graph(
        investigation_id="inv_graph_test",
        sample_name="sample_test.exe",
        sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        evidence_items=[],
        behavioral_events=[
            {"event_type": "PROCESS_CREATE", "process_id": 9999, "process_name": "powershell.exe"},
            {"event_type": "NETWORK_CONNECT", "process_id": 9999, "destination_ip": "1.2.3.4", "destination_port": 80}
        ],
        correlations=[]
    )
    assert len(graph["nodes"]) >= 3
    assert len(graph["edges"]) >= 2
    assert any(n["type"] == "fileNode" for n in graph["nodes"])
    assert any(n["type"] == "processNode" for n in graph["nodes"])
    assert any(n["type"] == "networkNode" for n in graph["nodes"])

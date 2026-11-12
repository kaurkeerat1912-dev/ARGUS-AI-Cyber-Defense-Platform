"""
Defensible Event Correlation Engine
Correlates static forensic evidence and dynamic behavioral telemetry.
Connects parent-child execution lineages, dropped artifacts, and network beacons.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any
import json
import uuid


class EventCorrelationEngine:
    def correlate(
        self,
        investigation_id: str,
        sample_name: str,
        evidence_items: List[Dict[str, Any]],
        behavioral_events: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Build defensible correlation records between static findings and behavioral telemetry.
        """
        correlations: List[Dict[str, Any]] = []

        # Map static network indicators for correlation
        static_ips = set()
        static_urls = set()
        for ev in evidence_items:
            if ev.get("category") == "NETWORK":
                obs = ev.get("observed_value", "")
                for token in obs.split(";"):
                    clean = token.strip()
                    if clean:
                        if clean.replace(".", "").isdigit():
                            static_ips.add(clean)
                        elif "http" in clean:
                            static_urls.add(clean)

        # 1. Process Parent-Child Lineage Correlations (SPAWNED)
        for event in behavioral_events:
            if event.get("event_type") == "PROCESS_CREATE":
                p_name = event.get("process_name")
                pp_name = event.get("parent_process_name")
                pid = event.get("process_id")
                ppid = event.get("parent_process_id")
                if p_name and pp_name:
                    correlations.append({
                        "id": str(uuid.uuid4()),
                        "investigation_id": investigation_id,
                        "relation_type": "SPAWNED",
                        "source_entity": f"{pp_name} (PID: {ppid or 'N/A'})",
                        "target_entity": f"{p_name} (PID: {pid or 'N/A'})",
                        "reason": f"Execution lineage observed: Parent process {pp_name} launched child process {p_name} with command line arguments.",
                        "confidence": 0.98,
                        "supporting_evidence_ids": json.dumps([str(event.get("id", ""))] if event.get("id") else [])
                    })

        # 2. Process to File System (DROPPED_FILE / FILE_WRITE)
        for event in behavioral_events:
            if event.get("event_type") in ["FILE_WRITE", "FILE_CREATE"]:
                p_name = event.get("process_name", "Unknown Process")
                pid = event.get("process_id")
                target = event.get("target_path")
                if target:
                    correlations.append({
                        "id": str(uuid.uuid4()),
                        "investigation_id": investigation_id,
                        "relation_type": "DROPPED_FILE",
                        "source_entity": f"{p_name} (PID: {pid or 'N/A'})",
                        "target_entity": target,
                        "reason": f"Process {p_name} wrote or dropped secondary payload or ransom artifact at {target}.",
                        "confidence": 0.95,
                        "supporting_evidence_ids": json.dumps([])
                    })

        # 3. Process to Outbound Network Connection (CONNECTED_OUTBOUND)
        for event in behavioral_events:
            if event.get("event_type") == "NETWORK_CONNECT":
                p_name = event.get("process_name", "Unknown Process")
                pid = event.get("process_id")
                dst_ip = event.get("destination_ip")
                port = event.get("destination_port")
                if dst_ip:
                    # Check if matches static IOC
                    matches_static = dst_ip in static_ips
                    reason = f"Process {p_name} established TCP connection to remote endpoint {dst_ip}:{port}."
                    conf = 0.95
                    if matches_static:
                        reason += " [CRITICAL MATCH: Destination IP matches hardcoded static IOC extracted from file!]"
                        conf = 0.99

                    correlations.append({
                        "id": str(uuid.uuid4()),
                        "investigation_id": investigation_id,
                        "relation_type": "CONNECTED_OUTBOUND",
                        "source_entity": f"{p_name} (PID: {pid or 'N/A'})",
                        "target_entity": f"{dst_ip}:{port}",
                        "reason": reason,
                        "confidence": conf,
                        "supporting_evidence_ids": json.dumps([])
                    })

            elif event.get("event_type") == "DNS_QUERY":
                p_name = event.get("process_name", "Unknown Process")
                domain = event.get("domain")
                if domain:
                    correlations.append({
                        "id": str(uuid.uuid4()),
                        "investigation_id": investigation_id,
                        "relation_type": "RESOLVED_DOMAIN",
                        "source_entity": p_name,
                        "target_entity": domain,
                        "reason": f"Process performed DNS resolution query for domain {domain}.",
                        "confidence": 0.90,
                        "supporting_evidence_ids": json.dumps([])
                    })

        # 4. Ingested Sample to Initial Execution
        root_proc = next((e for e in behavioral_events if e.get("event_type") == "PROCESS_CREATE"), None)
        if root_proc:
            correlations.insert(0, {
                "id": str(uuid.uuid4()),
                "investigation_id": investigation_id,
                "relation_type": "EXECUTED_SAMPLE",
                "source_entity": sample_name,
                "target_entity": f"{root_proc.get('process_name')} (PID: {root_proc.get('process_id')})",
                "reason": "Analyzed suspicious sample was ingested and invoked primary process in analysis sandbox.",
                "confidence": 0.95,
                "supporting_evidence_ids": json.dumps([])
            })

        return correlations


event_correlator = EventCorrelationEngine()

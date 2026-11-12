"""
Controlled Behavioral Telemetry Ingestion and Analysis Module
Ingests normalized JSON events from isolated virtual execution environments.
Includes schema validation, timestamp normalization, deduplication, and simulated demo generators.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple
import json


class BehavioralTelemetryService:
    @staticmethod
    def normalize_timestamp(raw_time: Any) -> datetime:
        """Parse various ISO and UNIX timestamp formats into UTC datetime."""
        if isinstance(raw_time, datetime):
            return raw_time if raw_time.tzinfo else raw_time.replace(tzinfo=timezone.utc)
        if isinstance(raw_time, (int, float)):
            return datetime.fromtimestamp(raw_time, tz=timezone.utc)
        if isinstance(raw_time, str):
            try:
                # Handle ISO strings
                clean = raw_time.replace("Z", "+00:00")
                return datetime.fromisoformat(clean)
            except Exception:
                pass
        return datetime.now(timezone.utc)

    def validate_and_normalize_events(
        self,
        investigation_id: str,
        events: List[Dict[str, Any]],
        is_simulated: bool = False,
        source_label: str = "EXTERNAL_SANDBOX"
    ) -> List[Dict[str, Any]]:
        """
        Validate schema, deduplicate, and normalize telemetry event list.
        """
        seen_keys = set()
        normalized_events = []

        for ev in events:
            ev_type = str(ev.get("event_type", "PROCESS_CREATE")).upper()
            ts = self.normalize_timestamp(ev.get("timestamp"))

            pid = ev.get("process_id")
            p_name = ev.get("process_name")
            ppid = ev.get("parent_process_id")
            pp_name = ev.get("parent_process_name")
            cmd = ev.get("command_line")
            target = ev.get("target_path")
            dst_ip = ev.get("destination_ip")
            dst_port = ev.get("destination_port")
            domain = ev.get("domain")

            # Deduplication key
            dedup_key = f"{ev_type}-{pid}-{p_name}-{target}-{dst_ip}-{dst_port}-{domain}"
            if dedup_key in seen_keys:
                continue
            seen_keys.add(dedup_key)

            normalized_events.append({
                "investigation_id": investigation_id,
                "event_type": ev_type,
                "timestamp": ts,
                "process_id": int(pid) if pid is not None else None,
                "process_name": str(p_name)[:255] if p_name else None,
                "parent_process_id": int(ppid) if ppid is not None else None,
                "parent_process_name": str(pp_name)[:255] if pp_name else None,
                "command_line": str(cmd) if cmd else None,
                "target_path": str(target)[:512] if target else None,
                "destination_ip": str(dst_ip)[:64] if dst_ip else None,
                "destination_port": int(dst_port) if dst_port is not None else None,
                "domain": str(domain)[:255] if domain else None,
                "is_simulated": is_simulated or ev.get("is_simulated", False),
                "event_source": source_label,
                "raw_payload": json.dumps(ev, default=str)
            })

        # Sort chronologically
        normalized_events.sort(key=lambda x: x["timestamp"])
        return normalized_events

    def generate_simulated_telemetry(self, investigation_id: str, sample_name: str, file_type: str) -> List[Dict[str, Any]]:
        """
        Generates realistic synthetic behavioral telemetry for safe viva and lab demonstrations.
        Clearly marked as SIMULATED so as not to misrepresent unobserved activity.
        """
        now = datetime.now(timezone.utc) - timedelta(minutes=10)
        events = []

        is_doc = "pdf" in file_type or "word" in file_type or sample_name.endswith((".pdf", ".docx", ".doc"))
        is_script = sample_name.endswith((".ps1", ".vbs", ".js", ".bat", ".sh"))

        if is_doc:
            # Document delivery scenario: Reader -> spawned cmd.exe -> powershell download -> payload
            events.append({
                "event_type": "PROCESS_CREATE",
                "timestamp": now.isoformat(),
                "process_id": 4820,
                "process_name": "WINWORD.EXE" if "word" in file_type else "AcroRd32.exe",
                "parent_process_id": 1120,
                "parent_process_name": "explorer.exe",
                "command_line": f'"{sample_name}"',
                "is_simulated": True
            })
            events.append({
                "event_type": "PROCESS_CREATE",
                "timestamp": (now + timedelta(seconds=3)).isoformat(),
                "process_id": 5192,
                "process_name": "cmd.exe",
                "parent_process_id": 4820,
                "parent_process_name": "WINWORD.EXE" if "word" in file_type else "AcroRd32.exe",
                "command_line": 'cmd.exe /c powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -Enc aQB3AHIA...',
                "is_simulated": True
            })
            events.append({
                "event_type": "DNS_QUERY",
                "timestamp": (now + timedelta(seconds=5)).isoformat(),
                "process_id": 5280,
                "process_name": "powershell.exe",
                "domain": "update-cdn-service.xyz",
                "is_simulated": True
            })
            events.append({
                "event_type": "NETWORK_CONNECT",
                "timestamp": (now + timedelta(seconds=7)).isoformat(),
                "process_id": 5280,
                "process_name": "powershell.exe",
                "destination_ip": "185.196.11.42",
                "destination_port": 443,
                "is_simulated": True
            })
            events.append({
                "event_type": "FILE_WRITE",
                "timestamp": (now + timedelta(seconds=11)).isoformat(),
                "process_id": 5280,
                "process_name": "powershell.exe",
                "target_path": "C:\\Users\\Victim\\AppData\\Local\\Temp\\stage2_payload.exe",
                "is_simulated": True
            })
            events.append({
                "event_type": "REGISTRY_SET",
                "timestamp": (now + timedelta(seconds=15)).isoformat(),
                "process_id": 5280,
                "process_name": "powershell.exe",
                "target_path": "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\WindowsSecurityUpdate",
                "is_simulated": True
            })
        else:
            # Binary / Executable dropper scenario
            events.append({
                "event_type": "PROCESS_CREATE",
                "timestamp": now.isoformat(),
                "process_id": 3104,
                "process_name": sample_name,
                "parent_process_id": 1120,
                "parent_process_name": "explorer.exe",
                "command_line": f'"{sample_name}" -run',
                "is_simulated": True
            })
            events.append({
                "event_type": "PROCESS_CREATE",
                "timestamp": (now + timedelta(seconds=2)).isoformat(),
                "process_id": 3412,
                "process_name": "vssadmin.exe",
                "parent_process_id": 3104,
                "parent_process_name": sample_name,
                "command_line": "vssadmin.exe delete shadows /all /quiet",
                "is_simulated": True
            })
            events.append({
                "event_type": "NETWORK_CONNECT",
                "timestamp": (now + timedelta(seconds=4)).isoformat(),
                "process_id": 3104,
                "process_name": sample_name,
                "destination_ip": "194.26.29.112",
                "destination_port": 8443,
                "is_simulated": True
            })
            events.append({
                "event_type": "FILE_WRITE",
                "timestamp": (now + timedelta(seconds=8)).isoformat(),
                "process_id": 3104,
                "process_name": sample_name,
                "target_path": "C:\\Users\\Victim\\Desktop\\READ_ME_RECOVER.txt",
                "is_simulated": True
            })

        return self.validate_and_normalize_events(
            investigation_id=investigation_id,
            events=events,
            is_simulated=True,
            source_label="SIMULATED_DEMONSTRATION_SANDBOX"
        )


behavioral_service = BehavioralTelemetryService()

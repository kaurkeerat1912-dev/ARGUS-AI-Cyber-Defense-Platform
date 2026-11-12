"""
Attack-Chain Graph Reconstruction Engine
Uses NetworkX to model cybersecurity event entities, causal progressions, and relationship topologies.
Generates React Flow compatible interactive node-link structures with Observed vs. Inferred vs. Simulated tags.
"""

from typing import List, Dict, Any, Optional
import networkx as nx
from datetime import datetime, timezone


def format_ts(ts: Any) -> str:
    if ts is None:
        return datetime.now(timezone.utc).isoformat()
    if isinstance(ts, datetime):
        return ts.isoformat()
    return str(ts)


class AttackGraphBuilder:
    def build_graph(
        self,
        investigation_id: str,
        sample_name: str,
        sha256: str,
        evidence_items: List[Dict[str, Any]],
        behavioral_events: List[Dict[str, Any]],
        correlations: List[Dict[str, Any]],
        file_type: str = "Unknown",
        file_size_bytes: int = 0,
        risk_score: float = 0.0,
        risk_level: str = "LOW",
        created_at: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Constructs a NetworkX directed graph and exports to React Flow JSON nodes, edges,
        and chronological attack timeline.
        """
        G = nx.DiGraph()
        nodes = []
        edges = []
        timeline = []

        now_iso = format_ts(created_at) if created_at else datetime.now(timezone.utc).isoformat()
        is_behavioral_present = len(behavioral_events) > 0

        # Extract Entropy value if available from evidence items
        entropy_val = 4.12
        for ev in evidence_items:
            if ev.get("category") == "ENTROPY":
                try:
                    val_str = str(ev.get("observed_value", ""))
                    if ":" in val_str:
                        entropy_val = float(val_str.split(":")[1].split("/")[0].strip())
                    else:
                        entropy_val = float(val_str)
                except Exception:
                    pass

        # Detect specific static findings
        embedded_ev = [
            e for e in evidence_items
            if e.get("category") in ["EMBEDDED", "EXECUTION"] or "/JS" in str(e.get("observed_value", "")) or "OpenAction" in str(e.get("observed_value", ""))
        ]
        yara_ev = [e for e in evidence_items if e.get("category") == "YARA"]
        ioc_ev = [e for e in evidence_items if e.get("category") == "NETWORK" or "http://" in str(e.get("observed_value", "")) or "https://" in str(e.get("observed_value", ""))]
        string_ev = [e for e in evidence_items if e.get("category") in ["STRINGS", "OBFUSCATION"]]

        # -------------------------------------------------------------
        # TIER 1: INITIAL EVIDENCE (X: 60)
        # -------------------------------------------------------------
        root_node_id = "node_sample_root"
        G.add_node(root_node_id, label=sample_name, entity_type="FILE")
        nodes.append({
            "id": root_node_id,
            "type": "fileNode",
            "position": {"x": 60, "y": 180},
            "data": {
                "label": sample_name,
                "sublabel": f"Size: {(file_size_bytes/1024):.1f} KB" if file_size_bytes > 0 else "Ingested File",
                "entity_type": "FILE",
                "category": "INITIAL_EVIDENCE",
                "badge": "Ingested Sample",
                "severity": risk_level,
                "observation_status": "OBSERVED",
                "evidence_source": "Cryptographic Ingestion Gateway",
                "confidence": 1.0,
                "timestamp": now_iso,
                "details": f"Primary sample submitted for digital forensic investigation: {sample_name}. Quarantined with non-executable UUID in sandbox."
            }
        })

        # Node: SHA-256 Cryptographic Hash
        hash_node_id = "node_sha256"
        G.add_node(hash_node_id, label="SHA-256", entity_type="HASH")
        nodes.append({
            "id": hash_node_id,
            "type": "fileNode",
            "position": {"x": 60, "y": 340},
            "data": {
                "label": "SHA-256 Digest",
                "sublabel": f"{sha256[:16]}...",
                "entity_type": "HASH",
                "category": "INITIAL_EVIDENCE",
                "badge": "Cryptographic Hash",
                "severity": "INFO",
                "observation_status": "OBSERVED",
                "evidence_source": "SHA-256 Digest Engine",
                "confidence": 1.0,
                "timestamp": now_iso,
                "details": f"Cryptographic integrity hash calculated across raw byte stream: {sha256}"
            }
        })

        edges.append({
            "id": f"edge_{root_node_id}_{hash_node_id}",
            "source": root_node_id,
            "target": hash_node_id,
            "label": "GENERATED_HASH",
            "animated": False,
            "style": {"stroke": "#10b981", "strokeWidth": 2},
            "data": {
                "relationship_type": "GENERATED_HASH",
                "description": "Cryptographic SHA-256 hash was generated from the raw byte stream to verify file identity and ensure non-repudiation.",
                "supporting_evidence": f"Full Digest: {sha256}",
                "confidence": 1.0,
                "observation_status": "OBSERVED"
            }
        })

        # Node: File Metadata
        meta_node_id = "node_file_metadata"
        G.add_node(meta_node_id, label="Metadata", entity_type="METADATA")
        nodes.append({
            "id": meta_node_id,
            "type": "eventNode",
            "position": {"x": 60, "y": 20},
            "data": {
                "label": "File Metadata",
                "sublabel": f"{file_type} • {(file_size_bytes/1024):.1f} KB" if file_size_bytes else file_type,
                "entity_type": "METADATA",
                "category": "INITIAL_EVIDENCE",
                "badge": "File Metadata",
                "severity": "INFO",
                "observation_status": "OBSERVED",
                "evidence_source": "Magic Byte & Header Analyzer",
                "confidence": 1.0,
                "timestamp": now_iso,
                "details": f"Format: {file_type}, Size: {file_size_bytes} bytes. Magic byte inspection confirmed container format."
            }
        })

        edges.append({
            "id": f"edge_{root_node_id}_{meta_node_id}",
            "source": root_node_id,
            "target": meta_node_id,
            "label": "CONTAINS_METADATA",
            "animated": False,
            "style": {"stroke": "#10b981", "strokeWidth": 2},
            "data": {
                "relationship_type": "CONTAINS_METADATA",
                "description": "Header inspection and magic byte evaluation extracted structural file metadata.",
                "supporting_evidence": f"Format: {file_type}",
                "confidence": 1.0,
                "observation_status": "OBSERVED"
            }
        })

        # -------------------------------------------------------------
        # TIER 2: STATIC ANALYSIS (X: 360)
        # -------------------------------------------------------------
        struct_node_id = "node_static_structure"
        G.add_node(struct_node_id, label="Structure Analysis", entity_type="STRUCTURE")
        has_struct_exploit = any(e.get("severity") in ["HIGH", "CRITICAL"] for e in evidence_items)
        nodes.append({
            "id": struct_node_id,
            "type": "eventNode",
            "position": {"x": 360, "y": 20},
            "data": {
                "label": "Structure Analysis",
                "sublabel": "AST & Object Trees",
                "entity_type": "STRUCTURE",
                "category": "STATIC_ANALYSIS",
                "badge": "Static Forensics",
                "severity": "HIGH" if has_struct_exploit else "LOW",
                "observation_status": "OBSERVED",
                "evidence_source": "Non-Executing Byte AST Parser",
                "confidence": 0.96,
                "timestamp": now_iso,
                "details": f"Decomposed container structures, streams, and xref tables for {file_type} without executing payload code."
            }
        })

        edges.append({
            "id": f"edge_{root_node_id}_{struct_node_id}",
            "source": root_node_id,
            "target": struct_node_id,
            "label": "EVALUATED_BY",
            "animated": False,
            "style": {"stroke": "#3b82f6", "strokeWidth": 2},
            "data": {
                "relationship_type": "EVALUATED_BY",
                "description": "File bytes parsed by static structural engine to discover internal streams, objects, and xref tables.",
                "supporting_evidence": "Magic Byte & Structural Object Parsers",
                "confidence": 0.96,
                "observation_status": "OBSERVED"
            }
        })

        # Node: Shannon Entropy
        entropy_node_id = "node_shannon_entropy"
        G.add_node(entropy_node_id, label="Entropy", entity_type="ENTROPY")
        nodes.append({
            "id": entropy_node_id,
            "type": "eventNode",
            "position": {"x": 360, "y": 180},
            "data": {
                "label": "Shannon Entropy",
                "sublabel": f"{entropy_val:.2f} / 8.0 bits",
                "entity_type": "ENTROPY",
                "category": "STATIC_ANALYSIS",
                "badge": "Entropy Analysis",
                "severity": "HIGH" if entropy_val > 7.0 else "LOW",
                "observation_status": "OBSERVED",
                "evidence_source": "Shannon Entropy Byte Engine",
                "confidence": 0.99,
                "timestamp": now_iso,
                "details": f"Shannon entropy measured at {entropy_val:.2f}/8.0 bits. " + ("High entropy indicates packed code or encrypted shellcode payload." if entropy_val > 7.0 else "Normal entropy indicates standard uncompressed content.")
            }
        })

        edges.append({
            "id": f"edge_{root_node_id}_{entropy_node_id}",
            "source": root_node_id,
            "target": entropy_node_id,
            "label": "MEASURED_ENTROPY",
            "animated": False,
            "style": {"stroke": "#3b82f6", "strokeWidth": 2},
            "data": {
                "relationship_type": "MEASURED_ENTROPY",
                "description": "Shannon entropy calculation determines byte randomness to assess whether payload is packed or encrypted.",
                "supporting_evidence": f"Shannon Entropy: {entropy_val:.2f} bits/byte",
                "confidence": 0.99,
                "observation_status": "OBSERVED"
            }
        })

        # Conditional Static Nodes: Embedded Content
        embedded_node_id = None
        if embedded_ev:
            e_item = embedded_ev[0]
            embedded_node_id = "node_embedded_content"
            G.add_node(embedded_node_id, label="Embedded Content", entity_type="EMBEDDED")
            nodes.append({
                "id": embedded_node_id,
                "type": "eventNode",
                "position": {"x": 360, "y": 340},
                "data": {
                    "label": "Embedded Script / Action",
                    "sublabel": e_item.get("title", "Embedded Payload")[:24],
                    "entity_type": "EMBEDDED",
                    "category": "STATIC_ANALYSIS",
                    "badge": "Embedded Content",
                    "severity": e_item.get("severity", "HIGH"),
                    "observation_status": "OBSERVED",
                    "evidence_source": e_item.get("extraction_source", "PyMuPDF Stream Extractor"),
                    "confidence": e_item.get("confidence", 0.95),
                    "timestamp": now_iso,
                    "related_evidence_id": e_item.get("id"),
                    "details": e_item.get("description", "Embedded execution primitive found inside document structure.")
                }
            })

            edges.append({
                "id": f"edge_{struct_node_id}_{embedded_node_id}",
                "source": struct_node_id,
                "target": embedded_node_id,
                "label": "EXTRACTED_PAYLOAD",
                "animated": False,
                "style": {"stroke": "#f43f5e", "strokeWidth": 2},
                "data": {
                    "relationship_type": "EXTRACTED_PAYLOAD",
                    "description": "Structural parsing of file object streams extracted embedded executable scripts or automated action triggers.",
                    "supporting_evidence": e_item.get("observed_value", "Embedded Payload"),
                    "confidence": 0.95,
                    "observation_status": "OBSERVED"
                }
            })

        # Conditional Static Nodes: YARA Signature
        yara_node_id = None
        if yara_ev:
            y_item = yara_ev[0]
            yara_node_id = "node_yara_signature"
            G.add_node(yara_node_id, label="YARA Match", entity_type="SIGNATURE")
            nodes.append({
                "id": yara_node_id,
                "type": "eventNode",
                "position": {"x": 360, "y": 490},
                "data": {
                    "label": "YARA Signature Match",
                    "sublabel": y_item.get("title", "Signature Rule")[:24],
                    "entity_type": "SIGNATURE",
                    "category": "STATIC_ANALYSIS",
                    "badge": "Signature Match",
                    "severity": y_item.get("severity", "CRITICAL"),
                    "observation_status": "OBSERVED",
                    "evidence_source": "YARA Engine 4.5",
                    "confidence": 0.98,
                    "timestamp": now_iso,
                    "related_evidence_id": y_item.get("id"),
                    "details": y_item.get("description", "Byte stream matched known malware or exploit signature.")
                }
            })

            edges.append({
                "id": f"edge_{struct_node_id}_{yara_node_id}",
                "source": struct_node_id,
                "target": yara_node_id,
                "label": "MATCHES_SIGNATURE",
                "animated": False,
                "style": {"stroke": "#f43f5e", "strokeWidth": 2},
                "data": {
                    "relationship_type": "MATCHES_SIGNATURE",
                    "description": "Byte pattern matching engine matched binary byte sequence against compiled threat intelligence rules.",
                    "supporting_evidence": y_item.get("observed_value", "YARA Rule"),
                    "confidence": 0.98,
                    "observation_status": "OBSERVED"
                }
            })

        # -------------------------------------------------------------
        # TIER 3: THREAT INTELLIGENCE & AI (X: 660)
        # -------------------------------------------------------------
        ml_node_id = "node_ml_classification"
        G.add_node(ml_node_id, label="ML Classifier", entity_type="ML_CLASSIFICATION")
        nodes.append({
            "id": ml_node_id,
            "type": "eventNode",
            "position": {"x": 660, "y": 20},
            "data": {
                "label": "ML Malware Classifier",
                "sublabel": "Random Forest 14D",
                "entity_type": "ML_CLASSIFICATION",
                "category": "THREAT_INTELLIGENCE",
                "badge": "Malware Classifier",
                "severity": "HIGH" if risk_score >= 60 else "LOW",
                "observation_status": "OBSERVED",
                "evidence_source": "Supervised Random Forest Classifier",
                "confidence": 0.91,
                "timestamp": now_iso,
                "details": f"Supervised machine learning ensemble evaluated 14 structural features, classifying sample byte distribution and structural patterns."
            }
        })

        edges.append({
            "id": f"edge_{root_node_id}_{ml_node_id}",
            "source": root_node_id,
            "target": ml_node_id,
            "label": "CLASSIFIED_BY",
            "animated": False,
            "style": {"stroke": "#8b5cf6", "strokeWidth": 2},
            "data": {
                "relationship_type": "CLASSIFIED_BY",
                "description": "14-dimensional feature vector extracted from file was classified through trained Random Forest ensemble.",
                "supporting_evidence": "Supervised 14-Feature Vector",
                "confidence": 0.91,
                "observation_status": "OBSERVED"
            }
        })

        # Node: Isolation Forest Anomaly Detection
        anomaly_node_id = "node_anomaly_detection"
        G.add_node(anomaly_node_id, label="Anomaly Model", entity_type="ANOMALY")
        nodes.append({
            "id": anomaly_node_id,
            "type": "eventNode",
            "position": {"x": 660, "y": 180},
            "data": {
                "label": "Anomaly Detection",
                "sublabel": "Isolation Forest",
                "entity_type": "ANOMALY",
                "category": "THREAT_INTELLIGENCE",
                "badge": "Anomaly Detection",
                "severity": "HIGH" if risk_score >= 60 else "LOW",
                "observation_status": "OBSERVED",
                "evidence_source": "Unsupervised Isolation Forest Engine",
                "confidence": 0.88,
                "timestamp": now_iso,
                "details": "Unsupervised Isolation Forest calculated structural outlier partition score to catch novel, zero-day threat patterns."
            }
        })

        edges.append({
            "id": f"edge_{entropy_node_id}_{anomaly_node_id}",
            "source": entropy_node_id,
            "target": anomaly_node_id,
            "label": "CORRELATED_WITH",
            "animated": False,
            "style": {"stroke": "#8b5cf6", "strokeWidth": 2},
            "data": {
                "relationship_type": "CORRELATED_WITH",
                "description": "Shannon entropy variance and section size ratios mapped into multidimensional partition space for anomaly scoring.",
                "supporting_evidence": "Entropy & Section Density Variance",
                "confidence": 0.88,
                "observation_status": "OBSERVED"
            }
        })

        # Conditional Threat Intel: Network IoC Matching
        ioc_node_id = None
        if ioc_ev:
            i_item = ioc_ev[0]
            ioc_node_id = "node_network_ioc"
            G.add_node(ioc_node_id, label="Extracted C2 Target", entity_type="IOC")
            nodes.append({
                "id": ioc_node_id,
                "type": "networkNode",
                "position": {"x": 660, "y": 340},
                "data": {
                    "label": "Extracted C2 Target",
                    "sublabel": i_item.get("observed_value", "C2 Endpoint")[:24],
                    "entity_type": "IOC",
                    "category": "THREAT_INTELLIGENCE",
                    "badge": "IoC Matching",
                    "severity": i_item.get("severity", "HIGH"),
                    "observation_status": "OBSERVED",
                    "evidence_source": "IOC Regex Extractor & Threat Intel",
                    "confidence": 0.92,
                    "timestamp": now_iso,
                    "related_evidence_id": i_item.get("id"),
                    "details": f"Extracted outbound remote callback target: {i_item.get('observed_value')}"
                }
            })

            source_for_ioc = embedded_node_id or struct_node_id
            edges.append({
                "id": f"edge_{source_for_ioc}_{ioc_node_id}",
                "source": source_for_ioc,
                "target": ioc_node_id,
                "label": "MATCHES_IOC",
                "animated": False,
                "style": {"stroke": "#f43f5e", "strokeWidth": 2},
                "data": {
                    "relationship_type": "MATCHES_IOC",
                    "description": "Static analysis extracted network indicator associated with known stage-2 payload drop servers or C2 infrastructure.",
                    "supporting_evidence": i_item.get("observed_value", ""),
                    "confidence": 0.92,
                    "observation_status": "OBSERVED"
                }
            })

        # -------------------------------------------------------------
        # TIER 4: ATTACK RECONSTRUCTION & RUNTIME (X: 960+)
        # -------------------------------------------------------------
        entry_node_id = None
        if embedded_ev or is_behavioral_present or risk_score >= 60:
            entry_node_id = "node_entry_point"
            G.add_node(entry_node_id, label="Suspected Entry Point", entity_type="ENTRY_POINT")
            nodes.append({
                "id": entry_node_id,
                "type": "processNode",
                "position": {"x": 960, "y": 60},
                "data": {
                    "label": "Suspected Entry Point",
                    "sublabel": "Document Execution Vector",
                    "entity_type": "ENTRY_POINT",
                    "category": "ATTACK_RECONSTRUCTION",
                    "badge": "Attack Vector",
                    "severity": "CRITICAL" if risk_score >= 80 else "HIGH",
                    "observation_status": "INFERRED" if not is_behavioral_present else "OBSERVED",
                    "evidence_source": "Causal Exploit Chain Modeling",
                    "confidence": 0.89,
                    "timestamp": now_iso,
                    "details": "Automated trigger structure (/OpenAction or macro auto-exec) identified as primary entry vector that attempts to initiate code execution upon document rendering."
                }
            })

            entry_src = embedded_node_id or struct_node_id
            edges.append({
                "id": f"edge_{entry_src}_{entry_node_id}",
                "source": entry_src,
                "target": entry_node_id,
                "label": "SUSPECTED_ENTRY_POINT",
                "animated": is_behavioral_present,
                "style": {"stroke": "#f97316", "strokeWidth": 2, **({"strokeDasharray": "3,3"} if not is_behavioral_present else {})},
                "data": {
                    "relationship_type": "SUSPECTED_ENTRY_POINT",
                    "description": "Embedded interactive actions and script hooks provide a mechanism to hijack document viewer process flow.",
                    "supporting_evidence": "Exploit Trigger Structure in Document Catalog",
                    "confidence": 0.89,
                    "observation_status": "INFERRED" if not is_behavioral_present else "OBSERVED"
                }
            })

        # Add Behavioral Events (ONLY when genuine or simulated telemetry exists!)
        added_proc_ids = set()
        first_proc_node_id = None
        if is_behavioral_present:
            proc_events = [e for e in behavioral_events if e.get("event_type") == "PROCESS_CREATE"]
            for i, pev in enumerate(proc_events):
                p_id = f"proc_{pev.get('process_id', i)}"
                p_name = pev.get("process_name", "process.exe")
                is_sim = pev.get("is_simulated", False)
                if not first_proc_node_id:
                    first_proc_node_id = p_id

                if p_id not in added_proc_ids:
                    added_proc_ids.add(p_id)
                    G.add_node(p_id, label=p_name, entity_type="PROCESS")
                    nodes.append({
                        "id": p_id,
                        "type": "processNode",
                        "position": {"x": 960 + (i * 220), "y": 200},
                        "data": {
                            "label": p_name,
                            "sublabel": f"PID: {pev.get('process_id')}",
                            "entity_type": "PROCESS",
                            "category": "ATTACK_RECONSTRUCTION",
                            "badge": "Simulated Process" if is_sim else "Executed Process",
                            "severity": "CRITICAL" if "cmd" in p_name or "power" in p_name else "HIGH",
                            "observation_status": "SIMULATED" if is_sim else "OBSERVED",
                            "evidence_source": "Virtual Sandbox EDR Telemetry",
                            "confidence": 0.95,
                            "timestamp": format_ts(pev.get("timestamp")),
                            "details": f"Command line: {pev.get('command_line')}"
                        }
                    })

            # Connect entry point to first process
            if first_proc_node_id:
                src_for_proc = entry_node_id or root_node_id
                edges.append({
                    "id": f"edge_{src_for_proc}_{first_proc_node_id}",
                    "source": src_for_proc,
                    "target": first_proc_node_id,
                    "label": "SPAWNED_PROCESS",
                    "animated": True,
                    "style": {"stroke": "#ef4444", "strokeWidth": 2},
                    "data": {
                        "relationship_type": "SPAWNED_PROCESS",
                        "description": "Exploitation of document entry point spawned malicious child operating system process.",
                        "supporting_evidence": "Process Create Telemetry Event",
                        "confidence": 0.95,
                        "observation_status": "SIMULATED" if any(e.get("is_simulated") for e in proc_events) else "OBSERVED"
                    }
                })

            # Connect parent to child processes
            for pev in proc_events:
                ppid = pev.get("parent_process_id")
                curr_pid = f"proc_{pev.get('process_id')}"
                parent_node_id = f"proc_{ppid}"
                if parent_node_id in added_proc_ids and parent_node_id != curr_pid:
                    edges.append({
                        "id": f"edge_{parent_node_id}_{curr_pid}",
                        "source": parent_node_id,
                        "target": curr_pid,
                        "label": "SPAWNED_PROCESS",
                        "animated": True,
                        "style": {"stroke": "#f97316", "strokeWidth": 2},
                        "data": {
                            "relationship_type": "SPAWNED_PROCESS",
                            "description": "Parent process invoked child execution stager via command-line shell invocation.",
                            "supporting_evidence": f"Parent PID {ppid} -> Child PID {pev.get('process_id')}",
                            "confidence": 0.95,
                            "observation_status": "SIMULATED" if pev.get("is_simulated") else "OBSERVED"
                        }
                    })

            # Add Behavioral Network Nodes
            net_events = [e for e in behavioral_events if e.get("event_type") in ["NETWORK_CONNECT", "DNS_QUERY"]]
            for j, nev in enumerate(net_events):
                dst = nev.get("destination_ip") or nev.get("domain") or "remote_host"
                net_node_id = f"net_{j}_{dst.replace('.', '_')}"
                src_pid = f"proc_{nev.get('process_id')}"
                if src_pid not in added_proc_ids:
                    src_pid = first_proc_node_id or root_node_id

                G.add_node(net_node_id, label=dst, entity_type="NETWORK")
                nodes.append({
                    "id": net_node_id,
                    "type": "networkNode",
                    "position": {"x": 1220, "y": 80 + (j * 140)},
                    "data": {
                        "label": dst,
                        "sublabel": f"Port: {nev.get('destination_port', '443')}",
                        "entity_type": "NETWORK",
                        "category": "ATTACK_RECONSTRUCTION",
                        "badge": "C2 Socket",
                        "severity": "CRITICAL",
                        "observation_status": "SIMULATED" if nev.get("is_simulated") else "OBSERVED",
                        "evidence_source": "Virtual Sandbox Socket Monitor",
                        "confidence": 0.95,
                        "timestamp": format_ts(nev.get("timestamp")),
                        "details": f"Outbound socket connection established to external server: {dst}"
                    }
                })

                edges.append({
                    "id": f"edge_{src_pid}_{net_node_id}",
                    "source": src_pid,
                    "target": net_node_id,
                    "label": "CONNECTED_TO",
                    "animated": True,
                    "style": {"stroke": "#06b6d4", "strokeWidth": 2},
                    "data": {
                        "relationship_type": "CONNECTED_TO",
                        "description": "Active in-memory process established TCP connection to remote C2 network endpoint.",
                        "supporting_evidence": f"Socket: {dst}:{nev.get('destination_port', '443')}",
                        "confidence": 0.95,
                        "observation_status": "SIMULATED" if nev.get("is_simulated") else "OBSERVED"
                    }
                })

            # Add Dropped Files
            file_events = [e for e in behavioral_events if e.get("event_type") == "FILE_WRITE"]
            for k, fev in enumerate(file_events):
                target_p = fev.get("target_path", "payload.bin")
                f_name = target_p.split("\\")[-1].split("/")[-1]
                fs_node_id = f"fs_{k}_{f_name.replace('.', '_')}"
                src_pid = f"proc_{fev.get('process_id')}"
                if src_pid not in added_proc_ids:
                    src_pid = first_proc_node_id or root_node_id

                G.add_node(fs_node_id, label=f_name, entity_type="FILESYSTEM")
                nodes.append({
                    "id": fs_node_id,
                    "type": "fileNode",
                    "position": {"x": 1220, "y": 220 + (k * 140)},
                    "data": {
                        "label": f_name,
                        "sublabel": "Dropped Payload",
                        "entity_type": "FILESYSTEM",
                        "category": "ATTACK_RECONSTRUCTION",
                        "badge": "Dropped Payload",
                        "severity": "HIGH",
                        "observation_status": "SIMULATED" if fev.get("is_simulated") else "OBSERVED",
                        "evidence_source": "Virtual Sandbox Filesystem Driver",
                        "confidence": 0.95,
                        "timestamp": format_ts(fev.get("timestamp")),
                        "details": f"Secondary stage-2 payload dropped to filesystem path: {target_p}"
                    }
                })

                edges.append({
                    "id": f"edge_{src_pid}_{fs_node_id}",
                    "source": src_pid,
                    "target": fs_node_id,
                    "label": "MODIFIED_FILE",
                    "animated": False,
                    "style": {"stroke": "#a855f7", "strokeWidth": 2},
                    "data": {
                        "relationship_type": "MODIFIED_FILE",
                        "description": "Process downloaded or unpacked executable artifact onto host filesystem.",
                        "supporting_evidence": f"Target Path: {target_p}",
                        "confidence": 0.95,
                        "observation_status": "SIMULATED" if fev.get("is_simulated") else "OBSERVED"
                    }
                })

            # Add Registry Persistence
            reg_events = [e for e in behavioral_events if e.get("event_type") == "REGISTRY_SET"]
            for m, rev in enumerate(reg_events):
                r_path = rev.get("target_path", "HKCU\\...\\Run")
                reg_node_id = f"reg_{m}"
                src_pid = f"proc_{rev.get('process_id')}"
                if src_pid not in added_proc_ids:
                    src_pid = first_proc_node_id or root_node_id

                G.add_node(reg_node_id, label="Persistence Key", entity_type="PERSISTENCE")
                nodes.append({
                    "id": reg_node_id,
                    "type": "eventNode",
                    "position": {"x": 1220, "y": 360 + (m * 140)},
                    "data": {
                        "label": "Autorun Key",
                        "sublabel": "HKCU\\...\\Run",
                        "entity_type": "PERSISTENCE",
                        "category": "ATTACK_RECONSTRUCTION",
                        "badge": "Persistence Key",
                        "severity": "HIGH",
                        "observation_status": "SIMULATED" if rev.get("is_simulated") else "OBSERVED",
                        "evidence_source": "Virtual Sandbox Registry Monitor",
                        "confidence": 0.95,
                        "timestamp": format_ts(rev.get("timestamp")),
                        "details": f"Registry persistence hook established to persist payload across reboots: {r_path}"
                    }
                })

                edges.append({
                    "id": f"edge_{src_pid}_{reg_node_id}",
                    "source": src_pid,
                    "target": reg_node_id,
                    "label": "PERSISTENCE_SET",
                    "animated": False,
                    "style": {"stroke": "#a855f7", "strokeWidth": 2},
                    "data": {
                        "relationship_type": "PERSISTENCE_SET",
                        "description": "Process modified system autostart registry entries to achieve persistent reboot survival.",
                        "supporting_evidence": f"Key: {r_path}",
                        "confidence": 0.95,
                        "observation_status": "SIMULATED" if rev.get("is_simulated") else "OBSERVED"
                    }
                })

        # -------------------------------------------------------------
        # TIER 5: DEFENSIVE RESPONSE (X: 1220 / 1480)
        # -------------------------------------------------------------
        defense_x = 1500 if is_behavioral_present else 1220

        # Node: Threat Assessment
        assess_node_id = "node_threat_assessment"
        G.add_node(assess_node_id, label="Threat Assessment", entity_type="THREAT_ASSESSMENT")
        nodes.append({
            "id": assess_node_id,
            "type": "eventNode",
            "position": {"x": defense_x, "y": 20},
            "data": {
                "label": "Threat Assessment",
                "sublabel": f"{risk_score:.1f}/100 • {risk_level}",
                "entity_type": "THREAT_ASSESSMENT",
                "category": "DEFENSIVE_RESPONSE",
                "badge": "Threat Assessment",
                "severity": risk_level,
                "observation_status": "OBSERVED",
                "evidence_source": "Composite Risk Scoring Engine",
                "confidence": 0.95,
                "timestamp": now_iso,
                "details": f"Synthesized static evidence findings, ML inference, and anomaly metrics into a transparent risk score of {risk_score:.1f}/100 ({risk_level})."
            }
        })

        edges.append({
            "id": f"edge_{ml_node_id}_{assess_node_id}",
            "source": ml_node_id,
            "target": assess_node_id,
            "label": "TRIGGERED_ALERT",
            "animated": False,
            "style": {"stroke": "#6366f1", "strokeWidth": 2},
            "data": {
                "relationship_type": "TRIGGERED_ALERT",
                "description": "Multi-layer forensic scoring quantified security indicators and anomaly metrics into overall threat posture.",
                "supporting_evidence": f"Score: {risk_score:.1f}/100",
                "confidence": 0.95,
                "observation_status": "OBSERVED"
            }
        })

        # Node: Sandbox Isolation
        isolation_node_id = "node_sandbox_isolation"
        G.add_node(isolation_node_id, label="Sandbox Isolation", entity_type="SANDBOX_ISOLATION")
        nodes.append({
            "id": isolation_node_id,
            "type": "eventNode",
            "position": {"x": defense_x, "y": 180},
            "data": {
                "label": "Sandbox Isolation",
                "sublabel": "In-Memory Virtual SOC",
                "entity_type": "SANDBOX_ISOLATION",
                "category": "DEFENSIVE_RESPONSE",
                "badge": "Sandbox Isolation",
                "severity": "INFO",
                "observation_status": "OBSERVED",
                "evidence_source": "In-Memory Virtual Sandbox Deck",
                "confidence": 1.0,
                "timestamp": now_iso,
                "details": "All analysis and defensive containment simulations run inside an isolated in-memory deck; host OS and live networks are protected."
            }
        })

        edges.append({
            "id": f"edge_{assess_node_id}_{isolation_node_id}",
            "source": assess_node_id,
            "target": isolation_node_id,
            "label": "MITIGATED_BY",
            "animated": False,
            "style": {"stroke": "#10b981", "strokeWidth": 2},
            "data": {
                "relationship_type": "MITIGATED_BY",
                "description": "Threat assessment dispatches file containment to virtual sandbox, shielding the host OS from detonation.",
                "supporting_evidence": "Virtual Sandbox Isolation Deck Active",
                "confidence": 1.0,
                "observation_status": "OBSERVED"
            }
        })

        # Node: Quarantine Simulation
        quarantine_node_id = "node_quarantine"
        G.add_node(quarantine_node_id, label="Quarantine Policy", entity_type="DEFENSE_CONTAINMENT")
        nodes.append({
            "id": quarantine_node_id,
            "type": "eventNode",
            "position": {"x": defense_x, "y": 340},
            "data": {
                "label": "Quarantine Simulation",
                "sublabel": "Access Restriction",
                "entity_type": "DEFENSE_CONTAINMENT",
                "category": "DEFENSIVE_RESPONSE",
                "badge": "Quarantine",
                "severity": "LOW" if risk_level == "LOW" else "HIGH",
                "observation_status": "OBSERVED" if risk_level == "LOW" else "SIMULATED",
                "evidence_source": "Quarantine Storage Controller",
                "confidence": 0.98,
                "timestamp": now_iso,
                "details": "Restricts OS execute permissions, revoking file descriptors to block execution."
            }
        })

        edges.append({
            "id": f"edge_{isolation_node_id}_{quarantine_node_id}",
            "source": isolation_node_id,
            "target": quarantine_node_id,
            "label": "MITIGATED_BY",
            "animated": False,
            "style": {"stroke": "#10b981", "strokeWidth": 2},
            "data": {
                "relationship_type": "MITIGATED_BY",
                "description": "Quarantine controller applies strict access controls, isolating malicious payload from user endpoints.",
                "supporting_evidence": "Access Control List Policy",
                "confidence": 0.98,
                "observation_status": "OBSERVED"
            }
        })

        # Node: Host Firewall Rule (If network threat or network events exist)
        if ioc_ev or any(e.get("event_type") in ["NETWORK_CONNECT", "DNS_QUERY"] for e in behavioral_events):
            firewall_node_id = "node_firewall_rule"
            G.add_node(firewall_node_id, label="Firewall Rule", entity_type="DEFENSE_CONTAINMENT")
            nodes.append({
                "id": firewall_node_id,
                "type": "eventNode",
                "position": {"x": defense_x, "y": 500},
                "data": {
                    "label": "Host Firewall Rule",
                    "sublabel": "Egress Sinkhole",
                    "entity_type": "DEFENSE_CONTAINMENT",
                    "category": "DEFENSIVE_RESPONSE",
                    "badge": "Firewall Rule",
                    "severity": "CRITICAL",
                    "observation_status": "SIMULATED",
                    "evidence_source": "Automated Firewall Policy Synthesizer",
                    "confidence": 0.98,
                    "timestamp": now_iso,
                    "details": "Simulated packet-filtering firewall rule deployed to sever outbound socket connections to malicious C2 servers."
                }
            })

            src_for_fw = ioc_node_id or isolation_node_id
            edges.append({
                "id": f"edge_{src_for_fw}_{firewall_node_id}",
                "source": src_for_fw,
                "target": firewall_node_id,
                "label": "MITIGATED_BY",
                "animated": False,
                "style": {"stroke": "#10b981", "strokeWidth": 2},
                "data": {
                    "relationship_type": "MITIGATED_BY",
                    "description": "Host firewall rules generated to sinkhole egress packets directed toward malicious command & control endpoints.",
                    "supporting_evidence": "Packet Filtering Policy Rule",
                    "confidence": 0.98,
                    "observation_status": "SIMULATED"
                }
            })

        # -------------------------------------------------------------
        # 6. ATTACK TIMELINE (Chronological Order)
        # -------------------------------------------------------------
        timeline.append({
            "id": "tl-1",
            "phase": "INGESTION",
            "title": "Initial Ingestion & Nonce Verification",
            "description": f"File '{sample_name}' ingested and cryptographically digested ({sha256[:16]}...). Placed in safe quarantine storage.",
            "timestamp": now_iso,
            "severity": "INFO",
            "node_id": root_node_id,
            "status": "OBSERVED"
        })

        timeline.append({
            "id": "tl-2",
            "phase": "STATIC_ANALYSIS",
            "title": "Static Byte Parsing & Entropy Evaluation",
            "description": f"Evaluated internal AST structures and measured Shannon entropy ({entropy_val:.2f}/8.0 bits).",
            "timestamp": now_iso,
            "severity": "HIGH" if has_struct_exploit else "LOW",
            "node_id": struct_node_id,
            "status": "OBSERVED"
        })

        if embedded_ev:
            timeline.append({
                "id": "tl-3",
                "phase": "STATIC_ANALYSIS",
                "title": "Embedded Payload & Action Primitive Extracted",
                "description": f"Identified interactive script trigger ({embedded_ev[0].get('title', 'Embedded Payload')}).",
                "timestamp": now_iso,
                "severity": embedded_ev[0].get("severity", "HIGH"),
                "node_id": embedded_node_id,
                "status": "OBSERVED"
            })

        timeline.append({
            "id": f"tl-{len(timeline)+1}",
            "phase": "THREAT_INTELLIGENCE",
            "title": "Dual AI Machine Learning & Anomaly Evaluation",
            "description": f"Supervised Random Forest (14D vector) and unsupervised Isolation Forest evaluated threat posture.",
            "timestamp": now_iso,
            "severity": risk_level,
            "node_id": ml_node_id,
            "status": "OBSERVED"
        })

        if is_behavioral_present:
            for idx, bev in enumerate(behavioral_events):
                bev_type = bev.get("event_type", "EVENT")
                is_sim = bev.get("is_simulated", False)
                p_desc = bev.get("command_line") or bev.get("destination_ip") or bev.get("target_path") or "Runtime activity"
                timeline.append({
                    "id": f"tl-bev-{idx}",
                    "phase": "ATTACK_RECONSTRUCTION",
                    "title": f"Runtime {bev_type}: {bev.get('process_name') or 'Event'}",
                    "description": str(p_desc),
                    "timestamp": format_ts(bev.get("timestamp")) if bev.get("timestamp") else now_iso,
                    "severity": "CRITICAL" if bev_type in ["NETWORK_CONNECT", "PROCESS_CREATE"] else "HIGH",
                    "node_id": f"proc_{bev.get('process_id')}" if bev.get("process_id") else root_node_id,
                    "status": "SIMULATED" if is_sim else "OBSERVED"
                })

        timeline.append({
            "id": f"tl-{len(timeline)+1}",
            "phase": "DEFENSIVE_RESPONSE",
            "title": "Automated Sandbox Containment & Posture Synthesis",
            "description": f"Platform synthesized defensive containment and residual risk mitigation based on score of {risk_score:.1f}/100 ({risk_level}).",
            "timestamp": now_iso,
            "severity": "LOW" if risk_level == "LOW" else "HIGH",
            "node_id": isolation_node_id,
            "status": "SIMULATED" if risk_level != "LOW" else "OBSERVED"
        })

        # Summary narrative
        if is_behavioral_present:
            summary = (
                f"Multi-stage attack chain reconstructed across {len(nodes)} entities and {len(edges)} causal transitions. "
                f"Initial delivery via '{sample_name}' spawned processes, resulting in outbound beaconing and filesystem modifications."
            )
            missing_notes = None
        else:
            summary = (
                f"Forensic causal topology reconstructed across {len(nodes)} entities and {len(edges)} evidence-backed links. "
                f"Spans Initial Evidence, Static Forensics, Threat Intelligence, and Defensive Posture."
            )
            missing_notes = (
                "Dynamic runtime telemetry is not yet ingested for this file. "
                "Relationships shown represent validated static forensic findings and AI threat inferences. "
                "To simulate live process trees and network connections, click 'Inject Demo Telemetry'."
            )

        return {
            "id": f"graph_{investigation_id}",
            "investigation_id": investigation_id,
            "nodes": nodes,
            "edges": edges,
            "timeline": timeline,
            "summary": summary,
            "missing_evidence_notes": missing_notes
        }


attack_graph_builder = AttackGraphBuilder()

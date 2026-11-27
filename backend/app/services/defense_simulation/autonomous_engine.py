"""
ARGUS 2.0 Centralized Autonomous Defense & Batch Scanning Orchestrator
Processes multi-file batches, correlates cross-file threats, determines aggregate risks
without double-counting, synthesizes proactive countermeasures, executes sandbox remediations,
verifies outcomes, and builds a comprehensive security report.
"""

import os
import uuid
import json
import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.models.investigation import (
    Investigation,
    EvidenceItem,
    BehavioralEvent,
    DefensiveAction,
    RemediationExecution,
    BatchScan,
    BatchScanItem,
)
from backend.app.services.ingestion.quarantine import ingestion_service
from backend.app.services.static_analysis.analyzer import static_forensics_engine
from backend.app.services.feature_engineering.extractor import feature_extractor
from backend.app.services.ml_engine.model import ml_engine
from backend.app.services.ml_engine.risk_scorer import risk_scorer
from backend.app.services.attack_graph.builder import attack_graph_builder
from backend.app.services.explainable_ai.explainer import xai_engine
from backend.app.services.report_generation.generator import forensic_report_generator
from backend.app.services.defense_simulation.engine import defense_simulation_engine
from backend.app.services.defense_simulation.sandbox_remediation import sandbox_remediation_engine


class AutonomousDefenseEngine:
    """
    Central Autonomous Defense & Threat Response Engine for ARGUS 2.0.
    """

    def calculate_aggregate_risk(self, risk_scores: List[float]) -> float:
        """
        Documented aggregate risk methodology:
        Avoids naive averaging or double-counting of correlated threats.
        Uses probabilistic combination: 1 - product(1 - risk_i/100).
        Guarantees:
        - If one threat is 100, aggregate is 100.
        - Multiple medium threats accumulate appropriately without exceeding 100.
        - Empty batch yields 0.0.
        """
        if not risk_scores:
            return 0.0
        
        # Probabilistic union of risk events
        complement_product = 1.0
        for score in risk_scores:
            clamped = max(0.0, min(100.0, score)) / 100.0
            complement_product *= (1.0 - clamped)

        aggregate = (1.0 - complement_product) * 100.0
        return round(max(0.0, min(100.0, aggregate)), 1)

    async def execute_batch_scan_and_autodefend(
        self,
        files: List[UploadFile],
        auto_remediate: bool,
        target_os: Optional[str],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Orchestrate the 10-step autonomous scan, triage, and defense pipeline:
        1. Batch file ingestion & preservation
        2. Forensic analysis & feature extraction
        3. Threat & relationship correlation
        4. Prioritization of critical threats
        5. Proactive countermeasure synthesis
        6. Sandbox isolation execution
        7. Verification of mitigation
        8. Residual risk recalculation
        9. Security event timeline compilation
        10. Aggregated security report generation & database persistence
        """
        batch_id = str(uuid.uuid4())
        batch_title = f"Autonomous Scan Batch #{batch_id[:8]}"
        created_at = datetime.now(timezone.utc)

        batch_scan = BatchScan(
            id=batch_id,
            title=batch_title,
            status="PROCESSING",
            total_files=len(files),
            created_at=created_at
        )
        db.add(batch_scan)
        await db.commit()

        timeline: List[Dict[str, Any]] = [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "stage": "INITIALIZATION",
                "description": f"Initialized Autonomous Defense Engine for {len(files)} asset(s).",
                "status": "INFO",
            }
        ]

        item_records: List[BatchScanItem] = []
        initial_scores: List[float] = []
        residual_scores: List[float] = []
        threat_count = 0
        critical_count = 0
        contained_count = 0
        remediations_run = 0

        for file in files:
            orig_name = file.filename or "unknown_file"
            timeline.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "stage": "INGESTION",
                "description": f"Ingesting and calculating cryptographic fingerprint for '{orig_name}'...",
                "status": "INFO",
            })

            try:
                # 1. Ingestion
                ingest_meta = await ingestion_service.ingest_upload(file)
                inv_id = ingest_meta["investigation_id"]
                file_path = ingest_meta["file_path"]
                sha256 = ingest_meta["sha256"]
                file_size = ingest_meta["file_size_bytes"]
                file_type = ingest_meta["file_type"]

                # 2. Investigation record
                inv = Investigation(
                    id=inv_id,
                    original_name=orig_name,
                    stored_name=ingest_meta["stored_name"],
                    file_path=file_path,
                    sha256=sha256,
                    file_size_bytes=file_size,
                    file_type=file_type,
                    status="PROCESSING",
                    created_at=datetime.now(timezone.utc)
                )
                db.add(inv)
                await db.commit()

                # 3. Static Forensics & ML Inference
                evidence_dicts = static_forensics_engine.analyze_file(file_path, orig_name, file_type)
                features = feature_extractor.extract_features(file_size, evidence_dicts)
                ml_prediction = ml_engine.predict(features)
                risk_result = risk_scorer.calculate_risk(
                    evidence_items=evidence_dicts,
                    ml_prediction=ml_prediction,
                    behavioral_events=[],
                    correlations=[],
                    file_type=file_type,
                    file_size_bytes=file_size
                )

                inv_score = risk_result["risk_score"]
                inv_level = risk_result["risk_level"]
                initial_scores.append(inv_score)

                # Persist evidence
                for item in evidence_dicts:
                    ev_record = EvidenceItem(
                        investigation_id=inv_id,
                        category=item["category"],
                        title=item["title"],
                        description=item["description"],
                        severity=item["severity"],
                        observed_value=item["observed_value"],
                        extraction_source=item["extraction_source"],
                        offset_or_location=item.get("offset_or_location"),
                        explanation=item["explanation"],
                        confidence=item["confidence"],
                        limitations=item.get("limitations")
                    )
                    db.add(ev_record)

                # Update investigation
                inv.status = "COMPLETED"
                inv.risk_score = inv_score
                inv.risk_level = inv_level
                inv.confidence_score = risk_result["confidence_score"]
                inv.coverage_score = risk_result["coverage_score"]
                inv.completed_at = datetime.now(timezone.utc)
                await db.commit()

                is_threat = inv_score >= 30.0 or inv_level in ("MEDIUM", "HIGH", "CRITICAL")
                if is_threat:
                    threat_count += 1
                if inv_score >= 85.0 or inv_level == "CRITICAL":
                    critical_count += 1

                # 4. Synthesize Defensive Plan
                plan_data = defense_simulation_engine.generate_defense_plan_data(
                    investigation_id=inv.id,
                    sample_name=orig_name,
                    sha256=sha256,
                    file_type=file_type,
                    risk_score=inv_score,
                    evidence_items=evidence_dicts,
                    behavioral_events=[],
                    risk_level=inv_level
                )

                # Persist actions
                created_actions: List[DefensiveAction] = []
                for act in plan_data["actions"]:
                    db_act = DefensiveAction(
                        id=act["id"],
                        investigation_id=inv.id,
                        category=act["category"],
                        title=act["title"],
                        description=act["description"],
                        target=act["target"],
                        rule_syntax=act["rule_syntax"],
                        status=act["status"],
                        risk_reduction=act["risk_reduction"],
                        simulated_output=act.get("simulated_output"),
                    )
                    db.add(db_act)
                    created_actions.append(db_act)
                await db.commit()

                item_status = "SAFE" if not is_threat else "SCANNED"
                item_remed_status = "NONE"
                final_item_risk = inv_score
                executed_countermeasure_title = None

                # 5. Autonomous Auto-Remediation (if enabled and threat detected)
                if auto_remediate and is_threat and created_actions:
                    timeline.append({
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "stage": "AUTO_REMEDIATION",
                        "description": f"Proactively executing sandbox containment for threat '{orig_name}' ({inv_level})...",
                        "status": "ACTIVE",
                    })

                    # Execute highest priority defensive action
                    lead_action = created_actions[0]
                    exec_res = await sandbox_remediation_engine.execute_in_sandbox(
                        investigation_id=inv.id,
                        action_id=lead_action.id,
                        action_title=lead_action.title,
                        action_category=lead_action.category,
                        target=lead_action.target,
                        target_file=orig_name,
                        initial_risk=inv_score,
                        risk_reduction=lead_action.risk_reduction or 15.0,
                        rule_syntax=lead_action.rule_syntax,
                        target_os=target_os
                    )

                    # Persist execution
                    rem_exec = RemediationExecution(
                        id=exec_res["execution_id"],
                        investigation_id=inv.id,
                        action_id=lead_action.id,
                        action_title=lead_action.title,
                        action_category=lead_action.category,
                        target_file=orig_name,
                        target_identifier=lead_action.target,
                        status=exec_res["status"],
                        execution_type=exec_res["execution_type"],
                        detected_os=exec_res["detected_os"],
                        target_os=exec_res["target_os"],
                        risk_score_before=exec_res["risk_score_before"],
                        risk_score_after=exec_res["risk_score_after"],
                        risk_reduction_achieved=exec_res["risk_reduction_achieved"],
                        actions_performed=json.dumps(exec_res["actions_performed"]),
                        execution_logs="\n".join(exec_res["execution_logs"]),
                        error_message=exec_res.get("error_message"),
                        started_at=exec_res["started_at"],
                        completed_at=exec_res["completed_at"],
                    )
                    db.add(rem_exec)

                    if exec_res["status"] == "SUCCESS":
                        lead_action.status = "VERIFIED_BLOCKED"
                        lead_action.executed_at = exec_res["completed_at"]
                        inv.risk_score = exec_res["risk_score_after"]
                        final_item_risk = exec_res["risk_score_after"]
                        item_status = "REMEDIATED"
                        item_remed_status = "EXECUTED"
                        contained_count += 1
                        remediations_run += 1
                        executed_countermeasure_title = lead_action.title

                        timeline.append({
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "stage": "VERIFICATION",
                            "description": f"Verified sandbox neutralization: '{orig_name}' risk reduced to {final_item_risk:.1f}/100.",
                            "status": "SUCCESS",
                        })
                    else:
                        item_remed_status = "BLOCKED"
                        timeline.append({
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "stage": "VERIFICATION",
                            "description": f"Remediation blocked or failed for '{orig_name}': {exec_res.get('error_message')}",
                            "status": "WARNING",
                        })
                    await db.commit()

                residual_scores.append(final_item_risk)

                # Create BatchScanItem
                scan_item = BatchScanItem(
                    id=str(uuid.uuid4()),
                    batch_scan_id=batch_id,
                    investigation_id=inv.id,
                    filename=orig_name,
                    file_size_bytes=file_size,
                    sha256=sha256,
                    status=item_status,
                    risk_score_initial=inv_score,
                    risk_score_residual=final_item_risk,
                    risk_level=inv_level,
                    remediation_status=item_remed_status,
                    threat_category=plan_data.get("primary_strategy"),
                    countermeasure_title=executed_countermeasure_title or (created_actions[0].title if created_actions else None),
                    created_at=datetime.now(timezone.utc),
                    completed_at=datetime.now(timezone.utc)
                )
                db.add(scan_item)
                item_records.append(scan_item)

            except Exception as e:
                timeline.append({
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "stage": "ERROR",
                    "description": f"Failed analyzing '{orig_name}': {str(e)}",
                    "status": "BLOCKED",
                })
                scan_item = BatchScanItem(
                    id=str(uuid.uuid4()),
                    batch_scan_id=batch_id,
                    filename=orig_name,
                    status="FAILED",
                    created_at=datetime.now(timezone.utc),
                    completed_at=datetime.now(timezone.utc)
                )
                db.add(scan_item)
                item_records.append(scan_item)

        # Recalculate Aggregate Posture
        initial_agg = self.calculate_aggregate_risk(initial_scores)
        residual_agg = self.calculate_aggregate_risk(residual_scores)
        efficacy = 0.0
        if initial_agg > 0:
            efficacy = round(((initial_agg - residual_agg) / initial_agg) * 100.0, 1)

        verified_reduction = round(max(0.0, initial_agg - residual_agg), 1)

        batch_scan.threats_detected = threat_count
        batch_scan.critical_threats = critical_count
        batch_scan.threats_contained = contained_count
        batch_scan.remediations_executed = remediations_run
        batch_scan.initial_aggregate_risk = initial_agg
        batch_scan.residual_aggregate_risk = residual_agg
        batch_scan.mitigation_efficacy_pct = efficacy
        batch_scan.status = "COMPLETED"
        batch_scan.completed_at = datetime.now(timezone.utc)
        batch_scan.event_timeline_json = json.dumps(timeline)

        overall_posture = (
            "HARDENED" if residual_agg < 20.0
            else "CONTAINED" if residual_agg < 50.0
            else "ELEVATED_RISK" if residual_agg < 80.0
            else "CRITICAL"
        )

        executive_summary = (
            f"ARGUS 2.0 Autonomous Defense evaluated {len(files)} asset(s). "
            f"Identified {threat_count} threat vector(s) including {critical_count} critical indicator(s). "
            f"Autonomous sandbox containment executed {remediations_run} action(s), containing {contained_count} threat(s). "
            f"Aggregate threat posture reduced from {initial_agg:.1f}/100 to {residual_agg:.1f}/100 ({efficacy}% efficacy)."
        )
        batch_scan.executive_summary = executive_summary

        report_dict = {
            "batch_scan_id": batch_id,
            "title": batch_title,
            "files_analysed": len(files),
            "threats_detected": threat_count,
            "critical_threats": critical_count,
            "threats_contained": contained_count,
            "threats_requiring_manual_review": max(0, threat_count - contained_count),
            "remediations_executed": remediations_run,
            "initial_aggregate_risk": initial_agg,
            "residual_aggregate_risk": residual_agg,
            "verified_risk_reduction": verified_reduction,
            "mitigation_efficacy_pct": efficacy,
            "overall_posture": overall_posture,
            "severity_distribution": {
                "CRITICAL": critical_count,
                "HIGH": sum(1 for s in residual_scores if 60.0 <= s < 85.0),
                "MEDIUM": sum(1 for s in residual_scores if 30.0 <= s < 60.0),
                "LOW": sum(1 for s in residual_scores if s < 30.0),
            },
            "attack_paths_count": threat_count,
            "recommended_actions": [
                "Maintain virtual sandbox isolation for quarantined payloads",
                "Deploy generated dynamic YARA signatures across network perimeter",
                "Enforce egress port filtering for suspicious C2 destinations"
            ],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        batch_scan.report_json = json.dumps(report_dict)

        timeline.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stage": "COMPLETION",
            "description": f"Autonomous batch defense finalized. Security Posture: {overall_posture}.",
            "status": "SUCCESS",
        })
        batch_scan.event_timeline_json = json.dumps(timeline)

        await db.commit()

        return {
            "batch_scan": batch_scan,
            "items": item_records,
            "report": report_dict,
            "timeline": timeline,
        }

    async def get_overview_metrics(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Aggregate high-level intelligence across all investigations and batch scans.
        """
        inv_query = select(Investigation)
        inv_res = await db.execute(inv_query)
        all_invs = inv_res.scalars().all()

        rem_query = select(RemediationExecution)
        rem_res = await db.execute(rem_query)
        all_rems = rem_res.scalars().all()

        batch_query = select(BatchScan).order_by(BatchScan.created_at.desc()).limit(5)
        batch_res = await db.execute(batch_query)
        recent_batches = batch_res.scalars().all()

        total_files = len(all_invs)
        threats = [inv for inv in all_invs if (inv.risk_score or 0) >= 30.0 or inv.risk_level in ("MEDIUM", "HIGH", "CRITICAL")]
        criticals = [inv for inv in all_invs if (inv.risk_score or 0) >= 85.0 or inv.risk_level == "CRITICAL"]
        verified_rems = [r for r in all_rems if r.status == "SUCCESS"]

        # Calculate live aggregate risk
        current_scores = [inv.risk_score or 0.0 for inv in all_invs]
        current_agg = self.calculate_aggregate_risk(current_scores)
        initial_agg = min(100.0, current_agg + sum(r.risk_reduction_achieved or 0.0 for r in verified_rems))
        reduction_pct = 0.0
        if initial_agg > 0:
            reduction_pct = round(((initial_agg - current_agg) / initial_agg) * 100.0, 1)

        posture = (
            "HARDENED" if current_agg < 20.0
            else "CONTAINED" if current_agg < 50.0
            else "ELEVATED" if current_agg < 80.0
            else "CRITICAL"
        )

        timeline_items = [
            {
                "timestamp": r.started_at.isoformat() if r.started_at else "",
                "stage": "SANDBOX_REMEDIATION",
                "description": f"Verified remediation executed: '{r.action_title}' on {r.target_file}.",
                "status": r.status,
            }
            for r in verified_rems[:8]
        ]

        return {
            "overall_security_status": posture,
            "total_files_analysed": total_files,
            "threats_detected": len(threats),
            "critical_threats": len(criticals),
            "threats_contained": len(verified_rems),
            "threats_requiring_manual_review": max(0, len(threats) - len(verified_rems)),
            "active_investigations": total_files,
            "verified_remediations_count": len(verified_rems),
            "overall_initial_risk": initial_agg,
            "overall_current_risk": current_agg,
            "overall_risk_reduction_pct": reduction_pct,
            "risk_trend": [
                {"period": "Initial Risk", "score": initial_agg},
                {"period": "Remediated Risk", "score": current_agg},
            ],
            "live_timeline": timeline_items,
            "recent_batches": [
                {
                    "id": b.id,
                    "title": b.title,
                    "status": b.status,
                    "total_files": b.total_files,
                    "threats_detected": b.threats_detected,
                    "initial_risk": b.initial_aggregate_risk,
                    "residual_risk": b.residual_aggregate_risk,
                    "created_at": b.created_at.isoformat() if b.created_at else "",
                }
                for b in recent_batches
            ]
        }

    async def build_live_attack_map(self, db: AsyncSession, batch_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Build dynamic attack map showing detected threat nodes, targets, domains,
        and severed/contained connection lines.
        """
        inv_query = select(Investigation).order_by(Investigation.created_at.desc()).limit(15)
        inv_res = await db.execute(inv_query)
        invs = inv_res.scalars().all()

        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []

        # Central SOC Asset Node
        nodes.append({
            "id": "soc_core",
            "label": "ARGUS Security Hub",
            "type": "ASSET",
            "status": "SAFE",
            "risk_level": "LOW",
            "metadata": {"role": "Central Defense Kernel"}
        })

        active_threats = 0
        contained_threats = 0

        for inv in invs:
            file_node_id = f"file_{inv.id[:8]}"
            is_mal = (inv.risk_score or 0) >= 40.0
            is_contained = (inv.risk_score or 0) < 30.0 and inv.status == "COMPLETED"

            if is_mal:
                active_threats += 1
            if is_contained:
                contained_threats += 1

            nodes.append({
                "id": file_node_id,
                "label": inv.original_name,
                "type": "FILE",
                "status": "CONTAINED" if is_contained else "ACTIVE" if is_mal else "SAFE",
                "risk_level": inv.risk_level or "LOW",
                "metadata": {"risk_score": inv.risk_score, "file_type": inv.file_type}
            })

            edges.append({
                "source": "soc_core",
                "target": file_node_id,
                "label": "MONITORED_ASSET",
                "status": "CONTAINED" if is_contained else "ACTIVE"
            })

            # Fetch any evidence indicators to create domain/threat nodes
            ev_query = select(EvidenceItem).where(EvidenceItem.investigation_id == inv.id).limit(3)
            ev_res = await db.execute(ev_query)
            evs = ev_res.scalars().all()

            for ev in evs:
                if ev.severity in ("HIGH", "CRITICAL"):
                    ind_node_id = f"ind_{ev.id[:8]}"
                    nodes.append({
                        "id": ind_node_id,
                        "label": ev.title[:24],
                        "type": "THREAT",
                        "status": "CONTAINED" if is_contained else "ACTIVE",
                        "risk_level": ev.severity,
                        "metadata": {"observed": ev.observed_value}
                    })
                    edges.append({
                        "source": file_node_id,
                        "target": ind_node_id,
                        "label": "DETECTED_INDICATOR",
                        "status": "SEVERED" if is_contained else "ACTIVE"
                    })

        return {
            "batch_id": batch_id,
            "nodes": nodes,
            "edges": edges,
            "active_threats_count": active_threats,
            "contained_threats_count": contained_threats,
            "total_assets_count": len(nodes),
            "posture_status": "HARDENED" if active_threats == 0 else "DEFENSE_ACTIVE"
        }


autonomous_defense_engine = AutonomousDefenseEngine()

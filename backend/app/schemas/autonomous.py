"""
Pydantic V2 Schemas for ARGUS 2.0 Autonomous Defense Engine and Batch Scanning
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class BatchScanItemSchema(BaseModel):
    id: str
    batch_scan_id: str
    investigation_id: Optional[str] = None
    filename: str
    file_size_bytes: int = 0
    sha256: Optional[str] = None
    status: str
    risk_score_initial: float = 0.0
    risk_score_residual: float = 0.0
    risk_level: str = "LOW"
    remediation_status: str = "NONE"
    threat_category: Optional[str] = None
    countermeasure_title: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SecurityEventTimelineItem(BaseModel):
    timestamp: str
    stage: str
    description: str
    status: str  # SUCCESS, INFO, WARNING, BLOCKED, ACTIVE
    metadata: Optional[Dict[str, Any]] = None


class BatchSecurityReport(BaseModel):
    batch_scan_id: str
    title: str
    files_analysed: int
    threats_detected: int
    critical_threats: int
    threats_contained: int
    threats_requiring_manual_review: int
    remediations_executed: int
    initial_aggregate_risk: float
    residual_aggregate_risk: float
    verified_risk_reduction: float
    mitigation_efficacy_pct: float
    overall_posture: str  # HARDENED, CONTAINED, ELEVATED_RISK, CRITICAL
    severity_distribution: Dict[str, int]
    attack_paths_count: int
    recommended_actions: List[str]
    items: List[BatchScanItemSchema]
    timeline: List[SecurityEventTimelineItem]
    generated_at: str


class AutonomousDefenseOverviewResponse(BaseModel):
    overall_security_status: str  # HARDENED, PROTECTED, ELEVATED, CRITICAL
    total_files_analysed: int
    threats_detected: int
    critical_threats: int
    threats_contained: int
    threats_requiring_manual_review: int
    active_investigations: int
    verified_remediations_count: int
    overall_initial_risk: float
    overall_current_risk: float
    overall_risk_reduction_pct: float
    risk_trend: List[Dict[str, Any]]
    live_timeline: List[SecurityEventTimelineItem]
    recent_batches: List[Dict[str, Any]]


class AttackMapNode(BaseModel):
    id: str
    label: str
    type: str  # ASSET, FILE, THREAT, PROCESS, DOMAIN, MITIGATION
    status: str  # ACTIVE, CONTAINED, BLOCKED, SAFE
    risk_level: str
    metadata: Optional[Dict[str, Any]] = None


class AttackMapEdge(BaseModel):
    source: str
    target: str
    label: str
    status: str  # ACTIVE, SEVERED, CONTAINED


class LiveAttackMapResponse(BaseModel):
    batch_id: Optional[str] = None
    nodes: List[AttackMapNode]
    edges: List[AttackMapEdge]
    active_threats_count: int
    contained_threats_count: int
    total_assets_count: int
    posture_status: str

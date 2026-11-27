"""
Pydantic V2 Schemas for Requests and Responses
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class EvidenceItemSchema(BaseModel):
    id: str
    investigation_id: str
    category: str
    title: str
    description: str
    severity: str
    observed_value: str
    extraction_source: str
    offset_or_location: Optional[str] = None
    explanation: str
    confidence: float
    limitations: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BehavioralEventSchema(BaseModel):
    id: str
    investigation_id: str
    event_type: str
    timestamp: datetime
    process_id: Optional[int] = None
    process_name: Optional[str] = None
    parent_process_id: Optional[int] = None
    parent_process_name: Optional[str] = None
    command_line: Optional[str] = None
    target_path: Optional[str] = None
    destination_ip: Optional[str] = None
    destination_port: Optional[int] = None
    domain: Optional[str] = None
    is_simulated: bool = False
    event_source: str = "EXTERNAL_TELEMETRY_API"
    raw_payload: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EventCorrelationSchema(BaseModel):
    id: str
    investigation_id: str
    relation_type: str
    source_entity: str
    target_entity: str
    reason: str
    confidence: float
    supporting_evidence_ids: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class GraphNode(BaseModel):
    id: str
    type: str  # fileNode, processNode, networkNode, eventNode
    data: Dict[str, Any]
    position: Dict[str, float]


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    animated: bool = False
    style: Optional[Dict[str, Any]] = None
    data: Optional[Dict[str, Any]] = None


class AttackGraphSchema(BaseModel):
    id: str
    investigation_id: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    summary: str
    missing_evidence_notes: Optional[str] = None
    timeline: Optional[List[Dict[str, Any]]] = None
    created_at: datetime


class ForensicReportSchema(BaseModel):
    id: str
    investigation_id: str
    executive_summary: str
    pdf_path: Optional[str] = None
    json_data: Dict[str, Any]
    defensive_actions: List[str]
    limitations_disclaimer: str
    generated_by: str
    created_at: datetime


class TriageDecisionSchema(BaseModel):
    decision: str  # BLOCKED | ALLOWED
    action_taken: str  # e.g., "EXECUTION_BLOCKED_AND_ISOLATED" or "CLEARED_FOR_EXECUTION"
    warning_title: str
    warning_message: str
    severity: str  # CRITICAL | HIGH | MEDIUM | SAFE
    requires_user_override: bool
    quarantine_path: Optional[str] = None
    defense_summary: Optional[str] = None


class InvestigationSummarySchema(BaseModel):
    id: str
    original_name: str
    sha256: str
    file_size_bytes: int
    file_type: str
    status: str
    risk_score: float
    risk_level: str
    confidence_score: float
    coverage_score: float
    is_synthetic: bool
    created_at: datetime
    completed_at: Optional[datetime] = None
    summary: Optional[str] = None
    triage_verdict: Optional[TriageDecisionSchema] = None

    model_config = ConfigDict(from_attributes=True)


class InvestigationDetailSchema(InvestigationSummarySchema):
    evidence_count: int
    event_count: int
    correlation_count: int
    has_graph: bool
    has_report: bool


class TelemetryImportRequest(BaseModel):
    investigation_id: str
    events: List[Dict[str, Any]]
    is_simulated: bool = False
    source_label: str = "EXTERNAL_SANDBOX"


class MetricsOverviewSchema(BaseModel):
    total_investigations: int
    completed_investigations: int
    critical_risk_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    risk_distribution: List[Dict[str, Any]]
    timeline_activity: List[Dict[str, Any]]
    recent_findings: List[EvidenceItemSchema]
    system_health: Dict[str, Any]


class ModelEvaluationSchema(BaseModel):
    model_name: str
    model_version: str
    dataset_provenance: str
    dataset_size: int
    features_used: List[str]
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    confusion_matrix: Dict[str, int]
    roc_auc: Optional[float] = None
    trained_at: str
    is_experimental: bool
    feature_importances: Dict[str, float]


class SystemHealthSchema(BaseModel):
    status: str
    app_version: str
    university: str
    session: str
    database_status: str
    yara_installed: bool
    ollama_connected: bool
    ollama_model: Optional[str] = None
    available_forensic_modules: List[str]
    storage_quarantine_path: str

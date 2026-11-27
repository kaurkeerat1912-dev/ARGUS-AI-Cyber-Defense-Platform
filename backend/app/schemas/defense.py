"""
Pydantic V2 Schemas for Defensive Simulation and Automated Countermeasures
Part of ARGUS: AI Forensics, Threat Reconstruction & Defensive Platform
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class DefensiveActionSchema(BaseModel):
    id: str
    investigation_id: str
    category: str  # NETWORK_CONTAINMENT, PROCESS_TERMINATION, SIGNATURE_DEPLOYMENT, HOST_ISOLATION, PERSISTENCE_REMEDIATION
    title: str
    description: str
    target: str
    rule_syntax: str
    status: str  # PROPOSED, SIMULATING, ENFORCED, VERIFIED_BLOCKED, FAILED
    risk_reduction: float
    simulated_output: Optional[str] = None
    created_at: datetime
    executed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DefensePlanResponse(BaseModel):
    investigation_id: str
    sample_name: str
    file_type: str = "Unknown"
    initial_risk_score: float
    initial_risk_level: str
    primary_strategy: str  # STORE_IN_SANDBOX, STOP_ACCESS, CONTINUOUS_REVIEWING_MODE
    strategy_title: str
    strategy_badge: str
    strategy_description: str
    mitigated_risk_score: float
    residual_risk_level: str
    efficacy_percentage: float
    total_actions: int
    enforced_actions: int
    actions: List[DefensiveActionSchema]
    generated_rules: Dict[str, str]
    file_specific_summary: str


class ExecuteActionResponse(BaseModel):
    status: str
    action: DefensiveActionSchema
    updated_mitigated_risk_score: float
    updated_residual_risk_level: str
    efficacy_percentage: float
    simulation_log: List[str]


class ExecuteAllResponse(BaseModel):
    status: str
    executed_count: int
    initial_risk_score: float
    final_mitigated_risk_score: float
    final_risk_level: str
    overall_efficacy_percentage: float
    actions: List[DefensiveActionSchema]
    full_simulation_log: List[str]


class RemediationDetailResponse(BaseModel):
    action_id: str
    investigation_id: str
    threat_name: str
    target_file: str
    action_category: str
    title: str
    description: str
    why_recommended: str
    expected_risk_reduction: float
    target: str
    rule_syntax: str
    status: str
    detected_os: str
    adapted_mechanism: str
    os_rule_syntax: str
    safe_verification_action: str
    risk_score_before: float
    risk_score_after: float
    requires_confirmation: bool = True


class RemediationExecutionRequest(BaseModel):
    user_confirmed: bool = True
    target_os: Optional[str] = None


class RemediationExecutionResponse(BaseModel):
    execution_id: str
    investigation_id: str
    action_id: str
    remediation_name: str
    target_file: str
    status: str  # SUCCESS, FAILED, RUNNING, SIMULATED, BLOCKED
    execution_type: str  # SANDBOX_ISOLATED, SIMULATED, HOST_CONTROLLED
    detected_os: str
    target_os: str
    risk_score_before: float
    risk_score_after: float
    risk_reduction_achieved: float
    actions_performed: List[str]
    execution_logs: List[str]
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None


class RemediationHistoryItem(BaseModel):
    id: str
    investigation_id: str
    action_id: str
    action_title: str
    action_category: str
    target_file: str
    status: str
    execution_type: str
    detected_os: str
    risk_score_before: float
    risk_score_after: float
    risk_reduction_achieved: float
    actions_performed: List[str]
    execution_logs: List[str]
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


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

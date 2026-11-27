export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface EvidenceItem {
  id: string;
  investigation_id: string;
  category: string;
  title: string;
  description: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  observed_value: string;
  extraction_source: string;
  offset_or_location?: string;
  explanation: string;
  confidence: number;
  limitations?: string;
  created_at: string;
}

export interface BehavioralEvent {
  id: string;
  investigation_id: string;
  event_type: string;
  timestamp: string;
  process_id?: number;
  process_name?: string;
  parent_process_id?: number;
  parent_process_name?: string;
  command_line?: string;
  target_path?: string;
  destination_ip?: string;
  destination_port?: number;
  domain?: string;
  is_simulated: boolean;
  event_source: string;
}

export interface EventCorrelation {
  id: string;
  investigation_id: string;
  relation_type: string;
  source_entity: string;
  target_entity: string;
  reason: string;
  confidence: number;
  supporting_evidence_ids?: string;
  timestamp: string;
}

export interface GraphNodeData {
  label: string;
  sublabel?: string;
  entity_type?: string;
  category?: string;
  badge?: string;
  severity?: string;
  observation_status: 'OBSERVED' | 'INFERRED' | 'SIMULATED';
  evidence_source?: string;
  confidence?: number;
  timestamp?: string;
  related_evidence_id?: string;
  details?: string;
}

export interface GraphEdgeData {
  relationship_type?: string;
  description?: string;
  supporting_evidence?: string;
  confidence?: number;
  observation_status?: 'OBSERVED' | 'INFERRED' | 'SIMULATED';
  status?: string;
}

export interface TimelineEvent {
  id: string;
  phase: string;
  title: string;
  description: string;
  timestamp?: string;
  severity?: string;
  node_id?: string;
  status: 'OBSERVED' | 'INFERRED' | 'SIMULATED';
}

export interface AttackGraphData {
  id: string;
  investigation_id: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: GraphNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    animated?: boolean;
    style?: Record<string, any>;
    data?: GraphEdgeData;
  }>;
  timeline?: TimelineEvent[];
  summary: string;
  missing_evidence_notes?: string;
  created_at: string;
}

export interface TriageDecision {
  decision: 'BLOCKED' | 'ALLOWED';
  action_taken: string;
  warning_title: string;
  warning_message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'SAFE';
  requires_user_override: boolean;
  quarantine_path?: string | null;
  defense_summary?: string | null;
}

export interface InvestigationSummary {
  id: string;
  original_name: string;
  sha256: string;
  file_size_bytes: number;
  file_type: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  risk_score: number;
  risk_level: RiskLevel;
  confidence_score: number;
  coverage_score: number;
  is_synthetic: boolean;
  created_at: string;
  completed_at?: string;
  summary?: string;
  triage_verdict?: TriageDecision;
}

export interface InvestigationDetail extends InvestigationSummary {
  evidence_count: number;
  event_count: number;
  correlation_count: number;
  has_graph: boolean;
  has_report: boolean;
}

export interface MetricsOverview {
  total_investigations: number;
  completed_investigations: number;
  critical_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  risk_distribution: Array<{ name: string; value: number; color: string }>;
  timeline_activity: Array<{ day: string; investigations: number; threats: number }>;
  recent_findings: EvidenceItem[];
  system_health: Record<string, any>;
}

export interface ModelEvaluation {
  model_name: string;
  model_version: string;
  dataset_provenance: string;
  dataset_size: number;
  features_used: string[];
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  false_positive_rate: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
  roc_auc?: number;
  trained_at: string;
  is_experimental: boolean;
  feature_importances: Record<string, number>;
}

export interface SystemHealth {
  status: string;
  app_version: string;
  university: string;
  session: string;
  database_status: string;
  yara_installed: boolean;
  ollama_connected: boolean;
  ollama_model?: string;
  available_forensic_modules: string[];
  storage_quarantine_path: string;
}

export interface DefensiveAction {
  id: string;
  investigation_id: string;
  category: 'NETWORK_CONTAINMENT' | 'PROCESS_TERMINATION' | 'SIGNATURE_DEPLOYMENT' | 'HOST_ISOLATION' | 'PERSISTENCE_REMEDIATION' | 'SANDBOX_ISOLATION' | 'ACCESS_REVOCATION' | 'CONTINUOUS_MONITORING' | 'PAYLOAD_NEUTRALIZATION' | string;
  title: string;
  description: string;
  target: string;
  rule_syntax: string;
  status: 'PROPOSED' | 'SIMULATING' | 'ENFORCED' | 'VERIFIED_BLOCKED' | 'FAILED' | string;
  risk_reduction: number;
  simulated_output?: string;
  created_at: string;
  executed_at?: string;
}

export interface DefensePlan {
  investigation_id: string;
  sample_name: string;
  file_type?: string;
  initial_risk_score: number;
  initial_risk_level: RiskLevel;
  primary_strategy?: 'STORE_IN_SANDBOX' | 'STOP_ACCESS' | 'CONTINUOUS_REVIEWING_MODE' | string;
  strategy_title?: string;
  strategy_badge?: string;
  strategy_description?: string;
  mitigated_risk_score: number;
  residual_risk_level: RiskLevel;
  efficacy_percentage: number;
  total_actions: number;
  enforced_actions: number;
  actions: DefensiveAction[];
  generated_rules: {
    firewall_script?: string;
    yara_bundle?: string;
    powershell_playbook?: string;
    [key: string]: string | undefined;
  };
  file_specific_summary?: string;
}

export interface ExecuteActionResponse {
  status: string;
  action: DefensiveAction;
  updated_mitigated_risk_score: number;
  updated_residual_risk_level: RiskLevel;
  efficacy_percentage: number;
  simulation_log: string[];
}

export interface ExecuteAllResponse {
  status: string;
  executed_count: number;
  initial_risk_score: number;
  final_mitigated_risk_score: number;
  final_risk_level: RiskLevel;
  overall_efficacy_percentage: number;
  actions: DefensiveAction[];
  full_simulation_log: string[];
}

export interface EmailAttachment {
  id: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  sha256: string;
  md5: string;
  is_suspicious: boolean;
  data_base64: string;
}

export interface EmailSuspiciousUrl {
  url: string;
  is_suspicious: boolean;
}

export interface EmailExtractionResult {
  email_format: string;
  original_name: string;
  subject: string;
  sender: string;
  recipient: string;
  date: string;
  message_id?: string;
  return_path?: string;
  originating_ip?: string | null;
  spf_status: string;
  dkim_status: string;
  body_snippet: string;
  attachment_count: number;
  attachments: EmailAttachment[];
  embedded_urls: EmailSuspiciousUrl[];
}

export interface GmailMessage {
  id: string;
  thread_id: string;
  subject: string;
  sender: string;
  snippet: string;
  date: string;
  unread: boolean;
  spf_status: string;
  dkim_status: string;
  originating_ip: string;
  has_attachments: boolean;
  attachments: EmailAttachment[];
}

export interface GmailInboxResponse {
  status: string;
  account_email: string;
  unread_count: number;
  total_messages: number;
  messages: GmailMessage[];
}

export interface RemediationDetail {
  action_id: string;
  investigation_id: string;
  threat_name: string;
  target_file: string;
  action_category: string;
  title: string;
  description: string;
  why_recommended: string;
  expected_risk_reduction: number;
  target: string;
  rule_syntax: string;
  status: string;
  detected_os: string;
  adapted_mechanism: string;
  os_rule_syntax: string;
  safe_verification_action: string;
  risk_score_before: number;
  risk_score_after: number;
  requires_confirmation: boolean;
}

export interface RemediationExecutionResult {
  execution_id: string;
  investigation_id: string;
  action_id: string;
  remediation_name: string;
  target_file: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'SIMULATED' | 'BLOCKED';
  execution_type: 'SANDBOX_ISOLATED' | 'SIMULATED' | 'HOST_CONTROLLED';
  detected_os: string;
  target_os: string;
  risk_score_before: number;
  risk_score_after: number;
  risk_reduction_achieved: number;
  actions_performed: string[];
  execution_logs: string[];
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
}

export interface BatchScanItem {
  id: string;
  batch_scan_id: string;
  investigation_id?: string | null;
  filename: string;
  file_size_bytes: number;
  sha256?: string | null;
  status: string;
  risk_score_initial: number;
  risk_score_residual: number;
  risk_level: string;
  remediation_status: string;
  threat_category?: string | null;
  countermeasure_title?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface SecurityEventTimelineItem {
  timestamp: string;
  stage: string;
  description: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface BatchSecurityReport {
  batch_scan_id: string;
  title: string;
  files_analysed: number;
  threats_detected: number;
  critical_threats: number;
  threats_contained: number;
  threats_requiring_manual_review: number;
  remediations_executed: number;
  initial_aggregate_risk: number;
  residual_aggregate_risk: number;
  verified_risk_reduction: number;
  mitigation_efficacy_pct: number;
  overall_posture: string;
  severity_distribution: Record<string, number>;
  attack_paths_count: number;
  recommended_actions: string[];
  items: BatchScanItem[];
  timeline: SecurityEventTimelineItem[];
  generated_at: string;
}

export interface AutonomousDefenseOverview {
  overall_security_status: string;
  total_files_analysed: number;
  threats_detected: number;
  critical_threats: number;
  threats_contained: number;
  threats_requiring_manual_review: number;
  active_investigations: number;
  verified_remediations_count: number;
  overall_initial_risk: number;
  overall_current_risk: number;
  overall_risk_reduction_pct: number;
  risk_trend: Array<{ period: string; score: number }>;
  live_timeline: SecurityEventTimelineItem[];
  recent_batches: Array<any>;
}

export interface AttackMapNode {
  id: string;
  label: string;
  type: 'ASSET' | 'FILE' | 'THREAT' | 'PROCESS' | 'DOMAIN' | 'MITIGATION';
  status: 'ACTIVE' | 'CONTAINED' | 'BLOCKED' | 'SAFE';
  risk_level: string;
  metadata?: Record<string, any>;
}

export interface AttackMapEdge {
  source: string;
  target: string;
  label: string;
  status: 'ACTIVE' | 'SEVERED' | 'CONTAINED';
}

export interface LiveAttackMapData {
  batch_id?: string | null;
  nodes: AttackMapNode[];
  edges: AttackMapEdge[];
  active_threats_count: number;
  contained_threats_count: number;
  total_assets_count: number;
  posture_status: string;
}


export interface RemediationHistoryItem {
  id: string;
  investigation_id: string;
  action_id: string;
  action_title: string;
  action_category: string;
  target_file: string;
  status: string;
  execution_type: string;
  detected_os: string;
  risk_score_before: number;
  risk_score_after: number;
  risk_reduction_achieved: number;
  actions_performed: string[];
  execution_logs: string[];
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
}

export interface BatchScanItem {
  id: string;
  batch_scan_id: string;
  investigation_id?: string | null;
  filename: string;
  file_size_bytes: number;
  sha256?: string | null;
  status: string;
  risk_score_initial: number;
  risk_score_residual: number;
  risk_level: string;
  remediation_status: string;
  threat_category?: string | null;
  countermeasure_title?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface SecurityEventTimelineItem {
  timestamp: string;
  stage: string;
  description: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface BatchSecurityReport {
  batch_scan_id: string;
  title: string;
  files_analysed: number;
  threats_detected: number;
  critical_threats: number;
  threats_contained: number;
  threats_requiring_manual_review: number;
  remediations_executed: number;
  initial_aggregate_risk: number;
  residual_aggregate_risk: number;
  verified_risk_reduction: number;
  mitigation_efficacy_pct: number;
  overall_posture: string;
  severity_distribution: Record<string, number>;
  attack_paths_count: number;
  recommended_actions: string[];
  items: BatchScanItem[];
  timeline: SecurityEventTimelineItem[];
  generated_at: string;
}

export interface AutonomousDefenseOverview {
  overall_security_status: string;
  total_files_analysed: number;
  threats_detected: number;
  critical_threats: number;
  threats_contained: number;
  threats_requiring_manual_review: number;
  active_investigations: number;
  verified_remediations_count: number;
  overall_initial_risk: number;
  overall_current_risk: number;
  overall_risk_reduction_pct: number;
  risk_trend: Array<{ period: string; score: number }>;
  live_timeline: SecurityEventTimelineItem[];
  recent_batches: Array<any>;
}

export interface AttackMapNode {
  id: string;
  label: string;
  type: 'ASSET' | 'FILE' | 'THREAT' | 'PROCESS' | 'DOMAIN' | 'MITIGATION';
  status: 'ACTIVE' | 'CONTAINED' | 'BLOCKED' | 'SAFE';
  risk_level: string;
  metadata?: Record<string, any>;
}

export interface AttackMapEdge {
  source: string;
  target: string;
  label: string;
  status: 'ACTIVE' | 'SEVERED' | 'CONTAINED';
}

export interface LiveAttackMapData {
  batch_id?: string | null;
  nodes: AttackMapNode[];
  edges: AttackMapEdge[];
  active_threats_count: number;
  contained_threats_count: number;
  total_assets_count: number;
  posture_status: string;
}



import {
  InvestigationSummary,
  InvestigationDetail,
  EvidenceItem,
  BehavioralEvent,
  AttackGraphData,
  MetricsOverview,
  ModelEvaluation,
  SystemHealth,
  DefensePlan,
  ExecuteActionResponse,
  ExecuteAllResponse,
  EmailExtractionResult,
  EmailAttachment,
} from '../types';

const getApiBase = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      return `http://${window.location.hostname}:8000/api/v1`;
    }
    // In production web build (e.g. deployed on Vercel), default to the live Render backend
    return 'https://argus-ai-cyber-defense-platform.onrender.com/api/v1';
  }
  return 'https://argus-ai-cyber-defense-platform.onrender.com/api/v1';
};

const buildUrl = (path: string, params?: Record<string, string | number | undefined>): string => {
  const base = getApiBase();
  const rawUrl = base.startsWith('http')
    ? `${base}${path.startsWith('/') ? path : `/${path}`}`
    : `${window.location.origin}${base}${path.startsWith('/') ? path : `/${path}`}`;
  const url = new URL(rawUrl);
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, String(val));
      }
    });
  }
  return url.toString();
};

export const api = {
  // Ingest & Analyze
  async analyzeFile(file: File): Promise<InvestigationSummary> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(buildUrl('/files/analyze'), {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new Error(err.detail || 'File analysis failed');
    }
    return res.json();
  },

  // Investigations
  async getInvestigations(params?: { risk_level?: string; search?: string; limit?: number }): Promise<InvestigationSummary[]> {
    const res = await fetch(buildUrl('/investigations', params));
    if (!res.ok) throw new Error('Failed to fetch investigations');
    return res.json();
  },

  async getInvestigation(id: string): Promise<InvestigationDetail> {
    const res = await fetch(buildUrl(`/investigations/${id}`));
    if (!res.ok) throw new Error('Failed to fetch investigation');
    return res.json();
  },

  async getEvidence(id: string, params?: { category?: string; severity?: string }): Promise<EvidenceItem[]> {
    const res = await fetch(buildUrl(`/investigations/${id}/evidence`, params));
    if (!res.ok) throw new Error('Failed to fetch evidence');
    return res.json();
  },

  async getEvents(id: string): Promise<BehavioralEvent[]> {
    const res = await fetch(buildUrl(`/investigations/${id}/events`));
    if (!res.ok) throw new Error('Failed to fetch behavioral events');
    return res.json();
  },

  async getGraph(id: string): Promise<AttackGraphData> {
    const res = await fetch(buildUrl(`/investigations/${id}/graph`));
    if (!res.ok) throw new Error('Failed to fetch attack graph');
    return res.json();
  },

  async getReportJson(id: string): Promise<any> {
    const res = await fetch(buildUrl(`/investigations/${id}/report`));
    if (!res.ok) throw new Error('Failed to fetch report JSON');
    return res.json();
  },

  getPdfUrl(id: string): string {
    return buildUrl(`/investigations/${id}/report/pdf`);
  },

  // Telemetry
  async importTelemetry(investigationId: string, events: any[], isSimulated = false): Promise<any> {
    const res = await fetch(buildUrl('/telemetry/import'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        investigation_id: investigationId,
        events,
        is_simulated: isSimulated,
      }),
    });
    if (!res.ok) throw new Error('Failed to import telemetry');
    return res.json();
  },

  async simulateTelemetry(investigationId: string): Promise<any> {
    const res = await fetch(buildUrl(`/telemetry/simulate/${investigationId}`), {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to simulate telemetry');
    return res.json();
  },

  // Metrics & ML
  async getMetricsOverview(): Promise<MetricsOverview> {
    const res = await fetch(buildUrl('/metrics/overview'));
    if (!res.ok) throw new Error('Failed to fetch SOC metrics');
    return res.json();
  },

  async getModelEvaluation(): Promise<ModelEvaluation> {
    const res = await fetch(buildUrl('/models/evaluation'));
    if (!res.ok) throw new Error('Failed to fetch ML model evaluation');
    return res.json();
  },

  async retrainModels(): Promise<ModelEvaluation> {
    const res = await fetch(buildUrl('/models/retrain'), {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to retrain models');
    return res.json();
  },

  // Defensive Simulation
  async getDefensePlan(investigationId: string): Promise<DefensePlan> {
    const res = await fetch(buildUrl(`/defense/plan/${investigationId}`));
    if (!res.ok) throw new Error('Failed to fetch defense plan');
    return res.json();
  },

  async executeDefenseAction(investigationId: string, actionId: string): Promise<ExecuteActionResponse> {
    const res = await fetch(buildUrl(`/defense/action/${investigationId}/${actionId}/execute`), {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to execute defense action');
    return res.json();
  },

  async executeAllDefenseActions(investigationId: string): Promise<ExecuteAllResponse> {
    const res = await fetch(buildUrl(`/defense/${investigationId}/execute-all`), {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to execute all defense actions');
    return res.json();
  },

  async resetDefenseSimulation(investigationId: string): Promise<DefensePlan> {
    const res = await fetch(buildUrl(`/defense/${investigationId}/reset`), {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset defense simulation');
    return res.json();
  },

  // Remediation Engine (OS-Aware Sandbox Execution & History)
  async getRemediationDetails(investigationId: string, actionId: string): Promise<import('../types').RemediationDetail> {
    const res = await fetch(buildUrl(`/defense/remediation/${investigationId}/${actionId}/details`));
    if (!res.ok) throw new Error('Failed to fetch remediation details');
    return res.json();
  },

  async executeRemediation(
    investigationId: string,
    actionId: string,
    payload: { user_confirmed: boolean; target_os?: string } = { user_confirmed: true }
  ): Promise<import('../types').RemediationExecutionResult> {
    const res = await fetch(buildUrl(`/defense/remediation/${investigationId}/${actionId}/execute`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Execution failed' }));
      throw new Error(err.detail || 'Remediation execution failed');
    }
    return res.json();
  },

  async getRemediationHistory(investigationId: string): Promise<import('../types').RemediationHistoryItem[]> {
    const res = await fetch(buildUrl(`/defense/remediation/${investigationId}/history`));
    if (!res.ok) throw new Error('Failed to fetch remediation history');
    return res.json();
  },

  async getRemediationExecutionStatus(executionId: string): Promise<import('../types').RemediationHistoryItem> {
    const res = await fetch(buildUrl(`/defense/remediation/execution/${executionId}`));
    if (!res.ok) throw new Error('Failed to fetch execution status');
    return res.json();
  },

  // Email Extraction & Direct Ingestion (No local download needed)
  async extractAndAutoAnalyzeEmail(file: File): Promise<{
    status: string;
    investigation: InvestigationSummary;
    email_metadata: any;
    all_attachments: EmailAttachment[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(buildUrl('/email/extract-and-analyze'), {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to extract and analyze email' }));
      throw new Error(err.detail || 'Failed to extract and analyze email');
    }
    return res.json();
  },

  async extractEmail(fileOrData: File | { raw_email?: string; email_url?: string }): Promise<EmailExtractionResult> {
    let res: Response;
    if (fileOrData instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrData);
      res = await fetch(buildUrl('/email/extract'), {
        method: 'POST',
        body: formData,
      });
    } else {
      res = await fetch(buildUrl('/email/extract'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileOrData),
      });
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Email attachment extraction failed' }));
      throw new Error(err.detail || 'Email attachment extraction failed');
    }
    return res.json();
  },

  async analyzeEmailAttachment(attachment: { filename: string; data_base64: string; content_type?: string }): Promise<InvestigationSummary> {
    const res = await fetch(buildUrl('/email/analyze-attachment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attachment),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Direct attachment analysis failed' }));
      throw new Error(err.detail || 'Direct attachment analysis failed');
    }
    return res.json();
  },

  async getDemoEmailSample(): Promise<{ filename: string; raw_eml: string }> {
    const res = await fetch(buildUrl('/email/demo-sample'));
    if (!res.ok) throw new Error('Failed to fetch demo email sample');
    return res.json();
  },

  async connectGmail(userEmail?: string): Promise<import('../types').GmailInboxResponse> {
    const res = await fetch(buildUrl('/email/gmail/connect'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail || 'analyst@argus-defense.ai' }),
    });
    if (!res.ok) throw new Error('Failed to connect to Gmail account');
    return res.json();
  },

  // Health
  async getSystemHealth(): Promise<SystemHealth> {
    const res = await fetch(buildUrl('/health'));
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },
};

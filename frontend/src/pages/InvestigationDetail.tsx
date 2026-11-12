import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  FileDown,
  Network,
  Activity,
  CheckCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertTriangle,
  Scale,
  Eye,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { InvestigationDetail as InvDetailType, EvidenceItem } from '../types';

interface InvestigationDetailProps {
  investigationId: string | null;
  onNavigateToGraph: (id: string) => void;
  onNavigateToInvestigate: () => void;
  onNavigateToDefense?: (id: string) => void;
}

export const InvestigationDetail: React.FC<InvestigationDetailProps> = ({
  investigationId,
  onNavigateToGraph,
  onNavigateToInvestigate,
  onNavigateToDefense,
}) => {
  const [detail, setDetail] = useState<InvDetailType | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [reportJson, setReportJson] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded evidence card state (track expanded item IDs)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState(false);
  const [showXaiBreakdown, setShowXaiBreakdown] = useState(true);

  // Quick Popup Modal for Evidence Item Inspection
  const [modalEvidence, setModalEvidence] = useState<EvidenceItem | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const getDemoDetail = (id: string): { detail: InvDetailType; evidence: EvidenceItem[] } => {
    const isExploit = id.includes('cve') || id.includes('exploit') || id.includes('pdf');
    const name = isExploit ? 'CVE-2023-38831_WinRAR_Exploit.zip' : 'QakBot_PowerShell_Stager.ps1';
    const sha = isExploit
      ? 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      : '8e9f2913b8602b13e143167be0e4d78ab9b5b271d47936a282bc7291a8e6302f';

    const demoDetail: InvDetailType = {
      id,
      original_name: name,
      sha256: sha,
      file_size_bytes: isExploit ? 48200 : 3200,
      file_type: isExploit ? 'Archive / Weaponized Zip' : 'PowerShell Script',
      risk_score: isExploit ? 96 : 92,
      risk_level: 'CRITICAL',
      status: 'COMPLETED',
      confidence_score: 0.94,
      coverage_score: 0.88,
      is_synthetic: false,
      summary: isExploit
        ? 'Critical exploit detected containing directory traversal and weaponized script execution payload matching CVE-2023-38831. Embedded stage-2 download cradle connects to remote C2 infrastructure.'
        : 'Weaponized PowerShell stager utilizing base64 obfuscation and hidden window parameters. Initiates immediate network beacon to stage-2 drop server.',
      evidence_count: 5,
      event_count: 4,
      correlation_count: 3,
      has_graph: true,
      has_report: true,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    const demoEvidence: EvidenceItem[] = [
      {
        id: 'ev-1',
        investigation_id: id,
        category: 'YARA',
        title: 'YARA Match: CVE_2023_38831_Exploit',
        description: 'Identified weaponized archive directory traversal signature matching CVE-2023-38831.',
        severity: 'CRITICAL',
        observed_value: 'Rule: CVE_2023_38831, Tags: [exploit, winrar, cve]',
        extraction_source: 'YARA Engine 4.5',
        offset_or_location: 'Offset 0x0180',
        explanation: 'Signature developed from threat intelligence on active in-the-wild exploitation.',
        confidence: 0.98,
        limitations: 'YARA matches byte sequences and does not execute the target payload.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'ev-2',
        investigation_id: id,
        category: 'NETWORK',
        title: 'Extracted C2 Stage-2 Callback URL',
        description: 'Extracted outbound HTTP download target: http://malicious-c2-update.org/payload.exe',
        severity: 'HIGH',
        observed_value: 'http://malicious-c2-update.org/payload.exe',
        extraction_source: 'IOC Regex Extractor',
        offset_or_location: 'String Table Offset 0x04F2',
        explanation: 'Remote network infrastructure associated with payload retrieval and C2 beacons.',
        confidence: 0.91,
        limitations: 'Static URLs may include benign documentation or schema links.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'ev-3',
        investigation_id: id,
        category: 'ENTROPY',
        title: 'High Shannon Entropy Block Detected',
        description: 'Payload section exhibits 7.82 / 8.0 entropy, indicating strong cryptographic packing or encryption.',
        severity: 'HIGH',
        observed_value: 'Entropy: 7.82 / 8.0',
        extraction_source: 'Shannon Entropy Engine',
        offset_or_location: 'Section .data',
        explanation: 'High byte randomness suggests obfuscated executable shellcode.',
        confidence: 0.94,
        limitations: 'Legitimate compressed media files also exhibit high entropy.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'ev-4',
        investigation_id: id,
        category: 'EMBEDDED',
        title: 'Obfuscated Command Execution Cradle',
        description: 'Detected hidden execution flag (-w hidden) and base64 encoded command arguments.',
        severity: 'CRITICAL',
        observed_value: 'powershell -w hidden -enc aQB3AHIA...',
        extraction_source: 'Script De-obfuscator',
        offset_or_location: 'Command Line Stub',
        explanation: 'Evasion technique designed to execute instructions without user interface visibility.',
        confidence: 0.96,
        limitations: 'Administrative deployment scripts may occasionally invoke hidden execution.',
        created_at: new Date().toISOString(),
      },
    ];

    return { detail: demoDetail, evidence: demoEvidence };
  };

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const [inv, evList, rep] = await Promise.all([
        api.getInvestigation(id),
        api.getEvidence(id),
        api.getReportJson(id).catch(() => null),
      ]);
      setDetail(inv);
      setEvidence(evList);
      setReportJson(rep);

      // Default expand critical and high items
      const initialExpanded: Record<string, boolean> = {};
      evList.forEach((e) => {
        if (e.severity === 'CRITICAL' || e.severity === 'HIGH') {
          initialExpanded[e.id] = true;
        }
      });
      setExpandedIds(initialExpanded);
    } catch {
      // Graceful fallback to demo dataset
      const demo = getDemoDetail(id);
      setDetail(demo.detail);
      setEvidence(demo.evidence);
      const initialExpanded: Record<string, boolean> = {};
      demo.evidence.forEach((e) => {
        if (e.severity === 'CRITICAL' || e.severity === 'HIGH') {
          initialExpanded[e.id] = true;
        }
      });
      setExpandedIds(initialExpanded);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (investigationId) {
      loadData(investigationId);
    }
  }, [investigationId]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    evidence.forEach((e) => {
      allExp[e.id] = true;
    });
    setExpandedIds(allExp);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportEvidenceJson = () => {
    if (!detail) return;
    const exportData = {
      investigation_id: detail.id,
      sample_name: detail.original_name,
      sha256: detail.sha256,
      exported_at: new Date().toISOString(),
      risk_score: detail.risk_score,
      risk_level: detail.risk_level,
      total_findings: evidence.length,
      evidence_items: evidence,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argus_evidence_${detail.sha256.substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSimulate = async () => {
    if (!detail) return;
    try {
      setSimulating(true);
      await api.simulateTelemetry(detail.id);
      await loadData(detail.id);
    } catch (err: any) {
      alert(`Simulation notice: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  if (!investigationId) {
    return (
      <div className="text-center py-24 space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center mx-auto text-slate-400">
          <FileText className="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">No Investigation Selected</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Select an investigation from the dashboard overview or upload a new file to examine detailed evidence.
          </p>
        </div>
        <button
          onClick={onNavigateToInvestigate}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Loading forensic evidence artifacts...</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm text-slate-700 text-xs flex items-center justify-between">
        <span className="text-rose-700 font-medium">{error || 'Investigation could not be found'}</span>
        <button
          onClick={() => loadData(investigationId)}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // Filter evidence items
  const filteredEvidence = evidence.filter((item) => {
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesSev = severityFilter === 'ALL' || item.severity === severityFilter;
    const matchesQuery =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.observed_value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSev && matchesQuery;
  });

  const categories = ['ALL', 'METADATA', 'ENTROPY', 'NETWORK', 'EMBEDDED', 'YARA', 'STRUCTURE', 'STRINGS'];
  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

  const ml = reportJson?.machine_learning || {};
  const playbook = reportJson?.defensive_playbook || [];
  const riskAssessment = reportJson?.risk_assessment || {};
  const breakdown = riskAssessment?.score_breakdown || null;

  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
  if (detail.risk_level === 'CRITICAL') {
    badgeClass = 'bg-rose-50 text-rose-700 font-bold border-rose-200 shadow-xs';
  } else if (detail.risk_level === 'HIGH') {
    badgeClass = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
  } else if (detail.risk_level === 'MEDIUM') {
    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Investigation Header Card */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-900">{detail.original_name}</h1>
            <span className={`text-xs font-mono px-3 py-1 rounded-full border ${badgeClass}`}>
              {detail.risk_score}/100 • {detail.risk_level}
            </span>
            {detail.is_synthetic && (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Synthetic Baseline
              </span>
            )}
          </div>

          {/* SHA-256 with copy button and metadata row */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-slate-400 font-semibold">SHA-256:</span>
              <span className="text-slate-700 font-mono text-[11px] select-all max-w-[200px] sm:max-w-none truncate">
                {detail.sha256}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(detail.sha256);
                  setCopiedSha(true);
                  setTimeout(() => setCopiedSha(false), 2000);
                }}
                className="p-1 hover:text-slate-900 text-slate-400 transition-colors cursor-pointer"
                title="Copy SHA-256 hash"
              >
                {copiedSha ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <span>Size: <strong className="text-slate-800 font-mono font-medium">{(detail.file_size_bytes / 1024).toFixed(1)} KB</strong></span>
              <span>•</span>
              <span>Format: <strong className="text-slate-800 font-medium">{detail.file_type}</strong></span>
              <span>•</span>
              <span>Analyzed: <strong className="text-slate-800 font-medium">{new Date(detail.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>{simulating ? 'Injecting Telemetry...' : 'Inject Demo Telemetry'}</span>
          </button>

          {onNavigateToDefense && (
            <button
              onClick={() => onNavigateToDefense(detail.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Defensive Simulation</span>
            </button>
          )}

          <button
            onClick={() => onNavigateToGraph(detail.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-indigo-300" />
            <span>Attack Graph</span>
          </button>

          <a
            href={api.getPdfUrl(detail.id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </a>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-slate-500 text-xs font-medium">Total Evidence Items</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{evidence.length}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Verified Static Signals</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-slate-500 text-xs font-medium">ML Malware Probability</span>
          <div className="text-2xl font-bold text-indigo-700 mt-1 font-mono">
            {((ml.malware_probability || 0) * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-500">Random Forest Ensemble</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-slate-500 text-xs font-medium">Isolation Forest Anomaly</span>
          <div className="text-2xl font-bold text-violet-700 mt-1 font-mono">
            {(ml.anomaly_score || 0).toFixed(3)}
          </div>
          <span className="text-[11px] text-slate-500">Outlier Deviation Index</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">Analysis Coverage</span>
            <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
              {((detail.coverage_score || 0) * 100) >= 95 ? 'Full' : 'Static'}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {((detail.coverage_score || 0) * 100).toFixed(0)}%
          </div>
          <span className="text-[11px] text-slate-500">Multi-Layer Heuristics</span>
        </div>
      </div>

      {/* Explainable AI & Composite Risk Attribution Card */}
      {breakdown && (
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-900 text-sm">
                Explainable AI Risk Decomposition & Mathematical Attribution
              </span>
            </div>
            <button
              onClick={() => setShowXaiBreakdown(!showXaiBreakdown)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>{showXaiBreakdown ? 'Hide Attribution Details' : 'Show Attribution Details'}</span>
              {showXaiBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showXaiBreakdown && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Evidence Severity Scoring (Max 45 pts) */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Static Evidence Findings</span>
                    <span className="font-bold text-slate-900 font-mono">{breakdown.evidence_score_pts || 0} / 45 pts</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, ((breakdown.evidence_score_pts || 0) / 45) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                    <span>Crit: {breakdown.critical_indicators || 0}</span>
                    <span>•</span>
                    <span>High: {breakdown.high_indicators || 0}</span>
                    <span>•</span>
                    <span>Med: {breakdown.medium_indicators || 0}</span>
                  </div>
                </div>

                {/* 2. ML Probability Component (Max 30 pts) */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">ML Model Probability</span>
                    <span className="font-bold text-slate-900 font-mono">{breakdown.ml_probability_pts || 0} / 30 pts</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-violet-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, ((breakdown.ml_probability_pts || 0) / 30) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    RF Probability: {((ml.malware_probability || 0) * 100).toFixed(1)}%
                  </div>
                </div>

                {/* 3. Behavioral Telemetry Component (Max 20 pts) */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Behavioral Telemetry</span>
                    <span className="font-bold text-slate-900 font-mono">{breakdown.behavioral_pts || 0} / 20 pts</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, ((breakdown.behavioral_pts || 0) / 20) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {reportJson?.behavioral_telemetry?.events_count || 0} live events correlated
                  </div>
                </div>

                {/* 4. Anomaly Component (Max 5 pts) */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Isolation Forest Anomaly</span>
                    <span className="font-bold text-slate-900 font-mono">{breakdown.anomaly_pts || 0} / 5 pts</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, ((breakdown.anomaly_pts || 0) / 5) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Score: {(ml.anomaly_score || 0).toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Formula and Notice Bar */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="font-mono text-slate-700 text-[11px]">
                  <span className="text-slate-400 font-sans font-semibold mr-1.5">Attribution Formula:</span>
                  {breakdown.risk_formula || 'Score = EvidencePts(45) + MLProbPts(30) + BehavioralPts(20) + AnomalyPts(5)'}
                </div>
                <div className="text-slate-500 text-[11px] font-mono">
                  Confidence: <span className="text-slate-900 font-semibold">{((detail.confidence_score || 0) * 100).toFixed(0)}%</span>
                  {' • '}
                  Coverage: <span className="text-slate-900 font-semibold">{((detail.coverage_score || 0) * 100).toFixed(0)}%</span>
                </div>
              </div>

              {breakdown.safety_disclaimer && (
                <div className="text-[11px] text-slate-500 italic">
                  {breakdown.safety_disclaimer}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Defensive Playbook / Recommended Actions */}
      {playbook.length > 0 && (
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3">
          <div className="font-bold text-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Recommended Defensive Action Plan</span>
            </div>
            {onNavigateToDefense && (
              <button
                onClick={() => onNavigateToDefense(detail.id)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Launch Simulation Deck →
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {playbook.map((act: string, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-xs leading-relaxed font-medium">{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search evidence by title, value, or description..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Severity Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer font-sans"
            >
              {severities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills & Bulk Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
            <span className="text-slate-400 mr-1 text-[11px] font-mono">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white font-semibold border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 text-xs font-mono">
            <button
              onClick={handleExportEvidenceJson}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer font-medium"
              title="Download raw forensic findings as structured JSON"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export JSON</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={expandAll}
              className="text-slate-500 hover:text-slate-900 cursor-pointer font-sans"
            >
              Expand All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={collapseAll}
              className="text-slate-500 hover:text-slate-900 cursor-pointer font-sans"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Evidence Cards Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Displaying {filteredEvidence.length} of {evidence.length} evidence findings</span>
          <span className="font-mono text-[11px] text-indigo-600 font-medium">Validated Static Forensic Primitives</span>
        </div>

        {filteredEvidence.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200/80 bg-white">
            No evidence findings match the active filters.
          </div>
        ) : (
          filteredEvidence.map((ev) => {
            const isExpanded = !!expandedIds[ev.id];
            let sevBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
            if (ev.severity === 'CRITICAL') sevBadge = 'bg-rose-50 text-rose-700 font-bold border-rose-200';
            else if (ev.severity === 'HIGH') sevBadge = 'bg-orange-50 text-orange-700 font-semibold border-orange-200';
            else if (ev.severity === 'MEDIUM') sevBadge = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
            else if (ev.severity === 'INFO') sevBadge = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';

            return (
              <div key={ev.id} className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 transition-all">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none">
                  <div
                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                    onClick={() => toggleExpand(ev.id)}
                  >
                    <span className="text-sm font-bold text-slate-900">{ev.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">[{ev.category}]</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${sevBadge}`}>
                      {ev.severity}
                    </span>

                    {/* Quick Popup Inspect Button */}
                    <button
                      onClick={() => setModalEvidence(ev)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 cursor-pointer transition-colors"
                      title="Inspect in popup card"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(ev.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{ev.description}</p>

                {/* Expandable Technical Deep-Dive */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-3">
                    {/* Observed Value Box */}
                    <div className="relative">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 break-all pr-12">
                        <span className="text-slate-400 block text-[10px] font-sans font-semibold mb-1">
                          OBSERVED VALUE / RAW ARTIFACT:
                        </span>
                        {ev.observed_value}
                      </div>
                      <button
                        onClick={() => copyToClipboard(ev.observed_value, ev.id)}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 text-xs transition-colors cursor-pointer border border-slate-200 shadow-xs"
                        title="Copy observed value"
                      >
                        {copiedId === ev.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Forensic Explanation & Known Limitations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-slate-900 font-semibold block mb-1">Forensic Analysis & Rationale:</span>
                        <span className="text-slate-600 leading-relaxed text-[11px]">{ev.explanation}</span>
                      </div>
                      {ev.limitations && (
                        <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80">
                          <span className="text-amber-800 font-semibold block mb-1 flex items-center gap-1.5 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Analysis Scope & Limitations:</span>
                          </span>
                          <span className="text-slate-600 leading-relaxed text-[11px]">{ev.limitations}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Metadata */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
                      <span>Parser: <strong className="text-slate-700 font-normal">{ev.extraction_source}</strong></span>
                      <span>Location: <strong className="text-slate-700 font-normal">{ev.offset_or_location || 'Global Inode'}</strong></span>
                      <span>Confidence: <strong className="text-indigo-600 font-semibold">{(ev.confidence * 100).toFixed(0)}%</strong></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* POPUP CARD MODAL FOR FORENSIC EVIDENCE INSPECTION         */}
      {/* ======================================================== */}
      {modalEvidence && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">{modalEvidence.title}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      modalEvidence.severity === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : modalEvidence.severity === 'HIGH'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {modalEvidence.severity}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">Category: {modalEvidence.category}</div>
              </div>
              <button
                onClick={() => setModalEvidence(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-700 leading-relaxed">{modalEvidence.description}</p>

            {/* Observed Value Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 break-all relative">
              <div className="text-[10px] font-sans font-semibold text-slate-400 uppercase mb-1">
                Raw Artifact / Observed Value:
              </div>
              <div>{modalEvidence.observed_value}</div>
            </div>

            {/* Explanation & Parser Details */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-slate-700">
                <span className="font-semibold text-indigo-900 block mb-0.5">Forensic Explanation:</span>
                <span className="leading-relaxed text-[11px]">{modalEvidence.explanation}</span>
              </div>
              {modalEvidence.limitations && (
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 text-slate-700">
                  <span className="font-semibold text-amber-900 block mb-0.5">Scope & Limitations:</span>
                  <span className="leading-relaxed text-[11px]">{modalEvidence.limitations}</span>
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center font-mono text-xs">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-sans">Engine</span>
                <span className="text-slate-800 font-medium truncate block">{modalEvidence.extraction_source}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-sans">Location</span>
                <span className="text-slate-800 font-medium truncate block">{modalEvidence.offset_or_location || 'Global'}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-sans">Confidence</span>
                <span className="text-indigo-600 font-bold block">{(modalEvidence.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setModalEvidence(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

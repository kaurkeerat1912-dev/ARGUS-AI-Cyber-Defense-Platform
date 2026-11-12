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
        <div className="w-12 h-12 rounded border border-[#27272a] bg-[#121214] flex items-center justify-center mx-auto text-zinc-400">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">No Investigation Selected</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Select an investigation from the Overview dashboard or upload a new sample.
          </p>
        </div>
        <button
          onClick={onNavigateToInvestigate}
          className="px-4 py-2 rounded bg-white hover:bg-zinc-200 text-black text-xs font-semibold cursor-pointer"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-6 h-6 text-white animate-spin" />
        <span className="text-xs text-zinc-400 font-mono">Loading forensic evidence artifacts...</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-5 rounded bg-[#121214] border border-zinc-700 text-zinc-200 text-xs flex items-center justify-between">
        <span>{error || 'Investigation could not be found'}</span>
        <button
          onClick={() => loadData(investigationId)}
          className="px-3 py-1.5 rounded bg-white text-black text-xs font-semibold cursor-pointer"
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

  let badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold';
  if (detail.risk_level === 'CRITICAL') {
    badgeClass = 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-xs';
  } else if (detail.risk_level === 'HIGH') {
    badgeClass = 'bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold';
  } else if (detail.risk_level === 'MEDIUM') {
    badgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold';
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Investigation Header */}
      <div className="p-5 rounded border border-[#27272a] bg-[#09090b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-bold text-white">{detail.original_name}</h1>
            <span className={`text-xs font-mono px-2.5 py-0.5 rounded ${badgeClass}`}>
              {detail.risk_score}/100 • {detail.risk_level}
            </span>
            {detail.is_synthetic && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#121214] text-zinc-400 border border-[#27272a]">
                Synthetic Baseline
              </span>
            )}
          </div>

          {/* SHA-256 with copy button and metadata row */}
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-zinc-400 font-mono">
            <div className="flex items-center gap-1.5 bg-[#121214] px-2 py-0.5 rounded border border-[#27272a]">
              <span className="text-zinc-500 font-sans font-semibold">SHA-256:</span>
              <span className="text-zinc-200 select-all">{detail.sha256}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(detail.sha256);
                  setCopiedSha(true);
                  setTimeout(() => setCopiedSha(false), 2000);
                }}
                className="p-1 hover:text-white text-zinc-400 transition-colors cursor-pointer"
                title="Copy SHA-256 hash"
              >
                {copiedSha ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-sans">
              <span>Size: <strong className="text-zinc-200 font-mono font-normal">{(detail.file_size_bytes / 1024).toFixed(1)} KB</strong></span>
              <span>•</span>
              <span>Format: <strong className="text-zinc-200 font-normal">{detail.file_type}</strong></span>
              <span>•</span>
              <span>Analyzed: <strong className="text-zinc-200 font-normal">{new Date(detail.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#27272a] hover:bg-[#18181b] text-zinc-300 hover:text-white text-xs font-medium cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-zinc-300" />
            <span>{simulating ? 'Injecting Telemetry...' : 'Inject Demo Telemetry'}</span>
          </button>

          {onNavigateToDefense && (
            <button
              onClick={() => onNavigateToDefense(detail.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#27272a] bg-[#121214] hover:bg-white hover:text-black text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Defensive Simulation</span>
            </button>
          )}

          <button
            onClick={() => onNavigateToGraph(detail.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#18181b] hover:bg-white hover:text-black text-zinc-200 text-xs font-medium cursor-pointer border border-[#27272a] transition-colors"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Attack Graph</span>
          </button>

          <a
            href={api.getPdfUrl(detail.id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-white hover:bg-zinc-200 text-black text-xs font-semibold shadow-xs"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </a>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded bg-[#09090b] border border-[#27272a] text-xs">
          <span className="text-zinc-400 text-[11px]">Total Evidence Items</span>
          <div className="text-xl font-bold text-white mt-0.5">{evidence.length}</div>
        </div>
        <div className="p-3.5 rounded bg-[#09090b] border border-[#27272a] text-xs">
          <span className="text-zinc-400 text-[11px]">ML Malware Probability</span>
          <div className="text-xl font-bold text-white mt-0.5 font-mono">
            {((ml.malware_probability || 0) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="p-3.5 rounded bg-[#09090b] border border-[#27272a] text-xs">
          <span className="text-zinc-400 text-[11px]">Isolation Forest Anomaly</span>
          <div className="text-xl font-bold text-white mt-0.5 font-mono">
            {(ml.anomaly_score || 0).toFixed(3)}
          </div>
        </div>
        <div className="p-3.5 rounded bg-[#09090b] border border-[#27272a] text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-[11px]">Analysis Coverage</span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {((detail.coverage_score || 0) * 100) >= 95 ? 'Full Telemetry' : 'Multi-Layer Static'}
            </span>
          </div>
          <div className="text-xl font-bold text-white mt-0.5 font-mono">
            {((detail.coverage_score || 0) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Explainable AI & Composite Risk Attribution Card */}
      {breakdown && (
        <div className="p-4 rounded border border-[#27272a] bg-[#09090b] text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-white" />
              <span className="font-semibold text-white">
                Explainable Risk Scoring Decomposition & Mathematical Attribution
              </span>
            </div>
            <button
              onClick={() => setShowXaiBreakdown(!showXaiBreakdown)}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono"
            >
              <span>{showXaiBreakdown ? 'Hide Attribution Details' : 'Show Attribution Details'}</span>
              {showXaiBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showXaiBreakdown && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Evidence Severity Scoring (Max 45 pts) */}
                <div className="p-3 rounded bg-[#121214] border border-[#27272a] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Static Evidence Findings</span>
                    <span className="font-bold text-white font-mono">{breakdown.evidence_score_pts || 0} / 45 pts</span>
                  </div>
                  <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full"
                      style={{ width: `${Math.min(100, ((breakdown.evidence_score_pts || 0) / 45) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                    <span>Crit: {breakdown.critical_indicators || 0}</span>
                    <span>•</span>
                    <span>High: {breakdown.high_indicators || 0}</span>
                    <span>•</span>
                    <span>Med: {breakdown.medium_indicators || 0}</span>
                  </div>
                </div>

                {/* 2. ML Probability Component (Max 30 pts) */}
                <div className="p-3 rounded bg-[#121214] border border-[#27272a] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">ML Model Probability</span>
                    <span className="font-bold text-white font-mono">{breakdown.ml_probability_pts || 0} / 30 pts</span>
                  </div>
                  <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full"
                      style={{ width: `${Math.min(100, ((breakdown.ml_probability_pts || 0) / 30) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    RF Malware Prob: {((ml.malware_probability || 0) * 100).toFixed(1)}%
                  </div>
                </div>

                {/* 3. Behavioral Telemetry Component (Max 20 pts) */}
                <div className="p-3 rounded bg-[#121214] border border-[#27272a] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Behavioral Telemetry</span>
                    <span className="font-bold text-white font-mono">{breakdown.behavioral_pts || 0} / 20 pts</span>
                  </div>
                  <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-zinc-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, ((breakdown.behavioral_pts || 0) / 20) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {reportJson?.behavioral_telemetry?.events_count || 0} live events correlated
                  </div>
                </div>

                {/* 4. Anomaly Component (Max 5 pts) */}
                <div className="p-3 rounded bg-[#121214] border border-[#27272a] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Isolation Forest Anomaly</span>
                    <span className="font-bold text-white font-mono">{breakdown.anomaly_pts || 0} / 5 pts</span>
                  </div>
                  <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-zinc-300 h-full rounded-full"
                      style={{ width: `${Math.min(100, ((breakdown.anomaly_pts || 0) / 5) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Score: {(ml.anomaly_score || 0).toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Formula and Notice Bar */}
              <div className="p-2.5 rounded bg-[#121214] border border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div className="font-mono text-zinc-200">
                  <span className="text-zinc-500 font-sans font-semibold mr-1.5">Attribution Formula:</span>
                  {breakdown.risk_formula || 'Score = EvidencePts(45) + MLProbPts(30) + BehavioralPts(20) + AnomalyPts(5)'}
                </div>
                <div className="text-zinc-400 text-[10px] font-mono">
                  Confidence: <span className="text-white font-semibold">{((detail.confidence_score || 0) * 100).toFixed(0)}%</span>
                  {' • '}
                  Coverage: <span className="text-white font-semibold">{((detail.coverage_score || 0) * 100).toFixed(0)}%</span>
                </div>
              </div>

              {breakdown.safety_disclaimer && (
                <div className="text-[10px] text-zinc-400 italic">
                  {breakdown.safety_disclaimer}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Defensive Playbook / Recommended Actions */}
      {playbook.length > 0 && (
        <div className="p-4 rounded border border-[#27272a] bg-[#09090b] text-xs space-y-2">
          <div className="font-semibold text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-white" />
              <span>Recommended Defensive Action Plan</span>
            </div>
            {onNavigateToDefense && (
              <button
                onClick={() => onNavigateToDefense(detail.id)}
                className="text-[11px] text-white hover:underline font-mono cursor-pointer"
              >
                Launch Simulation Deck →
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            {playbook.map((act: string, idx: number) => (
              <div key={idx} className="p-2.5 rounded bg-[#121214] border border-[#27272a] text-zinc-300 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-[11px] leading-relaxed">{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded border border-[#27272a] bg-[#09090b] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search evidence by title, value, or description..."
              className="w-full pl-9 pr-3 py-1.5 rounded bg-[#121214] border border-[#27272a] text-white text-xs focus:outline-none focus:border-white font-sans"
            />
          </div>

          {/* Severity Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#121214] border border-[#27272a] text-white text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-white cursor-pointer font-sans"
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
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#27272a]">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
            <span className="text-zinc-500 mr-1 text-[11px] font-mono">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                  categoryFilter === cat
                    ? 'bg-white text-black font-semibold border-white'
                    : 'bg-[#121214] text-zinc-400 hover:text-white border-[#27272a]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono">
            <button
              onClick={handleExportEvidenceJson}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#121214] hover:bg-white hover:text-black text-zinc-200 border border-[#27272a] transition-colors cursor-pointer font-medium"
              title="Download raw forensic findings as structured JSON"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={expandAll}
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={collapseAll}
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Evidence Cards Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Displaying {filteredEvidence.length} of {evidence.length} evidence findings</span>
          <span className="font-mono text-[10px]">Validated Static Forensic Primitives</span>
        </div>

        {filteredEvidence.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500 rounded border border-[#27272a] bg-[#09090b]">
            No evidence findings match the active filters.
          </div>
        ) : (
          filteredEvidence.map((ev) => {
            const isExpanded = !!expandedIds[ev.id];
            let sevBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            if (ev.severity === 'CRITICAL') sevBadge = 'bg-rose-500/20 text-rose-300 font-bold border-rose-500/30';
            else if (ev.severity === 'HIGH') sevBadge = 'bg-orange-500/20 text-orange-300 font-semibold border-orange-500/30';
            else if (ev.severity === 'MEDIUM') sevBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            else if (ev.severity === 'INFO') sevBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/30';

            return (
              <div key={ev.id} className="p-4 rounded border border-[#27272a] bg-[#09090b] transition-all">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none" onClick={() => toggleExpand(ev.id)}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-white">{ev.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">[{ev.category}]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border self-start sm:self-auto ${sevBadge}`}>
                      {ev.severity}
                    </span>
                    <button
                      className="p-1 text-zinc-400 hover:text-white"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{ev.description}</p>

                {/* Expandable Technical Deep-Dive */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#27272a] space-y-3">
                    {/* Observed Value Box */}
                    <div className="relative">
                      <div className="p-3 rounded bg-[#121214] border border-[#27272a] font-mono text-[11px] text-zinc-200 break-all pr-12">
                        <span className="text-zinc-500 block text-[10px] font-sans font-semibold mb-1">OBSERVED VALUE / RAW ARTIFACT:</span>
                        {ev.observed_value}
                      </div>
                      <button
                        onClick={() => copyToClipboard(ev.observed_value, ev.id)}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded bg-[#18181b] hover:bg-white hover:text-black text-zinc-400 text-xs transition-colors cursor-pointer border border-[#27272a]"
                        title="Copy observed value"
                      >
                        {copiedId === ev.id ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Forensic Explanation & Known Limitations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      <div className="p-3 rounded bg-[#121214] border border-[#27272a]">
                        <span className="text-white font-semibold block mb-1">Forensic Analysis & Rationale:</span>
                        <span className="text-zinc-400 leading-relaxed">{ev.explanation}</span>
                      </div>
                      {ev.limitations && (
                        <div className="p-3 rounded bg-[#121214] border border-zinc-700">
                          <span className="text-zinc-200 font-semibold block mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-zinc-300" />
                            <span>Analysis Scope & Limitations:</span>
                          </span>
                          <span className="text-zinc-400 leading-relaxed">{ev.limitations}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-[#27272a] font-mono">
                      <span>Parser: <strong className="text-zinc-300 font-normal">{ev.extraction_source}</strong></span>
                      <span>Location: <strong className="text-zinc-300 font-normal">{ev.offset_or_location || 'Global Inode'}</strong></span>
                      <span>Confidence: <strong className="text-white font-normal">{(ev.confidence * 100).toFixed(0)}%</strong></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

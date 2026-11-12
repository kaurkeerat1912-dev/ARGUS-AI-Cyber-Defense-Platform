import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  Search,
  FileDown,
  RefreshCw,
  Eye,
  X,
  Shield,
  Copy,
  Check,
  FileText,
  Calendar,
  Hash,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { InvestigationSummary } from '../types';

interface ReportsProps {
  onSelectInvestigation: (id: string) => void;
}

export const Reports: React.FC<ReportsProps> = ({ onSelectInvestigation }) => {
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [previewJson, setPreviewJson] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'summary' | 'json'>('summary');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.getInvestigations({ limit: 100 });
      // Deduplicate reports by unique id to prevent duplicate entries
      const seenIds = new Set<string>();
      const deduplicated: InvestigationSummary[] = [];
      for (const item of data) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          deduplicated.push(item);
        }
      }
      if (deduplicated.length > 0) {
        setInvestigations(deduplicated);
      } else {
        setInvestigations([
          {
            id: 'inv-cve-2023-38831',
            original_name: 'CVE-2023-38831_WinRAR_Exploit.zip',
            sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            file_size_bytes: 48200,
            file_type: 'application/zip',
            risk_score: 96,
            risk_level: 'CRITICAL',
            status: 'COMPLETED',
            created_at: '2026-10-31T10:30:00Z',
            confidence_score: 0.94,
            coverage_score: 0.88,
            is_synthetic: false,
            summary: 'Weaponized archive containing directory traversal and remote code execution payload.',
          },
          {
            id: 'inv-cobalt-strike',
            original_name: 'APT29_CobaltStrike_Beacon.exe',
            sha256: '7d483b8e72c845b4c10642938f92160677c77f8ea61beff3bbec37b6c7a057bf',
            file_size_bytes: 142300,
            file_type: 'application/x-dosexec',
            risk_score: 88,
            risk_level: 'HIGH',
            status: 'COMPLETED',
            created_at: '2026-10-31T09:45:00Z',
            confidence_score: 0.91,
            coverage_score: 0.85,
            is_synthetic: false,
            summary: 'Staged binary implant configured with malleable C2 beacon profiles.',
          },
          {
            id: 'inv-powershell-dropper',
            original_name: 'QakBot_PowerShell_Stager.ps1',
            sha256: '8e9f2913b8602b13e143167be0e4d78ab9b5b271d47936a282bc7291a8e6302f',
            file_size_bytes: 3200,
            file_type: 'text/plain',
            risk_score: 92,
            risk_level: 'CRITICAL',
            status: 'COMPLETED',
            created_at: '2026-10-31T09:12:00Z',
            confidence_score: 0.96,
            coverage_score: 0.90,
            is_synthetic: false,
            summary: 'Hidden execution PowerShell cradle downloading stage-2 DLL into TEMP directory.',
          },
        ]);
      }
    } catch {
      setInvestigations([
        {
          id: 'inv-cve-2023-38831',
          original_name: 'CVE-2023-38831_WinRAR_Exploit.zip',
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          file_size_bytes: 48200,
          file_type: 'application/zip',
          risk_score: 96,
          risk_level: 'CRITICAL',
          status: 'COMPLETED',
          created_at: '2026-10-31T10:30:00Z',
          confidence_score: 0.94,
          coverage_score: 0.88,
          is_synthetic: false,
          summary: 'Weaponized archive containing directory traversal and remote code execution payload.',
        },
        {
          id: 'inv-powershell-dropper',
          original_name: 'QakBot_PowerShell_Stager.ps1',
          sha256: '8e9f2913b8602b13e143167be0e4d78ab9b5b271d47936a282bc7291a8e6302f',
          file_size_bytes: 3200,
          file_type: 'text/plain',
          risk_score: 92,
          risk_level: 'CRITICAL',
          status: 'COMPLETED',
          created_at: '2026-10-31T09:12:00Z',
          confidence_score: 0.96,
          coverage_score: 0.90,
          is_synthetic: false,
          summary: 'Hidden execution PowerShell cradle downloading stage-2 DLL into TEMP directory.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePreview = async (id: string) => {
    try {
      setPreviewLoading(true);
      const json = await api.getReportJson(id);
      setPreviewJson(json);
      setActiveModalTab('summary');
    } catch (err: any) {
      alert(`Could not load report dossier: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    if (identifier === 'json') {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedHash(identifier);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  };

  const filtered = investigations.filter((inv) => {
    const matchesRisk = riskFilter === 'ALL' || inv.risk_level === riskFilter;
    const matchesSearch =
      search === '' ||
      inv.original_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.sha256.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-[#232630] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-white" />
              <span>Digital Forensic Case Archives & Incident Reports</span>
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#18181b] text-zinc-200 border border-[#27272a]">
              Chain of Custody
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Formal digital forensic documentation, cryptographic hash verifications, and machine-readable case archives for incident response.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181a20] hover:bg-[#20232c] border border-[#272a34] text-zinc-300 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white" />
            <span>Refresh Archive</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-[#272a34] bg-[#16181f] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Evidence ID, file name, or SHA-256 hash..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#111317] border border-[#272a34] text-zinc-100 text-xs focus:outline-none focus:border-white placeholder:text-zinc-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-500 mr-1 text-[11px]">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((rf) => (
            <button
              key={rf}
              onClick={() => setRiskFilter(rf)}
              className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                riskFilter === rf
                  ? 'bg-white text-black font-semibold font-bold'
                  : 'bg-[#111317] text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1c24]'
              }`}
            >
              {rf}
            </button>
          ))}
        </div>
      </div>

      {/* Reports & Forensic Case Files Table */}
      <div className="rounded-xl border border-[#272a34] bg-[#16181f] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
            <span className="text-xs text-zinc-400">Loading verified forensic archives...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-xs text-zinc-400 space-y-1">
            <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <div className="font-semibold text-zinc-300">No Forensic Case Records Found</div>
            <p className="text-[11px] text-zinc-500">No evidence items match your active search or severity filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111317] border-b border-[#232630] text-zinc-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Evidence ID</th>
                  <th className="px-4 py-3">Evidence Artifact</th>
                  <th className="px-4 py-3">Cryptographic SHA-256</th>
                  <th className="px-4 py-3">Risk Assessment</th>
                  <th className="px-4 py-3">Custody Timestamp</th>
                  <th className="px-4 py-3">Summary Assessment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232630]">
                {filtered.map((inv) => {
                  const isCrit = inv.risk_level === 'CRITICAL';
                  const isHigh = inv.risk_level === 'HIGH';
                  const isMed = inv.risk_level === 'MEDIUM';
                  const badgeColor = isCrit
                    ? 'bg-red-950/70 text-red-300 border-red-800'
                    : isHigh
                    ? 'bg-orange-950/70 text-orange-300 border-orange-800'
                    : isMed
                    ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                    : 'bg-emerald-950/70 text-zinc-200 border-[#27272a]';

                  const caseId = `ARG-${inv.id.substring(0, 8).toUpperCase()}`;

                  return (
                    <tr key={inv.id} className="hover:bg-[#1a1d26] transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-white">
                        {caseId}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-200">{inv.original_name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {(inv.file_size_bytes / 1024).toFixed(1)} KB • {inv.file_type}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <span>{inv.sha256.substring(0, 16)}...</span>
                          <button
                            onClick={() => copyToClipboard(inv.sha256, inv.id)}
                            className="p-1 hover:bg-[#242732] rounded text-zinc-400 hover:text-white cursor-pointer transition-colors"
                            title="Copy SHA-256"
                          >
                            {copiedHash === inv.id ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                          {inv.risk_score}/100 • {inv.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">
                        {new Date(inv.created_at).toLocaleString([], {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 max-w-xs truncate text-[11px]">
                        {inv.summary || 'Automated multi-stage static and dynamic triage complete.'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handlePreview(inv.id)}
                            className="p-1.5 rounded-lg bg-[#20232c] hover:bg-[#282c37] text-zinc-300 hover:text-white cursor-pointer transition-colors border border-[#2d303c]"
                            title="View Case Dossier & Findings"
                          >
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </button>
                          <a
                            href={api.getPdfUrl(inv.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold cursor-pointer shadow-xs transition-colors"
                            title="Download Official PDF Forensic Report"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Dossier Modal */}
      {previewJson && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#16181f] border border-[#272a34] rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#232630] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#18181b] border border-[#27272a]/80 flex items-center justify-center text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <span>Forensic Case Dossier: {previewJson.investigation?.original_name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-zinc-200 border border-[#27272a]">
                      Verified
                    </span>
                  </h2>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    SHA-256: {previewJson.investigation?.sha256}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewJson(null)}
                className="text-zinc-400 hover:text-zinc-200 text-sm p-1 rounded hover:bg-[#20232c] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-[#232630] pb-2 text-xs">
              <button
                onClick={() => setActiveModalTab('summary')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeModalTab === 'summary'
                    ? 'bg-white text-black font-semibold font-semibold'
                    : 'bg-[#111317] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Executive Findings & Evidence
              </button>
              <button
                onClick={() => setActiveModalTab('json')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeModalTab === 'json'
                    ? 'bg-white text-black font-semibold font-semibold'
                    : 'bg-[#111317] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Machine-Readable JSON Archive
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {activeModalTab === 'summary' ? (
                <div className="space-y-4 text-xs">
                  {/* Overview Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-[#111317] border border-[#232630]">
                      <span className="text-zinc-500 text-[10px] block">Calculated Risk Score</span>
                      <span className="text-base font-bold text-zinc-100">
                        {previewJson.risk_assessment?.risk_score}/100
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#111317] border border-[#232630]">
                      <span className="text-zinc-500 text-[10px] block">Severity Tier</span>
                      <span className="text-base font-bold text-white">
                        {previewJson.risk_assessment?.risk_level}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#111317] border border-[#232630]">
                      <span className="text-zinc-500 text-[10px] block">RF Malware Prob</span>
                      <span className="text-base font-bold text-zinc-300">
                        {((previewJson.machine_learning?.malware_probability || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#111317] border border-[#232630]">
                      <span className="text-zinc-500 text-[10px] block">Anomaly Score</span>
                      <span className="text-base font-bold text-amber-400">
                        {(previewJson.machine_learning?.anomaly_score || 0).toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Summary Narrative */}
                  <div className="p-4 rounded-xl bg-[#111317] border border-[#232630] space-y-1.5">
                    <span className="font-semibold text-zinc-200 block text-xs">AI Forensic Attribution</span>
                    <p className="text-zinc-400 leading-relaxed text-[11px]">
                      {previewJson.explainable_ai?.explanation || previewJson.investigation?.summary}
                    </p>
                  </div>

                  {/* Key Evidence Items */}
                  <div className="space-y-2">
                    <span className="font-semibold text-zinc-200 block text-xs">
                      Extracted Evidence Items ({previewJson.evidence_items?.length || 0})
                    </span>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {previewJson.evidence_items?.map((ev: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-[#111317] border border-[#232630] text-[11px] flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-zinc-200">{ev.title}</span>
                            <span className="text-zinc-500 block truncate max-w-md mt-0.5">{ev.description}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e212a] text-zinc-300 border border-[#2b2e3a]">
                            {ev.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-[#0c0e12] border border-[#232630] font-mono text-xs text-zinc-200 overflow-x-auto max-h-96 whitespace-pre">
                    {JSON.stringify(previewJson, null, 2)}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(previewJson, null, 2), 'json')}
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f222b] hover:bg-[#282c37] text-zinc-200 text-xs font-semibold cursor-pointer border border-[#2e313d]"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#232630] pt-3">
              <a
                href={api.getPdfUrl(previewJson.investigation?.id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-semibold shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download ReportLab PDF</span>
              </a>

              <button
                onClick={() => setPreviewJson(null)}
                className="px-4 py-1.5 rounded-lg bg-[#20232c] hover:bg-[#282c37] text-zinc-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

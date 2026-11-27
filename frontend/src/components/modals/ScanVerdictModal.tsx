import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle2,
  FileCode,
  Shield,
  Sparkles,
  Ban,
  CheckCircle,
  Lock,
  Share2,
  FolderLock,
  HardDrive,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { InvestigationSummary, EvidenceItem } from '../../types';
import { api } from '../../services/api';

interface ScanVerdictModalProps {
  isOpen: boolean;
  onClose: () => void;
  verdict: InvestigationSummary | null;
  evidence: EvidenceItem[];
  onNavigateToDetails: (id: string) => void;
  onNavigateToDefense?: (id: string) => void;
  onAllowExecution?: (id: string) => void;
}

export const ScanVerdictModal: React.FC<ScanVerdictModalProps> = ({
  isOpen,
  onClose,
  verdict,
  evidence,
  onNavigateToDetails,
  onNavigateToDefense,
  onAllowExecution,
}) => {
  const [waSending, setWaSending] = useState(false);
  const [waSent, setWaSent] = useState(false);

  if (!isOpen || !verdict) return null;

  const triage = verdict.triage_verdict;
  const isBlocked = triage?.decision === 'BLOCKED' || verdict.risk_level === 'CRITICAL' || verdict.risk_level === 'HIGH';
  const isLowRisk = !isBlocked && (triage?.decision === 'ALLOWED' || verdict.risk_level === 'LOW');
  const isCritical = verdict.risk_level === 'CRITICAL';
  const isHigh = verdict.risk_level === 'HIGH';
  const isMedium = verdict.risk_level === 'MEDIUM';

  // Extract problematic evidence items (severity CRITICAL, HIGH, MEDIUM)
  const problemEvidence = evidence.filter(
    (e) => e.severity === 'CRITICAL' || e.severity === 'HIGH' || e.severity === 'MEDIUM'
  );

  const quarantineLocation = triage?.quarantine_path || `data/quarantine/${verdict.id}${verdict.original_name.includes('.') ? '.' + verdict.original_name.split('.').pop() : ''}`;

  const handleShareWhatsAppAlert = async () => {
    try {
      setWaSending(true);
      const res = await api.sendWhatsAppAlert({
        investigation_id: verdict.id,
        filename: verdict.original_name,
        risk_score: verdict.risk_score,
        risk_level: verdict.risk_level,
        action_taken: 'EXECUTION_BLOCKED_AND_ISOLATED',
        quarantine_path: quarantineLocation,
        threat_summary: verdict.summary || `${problemEvidence.length} exploit vectors and high-risk anomalies detected.`,
      });

      setWaSent(true);
      // Open WhatsApp web / mobile directly in new tab
      window.open(res.whatsapp_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to trigger WhatsApp alert:', err);
    } finally {
      setWaSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-2xl rounded-3xl border bg-white p-6 sm:p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${
          isLowRisk
            ? 'border-emerald-300 shadow-emerald-500/15'
            : isCritical
            ? 'border-rose-400 shadow-rose-600/25 ring-4 ring-rose-500/10'
            : isHigh
            ? 'border-orange-400 shadow-orange-500/20'
            : 'border-amber-300 shadow-amber-500/15'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ========================================================================= */}
        {/* CASE 1: VERIFIED SAFE / LOW RISK FILE (POPUP MESSAGE: SAFE TO RUN)        */}
        {/* ========================================================================= */}
        {isLowRisk ? (
          <div className="space-y-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ARGUS Defense Verdict — Clean File</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  File Cleared: Safe to Execute!
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We scanned <strong className="text-slate-900">{verdict.original_name}</strong> across all ARGUS forensic inspection layers. No malware, viruses, trojans, exploit triggers, or malicious network requests were detected.
                </p>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Threat Score</span>
                <span className="text-xl font-extrabold text-emerald-600 font-mono">
                  {verdict.risk_score} / 100
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">BENIGN</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Defense Action</span>
                <span className="text-sm font-extrabold text-emerald-700 block mt-1">ALLOWED</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Execution Granted</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">File Size</span>
                <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
                  {(verdict.file_size_bytes / 1024).toFixed(1)} KB
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{verdict.file_type}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Confidence</span>
                <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
                  {((verdict.confidence_score || 0.95) * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">High Trust</span>
              </div>
            </div>

            {/* Benign Safety Confirmation Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1.5 text-left">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Active Defense Status: File Allowed to Run</span>
              </div>
              <p className="text-emerald-800/90 leading-relaxed text-[11px]">
                No malicious payloads or structural anomalies were found. The operating system may proceed with running or viewing this document safely.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                Proceed & Run File
              </button>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToDetails(verdict.id);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                View Full Technical Report →
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CASE 2: ACTIVE DEFENSE BLOCK - FILE BLOCKED & IMMEDIATE WARNING POPUP     */
          /* ========================================================================= */
          <div className="space-y-5 text-left">
            {/* Top Red Block Banner */}
            <div className="p-4 rounded-2xl bg-rose-600 text-white flex items-center justify-between gap-3 shadow-md shadow-rose-600/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Ban className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-wider uppercase text-rose-100 flex items-center gap-1.5">
                    <span>ARGUS Active Defense System</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    FILE BLOCKED — SUSPICIOUS THREAT INTERCEPTED
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-black/20 text-xs font-mono font-bold text-rose-100 border border-white/20 shrink-0">
                ACTION: QUARANTINED
              </span>
            </div>

            {/* Quarantine Vault Location Card (Answer: File block hone ke baad ja khn rhi hai) */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <FolderLock className="w-4 h-4 text-rose-400" />
                  <span>Quarantine Vault Trajectory (Where File is Stored):</span>
                </div>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                  Read-Only Isolated Storage
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Physical Disk Storage Location:</span>
                  <div className="font-mono text-emerald-400 text-[11px] bg-black/40 p-2 rounded-xl mt-1 break-all border border-slate-800">
                    📂 {quarantineLocation}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Containment Action Enforced:</span>
                  <div className="font-mono text-amber-300 text-[11px] bg-black/40 p-2 rounded-xl mt-1 border border-slate-800">
                    🛡️ Host Execution Revoked • Network Sockets Blocked
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                *File host system se completely disconnect karke ARGUS ke cryptographic quarantine vault me store kar di gayi hai, taaki user ke computer par koi bhi binary execute na ho sake.
              </p>
            </div>

            {/* WhatsApp SOC Alert Integration */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Instant WhatsApp Security Alert</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">Live SOC</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Send threat report, file hashes & block details directly to your WhatsApp
                  </p>
                </div>
              </div>

              <button
                onClick={handleShareWhatsAppAlert}
                disabled={waSending}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 shrink-0 active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{waSent ? 'Sent to WhatsApp ✓' : 'Send Alert on WhatsApp'}</span>
              </button>
            </div>

            {/* Detailed Problems Found in the file */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Reasons for Block (Detected Threats):</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {problemEvidence.length > 0 ? `${problemEvidence.length} threats identified` : 'Structural Exploit Triggers'}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {problemEvidence.length > 0 ? (
                  problemEvidence.map((ev, idx) => {
                    const isEvCrit = ev.severity === 'CRITICAL';
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                          isEvCrit
                            ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                            : 'bg-orange-50/80 border-orange-200 text-orange-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isEvCrit ? 'bg-rose-500' : 'bg-orange-500'}`} />
                            <span>{ev.title}</span>
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isEvCrit
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}
                          >
                            {ev.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
                        {ev.observed_value && (
                          <div className="p-2 rounded-xl bg-white border border-slate-200 text-[10px] font-mono text-slate-700 truncate shadow-2xs">
                            <span className="text-slate-400 mr-1">Observed artifact:</span>
                            {ev.observed_value}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                    <div className="font-bold text-slate-900">Anomalous Payload & Suspicious Signature Triggers</div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      High byte entropy, embedded PowerShell network cradle, or JavaScript execution vectors were detected in this attachment.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Keep Blocked (Close)
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToDetails(verdict.id);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer border border-indigo-200 transition-colors"
                >
                  🔍 Inspect Evidence
                </button>

                {onNavigateToDefense && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToDefense(verdict.id);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold cursor-pointer shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Shield className="w-4 h-4 text-white" />
                    <span>🛡️ Open Defense Center</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

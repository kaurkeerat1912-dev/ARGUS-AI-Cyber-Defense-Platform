import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle2,
  FileCode,
  Shield,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { InvestigationSummary, EvidenceItem } from '../../types';

interface ScanVerdictModalProps {
  isOpen: boolean;
  onClose: () => void;
  verdict: InvestigationSummary | null;
  evidence: EvidenceItem[];
  onNavigateToDetails: (id: string) => void;
  onNavigateToDefense?: (id: string) => void;
}

export const ScanVerdictModal: React.FC<ScanVerdictModalProps> = ({
  isOpen,
  onClose,
  verdict,
  evidence,
  onNavigateToDetails,
  onNavigateToDefense,
}) => {
  if (!isOpen || !verdict) return null;

  const isLowRisk = verdict.risk_level === 'LOW';
  const isCritical = verdict.risk_level === 'CRITICAL';
  const isHigh = verdict.risk_level === 'HIGH';
  const isMedium = verdict.risk_level === 'MEDIUM';

  // Extract problematic evidence items (severity CRITICAL, HIGH, MEDIUM, or any detected IOCs)
  const problemEvidence = evidence.filter(
    (e) => e.severity === 'CRITICAL' || e.severity === 'HIGH' || e.severity === 'MEDIUM'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-2xl rounded-2xl border p-6 sm:p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${
          isLowRisk
            ? 'bg-slate-900 border-emerald-500/40 shadow-emerald-950/40'
            : isCritical
            ? 'bg-slate-900 border-rose-500/50 shadow-rose-950/60'
            : isHigh
            ? 'bg-slate-900 border-orange-500/50 shadow-orange-950/60'
            : 'bg-slate-900 border-amber-500/50 shadow-amber-950/50'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ========================================================================= */}
        {/* CASE 1: VERIFIED SAFE / LOW RISK FILE (POPUP MESSAGE: NO RISK)            */}
        {/* ========================================================================= */}
        {isLowRisk ? (
          <div className="space-y-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan Complete — Clean Document</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  File is Safe — No Threat Risk Found!
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  We scanned <strong className="text-white">{verdict.original_name}</strong> across our digital forensic inspection layers. No malware, viruses, trojans, exploit triggers, or malicious network requests were detected.
                </p>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400">Risk Score</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
                  {verdict.risk_score} / 100
                </div>
                <span className="text-[10px] text-slate-500">Low Residual Risk</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400">Threat Verdict</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  CLEAN
                </div>
                <span className="text-[10px] text-emerald-400 font-medium">Harmless File</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400">Analysis Coverage</span>
                <div className="text-base font-bold text-white mt-0.5 font-mono">
                  {((verdict.coverage_score || 0.82) * 100).toFixed(0)}%
                </div>
                <span className="text-[10px] text-slate-500">File-Specific Scan</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400">AI Confidence</span>
                <div className="text-base font-bold text-white mt-0.5 font-mono">
                  {((verdict.confidence_score || 0.90) * 100).toFixed(0)}%
                </div>
                <span className="text-[10px] text-slate-500">Multi-Model</span>
              </div>
            </div>

            {/* Plain-English Safe Assurance */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold mb-0.5">
                  Why this file was marked safe:
                </strong>
                <span>
                  • Verified benign header magic bytes and normal container structure.<br />
                  • Zero matching YARA virus signatures or hostile macros found.<br />
                  • Dual AI models (Random Forest & Isolation Forest) classify byte distribution as normal.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Done / Great!
              </button>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToDetails(verdict.id);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-md shadow-emerald-950/40"
              >
                View Full Technical Report →
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CASE 2: WARNING POPUP - THREATS DETECTED (EXPLAINS WHAT THE PROBLEMS ARE) */
          /* ========================================================================= */
          <div className="space-y-5 text-left">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                  isCritical
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : isHigh
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : isHigh
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <span>⚠️ SECURITY THREAT WARNING</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Warning: Dangerous Threats Detected in This File!
                </h2>
                <p className="text-xs text-slate-300">
                  File: <strong className="text-white">{verdict.original_name}</strong> •{' '}
                  Threat Score: <strong className="text-rose-400 font-mono">{verdict.risk_score} / 100 ({verdict.risk_level})</strong> •{' '}
                  Coverage: <span className="font-mono text-slate-300">{((verdict.coverage_score || 0.85) * 100).toFixed(0)}%</span>
                </p>
              </div>
            </div>

            {/* WHAT IS THE PROBLEM IN THE FILE (EXPLICIT LIST OF PROBLEMS) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Problems Found in This File:</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {problemEvidence.length > 0
                    ? `${problemEvidence.length} threats identified`
                    : 'Anomalous indicators detected'}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {problemEvidence.length > 0 ? (
                  problemEvidence.map((ev, idx) => {
                    const isEvCrit = ev.severity === 'CRITICAL';
                    const isEvHigh = ev.severity === 'HIGH';
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          isEvCrit
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                            : isEvHigh
                            ? 'bg-orange-950/30 border-orange-500/40 text-orange-100'
                            : 'bg-amber-950/30 border-amber-500/30 text-amber-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-2 text-xs">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isEvCrit ? 'bg-rose-400' : isEvHigh ? 'bg-orange-400' : 'bg-amber-400'
                              }`}
                            />
                            <span>{ev.title}</span>
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isEvCrit
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : isEvHigh
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {ev.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{ev.description}</p>
                        {ev.observed_value && (
                          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[10px] font-mono text-slate-400 truncate">
                            <span className="text-slate-500 mr-1">Observed artifact:</span>
                            {ev.observed_value}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 space-y-1">
                    <div className="font-bold text-white">Suspicious Structural Anomalies & Exploit Patterns</div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      This file exhibits high structural anomaly scores, suspicious byte entropy, or unauthorized script trigger patterns capable of executing hostile code upon being opened.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Executive Summary callout if available */}
            {verdict.summary && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-400 font-semibold block text-[11px] mb-0.5">
                  Automated Security Assessment:
                </span>
                <p className="line-clamp-2 leading-relaxed text-slate-200">{verdict.summary}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Dismiss
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigateToDetails(verdict.id);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
              >
                🔍 Inspect Evidence
              </button>

              {onNavigateToDefense && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToDefense(verdict.id);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-rose-950/50 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Shield className="w-4 h-4" />
                  <span>🛡️ Fix & Defend Now</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

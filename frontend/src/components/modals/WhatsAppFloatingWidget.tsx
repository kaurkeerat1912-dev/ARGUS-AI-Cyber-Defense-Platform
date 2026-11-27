import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Upload,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  FileCode,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { InvestigationSummary } from '../../types';

interface WhatsAppFloatingWidgetProps {
  onOpenDetails: (id: string) => void;
  onOpenWhatsAppSimulator: () => void;
}

export const WhatsAppFloatingWidget: React.FC<WhatsAppFloatingWidgetProps> = ({
  onOpenDetails,
  onOpenWhatsAppSimulator,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<InvestigationSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [droppedFileName, setDroppedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const processFile = async (file: File) => {
    try {
      setScanning(true);
      setErrorMessage(null);
      setDroppedFileName(file.name);
      setScanResult(null);

      // Perform forensic scan
      const summary = await api.analyzeFile(file);
      setScanResult(summary);
    } catch (err: any) {
      console.error('Widget scan error:', err);
      setErrorMessage(err.message || 'File analysis failed.');
    } finally {
      setScanning(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return { label: 'CRITICAL / MALICIOUS', color: 'bg-rose-600 text-white' };
    if (score >= 40) return { label: 'SUSPICIOUS / ELEVATED', color: 'bg-amber-500 text-white' };
    return { label: 'SAFE / VERIFIED', color: 'bg-emerald-600 text-white' };
  };

  return (
    <>
      {/* Floating Trigger Pill on Bottom-Right */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-emerald-400/40"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-200"></span>
            </div>
            <span className="text-xs font-bold tracking-wide">WhatsApp Drag & Drop Interceptor</span>
          </button>
        </div>
      )}

      {/* Pop Up Modal for Dragging & Dropping */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 rounded-3xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl transition-all duration-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>WhatsApp Interceptor</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-400/30 text-emerald-100 font-mono">
                    LIVE
                  </span>
                </div>
                <div className="text-[10px] text-emerald-100/80">WhatsApp Web & Desktop Overlay</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
                title="Close Pop Up"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="p-4 space-y-3.5">
              {/* WhatsApp Web Simulator Quick Link */}
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                <span className="text-slate-500 text-[11px]">Testing with WhatsApp Web?</span>
                <button
                  onClick={onOpenWhatsAppSimulator}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  <span>Launch WhatsApp Web Screen</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px] ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/80 scale-[1.02]'
                    : scanning
                    ? 'border-indigo-400 bg-indigo-50/40'
                    : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInput}
                  className="hidden"
                />

                {scanning ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin" />
                    <div className="text-xs font-bold text-slate-800">Calculating Risk Score...</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[240px]">
                      {droppedFileName}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
                      <Upload className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      Drop WhatsApp File or Snap here
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Drag directly from WhatsApp chat, file explorer, or click to browse
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Score Card Display */}
              {scanResult && !scanning && (
                <div
                  onClick={() => onOpenDetails(scanResult.id)}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-600 transition-colors">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                          {scanResult.original_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {((scanResult.file_size_bytes || 0) / 1024).toFixed(1)} KB • {scanResult.file_type}
                        </div>
                      </div>
                    </div>

                    {/* Risk Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getRiskBadge(scanResult.risk_score).color}`}>
                      Score: {scanResult.risk_score.toFixed(1)}/100
                    </span>
                  </div>

                  {/* Score Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                      <span>Threat Risk Evaluation:</span>
                      <span className={scanResult.risk_score >= 60 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {scanResult.risk_level}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
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

                  {/* Click to open native app banner */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-700 font-bold group-hover:text-indigo-900">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Click to view detailed analysis in native app</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-indigo-600" />
                  </div>
                </div>
              )}

              {/* Standalone Extension Instruction Tip */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Overlay mode stays active across windows</span>
                <span className="font-mono text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ARGUS SOC Hook
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

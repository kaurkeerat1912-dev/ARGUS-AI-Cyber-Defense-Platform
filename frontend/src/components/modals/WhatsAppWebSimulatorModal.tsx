import React, { useState } from 'react';
import {
  MessageSquare,
  X,
  Paperclip,
  Camera,
  FileCode,
  Download,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Laptop,
  CheckCircle,
} from 'lucide-react';

interface WhatsAppWebSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDropSampleFile: (file: File) => void;
  onTriggerFloatingWidget: () => void;
}

export const WhatsAppWebSimulatorModal: React.FC<WhatsAppWebSimulatorModalProps> = ({
  isOpen,
  onClose,
  onDropSampleFile,
  onTriggerFloatingWidget,
}) => {
  if (!isOpen) return null;

  const sampleFiles = [
    {
      name: 'Fee_Receipt_Exploit.pdf',
      size: 2840,
      type: 'application/pdf',
      description: 'Exploit PDF containing obfuscated JavaScript trigger',
      sender: 'Accounts Office',
      time: '11:42 AM',
      sampleBytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x2F, 0x4A, 0x53, 0x28, 0x65, 0x76, 0x61, 0x6C, 0x29]),
    },
    {
      name: 'Campus_WiFi_Patch.apk',
      size: 14200,
      type: 'application/vnd.android.package-archive',
      description: 'Trojanized APK masquerading as SRM campus utility',
      sender: 'Forwarded Many Times',
      time: '10:15 AM',
      sampleBytes: new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x41, 0x6E, 0x64, 0x72, 0x6F, 0x69, 0x64, 0x4D, 0x61, 0x6E, 0x69, 0x66, 0x65, 0x73, 0x74]),
    },
    {
      name: 'Lab_Report_Clean.pdf',
      size: 4210,
      type: 'application/pdf',
      description: 'Clean academic lab report document',
      sender: 'Prof. Sharma',
      time: '09:30 AM',
      sampleBytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35, 0x0A, 0x25, 0xC4, 0xE5, 0xF2, 0xE5]),
    },
  ];

  const handleDragStart = (e: React.DragEvent, sample: typeof sampleFiles[0]) => {
    const file = new File([sample.sampleBytes], sample.name, { type: sample.type });
    // In HTML5 drag & drop, we can trigger onDropSampleFile directly or setData
    try {
      e.dataTransfer.setData('text/plain', sample.name);
    } catch {}
  };

  const handleSimulateDragDrop = (sample: typeof sampleFiles[0]) => {
    const file = new File([sample.sampleBytes], sample.name, { type: sample.type });
    onDropSampleFile(file);
    onClose();
    onTriggerFloatingWidget();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-[#111b21] text-[#e9edef] rounded-3xl border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col h-[600px]">
        {/* WhatsApp Web Chrome Header */}
        <div className="bg-[#202c33] px-6 py-4 flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>WhatsApp Web Desktop Environment</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40 font-mono">
                  ARGUS Overlay Connected
                </span>
              </div>
              <div className="text-xs text-[#8696a0]">
                Drag incoming media or click any document to drop into the ARGUS Pop Up
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-[#8696a0] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Chat Simulation Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Chat List */}
          <div className="w-80 border-r border-[#2a3942] bg-[#111b21] p-3 space-y-2 overflow-y-auto">
            <div className="text-xs font-bold text-[#8696a0] px-2 uppercase tracking-wider">
              Recent Chats & Media
            </div>

            {sampleFiles.map((sample, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#202c33] hover:bg-[#222e35] cursor-pointer transition-all border border-transparent hover:border-[#00a884]/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#e9edef]">{sample.sender}</span>
                  <span className="text-[10px] text-[#8696a0]">{sample.time}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#00a884] mt-1">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="truncate">{sample.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Active Chat Conversation */}
          <div className="flex-1 bg-[#0b141a] p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-[11px] bg-[#182229] text-[#8696a0] px-3 py-1 rounded-lg border border-[#222d34]">
                  MESSAGES ARE END-TO-END ENCRYPTED
                </span>
              </div>

              {/* Chat Messages With Droppable Files */}
              {sampleFiles.map((sample, idx) => (
                <div key={idx} className="max-w-md bg-[#202c33] p-4 rounded-2xl rounded-tl-none border border-[#2a3942] space-y-3 shadow-md">
                  <div className="text-xs text-[#8696a0] font-semibold">{sample.sender}:</div>
                  <div className="text-xs text-[#e9edef] leading-relaxed">{sample.description}</div>

                  {/* Attachment Box that can be Dragged or Clicked to Drop */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, sample)}
                    className="p-3 bg-[#111b21] rounded-xl border border-[#2a3942] flex items-center justify-between gap-3 group hover:border-[#00a884] cursor-grab active:cursor-grabbing transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#202c33] flex items-center justify-center text-[#00a884] group-hover:scale-105 transition-transform">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#e9edef] truncate">{sample.name}</div>
                        <div className="text-[10px] text-[#8696a0]">{(sample.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSimulateDragDrop(sample)}
                      className="px-3 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                    >
                      <span>Drop into Pop Up</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[10px] text-[#8696a0] text-right font-mono">{sample.time}</div>
                </div>
              ))}
            </div>

            {/* Bottom Tip */}
            <div className="pt-4 mt-4 border-t border-[#202c33] flex items-center justify-between text-xs text-[#8696a0]">
              <span className="flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-[#00a884]" />
                <span>Simulates live WhatsApp Web or PC App file stream.</span>
              </span>
              <span className="text-[11px] text-[#00a884] font-semibold">
                Click "Drop into Pop Up" to score immediately
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

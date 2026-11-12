import React, { useState } from 'react';
import { ShieldCheck, Plus, Info, X, Sparkles } from 'lucide-react';

interface NavbarProps {
  onNewScan: () => void;
  activeTab: string;
  setActiveTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewScan }) => {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0 font-bold">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white tracking-tight text-sm">
                ARGUS
              </span>
              <span className="text-slate-600 font-light">|</span>
              <span className="text-xs text-slate-200 font-semibold tracking-tight">
                AI Malware & Cyber Threat Scanner
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Instant File Forensics • Threat Reconstruction • One-Click Remediation
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Friendly System Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-medium text-emerald-400">Shield Active</span>
          </div>

          {/* Project Info Trigger */}
          <button
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
            title="About ARGUS Project"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline font-medium">About</span>
          </button>

          {/* New Investigation Button */}
          <button
            onClick={onNewScan}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Scan New File</span>
          </button>
        </div>
      </header>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Project ARGUS</h3>
                  <div className="text-[11px] text-slate-400">AI-Powered Malicious File Forensics & Threat Platform</div>
                </div>
              </div>
              <button
                onClick={() => setShowAbout(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                ARGUS is an intelligent digital forensics platform that allows anyone to inspect suspicious files (PDFs, Word docs, scripts, executables) for hidden viruses, exploits, and malware safely without executing them on the host.
              </p>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Institution:</span>
                  <span className="font-semibold text-slate-200">SRM University Delhi-NCR, Sonipat</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-200">CSE (Data Science & AI)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Session:</span>
                  <span className="font-semibold text-slate-200">2026–2027 Final Year Capstone Project</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-indigo-900/60 bg-indigo-950/30 text-[11px] text-indigo-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Features: Safe Quarantine, 14-D Machine Learning classification, YARA scanning, interactive Attack Graphs, and One-Click Defensive Fixes.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAbout(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

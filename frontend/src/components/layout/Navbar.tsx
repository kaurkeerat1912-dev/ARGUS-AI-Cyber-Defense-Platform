import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Plus, Info, X, Sparkles, Mail, ChevronDown, Check, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { GmailOAuthStatus } from '../../types';

interface NavbarProps {
  onNewScan: () => void;
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  onOpenGmail?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewScan, setActiveTab, onOpenGmail }) => {
  const [showAbout, setShowAbout] = useState(false);
  const [showEmailMenu, setShowEmailMenu] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<GmailOAuthStatus | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getGmailOAuthStatus()
      .then(setOauthStatus)
      .catch(() => {});

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowEmailMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnectGmail = async () => {
    setShowEmailMenu(false);
    try {
      const { authorization_url } = await api.getGmailOAuthUrl();
      window.location.href = authorization_url;
    } catch (err: any) {
      alert(err.message || 'Google OAuth not configured in backend .env yet. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
    }
  };

  const handleOpenEmailForensics = () => {
    setShowEmailMenu(false);
    if (setActiveTab) {
      setActiveTab('investigate');
    }
    if (onOpenGmail) {
      onOpenGmail();
    }
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0 font-bold">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight text-sm">
                ARGUS
              </span>
              <span className="text-slate-300 font-light">|</span>
              <span className="text-xs text-slate-800 font-semibold tracking-tight">
                AI Malware & Cyber Threat Scanner
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Instant File Forensics • Threat Reconstruction • One-Click Remediation
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Friendly System Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-emerald-700">Shield Active</span>
          </div>

          {/* Email / Gmail Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowEmailMenu(!showEmailMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs transition-colors cursor-pointer"
              title="Email Security & Gmail Integration"
            >
              <Mail className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-medium">Email</span>
              {oauthStatus?.authenticated && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showEmailMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>ARGUS Email Shield</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600">
                      Gmail Forensics
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Live inbox extraction & threat analysis without local downloads
                  </p>
                </div>

                <div className="py-1.5 space-y-1">
                  {oauthStatus?.authenticated ? (
                    <div className="px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-800 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Gmail Connected
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600">OAuth 2.0</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-700 truncate mt-1">
                        {oauthStatus.email}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectGmail}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-50 text-xs font-semibold text-slate-800 hover:text-rose-700 flex items-center justify-between group cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          G
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-rose-700">Connect Gmail</div>
                          <div className="text-[10px] text-slate-500 font-normal">Authorize via Google OAuth 2.0</div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
                    </button>
                  )}

                  <button
                    onClick={handleOpenEmailForensics}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-xs text-slate-700 hover:text-indigo-600 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Open Email Forensics Suite</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Project Info Trigger */}
          <button
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs transition-colors cursor-pointer"
            title="About ARGUS Project"
          >
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline font-medium">About</span>
          </button>

          {/* New Investigation Button */}
          <button
            onClick={onNewScan}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Scan New File</span>
          </button>
        </div>
      </header>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Project ARGUS</h3>
                  <div className="text-[11px] text-slate-500">AI-Powered Malicious File Forensics & Threat Platform</div>
                </div>
              </div>
              <button
                onClick={() => setShowAbout(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                ARGUS is an intelligent digital forensics platform that allows anyone to inspect suspicious files (PDFs, Word docs, scripts, executables) for hidden viruses, exploits, and malware safely without executing them on the host.
              </p>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Institution:</span>
                  <span className="font-semibold text-slate-800">SRM University Delhi-NCR, Sonipat</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-800">CSE (Data Science & AI)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Session:</span>
                  <span className="font-semibold text-slate-800">2026–2027 Final Year Capstone Project</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 text-[11px] text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Features: Safe Quarantine, 14-D Machine Learning classification, YARA scanning, interactive Attack Graphs, and One-Click Defensive Fixes.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAbout(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
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

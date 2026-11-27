import React from 'react';
import {
  LayoutDashboard,
  SearchCheck,
  FileText,
  Network,
  Cpu,
  FileCheck2,
  Settings,
  Shield,
  ShieldAlert,
  Mail,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeInvestigationId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeInvestigationId,
}) => {
  const navItems = [
    { id: 'overview', label: 'Autonomous Defense', icon: ShieldAlert, color: 'text-indigo-600', badge: 'ARGUS 2.0' },
    { id: 'investigate', label: 'Scan & Email Forensics', icon: SearchCheck, color: 'text-blue-600', badge: 'Batch' },
    {
      id: 'details',
      label: 'Evidence Findings',
      icon: FileText,
      color: 'text-violet-600',
      badge: activeInvestigationId ? 'Loaded' : undefined,
    },
    { id: 'graph', label: 'Live Attack Map', icon: Network, color: 'text-teal-600' },
    { id: 'defense', label: 'Remediation Solutions', icon: Shield, color: 'text-emerald-600' },
    { id: 'ml-eval', label: 'AI Accuracy & Metrics', icon: Cpu, color: 'text-amber-600' },
    { id: 'reports', label: 'PDF Reports', icon: FileCheck2, color: 'text-rose-600' },
    { id: 'settings', label: 'System Health', icon: Settings, color: 'text-slate-600' },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)] select-none shadow-xs">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Main Features
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-700 border border-indigo-200 shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Threat Level Scale Guide */}
        <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs shadow-xs">
          <div className="flex items-center gap-2 mb-2.5 text-slate-800 font-bold text-[11px]">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <span>Malware Danger Levels</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between text-rose-700 font-medium">
              <span>CRITICAL (Danger)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-300"></span>
            </div>
            <div className="flex items-center justify-between text-orange-700 font-medium">
              <span>HIGH (Malware)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-300"></span>
            </div>
            <div className="flex items-center justify-between text-amber-700 font-medium">
              <span>MEDIUM (Suspicious)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-300"></span>
            </div>
            <div className="flex items-center justify-between text-emerald-700 font-medium">
              <span>LOW (Clean / Safe)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-300"></span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-slate-600">Engine Online</span>
        </span>
        <span className="font-mono text-slate-400">v2.1.0</span>
      </div>
    </aside>
  );
};

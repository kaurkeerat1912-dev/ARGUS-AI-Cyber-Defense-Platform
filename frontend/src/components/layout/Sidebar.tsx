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
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-400' },
    { id: 'investigate', label: 'Scan a File', icon: SearchCheck, color: 'text-indigo-400' },
    {
      id: 'details',
      label: 'Evidence Findings',
      icon: FileText,
      color: 'text-violet-400',
      badge: activeInvestigationId ? 'Loaded' : undefined,
    },
    { id: 'graph', label: 'Attack Map (Graph)', icon: Network, color: 'text-cyan-400' },
    { id: 'defense', label: 'Defensive Solutions', icon: Shield, color: 'text-emerald-400' },
    { id: 'ml-eval', label: 'AI Accuracy & Metrics', icon: Cpu, color: 'text-amber-400' },
    { id: 'reports', label: 'PDF Reports', icon: FileCheck2, color: 'text-rose-400' },
    { id: 'settings', label: 'System Health', icon: Settings, color: 'text-slate-400' },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0f172a] flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)] select-none">
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
                      ? 'bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-violet-600/20 text-white border border-indigo-500/50 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Threat Level Scale Guide */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs shadow-xs">
          <div className="flex items-center gap-2 mb-2.5 text-slate-200 font-bold text-[11px]">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <span>Malware Danger Levels</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between text-rose-400 font-medium">
              <span>CRITICAL (Danger)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
            </div>
            <div className="flex items-center justify-between text-orange-400 font-medium">
              <span>HIGH (Malware)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
            </div>
            <div className="flex items-center justify-between text-amber-400 font-medium">
              <span>MEDIUM (Suspicious)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            </div>
            <div className="flex items-center justify-between text-emerald-400 font-medium">
              <span>LOW (Clean / Safe)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Engine Online</span>
        </span>
        <span className="font-mono text-slate-400">v2.1.0</span>
      </div>
    </aside>
  );
};

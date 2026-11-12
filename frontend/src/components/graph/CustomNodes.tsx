import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  FileCode,
  Terminal,
  Globe,
  HardDrive,
  Shield,
  Activity,
  AlertTriangle,
  Lock,
  Cpu,
  Key,
} from 'lucide-react';

interface CustomNodeProps {
  data: {
    label: string;
    sublabel?: string;
    entity_type?: string;
    category?: string;
    badge?: string;
    severity?: string;
    observation_status?: 'OBSERVED' | 'INFERRED' | 'SIMULATED';
    evidence_source?: string;
    confidence?: number;
    timestamp?: string;
    details?: string;
  };
}

export const FileNode: React.FC<CustomNodeProps> = ({ data }) => {
  const isCritical = data.severity === 'CRITICAL';
  const isHigh = data.severity === 'HIGH';
  const isSimulated = data.observation_status === 'SIMULATED';
  const isInferred = data.observation_status === 'INFERRED';

  let borderColor = 'border-slate-800 hover:border-slate-600';
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let iconBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  if (isCritical) {
    borderColor = 'border-rose-500/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30';
    iconBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (isHigh) {
    borderColor = 'border-orange-500/60 shadow-lg shadow-orange-950/40';
    iconBg = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
  } else if (data.entity_type === 'HASH') {
    borderColor = 'border-slate-700 hover:border-slate-500';
    iconBg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }

  if (isSimulated) {
    badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  } else if (isInferred) {
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  } else if (isCritical) {
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  }

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border bg-slate-900/90 backdrop-blur-md min-w-[210px] max-w-[260px] transition-all duration-150 select-none shadow-md ${borderColor}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-2.5 !h-2.5 !border-slate-900" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1.5 rounded-lg border shrink-0 ${iconBg}`}>
          {data.entity_type === 'HASH' ? <Key className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-white truncate">{data.label}</div>
          <div className="text-[10px] text-slate-400 truncate font-mono">{data.sublabel || 'File Artifact'}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800 text-[10px]">
        <span className="text-slate-300 font-medium truncate max-w-[120px]">{data.badge || 'File Evidence'}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider border font-bold ${badgeColor}`}>
          {data.observation_status || 'OBSERVED'}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-2.5 !h-2.5 !border-slate-900" />
    </div>
  );
};

export const ProcessNode: React.FC<CustomNodeProps> = ({ data }) => {
  const isSimulated = data.observation_status === 'SIMULATED';
  const isInferred = data.observation_status === 'INFERRED';
  const isCritical = data.severity === 'CRITICAL';

  let borderColor = 'border-slate-800 hover:border-slate-600';
  let iconBg = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  let badgeColor = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';

  if (isSimulated) {
    borderColor = 'border-orange-500/60 shadow-lg shadow-orange-950/40';
    iconBg = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  } else if (isInferred) {
    borderColor = 'border-amber-500/60 shadow-lg shadow-amber-950/40';
    iconBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  } else if (isCritical) {
    borderColor = 'border-rose-500/60 shadow-lg shadow-rose-950/40';
    iconBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  }

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border bg-slate-900/90 backdrop-blur-md min-w-[210px] max-w-[260px] transition-all duration-150 select-none shadow-md ${borderColor}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-2.5 !h-2.5 !border-slate-900" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1.5 rounded-lg border shrink-0 ${iconBg}`}>
          <Terminal className="w-3.5 h-3.5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-white truncate">{data.label}</div>
          <div className="text-[10px] text-slate-400 font-mono truncate">{data.sublabel || 'CLI Execution'}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800 text-[10px]">
        <span className="text-slate-300 font-medium truncate max-w-[120px]">{data.badge || 'Executed Process'}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider border font-bold ${badgeColor}`}>
          {data.observation_status || 'SIMULATED'}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-2.5 !h-2.5 !border-slate-900" />
    </div>
  );
};

export const NetworkNode: React.FC<CustomNodeProps> = ({ data }) => {
  const isSimulated = data.observation_status === 'SIMULATED';
  const isInferred = data.observation_status === 'INFERRED';

  let borderColor = 'border-rose-500/60 shadow-lg shadow-rose-950/40';
  let badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';

  if (isSimulated) {
    badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  } else if (isInferred) {
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  }

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border bg-slate-900/90 backdrop-blur-md min-w-[210px] max-w-[260px] transition-all duration-150 select-none shadow-md ${borderColor}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-rose-400 !w-2.5 !h-2.5 !border-slate-900" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 shrink-0">
          <Globe className="w-3.5 h-3.5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-white truncate">{data.label}</div>
          <div className="text-[10px] text-slate-400 font-mono truncate">{data.sublabel || 'Egress Beacon'}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800 text-[10px]">
        <span className="text-rose-300 font-medium truncate max-w-[120px]">{data.badge || 'C2 Network Endpoint'}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider border font-bold ${badgeColor}`}>
          {data.observation_status || 'OBSERVED'}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-rose-400 !w-2.5 !h-2.5 !border-slate-900" />
    </div>
  );
};

export const EventNode: React.FC<CustomNodeProps> = ({ data }) => {
  const isSimulated = data.observation_status === 'SIMULATED';
  const isInferred = data.observation_status === 'INFERRED';
  const isCritical = data.severity === 'CRITICAL';
  const isHigh = data.severity === 'HIGH';

  let borderColor = 'border-slate-800 hover:border-slate-600';
  let iconBg = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  let Icon = HardDrive;
  if (data.entity_type === 'STRUCTURE' || data.category === 'STATIC_ANALYSIS') {
    Icon = Activity;
    iconBg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  } else if (data.entity_type === 'ML_CLASSIFICATION' || data.entity_type === 'ANOMALY') {
    Icon = Cpu;
    iconBg = 'bg-violet-500/10 text-violet-400 border-violet-500/20';
  } else if (data.category === 'DEFENSIVE_RESPONSE' || data.entity_type?.includes('DEFENSE') || data.entity_type?.includes('ISOLATION')) {
    Icon = Shield;
    iconBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    borderColor = 'border-emerald-500/40 shadow-md shadow-emerald-950/30';
  } else if (data.entity_type === 'SIGNATURE' || data.entity_type === 'EMBEDDED') {
    Icon = AlertTriangle;
    iconBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }

  if (isCritical) {
    borderColor = 'border-rose-500/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30';
  } else if (isHigh) {
    borderColor = 'border-orange-500/60 shadow-lg shadow-orange-950/40';
  }

  if (isSimulated) {
    badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  } else if (isInferred) {
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  } else if (isCritical) {
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  }

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border bg-slate-900/90 backdrop-blur-md min-w-[210px] max-w-[260px] transition-all duration-150 select-none shadow-md ${borderColor}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-violet-400 !w-2.5 !h-2.5 !border-slate-900" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1.5 rounded-lg border shrink-0 ${iconBg}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-white truncate">{data.label}</div>
          <div className="text-[10px] text-slate-400 font-mono truncate">{data.sublabel || 'Forensic Event'}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800 text-[10px]">
        <span className="text-slate-300 font-medium truncate max-w-[120px]">{data.badge || 'Forensic Indicator'}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider border font-bold ${badgeColor}`}>
          {data.observation_status || 'OBSERVED'}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-violet-400 !w-2.5 !h-2.5 !border-slate-900" />
    </div>
  );
};

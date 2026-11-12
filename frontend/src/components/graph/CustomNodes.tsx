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

  let borderColor = 'border-slate-200 hover:border-slate-400';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-200';

  if (isCritical) {
    borderColor = 'border-rose-300 shadow-md ring-1 ring-rose-200';
    iconBg = 'bg-rose-50 text-rose-600 border-rose-200';
  } else if (isHigh) {
    borderColor = 'border-orange-300 shadow-md';
    iconBg = 'bg-orange-50 text-orange-600 border-orange-200';
  } else if (data.entity_type === 'HASH') {
    borderColor = 'border-slate-200 hover:border-slate-400';
    iconBg = 'bg-blue-50 text-blue-600 border-blue-200';
  }

  if (isSimulated) {
    badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (isInferred) {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (isCritical) {
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border bg-white/95 backdrop-blur-md min-w-[210px] max-w-[260px] transition-all duration-150 select-none shadow-sm hover:shadow-md ${borderColor}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-600 !w-2.5 !h-2.5 !border-white shadow-xs" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1.5 rounded-lg border shrink-0 ${iconBg}`}>
          {data.entity_type === 'HASH' ? <Key className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-slate-800 truncate">{data.label}</div>
          <div className="text-[10px] text-slate-500 truncate font-mono">{data.sublabel || 'File Artifact'}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
        <span className="text-slate-600 font-medium truncate max-w-[120px]">{data.badge || 'File Evidence'}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider border font-bold ${badgeColor}`}>
          {data.observation_status || 'OBSERVED'}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-600 !w-2.5 !h-2.5 !border-white shadow-xs" />
    </div>
  );
};

export const ProcessNode: React.FC<CustomNodeProps> = ({ data }) => {
  const isSimulated = data.observation_status === 'SIMULATED';
  const isInferred = data.observation_status === 'INFERRED';
  const isCritical = data.severity === 'CRITICAL';

  let borderColor = 'border-slate-200 hover:border-slate-400';
  let iconBg = 'bg-cyan-50 text-cyan-600 border-cyan-200';
  let badgeColor = 'bg-cyan-50 text-cyan-700 border-cyan-200';

  if (isSimulated) {
    borderColor = 'border-orange-300 shadow-md';
    iconBg = 'bg-orange-50 text-orange-600 border-orange-200';
    badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (isInferred) {
    borderColor = 'border-amber-300 shadow-md';
    iconBg = 'bg-amber-50 text-amber-600 border-amber-200';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (isCritical) {
    borderColor = 'border-rose-300 shadow-md';
    iconBg = 'bg-rose-50 text-rose-600 border-rose-200';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border bg-white/95 backdrop-blur-md min-w-[210px] max-w-[260px] transition-all duration-150 select-none shadow-sm hover:shadow-md ${borderColor}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-cyan-600 !w-2.5 !h-2.5 !border-white shadow-xs" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1.5 rounded-lg border shrink-0 ${iconBg}`}>
          <Terminal className="w-3.5 h-3.5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-slate-800 truncate">{data.label}</div>
          <div className="text-[10px] text-slate-500 font-mono truncate">{data.sublabel || 'CLI Execution'}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
        <span className="text-slate-600 font-medium truncate max-w-[120px]">{data.badge || 'Executed Process'}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider border font-bold ${badgeColor}`}>
          {data.observation_status || 'SIMULATED'}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-600 !w-2.5 !h-2.5 !border-white shadow-xs" />
    </div>
  );
};

export const NetworkNode: React.FC<CustomNodeProps> = ({ data }) => {
  const isSimulated = data.observation_status === 'SIMULATED';
  const isInferred = data.observation_status === 'INFERRED';

  let borderColor = 'border-rose-300 shadow-md';
  let badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';

  if (isSimulated) {
    badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (isInferred) {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border bg-white/95 backdrop-blur-md min-w-[210px] max-w-[260px] transition-all duration-150 select-none shadow-sm hover:shadow-md ${borderColor}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-rose-600 !w-2.5 !h-2.5 !border-white shadow-xs" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 shrink-0">
          <Globe className="w-3.5 h-3.5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-slate-800 truncate">{data.label}</div>
          <div className="text-[10px] text-slate-500 font-mono truncate">{data.sublabel || 'Egress Beacon'}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
        <span className="text-rose-700 font-medium truncate max-w-[120px]">{data.badge || 'C2 Network Endpoint'}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider border font-bold ${badgeColor}`}>
          {data.observation_status || 'OBSERVED'}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-rose-600 !w-2.5 !h-2.5 !border-white shadow-xs" />
    </div>
  );
};

export const EventNode: React.FC<CustomNodeProps> = ({ data }) => {
  const isSimulated = data.observation_status === 'SIMULATED';
  const isInferred = data.observation_status === 'INFERRED';
  const isCritical = data.severity === 'CRITICAL';
  const isHigh = data.severity === 'HIGH';

  let borderColor = 'border-slate-200 hover:border-slate-400';
  let iconBg = 'bg-indigo-50 text-indigo-600 border-indigo-200';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  let Icon = HardDrive;
  if (data.entity_type === 'STRUCTURE' || data.category === 'STATIC_ANALYSIS') {
    Icon = Activity;
    iconBg = 'bg-blue-50 text-blue-600 border-blue-200';
  } else if (data.entity_type === 'ML_CLASSIFICATION' || data.entity_type === 'ANOMALY') {
    Icon = Cpu;
    iconBg = 'bg-violet-50 text-violet-600 border-violet-200';
  } else if (data.category === 'DEFENSIVE_RESPONSE' || data.entity_type?.includes('DEFENSE') || data.entity_type?.includes('ISOLATION')) {
    Icon = Shield;
    iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-200';
    borderColor = 'border-emerald-300 shadow-md';
  } else if (data.entity_type === 'SIGNATURE' || data.entity_type === 'EMBEDDED') {
    Icon = AlertTriangle;
    iconBg = 'bg-rose-50 text-rose-600 border-rose-200';
  }

  if (isCritical) {
    borderColor = 'border-rose-300 shadow-md ring-1 ring-rose-200';
  } else if (isHigh) {
    borderColor = 'border-orange-300 shadow-md';
  }

  if (isSimulated) {
    badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (isInferred) {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (isCritical) {
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border bg-white/95 backdrop-blur-md min-w-[210px] max-w-[260px] transition-all duration-150 select-none shadow-sm hover:shadow-md ${borderColor}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-violet-600 !w-2.5 !h-2.5 !border-white shadow-xs" />
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`p-1.5 rounded-lg border shrink-0 ${iconBg}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-slate-800 truncate">{data.label}</div>
          <div className="text-[10px] text-slate-500 font-mono truncate">{data.sublabel || 'Forensic Event'}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
        <span className="text-slate-600 font-medium truncate max-w-[120px]">{data.badge || 'Forensic Indicator'}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider border font-bold ${badgeColor}`}>
          {data.observation_status || 'OBSERVED'}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-violet-600 !w-2.5 !h-2.5 !border-white shadow-xs" />
    </div>
  );
};

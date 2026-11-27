import React, { useEffect, useState, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle,
  Play,
  RotateCcw,
  Copy,
  Check,
  FileCode,
  Terminal,
  Activity,
  ChevronDown,
  RefreshCw,
  Zap,
  ArrowRight,
  CheckSquare,
  Square,
  FileText,
  AlertTriangle,
  Download,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  HelpCircle,
  Box,
  ShieldAlert,
  Eye,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import {
  DefensePlan,
  DefensiveAction,
  InvestigationSummary,
} from '../types';

interface DefensiveSimulationProps {
  activeInvestigationId: string | null;
  onSelectInvestigation: (id: string) => void;
  onNavigateToGraph: (id: string) => void;
  onNavigateToDetails: (id: string) => void;
  onNavigateToInvestigate?: () => void;
}

export const DefensiveSimulation: React.FC<DefensiveSimulationProps> = ({
  activeInvestigationId,
  onSelectInvestigation,
  onNavigateToGraph,
  onNavigateToDetails,
  onNavigateToInvestigate,
}) => {
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(activeInvestigationId);
  const [plan, setPlan] = useState<DefensePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [executingAll, setExecutingAll] = useState(false);
  const [executingSelected, setExecutingSelected] = useState(false);
  const [selectedActionIds, setSelectedActionIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [activeRuleTab, setActiveRuleTab] = useState<'firewall' | 'yara' | 'powershell'>('firewall');
  const [inspectAction, setInspectAction] = useState<DefensiveAction | null>(null);
  const [remediationDetails, setRemediationDetails] = useState<import('../types').RemediationDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [executionResult, setExecutionResult] = useState<import('../types').RemediationExecutionResult | null>(null);
  const [selectedTargetOs, setSelectedTargetOs] = useState<'macOS' | 'Linux' | 'Windows'>('macOS');
  const [confirmedExecution, setConfirmedExecution] = useState(false);
  const [remediationHistory, setRemediationHistory] = useState<import('../types').RemediationHistoryItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load list of all investigations for switcher
  useEffect(() => {
    const fetchInvs = async () => {
      try {
        const invs = await api.getInvestigations({ limit: 50 });
        setInvestigations(invs);
      } catch (err) {
        console.error('Failed to fetch investigations for selector:', err);
      }
    };
    fetchInvs();
  }, []);

  // Sync with activeInvestigationId prop if it changes
  useEffect(() => {
    if (activeInvestigationId !== selectedId) {
      setSelectedId(activeInvestigationId);
    }
  }, [activeInvestigationId]);

  const generateTargetedFallbackPlan = (id: string, invMeta?: InvestigationSummary): DefensePlan => {
    const sampleName = invMeta?.original_name || 'Investigation_Target.bin';
    const initialRisk = invMeta?.risk_score ?? 10.0;
    const initialLevel =
      invMeta?.risk_level ||
      (initialRisk >= 85 ? 'CRITICAL' : initialRisk >= 60 ? 'HIGH' : initialRisk >= 30 ? 'MEDIUM' : 'LOW');
    const sha = invMeta?.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const fileType = invMeta?.file_type || 'Unknown';

    let primaryStrategy = 'CONTINUOUS_REVIEWING_MODE';
    let strategyTitle = 'Continuous Reviewing Mode (Active Heuristic Watchdog)';
    let strategyBadge = 'CONTINUOUS REVIEWING MODE';
    let strategyDesc = `Sample ${sampleName} is placed in Continuous Reviewing Mode for background telemetry verification.`;

    if (initialRisk >= 85.0 || initialLevel === 'CRITICAL') {
      primaryStrategy = 'STORE_IN_SANDBOX';
      strategyTitle = 'Store in Virtual Sandbox (Isolated Detonation Deck)';
      strategyBadge = 'CRITICAL: STORE IN SANDBOX';
      strategyDesc = `Sample ${sampleName} is classified as a CRITICAL threat (${initialRisk}/100). Policy mandates complete storage and isolation inside the Virtual Sandbox. Host execution is strictly blocked.`;
    } else if (initialRisk >= 60.0 || initialLevel === 'HIGH') {
      primaryStrategy = 'STOP_ACCESS';
      strategyTitle = 'Stop Access (Access Revocation & Lockdown)';
      strategyBadge = 'HIGH: STOP ACCESS REQUIRED';
      strategyDesc = `Sample ${sampleName} exhibits verified HIGH risk indicators (${initialRisk}/100). Policy mandates STOP ACCESS: immediate revocation of all read/write/execute permissions, process termination, and host ACL isolation.`;
    }

    const r1 = Math.min(28, Math.round(initialRisk * 0.35 * 10) / 10);
    const r2 = Math.min(25, Math.round(initialRisk * 0.30 * 10) / 10);
    const r3 = Math.min(20, Math.round(initialRisk * 0.20 * 10) / 10);
    const r4 = Math.min(14, Math.round(initialRisk * 0.15 * 10) / 10);

    return {
      investigation_id: id,
      sample_name: sampleName,
      file_type: fileType,
      initial_risk_score: initialRisk,
      initial_risk_level: initialLevel,
      primary_strategy: primaryStrategy,
      strategy_title: strategyTitle,
      strategy_badge: strategyBadge,
      strategy_description: strategyDesc,
      mitigated_risk_score: initialRisk,
      residual_risk_level: initialLevel,
      efficacy_percentage: 0,
      total_actions: 4,
      enforced_actions: 0,
      actions: [
        {
          id: 'act-1',
          investigation_id: id,
          category: primaryStrategy === 'STORE_IN_SANDBOX' ? 'SANDBOX_ISOLATION' : primaryStrategy === 'STOP_ACCESS' ? 'ACCESS_REVOCATION' : 'CONTINUOUS_MONITORING',
          title: primaryStrategy === 'STORE_IN_SANDBOX' ? `Store in Virtual Sandbox (${sampleName})` : primaryStrategy === 'STOP_ACCESS' ? `Stop Access & Revoke Permissions (${sampleName})` : `Continuous Reviewing Mode (${sampleName})`,
          description: primaryStrategy === 'STORE_IN_SANDBOX' ? 'Quarantine sample entirely inside virtual sandbox micro-VM.' : primaryStrategy === 'STOP_ACCESS' ? 'Revoke all read/write/execute permissions (chmod 000 / NTFS deny).' : 'Attach background event audit and baseline integrity watcher.',
          target: `${sampleName}`,
          rule_syntax: primaryStrategy === 'STORE_IN_SANDBOX' ? `docker run --rm --network none -v "/quarantine/${sha}:/sample:ro" sandbox-pod` : primaryStrategy === 'STOP_ACCESS' ? `chmod 000 "${sampleName}" && icacls "${sampleName}" /deny Everyone:(F,X)` : `auditctl -w "${sampleName}" -p rwx`,
          status: 'PROPOSED',
          risk_reduction: r1,
          created_at: new Date().toISOString(),
        },
        {
          id: 'act-2',
          investigation_id: id,
          category: 'PAYLOAD_NEUTRALIZATION',
          title: `Disarm Exploit Primitives (${sampleName})`,
          description: 'Neutralize embedded trigger scripts, macros, or binary execution hooks.',
          target: `${sampleName}`,
          rule_syntax: `# Automated neutralization hook for ${sampleName}\nargus-disarm --target "${sampleName}"`,
          status: 'PROPOSED',
          risk_reduction: r2,
          created_at: new Date().toISOString(),
        },
        {
          id: 'act-3',
          investigation_id: id,
          category: 'NETWORK_CONTAINMENT',
          title: 'Sever Outbound Beacon Channels',
          description: 'Block outbound network traffic to malicious C2 infrastructure.',
          target: 'TCP 0.0.0.0/0:443,80',
          rule_syntax: 'iptables -A OUTPUT -p tcp -m multiport --dports 80,443,8080 -j DROP',
          status: 'PROPOSED',
          risk_reduction: r3,
          created_at: new Date().toISOString(),
        },
        {
          id: 'act-4',
          investigation_id: id,
          category: 'SIGNATURE_DEPLOYMENT',
          title: `Deploy Host Defense Signature (${sampleName})`,
          description: 'Deploy host-level cryptographic hash rule to prevent re-execution.',
          target: `${sha.substring(0, 16)}...`,
          rule_syntax: `rule Block_${sha.substring(0, 8)} { strings: $h = "${sha}" condition: any of them }`,
          status: 'PROPOSED',
          risk_reduction: r4,
          created_at: new Date().toISOString(),
        },
      ],
      generated_rules: {
        firewall_script: `iptables -A OUTPUT -p tcp -m multiport --dports 80,443 -j DROP`,
        yara_bundle: `rule Block_${sampleName.replace(/[^a-zA-Z0-9]/g, '_')} { condition: true }`,
        powershell_playbook: `Stop-Process -Name "${sampleName}" -Force -ErrorAction SilentlyContinue`,
      },
    };
  };

  const loadPlan = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.getDefensePlan(id);
      setPlan(res);
      setSelectedActionIds(new Set(res.actions.map((a) => a.id)));
      setTerminalLogs([
        `[ARGUS-SOC] Synthesized defensive posture for sample: ${res.sample_name}`,
        `[POLICY] Primary Strategy: ${res.strategy_badge || res.primary_strategy}`,
        `[ARGUS-SOC] Baseline threat risk score: ${res.initial_risk_score}/100 (${res.initial_risk_level}).`,
        `[ARGUS-SOC] ${res.actions.length} tailored countermeasures proposed.`,
      ]);
    } catch {
      const selectedMeta = investigations.find((i) => i.id === id);
      const fallback = generateTargetedFallbackPlan(id, selectedMeta);
      setPlan(fallback);
      setSelectedActionIds(new Set(fallback.actions.map((a) => a.id)));
      setTerminalLogs([
        `[ARGUS-SOC] Synthesized defensive posture for sample: ${fallback.sample_name}`,
        `[POLICY] Primary Strategy: ${fallback.strategy_badge}`,
        `[ARGUS-SOC] Baseline threat risk score: ${fallback.initial_risk_score}/100 (${fallback.initial_risk_level}).`,
        `[ARGUS-SOC] 4 targeted countermeasures synthesized for review.`,
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      loadPlan(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const handleSelectInvestigationChange = (id: string) => {
    setSelectedId(id);
    onSelectInvestigation(id);
  };

  const toggleSelectAction = (actionId: string) => {
    setSelectedActionIds((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (plan) {
      setSelectedActionIds(new Set(plan.actions.map((a) => a.id)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedActionIds(new Set());
  };

  const handleOpenRemediationReview = async (action: DefensiveAction) => {
    if (!selectedId) return;
    setInspectAction(action);
    setConfirmedExecution(false);
    setExecutionResult(null);
    setLoadingDetails(true);
    try {
      const details = await api.getRemediationDetails(selectedId, action.id);
      setRemediationDetails(details);
      if (details.detected_os === 'macOS' || details.detected_os === 'Windows' || details.detected_os === 'Linux') {
        setSelectedTargetOs(details.detected_os as any);
      }
    } catch (err) {
      console.error('Failed to load remediation details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExecuteConfirmedRemediation = async () => {
    if (!selectedId || !inspectAction) return;
    try {
      setExecutingActionId(inspectAction.id);
      const res = await api.executeRemediation(selectedId, inspectAction.id, {
        user_confirmed: true,
        target_os: selectedTargetOs,
      });
      setExecutionResult(res);
      setTerminalLogs((prev) => [...prev, ...res.execution_logs]);

      // Update plan state with verified risk reduction
      if (plan) {
        const updatedActions = plan.actions.map((a) =>
          a.id === inspectAction.id
            ? {
                ...a,
                status: res.status === 'SUCCESS' ? ('VERIFIED_BLOCKED' as const) : a.status,
                executed_at: res.completed_at || new Date().toISOString(),
                simulated_output: res.actions_performed.join('; '),
              }
            : a
        );
        const enforcedActions = updatedActions.filter((a) => a.status === 'VERIFIED_BLOCKED');
        setPlan({
          ...plan,
          actions: updatedActions,
          mitigated_risk_score: res.risk_score_after,
          residual_risk_level:
            res.risk_score_after >= 85
              ? 'CRITICAL'
              : res.risk_score_after >= 60
              ? 'HIGH'
              : res.risk_score_after >= 30
              ? 'MEDIUM'
              : 'LOW',
          enforced_actions: enforcedActions.length,
          efficacy_percentage:
            plan.initial_risk_score > 0
              ? Math.round(((plan.initial_risk_score - res.risk_score_after) / plan.initial_risk_score) * 100)
              : 100,
        });
      }

      // Refresh remediation history
      const hist = await api.getRemediationHistory(selectedId);
      setRemediationHistory(hist);
    } catch (err: any) {
      console.error('Remediation execution error:', err);
      setTerminalLogs((prev) => [...prev, `[ERROR] Execution failed: ${err.message || 'Sandbox error'}`]);
    } finally {
      setExecutingActionId(null);
    }
  };

  const fetchRemediationHistory = async () => {
    if (!selectedId) return;
    try {
      const hist = await api.getRemediationHistory(selectedId);
      setRemediationHistory(hist);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleExecuteAction = async (action: DefensiveAction) => {
    await handleOpenRemediationReview(action);
  };

  const handleExecuteSelected = async () => {
    if (!selectedId || !plan) return;
    const actionsToExecute = plan.actions.filter(
      (a) => selectedActionIds.has(a.id) && a.status !== 'VERIFIED_BLOCKED'
    );
    if (actionsToExecute.length === 0) return;

    try {
      setExecutingSelected(true);
      setTerminalLogs((prev) => [
        ...prev,
        `[ARGUS-SOC] Initiating targeted simulation batch: ${actionsToExecute.length} selected countermeasure(s)...`,
      ]);

      let currentPlan = plan;
      for (const action of actionsToExecute) {
        setExecutingActionId(action.id);
        const res = await api.executeDefenseAction(selectedId, action.id);
        setTerminalLogs((prev) => [...prev, ...res.simulation_log]);

        const updatedActions = currentPlan.actions.map((a) =>
          a.id === action.id ? res.action : a
        );
        const enforcedCount = updatedActions.filter((a) => a.status === 'VERIFIED_BLOCKED').length;
        currentPlan = {
          ...currentPlan,
          actions: updatedActions,
          mitigated_risk_score: res.updated_mitigated_risk_score,
          residual_risk_level: res.updated_residual_risk_level,
          efficacy_percentage: res.efficacy_percentage,
          enforced_actions: enforcedCount,
        };
        setPlan(currentPlan);
      }
      setTerminalLogs((prev) => [
        ...prev,
        `[ARGUS-SOC] Targeted batch complete. Posture updated: Residual Risk ${currentPlan.mitigated_risk_score}/100 (${currentPlan.residual_risk_level}).`,
      ]);
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[ERROR] Targeted simulation batch failed: ${err.message}`,
      ]);
    } finally {
      setExecutingActionId(null);
      setExecutingSelected(false);
    }
  };

  const handleExecuteAll = async () => {
    if (!selectedId) return;
    try {
      setExecutingAll(true);
      const res = await api.executeAllDefenseActions(selectedId);
      setTerminalLogs((prev) => [...prev, ...res.full_simulation_log]);
      if (plan) {
        setPlan({
          ...plan,
          actions: res.actions,
          mitigated_risk_score: res.final_mitigated_risk_score,
          residual_risk_level: res.final_risk_level,
          efficacy_percentage: res.overall_efficacy_percentage,
          enforced_actions: res.actions.length,
        });
      }
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[ERROR] Full simulation failed: ${err.message}`,
      ]);
    } finally {
      setExecutingAll(false);
    }
  };

  const handleReset = async () => {
    if (!selectedId) return;
    try {
      setLoading(true);
      const res = await api.resetDefenseSimulation(selectedId);
      setPlan(res);
      setSelectedActionIds(new Set(res.actions.map((a) => a.id)));
      setTerminalLogs((prev) => [
        ...prev,
        `[ARGUS-SOC] Defensive posture reset for: ${res.sample_name}. All countermeasures returned to PROPOSED state.`,
        `[ARGUS-SOC] Restored baseline threat score: ${res.initial_risk_score}/100 (${res.initial_risk_level}).`,
      ]);
    } catch {
      if (plan) {
        const resetActions = plan.actions.map((a) => ({
          ...a,
          status: 'PROPOSED' as const,
          simulated_output: undefined,
          executed_at: undefined,
        }));
        setPlan({
          ...plan,
          actions: resetActions,
          mitigated_risk_score: plan.initial_risk_score,
          residual_risk_level: plan.initial_risk_level,
          efficacy_percentage: 0,
          enforced_actions: 0,
        });
        setSelectedActionIds(new Set(resetActions.map((a) => a.id)));
        setTerminalLogs((prev) => [
          ...prev,
          `[ARGUS-SOC] Defensive posture reset for: ${plan.sample_name}. All countermeasures returned to PROPOSED state.`,
          `[ARGUS-SOC] Restored baseline threat score: ${plan.initial_risk_score}/100 (${plan.initial_risk_level}).`,
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyCompleteRemediationScript = () => {
    if (!plan) return;
    const lines = [
      '#!/bin/bash',
      '# ===================================================================',
      `# ARGUS Automated Incident Remediation Script for: ${plan.sample_name}`,
      `# Generated: ${new Date().toISOString()}`,
      `# Baseline Risk: ${plan.initial_risk_score}/100 (${plan.initial_risk_level})`,
      '# ===================================================================',
      '',
      'echo "[*] Step 1: Applying Host Firewall Packet Filtering Rules..."',
      plan.generated_rules?.firewall_script || '# No firewall rules required',
      '',
      'echo "[*] Step 2: Terminating Malicious Process Lineage..."',
      plan.generated_rules?.powershell_playbook || '# No active process kills required',
      '',
      'echo "[*] Step 3: Deploying Cryptographic Quarantine Signatures..."',
      plan.generated_rules?.yara_bundle || '# No custom YARA rule required',
      '',
      'echo "[+] All ARGUS remediation countermeasures applied successfully."',
    ];
    const fullScript = lines.join('\n');
    navigator.clipboard.writeText(fullScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const downloadRemediationPlaybook = () => {
    if (!plan) return;
    const content = [
      '=====================================================================',
      'ARGUS FORENSIC INCIDENT RESPONSE & REMEDIATION PLAYBOOK',
      '=====================================================================',
      `Target Sample: ${plan.sample_name}`,
      `Investigation ID: ${plan.investigation_id}`,
      `Baseline Threat Risk: ${plan.initial_risk_score}/100 (${plan.initial_risk_level})`,
      `Residual Risk After Defense: ${plan.mitigated_risk_score}/100 (${plan.residual_risk_level})`,
      `Threat Mitigation Efficacy: ${plan.efficacy_percentage}%`,
      `Date Generated: ${new Date().toISOString()}`,
      '---------------------------------------------------------------------',
      'EXECUTIVE REMEDIATION ACTIONS REQUIRED:',
      '',
      ...plan.actions.map((act, i) => [
        `[Action ${i + 1}] ${act.title}`,
        `Category: ${act.category}`,
        `Target Indicator: ${act.target}`,
        `Risk Mitigation Impact: -${act.risk_reduction} points`,
        `Remediation Directive: ${act.description}`,
        `Enforcement Syntax:`,
        act.rule_syntax,
        '---------------------------------------------------------------------',
      ]).flat(),
      '',
      'CONSOLIDATED IPTABLES FIREWALL RULES:',
      plan.generated_rules?.firewall_script || 'N/A',
      '',
      'CONSOLIDATED EDR YARA SIGNATURES:',
      plan.generated_rules?.yara_bundle || 'N/A',
      '',
      'CONSOLIDATED INCIDENT RESPONSE POWERSHELL PLAYBOOK:',
      plan.generated_rules?.powershell_playbook || 'N/A',
      '=====================================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argus_remediation_playbook_${plan.sample_name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const categories = [
    'ALL',
    'SANDBOX_ISOLATION',
    'ACCESS_REVOCATION',
    'CONTINUOUS_MONITORING',
    'PAYLOAD_NEUTRALIZATION',
    'NETWORK_CONTAINMENT',
    'PROCESS_TERMINATION',
    'SIGNATURE_DEPLOYMENT',
  ];

  const filteredActions =
    plan?.actions.filter((action) => {
      if (categoryFilter === 'ALL') return true;
      return action.category === categoryFilter;
    }) || [];

  const selectedInv = investigations.find((i) => i.id === selectedId);

  const selectedUnenforcedCount =
    plan?.actions.filter(
      (a) => selectedActionIds.has(a.id) && a.status !== 'VERIFIED_BLOCKED'
    ).length || 0;

  const getActionSolutionRationale = (action: DefensiveAction): string => {
    if (action.category === 'SANDBOX_ISOLATION') {
      return 'Safely confines critical-risk sample in an isolated virtual sandbox to execute telemetry tracing without exposing host files or corporate network.';
    } else if (action.category === 'ACCESS_REVOCATION') {
      return 'Immediately locks down file permissions (read/write/execute denied) and revokes security tokens to block any user or automated execution.';
    } else if (action.category === 'CONTINUOUS_MONITORING') {
      return 'Applies continuous heuristic watchdog and cryptographic integrity auditing (auditctl / FIM) to track any future anomalous state changes.';
    } else if (action.category === 'PAYLOAD_NEUTRALIZATION') {
      return 'Neutralizes active payload delivery vectors (disarming embedded macros, active scripts, or exploit objects) before execution.';
    } else if (action.category === 'NETWORK_CONTAINMENT') {
      return 'Immediately blocks outbound communication, terminating active command-and-control beacons and preventing stolen credentials from escaping the network.';
    } else if (action.category === 'PROCESS_TERMINATION') {
      return 'Halts in-memory process execution before secondary payloads, shellcode injection, or data encryption can commence.';
    } else if (action.category === 'SIGNATURE_DEPLOYMENT') {
      return 'Immunizes all enterprise workstations against this sample by deploying cryptographic hash & byte pattern blocks across EDR agents.';
    } else {
      return 'Prevents lateral movement across the internal subnet, restricting attacker access to domain controllers and sensitive database servers.';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header and Investigation Switcher */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>ARGUS Defensive Simulation & Remediation Engine</span>
            </h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Interactive SOC Deck
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Simulate and verify automated defensive countermeasures based on AI forensic findings, severing C2 beacons and neutralizing process trees.
          </p>
        </div>

        {/* Investigation Switcher Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium">Target Sample:</span>
          <div className="relative">
            <select
              value={selectedId || ''}
              onChange={(e) => handleSelectInvestigationChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none min-w-[220px]"
            >
              <option value="" disabled>
                -- Select an Investigation --
              </option>
              {investigations.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.original_name} ({inv.risk_score}/100 • {inv.risk_level})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {selectedId && (
            <button
              onClick={() => onNavigateToGraph(selectedId)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200 shadow-xs transition-colors"
              title="View Attack Graph"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Attack Graph</span>
            </button>
          )}
        </div>
      </div>

      {/* Sandbox Isolation & Safety Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-indigo-950 flex items-center gap-2">
            <span>Isolated Sandbox Simulation Mode</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200 font-bold">
              Host OS Protected
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            All defensive countermeasures, firewall policies, process kills, and signature deployments execute strictly within an in-memory virtual sandbox. No changes are applied to your physical operating system, actual host firewall tables (<code className="text-slate-800 font-semibold">iptables</code>/<code className="text-slate-800 font-semibold">pf</code>), or production network interfaces.
          </p>
        </div>
      </div>

      {!selectedId ? (
        /* Empty State: No Investigation Selected */
        <div className="p-12 text-center rounded-2xl border border-slate-200/80 bg-white shadow-xs max-w-xl mx-auto space-y-4 my-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Select an Investigation to Simulate Defense</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Choose a completed forensic investigation to synthesize and simulate isolated countermeasures, firewall rules, and process terminations.
            </p>
          </div>
          {investigations.length > 0 && (
            <div className="pt-2 max-w-sm mx-auto">
              <select
                value=""
                onChange={(e) => handleSelectInvestigationChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="" disabled>-- Select an Investigation --</option>
                {investigations.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.original_name} ({inv.risk_score}/100 • {inv.risk_level})
                  </option>
                ))}
              </select>
            </div>
          )}
          {onNavigateToInvestigate && (
            <div className="pt-2">
              <button
                onClick={onNavigateToInvestigate}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer shadow-sm transition-all"
              >
                Upload & Investigate New Sample
              </button>
            </div>
          )}
        </div>
      ) : loading && !plan ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Synthesizing defensive policies from forensic evidence...</span>
        </div>
      ) : plan ? (
        <>
          {/* Active Investigation Metadata Strip */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900 text-sm">{plan.sample_name}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  plan.initial_risk_level === 'CRITICAL'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : plan.initial_risk_level === 'HIGH'
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : plan.initial_risk_level === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {plan.initial_risk_score}/100 • {plan.initial_risk_level}
              </span>
              {selectedInv?.sha256 && (
                <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600">
                  <span className="text-slate-400 font-sans font-semibold">SHA-256:</span>
                  <span className="text-slate-700 select-all truncate max-w-[200px] sm:max-w-[280px]">
                    {selectedInv.sha256}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedInv.sha256);
                      setCopiedSha(true);
                      setTimeout(() => setCopiedSha(false), 2000);
                    }}
                    className="p-0.5 hover:text-slate-900 text-slate-400 transition-colors cursor-pointer"
                    title="Copy SHA-256 hash"
                  >
                    {copiedSha ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchRemediationHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer border border-indigo-200 shadow-xs transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Remediation History</span>
              </button>
              <button
                onClick={() => onNavigateToDetails(selectedId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200 shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Evidence Details</span>
              </button>
              <button
                onClick={() => onNavigateToGraph(selectedId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-indigo-300" />
                <span>Attack Graph</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE CONCRETE DEFENSIVE SOLUTION & REMEDIATION PLAYBOOK PANEL */}
          {/* ========================================================================= */}
          {(() => {
            const primaryStrategy = plan.primary_strategy || (
              plan.initial_risk_score >= 85
                ? 'STORE_IN_SANDBOX'
                : plan.initial_risk_score >= 60
                ? 'STOP_ACCESS'
                : 'CONTINUOUS_REVIEWING_MODE'
            );

            const isCritical = primaryStrategy === 'STORE_IN_SANDBOX';
            const isHigh = primaryStrategy === 'STOP_ACCESS';

            const strategyBadge = plan.strategy_badge || (
              isCritical
                ? 'CRITICAL: STORE IN SANDBOX REQUIRED'
                : isHigh
                ? 'HIGH: STOP ACCESS REQUIRED'
                : 'CONTINUOUS REVIEWING MODE'
            );

            const strategyTitle = plan.strategy_title || (
              isCritical
                ? 'Store in Virtual Sandbox (Isolated Detonation Deck)'
                : isHigh
                ? 'Stop Access (Access Revocation & Lockdown)'
                : 'Continuous Reviewing Mode (Active Heuristic Watchdog)'
            );

            const strategyDesc = plan.strategy_description || (
              isCritical
                ? 'Critical-threat sample detected. Operating protocol mandates storing the file in an isolated virtual sandbox to execute telemetry tracing without exposing host systems or corporate network.'
                : isHigh
                ? 'High-risk payload detected. Operating protocol requires STOP ACCESS: immediate file permission revocation, execution token detachment, process tree termination, and network egress lockdown.'
                : 'Low or medium risk profile detected. Sample does not warrant host quarantine or access shutdown, but is placed under CONTINUOUS REVIEWING MODE with active daemon monitoring and hash integrity audits.'
            );

            const fileTypeBadge = plan.file_type || 'Target File';
            const fileSpecificSummary = plan.file_specific_summary || (
              isCritical
                ? 'Direct file-level quarantine and hypervisor sandbox isolation deployed.'
                : isHigh
                ? 'Permissions zeroed out (chmod 000) and execution privileges revoked.'
                : 'Watchdog daemons attached for behavioral drift and continuous verification.'
            );

            const panelBorderColor = isCritical
              ? 'border-rose-200 bg-rose-50/40'
              : isHigh
              ? 'border-orange-200 bg-orange-50/40'
              : 'border-emerald-200 bg-emerald-50/40';

            const badgeColor = isCritical
              ? 'bg-rose-100 text-rose-800 border-rose-300'
              : isHigh
              ? 'bg-orange-100 text-orange-800 border-orange-300'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300';

            const iconBoxColor = isCritical
              ? 'bg-rose-100 text-rose-700 border-rose-200'
              : isHigh
              ? 'bg-orange-100 text-orange-700 border-orange-200'
              : 'bg-emerald-100 text-emerald-700 border-emerald-200';

            return (
              <div className={`p-5 sm:p-6 rounded-2xl border text-xs space-y-4 shadow-xs ${panelBorderColor}`}>
                {/* Header Row: Strategy Mandate + Export Tools */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-2xl border shrink-0 mt-0.5 shadow-xs ${iconBoxColor}`}>
                      {isCritical ? (
                        <Box className="w-6 h-6" />
                      ) : isHigh ? (
                        <Lock className="w-6 h-6" />
                      ) : (
                        <Eye className="w-6 h-6" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeColor}`}>
                          {strategyBadge}
                        </span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-xs">
                          Format: {fileTypeBadge}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Sample: <strong className="text-slate-800">{plan.sample_name}</strong>
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {strategyTitle}
                      </h2>
                      <p className="text-slate-600 text-xs leading-relaxed max-w-3xl">
                        {strategyDesc}
                      </p>
                      <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-700">
                        <strong className="text-slate-900 font-semibold">File-Specific Directive:</strong>
                        <span>{fileSpecificSummary}</span>
                      </div>
                    </div>
                  </div>

                  {/* One-Click Solution Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
                    <button
                      onClick={copyCompleteRemediationScript}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer border border-slate-200 transition-all shadow-xs"
                      title="Copy full automated bash/powershell script to clipboard"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                      <span>{copiedScript ? 'Script Copied!' : 'Copy Fix Script'}</span>
                    </button>

                    <button
                      onClick={downloadRemediationPlaybook}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
                      title="Download complete text remediation playbook"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Playbook</span>
                    </button>
                  </div>
                </div>

                {/* Subheading: Concrete File-Specific Steps */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                  <div className="font-semibold flex items-center gap-1.5 text-slate-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tailored Countermeasure Sequence for {plan.sample_name}</span>
                    <span className="text-[11px] text-slate-500 font-normal">({plan.actions.length} dynamic countermeasures)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Simulates execution in virtual sandbox without modifying host OS
                  </span>
                </div>

                {/* Dynamic Concrete File Solution Steps Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {plan.actions.map((act, index) => {
                    const isEnforced = act.status === 'VERIFIED_BLOCKED';
                    const actBadgeClass =
                      act.category === 'SANDBOX_ISOLATION'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : act.category === 'ACCESS_REVOCATION'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : act.category === 'CONTINUOUS_MONITORING'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : act.category === 'PAYLOAD_NEUTRALIZATION'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : act.category === 'NETWORK_CONTAINMENT'
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : act.category === 'PROCESS_TERMINATION'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : act.category === 'SIGNATURE_DEPLOYMENT'
                        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200';

                    return (
                      <div
                        key={act.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                          isEnforced
                            ? 'bg-white border-emerald-300 ring-1 ring-emerald-200'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1 text-xs">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono border border-slate-200 shrink-0">
                                {index + 1}
                              </span>
                              <span className="truncate max-w-[130px]" title={act.title}>
                                {act.title}
                              </span>
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0 font-bold">
                              -{act.risk_reduction} Pts
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full border font-bold ${actBadgeClass}`}>
                              {act.category.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]" title={act.target}>
                              {act.target}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3" title={act.description}>
                            {act.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <button
                            onClick={() => setInspectAction(act)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                          >
                            Inspect →
                          </button>
                          {isEnforced ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1 text-xs">
                              <Check className="w-3.5 h-3.5" /> Enforced
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium flex items-center gap-1 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Before vs After Risk Comparison Bar */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Initial Threat */}
              <div
                className={`p-3 rounded-2xl border font-bold text-center min-w-[110px] shadow-xs ${
                  plan.initial_risk_level === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : plan.initial_risk_level === 'HIGH'
                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : plan.initial_risk_level === 'MEDIUM'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">
                  Initial Threat
                </div>
                <div className="text-2xl font-bold mt-0.5">
                  {plan.initial_risk_score}
                  <span className="text-xs font-normal opacity-70">/100</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5">{plan.initial_risk_level}</div>
              </div>

              {/* Arrow and Delta */}
              <div className="flex-1 md:w-56 text-center px-3">
                <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Threat Neutralization</span>
                </div>
                <div className="text-xs font-bold text-emerald-700 font-mono">
                  -{Math.round((plan.initial_risk_score - plan.mitigated_risk_score) * 10) / 10} pts ({plan.efficacy_percentage}%)
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-200">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${plan.efficacy_percentage}%` }}
                  />
                </div>
              </div>

              {/* Residual Risk */}
              <div
                className={`p-3 rounded-2xl border font-bold text-center min-w-[110px] shadow-xs ${
                  plan.residual_risk_level === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : plan.residual_risk_level === 'HIGH'
                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : plan.residual_risk_level === 'MEDIUM'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">
                  Residual Risk
                </div>
                <div className="text-2xl font-bold mt-0.5">
                  {plan.mitigated_risk_score}
                  <span className="text-xs font-normal opacity-70">/100</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5">{plan.residual_risk_level}</div>
              </div>
            </div>

            <div className="text-xs text-slate-500 md:text-right border-t md:border-t-0 border-slate-100 pt-2 md:pt-0 w-full md:w-auto">
              <div className="text-slate-800 font-semibold flex items-center md:justify-end gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Simulation Sandbox Active</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {plan.enforced_actions} of {plan.total_actions} countermeasures verified blocked
              </div>
            </div>
          </div>

          {/* Verified Resolution Celebration Banner */}
          {plan.enforced_actions === plan.total_actions && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Incident Remediated — Full Threat Neutralization Verified</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                      100% Contained
                    </span>
                  </h3>
                  <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                    All defensive solution actions have been successfully executed and validated in the host-isolated sandbox emulator. Residual threat posture reduced to <strong>{plan.mitigated_risk_score}/100 ({plan.residual_risk_level})</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={downloadRemediationPlaybook}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
              >
                Export Incident Certificate
              </button>
            </div>
          )}

          {/* Posture Metrics Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Initial Threat Score */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
              <span className="text-xs text-slate-500 font-medium">Initial Threat Score</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{plan.initial_risk_score}</span>
                <span className="text-xs text-slate-400">/ 100</span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ml-auto ${
                    plan.initial_risk_level === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : plan.initial_risk_level === 'HIGH'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : plan.initial_risk_level === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {plan.initial_risk_level}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2">Unmitigated baseline score</div>
            </div>

            {/* Residual Risk */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
              <span className="text-xs text-slate-500 font-medium">Residual Risk</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{plan.mitigated_risk_score}</span>
                <span className="text-xs text-slate-400">/ 100</span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ml-auto ${
                    plan.residual_risk_level === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : plan.residual_risk_level === 'HIGH'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : plan.residual_risk_level === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {plan.residual_risk_level}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                {plan.enforced_actions === plan.total_actions
                  ? 'All countermeasures active'
                  : `${plan.total_actions - plan.enforced_actions} actions pending simulation`}
              </div>
            </div>

            {/* Mitigation Effectiveness */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
              <span className="text-xs text-slate-500 font-medium">Mitigation Effectiveness</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-700">{plan.efficacy_percentage}%</span>
                <span className="text-xs text-slate-500 ml-auto">Threat neutralized</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 border border-slate-200">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${plan.efficacy_percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Simulation Status */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
              <span className="text-xs text-slate-500 font-medium">Simulation Status</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {plan.enforced_actions} <span className="text-sm text-slate-400 font-normal">/ {plan.total_actions}</span>
                </span>
                <ShieldCheck className="w-5 h-5 text-indigo-600 ml-auto" />
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                {plan.enforced_actions === plan.total_actions ? 'Full fleet containment verified' : 'Simulation in progress'}
              </div>
            </div>
          </div>

          {/* Action Control Bar */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-wrap items-center justify-between gap-4">
            {/* Category Filter Pills & Selection helpers */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-slate-400 mr-1 text-[11px] font-mono">Filter:</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      categoryFilter === cat
                        ? 'bg-slate-900 text-white font-semibold border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                    }`}
                  >
                    {cat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 pl-2 border-l border-slate-200">
                <button
                  onClick={handleSelectAll}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  onClick={handleDeselectAll}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Deselect
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowRulesModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200 shadow-xs transition-colors"
              >
                <FileCode className="w-4 h-4 text-indigo-600" />
                <span>Export Rulesets</span>
              </button>

              <button
                onClick={handleReset}
                disabled={loading || executingAll || executingSelected}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200 shadow-xs transition-colors"
                title="Reset simulation to initial proposed state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Posture</span>
              </button>

              {/* Simulate Selected Button */}
              {selectedUnenforcedCount > 0 && selectedUnenforcedCount < plan.total_actions && (
                <button
                  onClick={handleExecuteSelected}
                  disabled={executingSelected || executingAll}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {executingSelected ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Simulating ({selectedUnenforcedCount})...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Simulate Selected ({selectedUnenforcedCount})</span>
                    </>
                  )}
                </button>
              )}

              {/* Simulate Full Containment Button */}
              <button
                onClick={handleExecuteAll}
                disabled={executingAll || executingSelected || plan.enforced_actions === plan.total_actions}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                  plan.enforced_actions === plan.total_actions
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {executingAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Simulation Deck...</span>
                  </>
                ) : plan.enforced_actions === plan.total_actions ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>All Solutions Verified & Active</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Apply Complete Solution (Execute All)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Content Grid: Countermeasure Deck + Real-time Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Countermeasure Cards (7 cols on large) */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Displaying {filteredActions.length} of {plan.actions.length} defensive solutions</span>
                <span className="font-mono text-[11px] text-indigo-600">Deterministic EDR & Firewall simulation</span>
              </div>

              {filteredActions.map((action) => {
                const isEnforced = action.status === 'VERIFIED_BLOCKED';
                const isCurrentExecuting = executingActionId === action.id;
                const isSelected = selectedActionIds.has(action.id);

                const catBadgeColor =
                  action.category === 'SANDBOX_ISOLATION'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : action.category === 'ACCESS_REVOCATION'
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : action.category === 'CONTINUOUS_MONITORING'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : action.category === 'PAYLOAD_NEUTRALIZATION'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : action.category === 'NETWORK_CONTAINMENT'
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : action.category === 'PROCESS_TERMINATION'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : action.category === 'SIGNATURE_DEPLOYMENT'
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <div
                    key={action.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs ${
                      isEnforced
                        ? 'border-emerald-300 bg-white ring-1 ring-emerald-200'
                        : isSelected
                        ? 'border-indigo-300 bg-white'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {/* Selection Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleSelectAction(action.id)}
                          className="mt-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title={isSelected ? 'Deselect action' : 'Select action'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>

                        <div>
                          <div className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            <span>Recommended Remediation Action</span>
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">{action.title}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto pl-6 sm:pl-0">
                        <span className={`text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full border ${catBadgeColor}`}>
                          {action.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          -{action.risk_reduction} Pts
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed pl-6">{action.description}</p>

                    {/* What this solves callout */}
                    <div className="mt-2.5 ml-6 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-start gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="text-slate-600 leading-snug text-[11px]">
                        <strong className="text-slate-900 font-semibold">Remediation Value: </strong>
                        {getActionSolutionRationale(action)}
                      </span>
                    </div>

                    {/* Target identifier */}
                    <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 pl-6">
                      <span className="font-semibold text-slate-700">Target Indicator:</span>
                      <span className="font-mono text-slate-800 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                        {action.target}
                      </span>
                    </div>

                    {/* Rule Syntax Box */}
                    <div className="mt-3 relative ml-6">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap overflow-x-auto max-h-36">
                        {action.rule_syntax}
                      </div>
                      <button
                        onClick={() => copyToClipboard(action.rule_syntax, action.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs transition-colors cursor-pointer border border-slate-200 shadow-xs"
                        title="Copy policy syntax"
                      >
                        {copiedId === action.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Footer with Execution Status & Button */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between ml-6">
                      <div className="flex items-center gap-2 text-xs">
                        {isEnforced ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                            <CheckCircle className="w-4 h-4" />
                            <span>SOLUTION ENFORCED & VERIFIED IN SANDBOX</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            <span>Pending Sandbox Simulation</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setInspectAction(action)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-xs"
                        >
                          Details
                        </button>

                        <button
                          onClick={() => handleExecuteAction(action)}
                          disabled={isEnforced || isCurrentExecuting}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                            isEnforced
                              ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-default'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {isCurrentExecuting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Simulating in Sandbox...</span>
                            </>
                          ) : isEnforced ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Enforced (Sandbox)</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Simulate Action</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Terminal & Simulation Console (5 cols on large) */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-slate-800">ARGUS Live Containment Terminal</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(terminalLogs.join('\n'));
                      setCopiedId('term-logs');
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    {copiedId === 'term-logs' ? 'Logs Copied!' : 'Copy Logs'}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => setTerminalLogs([])}
                    className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Terminal Box */}
              <div className="rounded-2xl border border-slate-800 bg-[#0c0e12] shadow-xl overflow-hidden flex flex-col h-[580px]">
                {/* Terminal Header */}
                <div className="h-8 bg-[#15171d] border-b border-[#232630] px-3.5 flex items-center justify-between select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold tracking-wide">
                    argus-defense-kernel // virtual-sandbox-soc (host-isolated)
                  </span>
                  <div className="w-8"></div>
                </div>

                {/* Terminal Body */}
                <div className="flex-1 p-3.5 font-mono text-[11px] overflow-y-auto space-y-1 text-slate-300 leading-relaxed selection:bg-indigo-500/30 selection:text-white">
                  <div className="text-slate-500 pb-2 border-b border-[#1c1f26] text-[10px]">
                    Project ARGUS Automated Response Orchestrator v1.0 [Ready]
                  </div>

                  {terminalLogs.map((log, idx) => {
                    const isError = log.includes('[ERROR]');
                    const isSuccess = log.includes('100% BLOCKED') || log.includes('NEUTRALIZED') || log.includes('ENFORCED') || log.includes('QUARANTINED') || log.includes('COMPLETE') || log.includes('VERIFIED');
                    const isDispatch = log.includes('DISPATCH') || log.includes('POLICY-INJECT') || log.includes('ENFORCING');

                    return (
                      <div
                        key={idx}
                        className={`${
                          isError
                            ? 'text-rose-400 font-bold'
                            : isSuccess
                            ? 'text-emerald-400 font-semibold'
                            : isDispatch
                            ? 'text-indigo-300'
                            : 'text-slate-300'
                        }`}
                      >
                        {log}
                      </div>
                    );
                  })}
                  <div ref={terminalEndRef} />
                </div>

                {/* Terminal Status Footer */}
                <div className="h-7 bg-[#0e1014] border-t border-[#1c1f26] px-3.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>VIRTUAL SANDBOX EMULATOR: ACTIVE (Host Isolated)</span>
                  </div>
                  <span>{terminalLogs.length} EVENTS RECORDED</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200/80 bg-white">
          No active investigation found. Select an investigation from the selector or upload a sample.
        </div>
      )}

      {/* Ruleset Export Modal */}
      {showRulesModal && plan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  ARGUS Exportable Defense Rulesets
                </h2>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs">
              <button
                onClick={() => setActiveRuleTab('firewall')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  activeRuleTab === 'firewall'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900'
                }`}
              >
                Firewall / iptables Script
              </button>
              <button
                onClick={() => setActiveRuleTab('yara')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  activeRuleTab === 'yara'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900'
                }`}
              >
                Adaptive YARA Bundle
              </button>
              <button
                onClick={() => setActiveRuleTab('powershell')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  activeRuleTab === 'powershell'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900'
                }`}
              >
                IR PowerShell Playbook
              </button>
            </div>

            {/* Code Content */}
            <div className="relative">
              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto max-h-80 whitespace-pre">
                {activeRuleTab === 'firewall'
                  ? plan.generated_rules.firewall_script
                  : activeRuleTab === 'yara'
                  ? plan.generated_rules.yara_bundle
                  : plan.generated_rules.powershell_playbook}
              </pre>
              <button
                onClick={() =>
                  copyToClipboard(
                    activeRuleTab === 'firewall'
                      ? plan.generated_rules.firewall_script || ''
                      : activeRuleTab === 'yara'
                      ? plan.generated_rules.yara_bundle || ''
                      : plan.generated_rules.powershell_playbook || '',
                    'modal-copy'
                  )
                }
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer shadow border border-white/20"
              >
                {copiedId === 'modal-copy' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Ruleset</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Inspection & Remediation Execution Modal */}
      {inspectAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Execute Defensive Remediation (Host-Isolated Sandbox)</span>
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{inspectAction.title}</h3>
              </div>
              <button
                onClick={() => {
                  setInspectAction(null);
                  setExecutionResult(null);
                  setRemediationDetails(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Inspecting host OS & synthesizing sandbox remediation...</span>
              </div>
            ) : executionResult ? (
              /* REAL EXECUTION RESULTS VIEW */
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border ${
                  executionResult.status === 'SUCCESS'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : executionResult.status === 'BLOCKED'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      {executionResult.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>Execution Status: {executionResult.status}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/70 border border-current">
                      {executionResult.execution_type}
                    </span>
                  </div>
                  <div className="text-xs mt-2 font-mono text-slate-600">
                    Execution ID: <span className="text-slate-900 font-bold select-all">{executionResult.execution_id}</span>
                  </div>
                </div>

                {/* Score delta */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-sans">Initial Threat</span>
                    <span className="text-slate-900 font-bold text-sm">{executionResult.risk_score_before}/100</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 block font-sans">Reduction</span>
                    <span className="text-emerald-700 font-bold text-sm">-{executionResult.risk_reduction_achieved} Pts</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-sans">Residual Risk</span>
                    <span className="text-slate-900 font-bold text-sm">{executionResult.risk_score_after}/100</span>
                  </div>
                </div>

                {/* Actions Performed */}
                {executionResult.actions_performed.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions Performed:</span>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-700">
                      {executionResult.actions_performed.map((act, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Execution Logs */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Sandbox Execution Logs:</span>
                  <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                    {executionResult.execution_logs.join('\n')}
                  </pre>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setInspectAction(null);
                      setExecutionResult(null);
                      setRemediationDetails(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer hover:bg-slate-800"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              /* PRE-EXECUTION REVIEW & CONFIRMATION VIEW */
              <div className="space-y-4">
                {/* Threat and File Metadata Strip */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Target File:</span>
                    <span className="font-bold text-slate-900">{plan.sample_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Category:</span>
                    <span className="font-mono text-indigo-700 font-bold">{inspectAction.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Expected Reduction:</span>
                    <span className="font-bold text-emerald-700">-{inspectAction.risk_reduction} Pts</span>
                  </div>
                </div>

                {/* Remediation Rationale / Why Recommended */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-1">
                  <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Why this Remediation is Recommended:</span>
                  </span>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    {remediationDetails?.why_recommended || getActionSolutionRationale(inspectAction)}
                  </p>
                </div>

                {/* OS Target Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Execution Profile & Host OS Adaptation:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['macOS', 'Linux', 'Windows'] as const).map((os) => (
                      <button
                        key={os}
                        type="button"
                        onClick={() => setSelectedTargetOs(os)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedTargetOs === os
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {os}
                        {remediationDetails?.detected_os === os && (
                          <span className="block text-[9px] font-normal opacity-80">(Detected Host)</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {remediationDetails?.adapted_mechanism && (
                    <div className="text-[11px] text-slate-500 mt-1">
                      Adapted Control: <span className="font-semibold text-slate-800">{remediationDetails.adapted_mechanism}</span>
                    </div>
                  )}
                </div>

                {/* Proposed Sandbox Action */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Proposed Defensive Command (Executed in Isolated Sandbox):
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-950 text-indigo-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-36">
                    {remediationDetails?.os_rule_syntax || inspectAction.rule_syntax}
                  </pre>
                </div>

                {/* Explicit User Confirmation Checkbox */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmedExecution}
                      onChange={(e) => setConfirmedExecution(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-slate-800 text-[11px] leading-relaxed">
                      <strong>Explicit User Authorization:</strong> I have reviewed the proposed defensive action, target indicator, and expected risk reduction. Execute this countermeasure safely inside the host-isolated ARGUS virtual sandbox jail.
                    </span>
                  </label>
                </div>

                {/* Modal Footer Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setInspectAction(null);
                      setRemediationDetails(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteConfirmedRemediation}
                    disabled={!confirmedExecution || executingActionId === inspectAction.id}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                      confirmedExecution && executingActionId !== inspectAction.id
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {executingActionId === inspectAction.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing in Sandbox...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Execute Remediation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Remediation Execution History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Audited Remediation History (Neon Database)</span>
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Execution Audit Log for {plan.sample_name}</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {remediationHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No remediation executions recorded yet for this investigation. Select an action and click Execute Remediation.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {remediationHistory.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900">{item.action_title}</div>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        item.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {item.status} ({item.execution_type})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                      <span>OS: <strong>{item.detected_os}</strong></span>
                      <span>Target: <strong className="font-mono">{item.target_file}</strong></span>
                      <span>Risk: <strong>{item.risk_score_before} &rarr; {item.risk_score_after}</strong> (-{item.risk_reduction_achieved})</span>
                      <span>Time: <strong>{new Date(item.started_at).toLocaleTimeString()}</strong></span>
                    </div>
                    {item.execution_logs && item.execution_logs.length > 0 && (
                      <pre className="p-2.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-28 whitespace-pre-wrap">
                        {item.execution_logs.slice(0, 4).join('\n')}
                        {item.execution_logs.length > 4 && `\n... +${item.execution_logs.length - 4} more log lines`}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

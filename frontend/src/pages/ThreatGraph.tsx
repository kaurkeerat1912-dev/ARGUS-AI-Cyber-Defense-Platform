import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Network,
  RefreshCw,
  AlertTriangle,
  Activity,
  X,
  Shield,
  ChevronDown,
  Search,
  Clock,
  Layers,
  HelpCircle,
  FileCode,
  Globe,
  Terminal,
  HardDrive,
  Cpu,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import {
  AttackGraphData,
  GraphNodeData,
  GraphEdgeData,
  TimelineEvent,
  InvestigationSummary,
} from '../types';
import {
  FileNode,
  ProcessNode,
  NetworkNode,
  EventNode,
} from '../components/graph/CustomNodes';

interface ThreatGraphProps {
  investigationId: string | null;
  onNavigateToInvestigate: () => void;
  onNavigateToDefense?: (id: string) => void;
  onSelectInvestigation?: (id: string) => void;
}

export const ThreatGraph: React.FC<ThreatGraphProps> = ({
  investigationId: initialInvestigationId,
  onNavigateToInvestigate,
  onNavigateToDefense,
  onSelectInvestigation,
}) => {
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [currentInvId, setCurrentInvId] = useState<string | null>(initialInvestigationId);
  const [graphData, setGraphData] = useState<AttackGraphData | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<{ id: string; data: GraphNodeData } | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ id: string; source: string; target: string; label: string; data?: GraphEdgeData } | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STATIC' | 'PROCESS' | 'NETWORK' | 'FILESYSTEM' | 'DEFENSE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTimeline, setShowTimeline] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

  const nodeTypes = useMemo(
    () => ({
      fileNode: FileNode,
      processNode: ProcessNode,
      networkNode: NetworkNode,
      eventNode: EventNode,
    }),
    []
  );

  const loadGraph = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getGraph(id);
      setGraphData(data);
      setNodes(data.nodes as unknown as Node[]);
      setEdges(data.edges as unknown as Edge[]);
      setSelectedNode(null);
      setSelectedEdge(null);
    } catch (err: any) {
      console.error('Failed to load attack graph:', err);
      setError(err.message || 'Failed to load attack graph from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInvs = async () => {
      try {
        const invs = await api.getInvestigations({ limit: 50 });
        setInvestigations(invs);
      } catch (err) {
        console.error('Failed to load investigations in graph:', err);
      }
    };
    fetchInvs();
  }, []);

  useEffect(() => {
    if (initialInvestigationId !== currentInvId) {
      setCurrentInvId(initialInvestigationId);
    }
  }, [initialInvestigationId]);

  useEffect(() => {
    if (currentInvId) {
      loadGraph(currentInvId);
    } else {
      setGraphData(null);
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  }, [currentInvId]);

  const handleSelectInvestigationChange = (id: string) => {
    setCurrentInvId(id);
    if (onSelectInvestigation) {
      onSelectInvestigation(id);
    }
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onNodeClick = (_: any, node: Node) => {
    setSelectedEdge(null);
    setSelectedNode({ id: node.id, data: node.data as unknown as GraphNodeData });
  };

  const onEdgeClick = (_: any, edge: Edge) => {
    setSelectedNode(null);
    setSelectedEdge({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: (edge.label as string) || 'CONNECTED_TO',
      data: edge.data as unknown as GraphEdgeData,
    });
  };

  const handleSimulate = async () => {
    if (!currentInvId) return;
    try {
      setSimulating(true);
      await api.simulateTelemetry(currentInvId);
      await loadGraph(currentInvId);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  // Filter nodes by category / type and search query
  const displayedNodes = useMemo(() => {
    return nodes.filter((n) => {
      const d = n.data as unknown as GraphNodeData;
      let matchesFilter = true;
      if (activeFilter === 'STATIC') {
        matchesFilter =
          d.category === 'INITIAL_EVIDENCE' ||
          d.category === 'STATIC_ANALYSIS' ||
          d.category === 'THREAT_INTELLIGENCE';
      } else if (activeFilter === 'PROCESS') {
        matchesFilter =
          n.type === 'processNode' ||
          d.entity_type === 'PROCESS' ||
          d.entity_type === 'ENTRY_POINT';
      } else if (activeFilter === 'NETWORK') {
        matchesFilter =
          n.type === 'networkNode' ||
          d.entity_type === 'NETWORK' ||
          d.entity_type === 'IOC';
      } else if (activeFilter === 'FILESYSTEM') {
        matchesFilter =
          d.entity_type === 'FILESYSTEM' ||
          d.entity_type === 'PERSISTENCE';
      } else if (activeFilter === 'DEFENSE') {
        matchesFilter = d.category === 'DEFENSIVE_RESPONSE';
      }

      const matchesSearch =
        searchQuery === '' ||
        d.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.sublabel && d.sublabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.details && d.details.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesFilter && matchesSearch;
    });
  }, [nodes, activeFilter, searchQuery]);

  const displayedNodeIds = useMemo(() => new Set(displayedNodes.map((n) => n.id)), [displayedNodes]);
  const displayedEdges = useMemo(() => {
    return edges.filter((e) => displayedNodeIds.has(e.source) && displayedNodeIds.has(e.target));
  }, [edges, displayedNodeIds]);

  const selectedInv = investigations.find((i) => i.id === currentInvId);

  if (!currentInvId) {
    return (
      <div className="text-center py-24 space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-indigo-400">
          <Network className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Select an Investigation to View Attack Reconstruction</h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose a completed forensic investigation from the dropdown below or run a new forensic scan to reconstruct its full causal attack chain.
          </p>
        </div>
        {investigations.length > 0 && (
          <div className="pt-2 max-w-xs mx-auto">
            <select
              value=""
              onChange={(e) => handleSelectInvestigationChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer w-full"
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
        <div className="pt-2">
          <button
            onClick={onNavigateToInvestigate}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer shadow-md shadow-indigo-950/40"
          >
            Scan New File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & CONTROLS TOOLBAR                          */}
      {/* ======================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-400" />
              <span>Graph-Based Threat & Attack-Chain Reconstruction</span>
            </h1>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              NetworkX Causal Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hierarchical causal graph spanning Initial Evidence, Static Forensics, Threat Intelligence, and Defensive Posture.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Target Sample Switcher */}
          {investigations.length > 0 && (
            <div className="relative">
              <select
                value={currentInvId || ''}
                onChange={(e) => handleSelectInvestigationChange(e.target.value)}
                className="bg-slate-950/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none max-w-[200px] sm:max-w-[260px] truncate"
              >
                <option value="" disabled>-- Select Investigation --</option>
                {investigations.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.original_name} ({inv.risk_score}/100 • {inv.risk_level})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          )}

          {/* Inject Demo Telemetry Button */}
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold cursor-pointer shrink-0 transition-all"
            title="Inject simulated dynamic VM execution telemetry"
          >
            {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
            <span>{simulating ? 'Injecting Telemetry...' : 'Inject Demo Telemetry'}</span>
          </button>

          {/* Toggle Timeline */}
          <button
            onClick={() => setShowTimeline((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shrink-0 transition-colors ${
              showTimeline
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>

          {/* Defensive Simulation link */}
          {onNavigateToDefense && currentInvId && (
            <button
              onClick={() => onNavigateToDefense(currentInvId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer border border-slate-700 shrink-0 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Defense</span>
            </button>
          )}
        </div>
      </div>

      {/* Missing Evidence Disclaimer / Simulation Prompt */}
      {graphData?.missing_evidence_notes && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/60 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Validated Static Forensic Topology Active</span>
              <span className="text-[11px] text-amber-300/80">{graphData.missing_evidence_notes}</span>
            </div>
          </div>
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 cursor-pointer shadow-sm transition-all"
          >
            Inject Demo Telemetry →
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SEARCH BAR & CATEGORY FILTER TABS                     */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes by title, type, or details..."
            className="w-full px-3 py-1.5 pl-8 rounded-lg bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
          {[
            { id: 'ALL' as const, label: `All (${nodes.length})` },
            { id: 'STATIC' as const, label: 'Static Evidence' },
            { id: 'PROCESS' as const, label: 'Processes' },
            { id: 'NETWORK' as const, label: 'Network C2' },
            { id: 'FILESYSTEM' as const, label: 'Filesystem' },
            { id: 'DEFENSE' as const, label: 'Defensive Actions' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all text-xs shrink-0 ${
                activeFilter === f.id
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN INTERACTIVE REACT FLOW GRAPH CANVAS              */}
      {/* ======================================================== */}
      <div className="relative h-[640px] rounded-2xl border border-slate-800 bg-[#0a0d14] overflow-hidden shadow-2xl">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-xs text-slate-400">Reconstructing causal attack topology...</span>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-xs text-rose-400">
            {error}
          </div>
        ) : (
          <ReactFlow
            nodes={displayedNodes}
            edges={displayedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2.0}
          >
            <Background color="#1e293b" gap={22} size={1} />
            <Controls className="!bg-slate-900 !border-slate-800 !fill-white" />
          </ReactFlow>
        )}

        {/* Floating Quick Legend Toggle Button */}
        <button
          onClick={() => setShowLegend((prev) => !prev)}
          className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md cursor-pointer transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>{showLegend ? 'Hide Legend' : 'Legend'}</span>
        </button>

        {/* Graph Legend Panel */}
        {showLegend && (
          <div className="absolute top-14 left-4 p-4 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-800 text-xs shadow-2xl z-20 max-w-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white tracking-wide">Graph Legend & Colors</span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Colors Mapping */}
            <div className="space-y-1.5 text-[11px]">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Semantic Colors</div>
              <div className="space-y-1 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>Green: Observed Ground-Truth Evidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span>Yellow: Inferred Heuristic Link</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shrink-0" />
                  <span>Purple: Suspicious Activity / Persistence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                  <span>Red: Critical Threat / Exploit Trigger</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                  <span>Orange: Simulated Sandbox Telemetry</span>
                </div>
              </div>
            </div>

            {/* Edge Style Key */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Relationship Lines</div>
              <div className="space-y-1 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-emerald-400 shrink-0" />
                  <span>Solid Line: Observed Fact</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-amber-400 border-t border-dashed border-amber-400 shrink-0" />
                  <span>Dashed Line: Inferred Connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-orange-400 border-t-2 border-dashed border-orange-400 shrink-0" />
                  <span>Dotted Line: Simulated Action</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SELECTED NODE INFORMATION DRAWER                         */}
        {/* ======================================================== */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-84 sm:w-96 p-5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 text-xs shadow-2xl z-20 space-y-4 max-h-[580px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Node Forensic Inspector</span>
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Entity Label</div>
              <div className="font-bold text-white text-base mt-0.5 break-all">{selectedNode.data.label}</div>
              {selectedNode.data.sublabel && (
                <div className="text-xs text-indigo-300 font-mono mt-0.5">{selectedNode.data.sublabel}</div>
              )}
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-[10px]">
                {selectedNode.data.badge || 'Forensic Entity'}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  selectedNode.data.observation_status === 'SIMULATED'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    : selectedNode.data.observation_status === 'INFERRED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {selectedNode.data.observation_status || 'OBSERVED'}
              </span>

              {selectedNode.data.severity && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    selectedNode.data.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : selectedNode.data.severity === 'HIGH'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {selectedNode.data.severity}
                </span>
              )}
            </div>

            {/* Forensic Source and Confidence */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Evidence Source</span>
                <span className="text-white font-medium">{selectedNode.data.evidence_source || 'Static Extraction'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Confidence</span>
                <span className="text-white font-mono font-semibold">
                  {selectedNode.data.confidence ? `${(selectedNode.data.confidence * 100).toFixed(0)}%` : '100%'}
                </span>
              </div>
            </div>

            {/* Description / Forensic Details */}
            {selectedNode.data.details && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Forensic Explanation</span>
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed break-all">
                  {selectedNode.data.details}
                </div>
              </div>
            )}

            {/* Node ID */}
            <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800 flex items-center justify-between">
              <span>Node ID: {selectedNode.id}</span>
              {selectedNode.data.timestamp && (
                <span>Time: {new Date(selectedNode.data.timestamp).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SELECTED EDGE INFORMATION DRAWER                         */}
        {/* ======================================================== */}
        {selectedEdge && (
          <div className="absolute top-4 right-4 w-84 sm:w-96 p-5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 text-xs shadow-2xl z-20 space-y-4 max-h-[580px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Relationship Inspector</span>
              </span>
              <button
                onClick={() => setSelectedEdge(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Relationship Type</div>
              <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                {selectedEdge.label || selectedEdge.data?.relationship_type || 'CONNECTED_TO'}
              </div>
              <div className="text-xs text-slate-300 font-mono mt-1 flex items-center gap-1.5">
                <span className="truncate">{selectedEdge.source}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{selectedEdge.target}</span>
              </div>
            </div>

            {/* Observation Status */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  selectedEdge.data?.observation_status === 'SIMULATED'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    : selectedEdge.data?.observation_status === 'INFERRED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {selectedEdge.data?.observation_status || 'OBSERVED'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Confidence: {selectedEdge.data?.confidence ? `${(selectedEdge.data.confidence * 100).toFixed(0)}%` : '100%'}
              </span>
            </div>

            {/* Why This Relationship Exists */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Why This Link Exists</span>
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                {selectedEdge.data?.description ||
                  'Directed causal link established between evidence entities based on structural parsing or telemetry correlation.'}
              </div>
            </div>

            {/* Supporting Evidence */}
            {selectedEdge.data?.supporting_evidence && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Supporting Forensic Evidence</span>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-[11px] text-indigo-300 break-all">
                  {selectedEdge.data.supporting_evidence}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. CHRONOLOGICAL ATTACK TIMELINE PANEL                   */}
      {/* ======================================================== */}
      {showTimeline && graphData?.timeline && graphData.timeline.length > 0 && (
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-white">Chronological Attack & Forensic Progression</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {graphData.timeline.length} Sequenced Milestones
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {graphData.timeline.map((evt: TimelineEvent, idx: number) => {
              const isSim = evt.status === 'SIMULATED';
              const isInferred = evt.status === 'INFERRED';
              const isCrit = evt.severity === 'CRITICAL';
              const isHigh = evt.severity === 'HIGH';

              return (
                <div
                  key={evt.id || idx}
                  onClick={() => {
                    if (evt.node_id) {
                      const targetNode = nodes.find((n) => n.id === evt.node_id);
                      if (targetNode) {
                        setSelectedNode({ id: targetNode.id, data: targetNode.data as unknown as GraphNodeData });
                      }
                    }
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono font-bold text-indigo-400">
                      Step {idx + 1} • {evt.phase}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                        isSim
                          ? 'bg-orange-500/20 text-orange-300'
                          : isInferred
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {evt.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  {evt.timestamp && (
                    <div className="text-[10px] text-slate-500 font-mono pt-1.5 border-t border-slate-800/80">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Narrative Card */}
      {graphData?.summary && (
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md text-xs space-y-1.5">
          <div className="font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Reconstructed Threat Narrative</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{graphData.summary}</p>
        </div>
      )}
    </div>
  );
};

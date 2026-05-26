import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  FileText, 
  AlertTriangle, 
  Clock, 
  MousePointer2, 
  Hand,
  ChevronDown,
  ChevronUp,
  Sliders,
  Maximize2,
  TrendingDown,
  Activity,
  CheckCircle2,
  Lock,
  ArrowLeft
} from 'lucide-react';
import * as d3Selection from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { SectionTitle } from '../components/UI';

// --- DATA ---
const MATRIX_ROWS = [
  { id: 'SYS-01', name: 'GENERATION', eq: 'eq-01', expect: '102 MW', report: '102 MW', delta: '0.0%', sev: 0.1, trace: [1,1,1,1,1,1,1,1,1,1,1,1], route: 'WATCH' },
  { id: 'SYS-02', name: 'FUEL GAS', eq: 'eq-02', expect: '111 MMcm', report: '96 MMcm', delta: '-13.5%', sev: 0.65, trace: [1,1,2,1,2,2,3,2,2,1,2,3], route: 'VERIFY' },
  { id: 'SYS-03', name: 'EMISSIONS', eq: 'eq-03', expect: '115 T', report: '92 T', delta: '-20.0%', sev: 0.9, trace: [1,1,2,2,2,2,3,2,2,3,2,3], route: 'ESCALATE' },
  { id: 'SYS-04', name: 'SCADA MWh', eq: 'eq-04', expect: '102 MW', report: '118 MW', delta: '+15.7%', sev: 0.72, trace: [1,2,2,1,2,2,2,1,3,2,3,3], route: 'VERIFY' },
  { id: 'SYS-05', name: 'DISPATCH', eq: 'eq-05', expect: '103 MW', report: '121 MW', delta: '+17.5%', sev: 0.78, trace: [1,1,1,2,2,2,2,1,3,2,3,3], route: 'VERIFY' },
  { id: 'SYS-06', name: 'FINANCE INV', eq: 'eq-06', expect: '104 BN', report: '126 BN', delta: '+21.2%', sev: 0.95, trace: [0,0,1,1,2,2,3,3,2,3,3,3], route: 'ESCALATE' },
];

const NARRATIVE = [
  { section: 'AI Pattern Match', text: 'System cross-referenced 5 data sources: SCADA generation logs (+15.7%) and fuel consumption baseline (-13.5%) show physically irreconcilable deviation. Current operating pattern matches confirmed overproduction violation cases (similarity 0.87, 95% CI: 0.82-0.92) — classified as high-risk behavior pattern.' },
  { section: 'AI Attribution', text: 'Heat-rate and carbon-emissions physical triangle verification confirms output data validity is questionable. Financial invoice anomalies, SCADA time-series mutations, and equipment procurement records triangulate to unreported capacity expansion (posterior probability 0.85). Derived by 6-Agent Bayesian ensemble.' },
  { section: 'Warning & Recommendation', text: '68% probability of safety incident (equipment overload / emissions exceedance) within 90 days. Recommend on-site inspection of Turbine Units 1-4 within 72H; freeze approval workflows concurrently. Similar historical cases accumulated 240M KZT in fines.' }
];

const WORKFLOW_DATA = {
  heat_rate: [0, 0, 1, 0, 1, 2, 3, 2, 2, 1, 2, 3],
  carbon: [0, 0, 1, 1, 2, 2, 2, 2, 3, 2, 2, 3],
  tariff: [0, 0, 0, 1, 1, 2, 2, 3, 3, 2, 3, 3],
  cap: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  dispatch: [0, 1, 1, 1, 2, 2, 2, 1, 3, 2, 3, 3]
};

// --- STYLES ---
const COLORS = {
  BG: '#F4F6FA',
  PANEL: '#FFFFFF',
  GRID: '#E2E7EF',
  SOFT: '#FAFBFD',
  INK: '#0F1722',
  TEXT: '#1A2330',
  MUTED: '#6A7686',
  BLUE: '#2D6CDF',
  TEAL: '#2AB3A6',
  GREEN: '#2FA862',
  AMBER: '#E89518',
  RED: '#D8454C',
  ROSE: '#B23A6A',
};

const StatusChip = ({ status }: { status: string }) => {
  const color = status === 'CORE' ? COLORS.BLUE : status === 'WARN' ? COLORS.AMBER : COLORS.RED;
  return (
    <div className="px-1 py-0.5 rounded-[2px] transition-all" style={{ backgroundColor: `${color}15`, border: `0.5px solid ${color}30` }}>
      <span className="text-[7.5px] font-bold uppercase tracking-wider" style={{ color }}>{status}</span>
    </div>
  );
};

const TraceDots = ({ trace }: { trace: number[] }) => {
  return (
    <div className="flex items-center gap-1">
      {trace.map((t, i) => {
        const color = t === 0 ? '#DDE3EC' : t === 1 ? COLORS.GREEN : t === 2 ? COLORS.AMBER : COLORS.RED;
        return (
          <div key={i} className="relative flex items-center justify-center">
            {t === 3 && (
              <div className="absolute w-[12px] h-[12px] border border-dashed border-status-critical rounded-full animate-pulse" />
            )}
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          </div>
        );
      })}
    </div>
  );
};

export default function EnterpriseReporting() {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow'>('overview');
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const [isMatrixExpanded, setIsMatrixExpanded] = useState(false);
  const navigate = useNavigate();

  // d3-zoom implementation for Identity Graph
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current || !isGraphExpanded) return;
    const svg = d3Selection.select(svgRef.current);
    const content = svg.select('g.zoom-container');

    const zoomBehavior = d3Zoom.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        content.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoomBehavior as any);
    svg.call(zoomBehavior.transform as any, d3Zoom.zoomIdentity.translate(80, 40).scale(1.2));
  }, [isGraphExpanded]);

  const handleTabChange = (tab: 'overview' | 'workflow') => {
    setActiveTab(tab);
  };

  const ID_GRAPH_NODES = [
    { id: 'GEN', x: 404, y: 740 - 538, title: 'GENERATION TRUTH', sub: 'AI baseline · 102 MW', value: '102', accent: COLORS.BLUE, status: 'CORE' },
    { id: 'FUEL', x: 160, y: 855 - 538, title: 'FUEL GAS · UNG', sub: 'implied 111 / submitted 96', value: '-13.5%', accent: COLORS.AMBER, status: 'WARN' },
    { id: 'EMIT', x: 640, y: 855 - 538, title: 'EMISSIONS · MOE', expected: 115, disclosed: 92, sub: 'expected 115 / disclosed 92', value: '-20.0%', accent: COLORS.RED, status: 'CRITICAL' },
    { id: 'SCADA', x: 160, y: 622 - 538, title: 'SCADA MWh · KEGOC', sub: 'logged 118 / expected 102', value: '+15.7%', accent: COLORS.AMBER, status: 'WARN' },
    { id: 'DISP', x: 640, y: 622 - 538, title: 'DISPATCH · SO', sub: 'declared 121 / expected 103', value: '+17.5%', accent: COLORS.AMBER, status: 'WARN' },
    { id: 'FIN', x: 840, y: 740 - 538, title: 'FINANCE INV', sub: 'billed 126 / expected 104', value: '+21.2%', accent: COLORS.RED, status: 'CRITICAL' },
    { id: 'PERMIT', x: 36, y: 740 - 538, title: 'PERMIT CAP', sub: 'cap 100 / util 118', value: '+18.0%', accent: COLORS.RED, status: 'CRITICAL' },
    { id: 'ENT', x: 360, y: 928 - 538, title: 'ENT-KZ-AKT-0091', sub: 'Western Caspian Energy LLC', value: '—', accent: COLORS.INK, status: '', isEnt: true },
  ];

  const ID_GRAPH_EDGES = [
    { from: 'GEN', to: 'FUEL', label: 'Eq-1 heat-rate', value: '-13.5%', color: COLORS.AMBER, weight: 1.8, dashed: false, curve: 0 },
    { from: 'FUEL', to: 'EMIT', label: 'Eq-2 carbon factor', value: '-20.0%', color: COLORS.RED, weight: 2.0, dashed: false, curve: 0 },
    { from: 'GEN', to: 'EMIT', label: 'Eq-3 expected CO₂', value: '-20.0%', color: COLORS.RED, weight: 2.0, dashed: true, curve: -0.25 },
    { from: 'GEN', to: 'SCADA', label: 'Eq-4 dispatch↔SCADA', value: '+15.7%', color: COLORS.AMBER, weight: 1.6, dashed: false, curve: 0 },
    { from: 'GEN', to: 'DISP', label: 'Eq-5 dispatch parity', value: '+17.5%', color: COLORS.AMBER, weight: 1.6, dashed: false, curve: 0 },
    { from: 'GEN', to: 'FIN', label: 'Eq-6 tariff × MW', value: '+21.2%', color: COLORS.RED, weight: 2.0, dashed: false, curve: 0 },
    { from: 'GEN', to: 'PERMIT', label: 'Eq-7 cap vs util', value: '+18.0%', color: COLORS.RED, weight: 1.9, dashed: false, curve: 0 },
    { from: 'ENT', to: 'GEN', label: 'reports to', value: '—', color: COLORS.MUTED, weight: 0.9, dashed: true, curve: 0 },
  ];

  const getNodeCenter = (id: string) => {
    const node = ID_GRAPH_NODES.find(n => n.id === id);
    if (!node) return { x: 0, y: 0 };
    const w = node.isEnt ? 270 : (id === 'FIN' ? 140 : (id === 'PERMIT' ? 130 : (id === 'FUEL' || id === 'EMIT' ? 190 : 180)));
    const h = node.isEnt ? 24 : 58;
    return { x: node.x + w / 2, y: node.y + h / 2 };
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6FA] text-text-primary font-sans overflow-hidden">
      {/* 1 · TOP BAR */}
      <div className="h-10 border-b border-[#E2E7EF] bg-white flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1 text-[10px] font-bold text-text-tertiary hover:text-text-primary uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={12} /> Back
          </button>
          <div className="w-px h-3 bg-[#E2E7EF]" />
          <span className="text-[11px] font-bold uppercase tracking-tight text-[#0F1722]">Western Caspian Cross-System Verification</span>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center bg-[#EEF2F8] rounded-full p-0.5 border border-[#E2E7EF]">
          <button 
            onClick={() => handleTabChange('overview')}
            className={cn(
              "px-5 py-1 text-[9px] font-bold rounded-full transition-all flex items-center gap-1.5",
              activeTab === 'overview' ? "bg-[#0F1722] text-white" : "text-[#6A7686]"
            )}
          >
            EVIDENCE PILLARS
          </button>
          <button 
            onClick={() => handleTabChange('workflow')}
            className={cn(
              "px-5 py-1 text-[9px] font-bold rounded-full transition-all flex items-center gap-1.5",
              activeTab === 'workflow' ? "bg-[#0F1722] text-white" : "text-[#6A7686]"
            )}
          >
            COMPUTE WORKFLOW
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-[#0F1722] text-white text-[8px] font-bold rounded-[3px]">CASE-2026-001</div>
          <div className="px-2 py-0.5 bg-[#D8454C] text-white text-[8px] font-bold rounded-[3px]">SIMILARITY 0.87</div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#F5F7FA]">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-[1200px] mx-auto"
            >
              {/* Executive Verdict Hero Card */}
              <div className="bg-[#1A1E23] text-white p-6 rounded-md shadow-md border-b-2 border-status-critical">
                <div className="flex justify-between items-start gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">
                      <ShieldCheck size={14} className="text-white/72" /> AI Cross-System Reconciliation Verdict
                    </div>
                    <h2 className="text-[20px] font-black tracking-tight leading-tight uppercase">
                      Cross-system evidence confirms high-risk behavior pattern at Western Caspian Energy (ENT-0091)
                    </h2>
                    <p className="text-[12px] text-white/72 mt-2 max-w-[800px] leading-relaxed">
                      Reconciliation matrix has flagged physically irreconcilable deviations across 5 separate systems. The joint data signature indicates high-confidence capacity concealment and unreported production expansions (posterior probability 0.85).
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 text-right">
                    <span className="text-[8px] text-white/50 font-bold uppercase tracking-wider">Similarity Score</span>
                    <span className="text-[32px] font-black text-status-critical leading-none tabular-nums mt-1">0.87</span>
                    <span className="text-[9px] text-[#2FA862] font-bold mt-1 font-mono uppercase bg-[#2FA862]/10 px-1.5 py-0.5 rounded-sm">95% CI: 0.82 - 0.92</span>
                  </div>
                </div>
              </div>

              {/* The 4 Mismatch Evidence Columns Grid */}
              <div>
                <SectionTitle>4 Core Cross-System Mismatch Pillars</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Pillar 1: SCADA vs Self-Reporting */}
                  <div className="bg-white border border-border-default p-4 rounded-md shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Pillar 1: Physical</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-status-warning/10 text-status-warning rounded-sm">Mismatch</span>
                      </div>
                      <h4 className="text-[13px] font-bold text-text-primary leading-tight mb-2">SCADA vs Self-Reporting</h4>
                      <p className="text-[11px] leading-relaxed text-text-secondary font-medium">
                        SCADA telemetry logs real-time generation outputs at <span className="font-bold text-text-primary">118 MW</span>, while company self-reported gas consumption is only <span className="font-bold text-text-primary">96 MMcm</span> (expected <span className="font-bold text-text-primary">111 MMcm</span>).
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border-default flex justify-between items-end">
                      <span className="text-[8px] text-text-tertiary font-bold uppercase">Deviation</span>
                      <span className="text-[14px] font-black text-status-warning font-mono">+15.7% Gen / -13.5% Gas</span>
                    </div>
                  </div>

                  {/* Pillar 2: License Cap Exceedance */}
                  <div className="bg-white border border-border-default p-4 rounded-md shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Pillar 2: Permit</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-status-critical/10 text-status-critical rounded-sm">Breach</span>
                      </div>
                      <h4 className="text-[13px] font-bold text-text-primary leading-tight mb-2">Permit License Exceedance</h4>
                      <p className="text-[11px] leading-relaxed text-text-secondary font-medium">
                        The facility operates at an active load of <span className="font-bold text-text-primary">118 MW</span>, directly exceeding their legally approved ministerial permit limit of <span className="font-bold text-text-primary">100 MW</span>.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border-default flex justify-between items-end">
                      <span className="text-[8px] text-text-tertiary font-bold uppercase">Exceedance</span>
                      <span className="text-[14px] font-black text-status-critical font-mono">+18.0% Over Limit</span>
                    </div>
                  </div>

                  {/* Pillar 3: Commercial Billing Discrepancy */}
                  <div className="bg-white border border-border-default p-4 rounded-md shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Pillar 3: Fiscal</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-status-critical/10 text-status-critical rounded-sm">Discrepancy</span>
                      </div>
                      <h4 className="text-[13px] font-bold text-text-primary leading-tight mb-2">Invoice Billing Discrepancy</h4>
                      <p className="text-[11px] leading-relaxed text-text-secondary font-medium">
                        Outgoing financial billing invoices claim commercial transactions equivalent to <span className="font-bold text-text-primary">126 Billion KZT</span>, compared to their nominal declared baseline of <span className="font-bold text-text-primary">104 Billion KZT</span>.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border-default flex justify-between items-end">
                      <span className="text-[8px] text-text-tertiary font-bold uppercase">Discrepancy</span>
                      <span className="text-[14px] font-black text-status-critical font-mono">+21.2% Billing Vol</span>
                    </div>
                  </div>

                  {/* Pillar 4: Emission Under-reporting */}
                  <div className="bg-white border border-border-default p-4 rounded-md shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Pillar 4: Ecology</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-status-warning/10 text-status-warning rounded-sm">Sensor Gap</span>
                      </div>
                      <h4 className="text-[13px] font-bold text-text-primary leading-tight mb-2">CEMS Emission Suppression</h4>
                      <p className="text-[11px] leading-relaxed text-text-secondary font-medium">
                        Expected carbon emissions based on generation load is <span className="font-bold text-text-primary">115 Tons</span>, while the reported continuous emission monitoring system (CEMS) registers only <span className="font-bold text-text-primary">92 Tons</span>.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border-default flex justify-between items-end">
                      <span className="text-[8px] text-text-tertiary font-bold uppercase">Under-reporting</span>
                      <span className="text-[14px] font-black text-status-warning font-mono">-20.0% Emission</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Recommendation Section */}
              <div className="bg-[#FAFBFD] p-5 border border-border-default rounded-md flex items-start gap-4">
                <AlertTriangle size={20} className="text-status-critical mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-[13px] font-bold text-text-primary mb-1">Recommended Regulatory Intervention</h4>
                  <p className="text-[11.5px] leading-relaxed text-text-secondary">
                    Based on the confirmed cross-system mismatch, the Bayesian Master Agent recommends dispatching an inspection team to Mangystau region for turbine mechanical checks and CEMS physical sensor auditing within <span className="font-bold text-text-primary">36H</span>. Click the tab above to inspect the automated computational workflow DAG or view the detailed visual components below.
                  </p>
                </div>
              </div>

              {/* Collapsible Section 1: Deep-Dive Identity Reconciliation Graph */}
              <div className="bg-white border border-border-default rounded-md shadow-sm overflow-hidden">
                <button 
                  onClick={() => setIsGraphExpanded(!isGraphExpanded)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-text-primary border-b border-border-default hover:bg-bg-hover transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-text-tertiary" />
                    <span className="text-[13px] uppercase tracking-wider">Deep-Dive Identity Reconciliation Graph</span>
                  </div>
                  {isGraphExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isGraphExpanded && (
                  <div className="p-4 bg-bg-secondary/20">
                    <div className="flex items-center justify-between mb-3 text-[10px] text-text-tertiary">
                      <span>Interactive SVG Canvas (D3 zoom enabled - use mouse drag or click controls to zoom)</span>
                      <span className="font-bold">7 Nodes · 8 Mismatch Edges</span>
                    </div>
                    <div className="relative h-[480px] bg-white border border-border-default overflow-hidden rounded-md">
                      <svg ref={svgRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                            <polygon points="0 0, 6 2, 0 4" fill="currentColor" />
                          </marker>
                        </defs>
                        
                        <g className="zoom-container">
                          {/* Edges */}
                          {ID_GRAPH_EDGES.map((edge, i) => {
                            const start = getNodeCenter(edge.from);
                            const end = getNodeCenter(edge.to);
                            const dx = end.x - start.x;
                            const dy = end.y - start.y;
                            const midX = (start.x + end.x) / 2;
                            const midY = (start.y + end.y) / 2;
                            
                            let d = `M ${start.x},${start.y} L ${end.x},${end.y}`;
                            if (edge.curve !== 0) {
                              const cx = midX + dy * edge.curve;
                              const cy = midY - dx * edge.curve;
                              d = `M ${start.x},${start.y} Q ${cx},${cy} ${end.x},${end.y}`;
                            }

                            return (
                              <g key={i} style={{ color: edge.color }}>
                                <path 
                                  d={d} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth={edge.weight * 1.5} 
                                  strokeDasharray={edge.dashed ? "4,4" : "none"}
                                  markerEnd="url(#arrowhead)" 
                                  className="transition-all opacity-60"
                                />
                                {edge.label !== 'reports to' && (
                                  <g transform={`translate(${midX}, ${midY + (edge.curve !== 0 ? -20 : 0)})`}>
                                    <rect x="-22.5" y="-7" width="45" height="14" rx="2" fill="white" stroke="currentColor" strokeWidth="0.6" />
                                    <text y="3" textAnchor="middle" className="text-[8px] font-bold" fill="currentColor">{edge.value}</text>
                                  </g>
                                )}
                              </g>
                            );
                          })}

                          {/* Nodes */}
                          {ID_GRAPH_NODES.map((node) => {
                            const w = (node.isEnt ? 270 : (node.id === 'FIN' ? 140 : (node.id === 'PERMIT' ? 130 : (node.id === 'FUEL' || node.id === 'EMIT' ? 190 : 180)))) * 1.1;
                            const h = (node.isEnt ? 24 : 58) * 1.1;
                            return (
                              <foreignObject 
                                key={node.id}
                                x={node.x}
                                y={node.y}
                                width={w}
                                height={h}
                                style={{ overflow: 'visible' }}
                              >
                                <div 
                                  className={cn(
                                    "bg-white border border-[#E2E7EF] shadow-sm flex group hover:shadow-md transition-all cursor-pointer h-full scale-110",
                                    node.id === 'EMIT' && "border-status-critical/30"
                                  )}
                                >
                                  <div className="w-1.5 h-full shrink-0" style={{ backgroundColor: node.accent }} />
                                  <div className="flex-1 p-2.5 flex flex-col justify-between overflow-hidden">
                                    <div className="flex justify-between items-start">
                                      <div className="overflow-hidden">
                                        <div className="text-[9px] font-bold truncate uppercase">{node.title}</div>
                                        <div className="text-[7.2px] text-[#6A7686] truncate uppercase font-medium">{node.sub}</div>
                                      </div>
                                      {!node.isEnt && <div className="text-[10px] font-bold tabular-nums" style={{ color: node.accent }}>{node.value}</div>}
                                    </div>
                                    {!node.isEnt && <StatusChip status={node.status} />}
                                  </div>
                                </div>
                              </foreignObject>
                            );
                          })}
                        </g>
                      </svg>
                      
                      {/* Zoom HUD */}
                      <div className="absolute bottom-4 right-4 bg-white/90 border border-border-default px-3 py-1.5 rounded-sm shadow-sm flex gap-4 text-[10px] text-text-secondary font-mono">
                        <span>Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
                        <span>Mode: Drag Canvas to Pan</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Collapsible Section 2: Dense Reconciliation Matrix Table */}
              <div className="bg-white border border-border-default rounded-md shadow-sm overflow-hidden">
                <button 
                  onClick={() => setIsMatrixExpanded(!isMatrixExpanded)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-text-primary border-b border-border-default hover:bg-bg-hover transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-text-tertiary" />
                    <span className="text-[13px] uppercase tracking-wider">Dense Reconciliation Matrix Table</span>
                  </div>
                  {isMatrixExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isMatrixExpanded && (
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full border-collapse border border-border-default">
                      <thead>
                        <tr className="bg-bg-secondary text-left text-[9px] font-bold text-text-secondary border-b border-border-default uppercase tracking-wider">
                          <th className="p-3 border-r border-border-default">System ID & Component</th>
                          <th className="p-3 border-r border-border-default text-center">Expected limit</th>
                          <th className="p-3 border-r border-border-default text-center">Monitored value</th>
                          <th className="p-3 border-r border-border-default text-center">Deviation</th>
                          <th className="p-3 border-r border-border-default">Severity Index</th>
                          <th className="p-3 border-r border-border-default text-center">12-Month Historical Trace</th>
                          <th className="p-3 text-center">Action routing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MATRIX_ROWS.map((row, idx) => {
                          const sevColor = row.sev > 0.8 ? COLORS.RED : row.sev > 0.5 ? COLORS.AMBER : COLORS.GREEN;
                          return (
                            <tr key={idx} className={cn("text-[11px] border-b border-border-default hover:bg-bg-hover transition-colors", idx % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]")}>
                              <td className="p-3 border-r border-border-default">
                                <div className="font-bold text-text-primary uppercase">{row.name}</div>
                                <div className="text-[9px] text-text-tertiary font-mono">{row.id} · {row.eq}</div>
                              </td>
                              <td className="p-3 border-r border-border-default text-center font-bold font-mono">{row.expect}</td>
                              <td className="p-3 border-r border-border-default text-center font-bold font-mono">{row.report}</td>
                              <td className="p-3 border-r border-border-default text-center">
                                <span className="px-2 py-0.5 rounded-sm font-bold font-mono" style={{ backgroundColor: `${sevColor}15`, color: sevColor }}>
                                  {row.delta}
                                </span>
                              </td>
                              <td className="p-3 border-r border-border-default">
                                <div className="flex items-center gap-2">
                                  <div className="w-[60px] h-2 bg-[#E2E7EF] rounded-full overflow-hidden shrink-0">
                                    <div className="h-full rounded-full" style={{ width: `${row.sev * 100}%`, backgroundColor: sevColor }} />
                                  </div>
                                  <span className="font-mono text-[9px] text-text-tertiary">{(row.sev * 10).toFixed(1)}</span>
                                </div>
                              </td>
                              <td className="p-3 border-r border-border-default text-center"><TraceDots trace={row.trace} /></td>
                              <td className="p-3 text-center">
                                <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-sm border uppercase", 
                                  row.route === 'ESCALATE' ? "bg-status-critical/10 text-status-critical border-status-critical/20" : 
                                  row.route === 'VERIFY' ? "bg-status-warning/10 text-status-warning border-status-warning/20" : 
                                  "bg-status-success/10 text-status-success border-status-success/20"
                                )}>
                                  {row.route}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bottom Narrative / AI Case Details */}
              <div className="bg-white border border-border-default rounded-md p-5 shadow-sm">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-text-primary mb-4 pb-1 border-b border-border-default">
                  Analyst Narrative & Model Reference
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {NARRATIVE.map((n, i) => (
                    <div key={i} className="p-4 bg-bg-secondary/40 border border-border-default rounded-md">
                      <div className="inline-block px-2 py-0.5 bg-bg-dark text-white text-[8px] font-bold uppercase tracking-wider rounded-sm mb-3">
                        {n.section}
                      </div>
                      <p className="text-[11px] leading-relaxed text-text-secondary font-medium uppercase tracking-tight">
                        {n.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
               key="workflow"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="bg-white border border-[#E2E7EF] rounded-md overflow-hidden p-6 max-w-[1200px] mx-auto"
            >
              {/* Computation DAG Header */}
              <div className="mb-6">
                <h3 className="text-[14px] font-bold uppercase tracking-tight text-text-primary">Bayesian Ensemble Computation Flow DAG</h3>
                <p className="text-[11px] text-text-tertiary mt-1">
                  Visualization of parallel ingestion streams, range validation filters, classification routing, compute agents, and master agent consensus verdict logic.
                </p>
              </div>

              {/* Dotted Grid and SVG Workflow Canvas */}
              <div className="relative h-[640px] bg-[#FAFBFD] border border-border-default overflow-hidden rounded-md">
                <div 
                  className="absolute inset-0 pointer-events-none" 
                  style={{ 
                    backgroundImage: `radial-gradient(circle, #D9DEE6 0.6px, transparent 0.6px)`, 
                    backgroundSize: `18px 18px` 
                  }} 
                />

                <svg className="w-full h-full cursor-grab" viewBox="0 0 2000 800" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                      <polygon points="0 0, 6 2, 0 4" fill="#C9D0D8" />
                    </marker>
                  </defs>
                  
                  <g className="zoom-container" transform="translate(40, 20) scale(0.9)">
                    {/* Connections A to B */}
                    {[126, 246, 366, 486, 606, 726].map((y, i) => (
                      <path key={`a-b-${i}`} d={`M 402,${y} C 420,${y} 420,${150 + (i % 3) * 100 + 28} 446,${150 + (i % 3) * 100 + 28}`} stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                    ))}

                    {/* Connections B to C */}
                    {[150, 250, 350].map((y, i) => (
                      <path key={`b-c-${i}`} d={`M 614,${y + 28} C 640,${y + 28} 640,350 666,350`} stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                    ))}

                    {/* Connections C to D */}
                    {[250, 310, 370, 430, 490].map((y, i) => (
                      <path key={`c-d-${i}`} d={`M 906,${350 + (i-2) * 20} C 918,${350 + (i-2) * 20} 925,${y + 25} 930,${y + 25}`} stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                    ))}

                    {/* Connections D to F */}
                    {[250, 310, 370, 430, 490].map((y, i) => (
                      <path key={`d-f-${i}`} d={`M 1110,${y + 25} C 1400,${y + 25} 1500,264 1620,264`} stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" className="opacity-40" />
                    ))}

                    <path d="M 1780,115 C 1820,115 1820,180 1780,180" stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                    <path d="M 1700,348 L 1700,400" stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                    <path d="M 1700,348 C 1700,370 1600,470 1620,470" stroke="#C9D0D8" strokeWidth="1.2" fill="none" strokeDasharray="3,3" markerEnd="url(#arrowhead)" />
                    
                    <path d="M 1620,264 C 1500,100 600,100 402,126" stroke="#C9D0D8" strokeWidth="0.8" fill="none" strokeDasharray="5,5" markerEnd="url(#arrowhead)" className="opacity-20" />

                    {/* COL A: AGENTS */}
                    <text x="246" y="60" className="text-[11px] font-black fill-[#6A7686] uppercase tracking-widest">INGESTION AGENTS</text>
                    {[
                      { y: 100, label: 'INGEST · SCADA', sub: 'KEGOC MWh stream' },
                      { y: 220, label: 'INGEST · Dispatch', sub: 'SO dispatch log' },
                      { y: 340, label: 'INGEST · Fuel Gas', sub: 'UNG meter' },
                      { y: 460, label: 'INGEST · Emission', sub: 'MOE CEMS' },
                      { y: 580, label: 'INGEST · Finance', sub: 'Tariff invoice' },
                      { y: 700, label: 'INGEST · Permit', sub: 'Permit registry' },
                    ].map((node, i) => (
                      <foreignObject key={i} x="246" y={node.y} width="156" height="52">
                        <div className="w-full h-full bg-white border border-[#E2E7EF] flex rounded-sm">
                           <div className="w-1 bg-[#2D6CDF] h-full" />
                           <div className="flex-1 p-2 flex flex-col justify-center">
                              <div className="flex items-center gap-1 mb-0.5">
                                 <span className="text-[8px] text-[#2D6CDF]">◆</span>
                                 <span className="text-[8.5px] font-bold uppercase truncate">{node.label}</span>
                              </div>
                              <div className="text-[7px] text-[#6A7686] uppercase truncate font-bold">{node.sub}</div>
                           </div>
                        </div>
                      </foreignObject>
                    ))}

                    {/* COL B: GUARDRAILS */}
                    <text x="446" y="60" className="text-[11px] font-black fill-[#6A7686] uppercase tracking-widest">GUARDRAILS</text>
                    <foreignObject x="430" y="80" width="200" height="40">
                      <div className="bg-[#FFFEDD] p-2 border border-[#E2E7EF] text-[7.5px] font-bold uppercase text-[#8B6E2F]">Validate units, ranges & clock-skew.</div>
                    </foreignObject>
                    {[
                      { y: 150, label: 'SCHEMA GUARD', status: 'PASS' },
                      { y: 250, label: 'RANGE GUARD', status: 'PASS' },
                      { y: 350, label: 'DEDUP & JOIN', status: 'PASS' },
                    ].map((node, i) => (
                      <foreignObject key={i} x="446" y={node.y} width="168" height="56">
                        <div className="w-full h-full bg-white border border-[#2AB3A6] flex rounded-sm">
                           <div className="w-1 bg-[#2AB3A6] h-full" />
                           <div className="flex-1 p-2 flex flex-col justify-between">
                              <div className="flex items-center gap-1">
                                 <span className="text-[10px] text-[#2AB3A6]">◎</span>
                                 <span className="text-[8.5px] font-bold uppercase">{node.label}</span>
                              </div>
                              <div className="px-1.5 py-0.5 bg-[#2FA862]15 text-[#2FA862] text-[7.5px] font-bold rounded-sm border border-[#2FA862]30 w-fit">{node.status}</div>
                           </div>
                        </div>
                      </foreignObject>
                    ))}

                    {/* COL C: CLASSIFIER */}
                    <text x="666" y="60" className="text-[11px] font-black fill-[#6A7686] uppercase tracking-widest">CLASSIFIER</text>
                    <foreignObject x="666" y="240" width="240" height="220">
                      <div className="w-full h-full bg-white border border-[#C9CFDA] rounded-[4px] p-3 flex flex-col overflow-hidden">
                         <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] text-[#0F1722]">◇</span>
                            <span className="text-[8.5px] font-bold uppercase">CLASSIFIER · identity</span>
                         </div>
                         <div className="text-[7px] text-[#6A7686] uppercase mb-3 font-bold">routes signal to matching branch</div>
                         <div className="flex-1 space-y-1">
                            {['heat_rate', 'carbon', 'tariff', 'cap', 'dispatch'].map((b, i) => (
                               <div key={i} className="h-[26px] bg-[#FAFBFD] border border-[#E2E7EF] flex items-center justify-between px-2 group hover:border-[#2D6CDF] transition-all rounded-sm">
                                  <span className="text-[7.5px] font-bold font-mono text-[#0F1722]">identity == {b}</span>
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#DDE3EC] group-hover:bg-[#2D6CDF]" />
                               </div>
                            ))}
                         </div>
                      </div>
                    </foreignObject>

                    {/* COL D: COMPUTE */}
                    <text x="930" y="60" className="text-[11px] font-black fill-[#6A7686] uppercase tracking-widest">COMPUTE AGENTS</text>
                    {[
                      { y: 250, label: 'HEAT-RATE AGENT', color: COLORS.AMBER },
                      { y: 310, label: 'CARBON AGENT', color: COLORS.RED },
                      { y: 370, label: 'TARIFF AGENT', color: COLORS.RED },
                      { y: 430, label: 'CAP AGENT', color: COLORS.RED },
                      { y: 490, label: 'DISPATCH AGENT', color: COLORS.AMBER },
                    ].map((node, i) => (
                      <g key={i}>
                        <foreignObject x="930" y={node.y} width="180" height="50">
                           <div className="w-full h-full bg-white border border-[#E2E7EF] flex rounded-sm">
                              <div className="w-1 h-full" style={{ backgroundColor: node.color }} />
                              <div className="flex-1 p-2 flex flex-col justify-center gap-1">
                                 <div className="flex items-center gap-1">
                                    <span className="text-[9px]" style={{ color: node.color }}>◆</span>
                                    <span className="text-[8.5px] font-bold uppercase">{node.label}</span>
                                 </div>
                                 <div className="px-1.5 py-0.5 bg-[#EEF2F8] text-[#2D6CDF] text-[7.5px] font-bold rounded-sm w-fit">ACTIVE</div>
                              </div>
                           </div>
                        </foreignObject>
                        {/* Month Strips */}
                        <g transform={`translate(1120, ${node.y + 10})`}>
                          {Array.from({ length: 12 }).map((_, j) => {
                            const val = Object.values(WORKFLOW_DATA)[i % 5][j];
                            const color = val === 0 ? '#DDE3EC' : val === 1 ? COLORS.GREEN : val === 2 ? COLORS.AMBER : COLORS.RED;
                            const label = val === 0 ? '—' : val === 1 ? 'OK' : val === 2 ? 'WRN' : 'BAD';
                            return (
                              <g key={j} transform={`translate(${j * 36}, 0)`}>
                                 <rect width="30" height="30" fill="white" stroke="#E2E7EF" strokeWidth="0.5" />
                                 <rect width="30" height="10" fill={color} />
                                 <text x="15" y="7" textAnchor="middle" className="text-[6px] font-bold" fill={val === 0 ? '#0F1722' : 'white'}>M{j+1}</text>
                                 <text x="15" y="24" textAnchor="middle" className="text-[7.5px] font-bold" fill={color}>{label}</text>
                              </g>
                            );
                          })}
                        </g>
                      </g>
                    ))}

                    {/* COL F: MASTER */}
                    <text x="1620" y="60" className="text-[11px] font-black fill-[#6A7686] uppercase tracking-widest">MASTER AGENT</text>
                    <foreignObject x="1620" y="180" width="180" height="168">
                      <div className="w-full h-full bg-[#0F1722] border-2 border-dashed border-[#D8454C] p-4 flex flex-col items-center justify-between rounded-sm">
                         <div className="w-full text-center">
                            <div className="text-[8.5px] font-black text-white uppercase tracking-widest mb-1">◆ MASTER AUDIT</div>
                            <div className="text-[7px] text-white/40 uppercase font-black">Bayesian ensemble</div>
                         </div>
                         <div className="flex flex-col items-center">
                            <div className="text-[36px] font-black text-[#D8454C] leading-none mb-1 tabular-nums">0.85</div>
                            <div className="text-[10px] font-black text-[#D8454C] uppercase tracking-widest">POSTERIOR</div>
                         </div>
                         <div className="flex gap-2 w-full">
                            <div className="flex-1 bg-white/10 px-1 py-1 text-center text-[7px] text-white/60 font-black uppercase">prior 0.71</div>
                            <div className="flex-1 bg-[#D8454C]/20 px-1 py-1 text-center text-[7px] text-[#D8454C] font-black uppercase">Δ +0.14</div>
                         </div>
                         <div className="text-[7.5px] font-black text-white uppercase tracking-[0.2em] border-t border-white/20 pt-2 w-full text-center">UNREPORTED CAP. EXP.</div>
                      </div>
                    </foreignObject>
                  </g>
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  FileText, 
  MoreHorizontal, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Eye, 
  Settings, 
  Download,
  CheckCircle2,
  XCircle,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  MousePointer2,
  Hand,
  Maximize2,
  Lock
} from 'lucide-react';
import * as d3Selection from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';

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
  { section: 'EVIDENCE CHAIN', text: 'Cross-system reconciliation reveals a persistent divergence between SCADA-logged generation (+15.7%) and fuel-consumption baselines (-13.5%). This decoupled state suggests capacity beyond declared parameters.' },
  { section: 'INFERENCE', text: 'Physical identity triangulation (Heat-Rate ↔ Carbon) places the probability of unreported expansion at 0.87. Discrepancies in finance billing align with excessive SCADA logs, confirming high fiscal materiality.' },
  { section: 'POLICY IMPLICATION', text: 'Violation of national grid balancing protocols detected. Breach of Title III energy disclosure requirements. Immediate escalation for physical audit of Turbine Units 1-4 required.' }
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

// --- COMPONENTS ---

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
    <div className="flex items-center gap-1.5">
      {trace.map((t, i) => {
        const color = t === 0 ? '#DDE3EC' : t === 1 ? COLORS.GREEN : t === 2 ? COLORS.AMBER : COLORS.RED;
        return (
          <div key={i} className="relative flex items-center justify-center">
            {t === 3 && (
              <div className="absolute w-[14px] h-[14px] border border-dashed border-status-critical rounded-full animate-pulse" />
            )}
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          </div>
        );
      })}
    </div>
  );
};

// --- Page 2.2 Component ---

export default function EnterpriseReporting() {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow'>('overview');
  const navigate = useNavigate();

  // d3-zoom implementation for Identity Graph
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3Selection.select(svgRef.current);
    const content = svg.select('g.zoom-container');

    const zoomBehavior = d3Zoom.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        content.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    // Default zoom magnified
    svg.call(zoomBehavior as any);
    svg.call(zoomBehavior.transform as any, d3Zoom.zoomIdentity.translate(100, 50).scale(1.3));
  }, []);

  // Handle Tab Switch via Hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'overview' || hash === 'workflow') {
      setActiveTab(hash as any);
    }
  }, []);

  const handleTabChange = (tab: 'overview' | 'workflow') => {
    setActiveTab(tab);
    window.location.hash = tab;
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
    <div className="flex-1 flex flex-col bg-[#F4F6FA] text-[#1A2330] font-sans overflow-hidden">
      {/* 1 · TOP BAR */}
      <div className="h-10 border-b border-[#E2E7EF] bg-white flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-tight text-[#0F1722]">AKTAU SCADA REGULATORY CONSOLE</span>
          <div className="w-px h-3 bg-[#E2E7EF]" />
          <span className="text-[8.5px] font-medium text-[#6A7686] uppercase tracking-wider">PAGE 2.2 · CROSS-SYSTEM CONSISTENCY VERIFICATION</span>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center bg-[#EEF2F8] rounded-full p-0.5 border border-[#E2E7EF] mx-auto">
          <button 
            onClick={() => handleTabChange('overview')}
            className={cn(
              "px-5 py-1 text-[9px] font-bold rounded-full transition-all flex items-center gap-1.5 group",
              activeTab === 'overview' ? "bg-[#0F1722] text-white border-b-2 border-[#2D6CDF]" : "text-[#6A7686]"
            )}
          >
            OVERVIEW
          </button>
          <button 
            onClick={() => handleTabChange('workflow')}
            className={cn(
              "px-5 py-1 text-[9px] font-bold rounded-full transition-all flex items-center gap-1.5 group",
              activeTab === 'workflow' ? "bg-[#0F1722] text-white border-b-2 border-[#2D6CDF]" : "text-[#6A7686]"
            )}
          >
            AGENT WORKFLOW
            <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-[#0F1722] text-white text-[8px] font-bold rounded-[3px]">CASE-2026-001</div>
          <div className="px-2 py-0.5 bg-[#D8454C] text-white text-[8px] font-bold rounded-[3px]">POSTERIOR 0.87</div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-[#E2E7EF] rounded-[3px]">
            <div className="w-1.5 h-1.5 bg-[#2FA862] rounded-full animate-[pulse_1.4s_infinite]" />
            <span className="text-[8px] font-bold text-[#2FA862]">LIVE</span>
          </div>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div 
               key="overview"
               initial={{ opacity: 0, x: -8 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 8 }}
               transition={{ duration: 0.2 }}
                className="h-full grid grid-cols-[1fr_820px] grid-rows-[70fr_30fr] gap-4 p-4 overflow-hidden"
            >
              {/* IDENTITY GRAPH (Top-Left) */}
              <div className="bg-white border border-[#E2E7EF] rounded-[10px] flex flex-col p-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                   <div>
                     <h3 className="text-[11px] font-bold uppercase tracking-tight">IDENTITY GRAPH · PHYSICAL RECONCILIATION</h3>
                     <p className="text-[7.6px] text-[#6A7686] uppercase tracking-wider">6 source systems · 7 physical identities · breach edges weighted by deviation</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="flex bg-[#EEF2F8] rounded-sm p-0.5 border border-[#E2E7EF]">
                         <button className="p-1 hover:bg-white rounded-sm transition-all"><MousePointer2 size={10} /></button>
                         <button className="p-1 hover:bg-white rounded-sm transition-all bg-white shadow-sm"><Hand size={10} /></button>
                      </div>
                      <div className="px-2 py-0.5 bg-[#2D6CDF] text-white text-[8px] font-bold rounded-[3px]">GRAPH</div>
                   </div>
                </div>

                {/* GRAPH CANVAS */}
                <div className="flex-1 relative mt-2 bg-[#F9FAFB] border border-[#E2E7EF] overflow-hidden rounded-[4px]">
                  <svg ref={svgRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
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

                  {/* FLOAT ZOOM UI */}
                  <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-20">
                    <button className="w-6 h-6 bg-white border border-[#E2E7EF] flex items-center justify-center text-[10px] font-bold hover:bg-[#F9FAFB]">+</button>
                    <button className="w-6 h-6 bg-white border border-[#E2E7EF] flex items-center justify-center text-[10px] font-bold hover:bg-[#F9FAFB]">−</button>
                  </div>
                </div>

                <div className="h-8 border-t border-[#E2E7EF] mt-auto flex items-center justify-center gap-8 shrink-0">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#D8454C] rounded-[2px]" /> <span className="text-[8px] font-bold text-[#6A7686] uppercase">CRITICAL ≥ 18%</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#E89518] rounded-[2px]" /> <span className="text-[8px] font-bold text-[#6A7686] uppercase">WARN 10-18%</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#2AB3A6] rounded-[2px]" /> <span className="text-[8px] font-bold text-[#6A7686] uppercase">MILD</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#2FA862] rounded-[2px]" /> <span className="text-[8px] font-bold text-[#6A7686] uppercase">OK</span></div>
                </div>
              </div>

              {/* RECONCILIATION MATRIX (Top-Right) */}
              <div className="bg-white border border-[#E2E7EF] rounded-[10px] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-[#E2E7EF] flex items-center justify-between">
                   <div>
                     <h3 className="text-[11px] font-bold uppercase tracking-tight">RECONCILIATION MATRIX</h3>
                     <p className="text-[7.6px] text-[#6A7686] uppercase">6 systems · expected / reported / Δ / severity / 12-month trace / routing</p>
                   </div>
                   <div className="px-2 py-0.5 bg-[#EEF2F8] border border-[#E2E7EF] text-[#6A7686] text-[8px] font-bold rounded-[3px]">DENSE</div>
                </div>
                
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-[#EEF2F8] z-10">
                      <tr className="h-[22px]">
                        <th className="text-left px-4 text-[8px] font-bold text-[#6A7686] uppercase tracking-widest border-r border-[#E2E7EF]">SYSTEM</th>
                        <th className="text-center px-2 text-[8px] font-bold text-[#6A7686] uppercase tracking-widest border-r border-[#E2E7EF]">EXPECT</th>
                        <th className="text-center px-2 text-[8px] font-bold text-[#6A7686] uppercase tracking-widest border-r border-[#E2E7EF]">REPORT</th>
                        <th className="text-center px-2 text-[8px] font-bold text-[#6A7686] uppercase tracking-widest border-r border-[#E2E7EF]">Δ</th>
                        <th className="text-left px-4 text-[8px] font-bold text-[#6A7686] uppercase tracking-widest border-r border-[#E2E7EF]">SEV</th>
                        <th className="text-center px-4 text-[8px] font-bold text-[#6A7686] uppercase tracking-widest border-r border-[#E2E7EF]">12-MONTH TRACE</th>
                        <th className="text-center px-2 text-[8px] font-bold text-[#6A7686] uppercase tracking-widest">ROUTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MATRIX_ROWS.map((row, idx) => {
                        const sevColor = row.sev > 0.8 ? COLORS.RED : row.sev > 0.5 ? COLORS.AMBER : COLORS.GREEN;
                        return (
                          <tr key={idx} className={cn("h-[58px] border-b border-[#E2E7EF] hover:bg-[#F4F6FA] transition-colors", idx % 2 === 0 ? "bg-white" : "bg-[#FAFBFD]")}>
                            <td className="px-4 border-r border-[#E2E7EF]">
                              <div className="text-[8.4px] font-bold uppercase">{row.name}</div>
                              <div className="text-[6.6px] text-[#6A7686] font-mono">{row.id} · {row.eq}</div>
                            </td>
                            <td className="px-2 text-center border-r border-[#E2E7EF]"><span className="text-[10.6px] font-bold">{row.expect}</span></td>
                            <td className="px-2 text-center border-r border-[#E2E7EF]"><span className="text-[10.6px] font-bold">{row.report}</span></td>
                            <td className="px-2 text-center border-r border-[#E2E7EF]">
                              <div className="px-2 py-0.5 rounded-[3px] text-[9.6px] font-bold inline-block" style={{ backgroundColor: `${sevColor}15`, color: sevColor }}>
                                {row.delta}
                              </div>
                            </td>
                            <td className="px-4 border-r border-[#E2E7EF]">
                              <div className="w-[70px] h-2 bg-[#E2E7EF] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${row.sev * 100}%`, backgroundColor: sevColor }} />
                              </div>
                            </td>
                            <td className="px-4 border-r border-[#E2E7EF] text-center"><TraceDots trace={row.trace} /></td>
                            <td className="px-2 text-center">
                              <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-[4px] border", 
                                row.route === 'ESCALATE' ? "bg-[#D8454C]15 text-[#D8454C] border-[#D8454C]30" : 
                                row.route === 'VERIFY' ? "bg-[#E89518]15 text-[#E89518] border-[#E89518]30" : 
                                "bg-[#2FA862]15 text-[#2FA862] border-[#2FA862]30")}>
                                {row.route}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BOTTOM SECTION (AI Findings & Narrative) */}
              <div className="col-span-2 bg-[#F4F6FA] flex flex-col gap-4 overflow-hidden">
                {/* AI FINDINGS CARDS (Horizontal) */}
                <div className="grid grid-cols-4 gap-4 shrink-0">
                  {[
                    { title: 'ROOT CAUSE', value: 'UNREPORTED CAPACITY EXPANSION', desc: 'SCADA decoupling from physical energy limits.', chip: 'P=0.87 RED', color: COLORS.RED, pulse: true },
                    { title: 'MAGNITUDE', value: '≈ 16 MW UNDECLARED', desc: 'Δ +18 MW from regulatory baseline archive.', chip: 'AMBER', color: COLORS.AMBER, pulse: false },
                    { title: 'FISCAL IMPACT', value: '1.24 BN KZT (12-MONTH)', desc: 'Estimated loss from unlevied generation fees.', chip: 'HIGH RED', color: COLORS.ROSE, pulse: true },
                    { title: 'RECOMMENDED ACTION', value: 'ESCALATE TO MoE + KEGOC', desc: 'Formal audit triggered for Case 2026-001.', chip: 'ACT 72h BLUE', color: COLORS.BLUE, pulse: false },
                  ].map((card, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "bg-white border border-[#E2E7EF] rounded-[10px] flex relative overflow-hidden group hover:shadow-lg transition-all h-[80px]",
                        card.pulse && "border-2 border-dashed card-pulse"
                      )}
                      style={{ borderColor: card.pulse ? card.color : '#E2E7EF' }}
                    >
                      {card.pulse && (
                          <style>{`
                            @keyframes pulseBorder_${i} {
                              0%, 100% { box-shadow: 0 0 0 0 ${card.color}55; }
                              50% { box-shadow: 0 0 0 6px ${card.color}00; }
                            }
                            .card-pulse { animation: pulseBorder_${i} 2.2s ease-out infinite; }
                          `}</style>
                      )}
                      <div className="w-[5px] h-full" style={{ backgroundColor: card.color }} />
                      <div className="flex-1 p-3 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[7px] font-bold text-[#6A7686] uppercase tracking-widest">{card.title}</span>
                            <span className="text-[6px] font-bold text-[#6A7686] uppercase tracking-tighter opacity-60">{card.chip}</span>
                          </div>
                          <div>
                            <div className={cn("text-[11px] font-bold leading-none mb-1", card.pulse ? "text-status-critical" : "text-[#1A2330]")}>{card.value}</div>
                            <p className="text-[7.4px] text-[#6A7686] line-clamp-1 leading-tight uppercase font-medium">{card.desc}</p>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ANALYST NARRATIVE (Horizontal Columns) */}
                <div className="flex-1 bg-white border border-[#E2E7EF] rounded-[10px] p-4 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <h3 className="text-[11px] font-bold uppercase tracking-tight">ANALYST NARRATIVE · CASE SUMMARY</h3>
                    <div className="flex items-center gap-4">
                      <div className="px-2 py-0.5 bg-[#0F1722] text-white text-[8px] font-bold rounded-[3px]">REPORT</div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-6">
                    {NARRATIVE.map((n, i) => (
                      <div key={i} className="flex flex-col gap-2 p-3 bg-[#FAFBFD] border border-[#E2E7EF] rounded-[6px]">
                        <div className="bg-[#0F1722] text-white text-[7.4px] font-bold px-2 py-1 uppercase tracking-widest text-center rounded-[2px] w-fit">{n.section}</div>
                        <p className="text-[9.5px] leading-relaxed text-[#1A2330] font-medium uppercase tracking-tighter opacity-80">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
               key="workflow"
               initial={{ opacity: 0, x: 8 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -8 }}
               transition={{ duration: 0.2 }}
               className="h-full flex flex-col overflow-hidden bg-[#F4F6FA]"
            >
              {/* AGENT WORKFLOW CANVAS VIEW */}
              <WorkflowTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- WORKFLOW TAB SUBCOMPONENT ---

const WorkflowTab = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // d3-zoom implementation
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3Selection.select(svgRef.current);
    const content = svg.select('g.zoom-container');

    const zoomBehavior = d3Zoom.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        content.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoomBehavior as any);
  }, []);

  return (
    <div className="flex-1 flex overflow-hidden relative" ref={containerRef}>
      {/* 3.1 LEFT SIDEBAR */}
      <div className="w-[188px] h-full bg-white border-r border-[#E2E7EF] flex flex-col py-6 px-4 z-40">
        <div className="space-y-6">
          {[
            { group: 'Core', items: [{ icon: '◆', label: 'Agent' }, { icon: '◎', label: 'Classify' }, { icon: '■', label: 'End' }, { icon: '✎', label: 'Note' }] },
            { group: 'Tools', items: [{ icon: '🛡', label: 'Guardrails' }, { icon: '✨', label: 'AI Verify' }, { icon: '⚠️', label: 'Anomaly det.' }, { icon: '★', label: 'Score' }] },
            { group: 'Logic', items: [{ icon: '⌥', label: 'If / Else' }, { icon: '⟳', label: 'While' }, { icon: '✓', label: 'User approval' }] },
            { group: 'Data', items: [{ icon: '⇄', label: 'Transform' }, { icon: '⚿', label: 'Set state' }, { icon: '📥', label: 'Load source' }] },
          ].map((cat, i) => (
            <div key={i}>
              <h4 className="text-[10px] font-bold text-[#6A7686] uppercase tracking-widest mb-3">{cat.group}</h4>
              <div className="space-y-1">
                {cat.items.map((item, j) => (
                  <div key={j} className="h-7 px-2 flex items-center gap-2 hover:bg-[#F4F6FA] cursor-pointer rounded-[4px] group transition-all">
                    <span className="text-[12px] text-[#2D6CDF] group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-[8.6px] font-bold text-[#1A2330] uppercase">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3.2 MAIN CANVAS */}
      <div className="flex-1 relative bg-[#F4F6FA] overflow-hidden">
        {/* Dotted Grid */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ 
            backgroundImage: `radial-gradient(circle, #D9DEE6 0.6px, transparent 0.6px)`, 
            backgroundSize: `18px 18px` 
          }} 
        />

        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing">
          <g className="zoom-container">
               {/* 6-Column DAG Computation Graph */}
               {/* COLUMN A: AGENTS (246x) */}
               <text x="246" y="60" className="text-[10px] font-black fill-[#6A7686] uppercase tracking-widest">AGENTS · SOURCE</text>
               {[
                 { y: 100, label: 'INGEST · SCADA', sub: 'KEGOC MWh stream' },
                 { y: 220, label: 'INGEST · Dispatch', sub: 'SO dispatch log' },
                 { y: 340, label: 'INGEST · Fuel Gas', sub: 'UNG meter' },
                 { y: 460, label: 'INGEST · Emission', sub: 'MOE CEMS' },
                 { y: 580, label: 'INGEST · Finance', sub: 'Tariff invoice' },
                 { y: 700, label: 'INGEST · Permit', sub: 'Permit registry' },
               ].map((node, i) => (
                 <foreignObject key={i} x="246" y={node.y} width="156" height="52">
                    <div className="w-full h-full bg-white border border-[#E2E7EF] flex">
                       <div className="w-1 bg-[#2D6CDF] h-full" />
                       <div className="flex-1 p-2 flex flex-col justify-center">
                          <div className="flex items-center gap-1 mb-0.5">
                             <span className="text-[8px] text-[#2D6CDF]">◆</span>
                             <span className="text-[8.4px] font-bold uppercase truncate">{node.label}</span>
                          </div>
                          <div className="text-[6.8px] text-[#6A7686] uppercase truncate">{node.sub}</div>
                       </div>
                    </div>
                 </foreignObject>
               ))}

                      {/* Connections A to B */}
                      {[126, 246, 366, 486, 606, 726].map((y, i) => (
                        <path key={`a-b-${i}`} d={`M 402,${y} C 420,${y} 420,${150 + (i % 3) * 100 + 28} 446,${150 + (i % 3) * 100 + 28}`} stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                      ))}

                      {/* Connections B to C */}
                      {[150, 250, 350].map((y, i) => (
                        <path key={`b-c-${i}`} d={`M 614,${y + 28} C 640,${y + 28} 640,350 666,350`} stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                      ))}

                      {/* Connections C to D (All Compute Agents connected) */}
                      {[250, 310, 370, 430, 490].map((y, i) => (
                        <path key={`c-d-${i}`} d={`M 906,${350 + (i-2) * 20} C 918,${350 + (i-2) * 20} 925,${y + 25} 930,${y + 25}`} stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                      ))}

                      {/* Connections D to F (Ensure connection to Master Audit) */}
                      {[250, 310, 370, 430, 490].map((y, i) => (
                        <path key={`d-f-${i}`} d={`M 1110,${y + 25} C 1400,${y + 25} 1500,264 1620,264`} stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" className="opacity-40" />
                      ))}

                      {/* Approval to Master Audit */}
                      <path d="M 1780,115 C 1820,115 1820,180 1780,180" stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />

                      {/* Master Audit to Verdicts */}
                      <path d="M 1700,348 L 1700,400" stroke="#C9D0D8" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                      <path d="M 1700,348 C 1700,370 1600,470 1620,470" stroke="#C9D0D8" strokeWidth="1.2" fill="none" strokeDasharray="3,3" markerEnd="url(#arrowhead)" />
                      
                      {/* Master Audit back to Agents (Feedback loop) */}
                      <path d="M 1620,264 C 1500,100 600,100 402,126" stroke="#C9D0D8" strokeWidth="0.8" fill="none" strokeDasharray="5,5" markerEnd="url(#arrowhead)" className="opacity-20" />

               {/* COLUMN B: GUARDRAILS (446x) */}
               <text x="446" y="60" className="text-[10px] font-black fill-[#6A7686] uppercase tracking-widest">GUARDRAILS</text>
               <foreignObject x="430" y="80" width="200" height="40">
                  <div className="bg-[#FFFEDD] p-2 border border-[#E2E7EF] text-[7.5px] font-bold uppercase text-[#8B6E2F]">Validate units, ranges, clock-skew & schema.</div>
               </foreignObject>
               {[
                 { y: 150, label: 'SCHEMA GUARD', status: 'PASS' },
                 { y: 250, label: 'RANGE GUARD', status: 'PASS' },
                 { y: 350, label: 'DEDUP & JOIN', status: 'PASS' },
               ].map((node, i) => (
                 <foreignObject key={i} x="446" y={node.y} width="168" height="56">
                    <div className="w-full h-full bg-white border border-[#2AB3A6] flex">
                       <div className="w-1 bg-[#2AB3A6] h-full" />
                       <div className="flex-1 p-2 flex flex-col justify-between">
                          <div className="flex items-center gap-1">
                             <span className="text-[10px] text-[#2AB3A6]">◎</span>
                             <span className="text-[8.4px] font-bold uppercase">{node.label}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <div className="px-1 py-0.5 bg-[#2FA862]15 text-[#2FA862] text-[7px] font-bold rounded-[2px] border border-[#2FA862]30">{node.status}</div>
                          </div>
                       </div>
                    </div>
                 </foreignObject>
               ))}

               {/* COLUMN C: CONDITION (666x) */}
               <text x="666" y="60" className="text-[10px] font-black fill-[#6A7686] uppercase tracking-widest">CONDITION</text>
               <foreignObject x="666" y="240" width="240" height="220">
                  <div className="w-full h-full bg-white border border-[#C9CFDA] rounded-[4px] p-3 flex flex-col overflow-hidden">
                     <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-[#0F1722]">◇</span>
                        <span className="text-[8.4px] font-bold uppercase">CLASSIFIER · identity</span>
                     </div>
                     <div className="text-[6.8px] text-[#6A7686] uppercase mb-3">routes signal to matching branch</div>
                     <div className="flex-1 space-y-1">
                        {['heat_rate', 'carbon', 'tariff', 'cap', 'dispatch'].map((b, i) => (
                           <div key={i} className="h-[26px] bg-[#FAFBFD] border border-[#E2E7EF] flex items-center justify-between px-2 group hover:border-[#2D6CDF] transition-all">
                              <span className="text-[7.4px] font-bold font-mono text-[#0F1722]">identity == {b}</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-[#DDE3EC] group-hover:bg-[#2D6CDF]" />
                           </div>
                        ))}
                     </div>
                  </div>
               </foreignObject>

               {/* COLUMN D: COMPUTE (930x) */}
               <text x="930" y="60" className="text-[10px] font-black fill-[#6A7686] uppercase tracking-widest">COMPUTE AGENTS</text>
               {[
                 { y: 250, label: 'HEAT-RATE AGENT', color: COLORS.AMBER },
                 { y: 310, label: 'CARBON AGENT', color: COLORS.RED },
                 { y: 370, label: 'TARIFF AGENT', color: COLORS.RED },
                 { y: 430, label: 'CAP AGENT', color: COLORS.RED },
                 { y: 490, label: 'DISPATCH AGENT', color: COLORS.AMBER },
               ].map((node, i) => (
                 <g key={i}>
                   <foreignObject x="930" y={node.y} width="180" height="50">
                      <div className="w-full h-full bg-white border border-[#E2E7EF] flex">
                         <div className="w-1 h-full" style={{ backgroundColor: node.color }} />
                         <div className="flex-1 p-2 flex flex-col justify-center gap-1">
                            <div className="flex items-center gap-1">
                               <span className="text-[9px]" style={{ color: node.color }}>◆</span>
                               <span className="text-[8.4px] font-bold uppercase">{node.label}</span>
                            </div>
                            <div className="px-1.5 py-0.5 bg-[#EEF2F8] text-[#2D6CDF] text-[7px] font-bold rounded-[2px] w-fit">ACTIVE</div>
                         </div>
                      </div>
                   </foreignObject>
                   {/* Month Strips */}
                   <g transform={`translate(1120, ${node.y + 10})`}>
                      {Array.from({ length: 12 }).map((_, j) => {
                        const val = Object.values(WORKFLOW_DATA)[i][j];
                        const color = val === 0 ? '#DDE3EC' : val === 1 ? COLORS.GREEN : val === 2 ? COLORS.AMBER : COLORS.RED;
                        const label = val === 0 ? '—' : val === 1 ? 'OK' : val === 2 ? 'WRN' : 'BAD';
                        return (
                          <g key={j} transform={`translate(${j * 36}, 0)`}>
                             <rect width="30" height="30" fill="white" stroke="#E2E7EF" strokeWidth="0.5" />
                             <rect width="30" height="10" fill={color} />
                             <text x="15" y="7" textAnchor="middle" className="text-[5.6px] font-bold" fill={val === 0 ? '#0F1722' : 'white'}>M{j+1}</text>
                             <text x="15" y="24" textAnchor="middle" className="text-[7.5px] font-bold" fill={color}>{label}</text>
                          </g>
                        );
                      })}
                   </g>
                 </g>
               ))}

               {/* COLUMN F: VERDICT */}
               <text x="1620" y="60" className="text-[10px] font-black fill-[#6A7686] uppercase tracking-widest">MASTER & VERDICT</text>
               <foreignObject x="1620" y="80" width="160" height="70">
                  <div className="bg-white border border-[#E2E7EF] p-3 shadow-lg">
                    <div className="text-[8.4px] font-bold uppercase mb-1 flex items-center gap-1.5">
                       <CheckCircle2 size={12} className="text-[#2FA862]" /> Inspector approval
                    </div>
                    <div className="text-[6.8px] text-[#6A7686] uppercase mb-2">Does this verdict hold?</div>
                    <div className="flex gap-2">
                       <div className="flex-1 px-2 py-1 bg-[#2FA862]15 text-[#2FA862] text-[7px] font-bold text-center border border-[#2FA862]30 uppercase">Approve</div>
                       <div className="flex-1 px-2 py-1 bg-[#D8454C]15 text-[#D8454C] text-[7px] font-bold text-center border border-[#D8454C]30 uppercase">Reject</div>
                    </div>
                  </div>
               </foreignObject>

               <foreignObject x="1620" y="180" width="160" height="168">
                  <div className="w-full h-full bg-[#0F1722] border-2 border-dashed border-[#D8454C] animate-[pulseBorder_2s_infinite] p-4 flex flex-col items-center justify-between">
                     <div className="w-full text-center">
                        <div className="text-[8.4px] font-black text-white uppercase tracking-widest mb-1">◆ MASTER AUDIT</div>
                        <div className="text-[6.8px] text-white/40 uppercase font-black uppercase">Bayesian ensemble</div>
                     </div>
                     <div className="flex flex-col items-center">
                        <div className="text-[36px] font-black text-[#D8454C] leading-none mb-1 tabular-nums">0.87</div>
                        <div className="text-[10px] font-black text-[#D8454C] uppercase tracking-widest">POSTERIOR</div>
                     </div>
                     <div className="flex gap-2 w-full">
                        <div className="flex-1 bg-white/10 px-1 py-1 text-center text-[7px] text-white/60 font-black uppercase">prior 0.71</div>
                        <div className="flex-1 bg-[#D8454C]20 px-1 py-1 text-center text-[7px] text-[#D8454C] font-black uppercase">Δ +0.16</div>
                     </div>
                     <div className="text-[6.6px] font-black text-white uppercase tracking-[0.2em] border-t border-white/20 pt-2 w-full text-center">UNREPORTED CAP. EXP.</div>
                  </div>
               </foreignObject>

               <foreignObject x="1620" y="400" width="160" height="40">
                  <div className="w-full h-full border border-[#E2E7EF] bg-white p-2 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-[#2FA862] rounded-full" />
                     <span className="text-[10px] font-black text-[#0F1722] uppercase tracking-widest">□ End · CASE OPEN</span>
                  </div>
               </foreignObject>
               <foreignObject x="1620" y="450" width="160" height="40">
                  <div className="w-full h-full border border-[#E2E7EF] bg-[#0F1722] p-2 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">□ End · CASE CLOSE</span>
                  </div>
               </foreignObject>
          </g>
        </svg>

        {/* 3.3 BOTTOM TOOLBAR */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-[#E2E7EF] p-1.5 flex items-center gap-1 shadow-2xl rounded-sm z-50">
           {[
             { icon: Hand, label: 'Pan' },
             { icon: MousePointer2, label: 'Select' },
             { icon: RotateCcw, label: 'Undo' },
             { icon: RotateCcw, label: 'Redo', rotate: true },
           ].map((tool, i) => (
             <button key={i} className="w-8 h-8 flex items-center justify-center text-[#6A7686] hover:bg-[#F4F6FA] hover:text-[#0F1722] transition-colors rounded-sm">
                <tool.icon size={16} className={tool.rotate ? '-scale-x-100' : ''} />
             </button>
           ))}
        </div>

        {/* 3.4 ZOOM CONTROLS */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-1 z-50">
           <button className="w-8 h-8 bg-white border border-[#E2E7EF] shadow-lg flex items-center justify-center font-bold text-[14px]">+</button>
           <button className="w-8 h-8 bg-white border border-[#E2E7EF] shadow-lg flex items-center justify-center font-bold text-[14px]">−</button>
           <button className="w-8 h-8 bg-white border border-[#E2E7EF] shadow-lg flex items-center justify-center"><Maximize2 size={12} /></button>
           <button className="w-8 h-8 bg-white border border-[#E2E7EF] shadow-lg flex items-center justify-center"><Lock size={12} /></button>
        </div>

        {/* 3.5 FOOTER */}
        <div className="absolute bottom-4 left-[220px] text-[8px] font-bold text-[#6A7686] uppercase tracking-[0.2em]">
           12 agents · 5 compute branches · 60 monthly result cards · ensemble 0.87
        </div>
        <button className="absolute bottom-4 right-6 bg-[#2D6CDF] text-white px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-sm">
           EXPORT JSON
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  FileText, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Download,
  CheckCircle2,
  TrendingDown,
  RotateCcw,
  MousePointer2,
  Hand,
  Maximize2,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
  FileCheck,
  Search,
  Gavel,
  Wrench,
  ExternalLink,
  Plus,
  Minus
} from 'lucide-react';
import * as d3Selection from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ATTRIBUTION_DATA } from '../data/attribution/case_001_attribution';

// --- STYLES & HELPERS ---
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

const STATUS_COLORS: any = {
  NORMAL:   { fill: '#2FBF71', label_bg: '#E8F7EF', label_text: '#2FBF71', className: '' },
  INFO:     { fill: '#4A90E2', label_bg: '#E8F1FC', label_text: '#4A90E2', className: '' },
  WARNING:  { fill: '#E7A53A', label_bg: '#FCF3E0', label_text: '#E7A53A', className: '' },
  CRITICAL: { fill: '#E14B4B', label_bg: '#FDECEC', label_text: '#E14B4B', className: 'dot-pulse-red' },
};

const VERDICT_STYLES: any = {
  RED_FLAG:    { background: '#FDECEC', text: '#E14B4B', label: 'RED FLAG' },
  YELLOW_FLAG: { background: '#FCF3E0', text: '#E7A53A', label: 'YELLOW FLAG' },
  GREEN:       { background: '#E8F7EF', text: '#2FBF71', label: 'CLEAR' },
};

const getIcon = (iconName: string, size = 18) => {
  switch (iconName) {
    case 'FileCheck': return <FileCheck size={size} />;
    case 'FileText': return <FileText size={size} />;
    case 'Search': return <Search size={size} />;
    case 'Gavel': return <Gavel size={size} />;
    case 'Wrench': return <Wrench size={size} />;
    case 'ShieldCheck': return <ShieldCheck size={size} />;
    default: return <FileText size={size} />;
  }
};

const formatTimestamp = (ts: string) => {
  const date = new Date(ts);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// --- Page Component ---

export default function WorkflowAttribution() {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow'>('overview');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const navigate = useNavigate();

  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const months = useMemo(() => {
    const arr = [];
    let curr = new Date("2025-06-01");
    for (let i = 0; i <= 12; i++) {
       arr.push(`${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`);
       curr.setMonth(curr.getMonth() + 1);
    }
    return arr;
  }, []);

  const getX = (ts: string) => {
    const date = new Date(ts);
    const start = new Date("2025-06-01");
    const diff = date.getTime() - start.getTime();
    const total = new Date("2026-06-01").getTime() - start.getTime();
    return (diff / total) * 1000; // 1000 is our timeline width in SVG
  };

  const getY = (laneId: string) => {
    const idx = ATTRIBUTION_DATA.lanes.findIndex(l => l.id === laneId);
    return idx * 96 + 48; // Each lane 96px, center dot
  };

  useEffect(() => {
    // Zoom removed for stability as per user request
  }, [activeTab]);

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

  const selectedEvent = ATTRIBUTION_DATA.events.find(e => e.id === selectedEventId);
  const selectedAgentReasoning = selectedAgentId ? (ATTRIBUTION_DATA.agent_reasoning as any)[selectedAgentId] : null;
  const selectedAgent = selectedAgentId ? ATTRIBUTION_DATA.lanes.find(l => l.agent.id === selectedAgentId)?.agent : null;

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6FA] text-[#1A2330] font-sans overflow-hidden">
      {/* TOP BAR */}
      <div className="h-10 border-b border-[#E2E7EF] bg-white flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-tight text-[#0F1722]">AKTAU SCADA REGULATORY CONSOLE</span>
          <div className="w-px h-3 bg-[#E2E7EF]" />
          <span className="text-[8.5px] font-medium text-[#6A7686] uppercase tracking-wider">PAGE 3.1 · WORKFLOW ATTRIBUTION · 6-AGENT REGULATORY LIFECYCLE</span>
        </div>

        <div className="flex items-center bg-[#EEF2F8] rounded-full p-0.5 border border-[#E2E7EF] mx-auto">
          <button onClick={() => handleTabChange('overview')} className={cn("px-5 py-1 text-[9px] font-bold rounded-full transition-all", activeTab === 'overview' ? "bg-[#0F1722] text-white border-b-2 border-[#2D6CDF]" : "text-[#6A7686]")}>OVERVIEW</button>
          <button onClick={() => handleTabChange('workflow')} className={cn("px-5 py-1 text-[9px] font-bold rounded-full transition-all flex items-center gap-1.5 group", activeTab === 'workflow' ? "bg-[#0F1722] text-white border-b-2 border-[#2D6CDF]" : "text-[#6A7686]")}>
            AGENT WORKFLOW <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-[#0F1722] text-white text-[8px] font-bold rounded-[3px]">CASE-2026-001</div>
          <div className="px-2 py-0.5 bg-[#D8454C] text-white text-[8px] font-bold rounded-[3px]">POSTERIOR 0.85</div>
          <div className="px-2 py-0.5 bg-[#2FA862] text-white text-[8px] font-bold rounded-[3px] flex items-center gap-1">
             <div className="w-1 h-1 bg-white rounded-full" /> 6/6 AGENTS
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 relative overflow-hidden flex">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div 
               key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
               className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Context Bar */}
              <div className="h-10 bg-[#EEF2F8] border-b border-[#E2E7EF] flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate(-1)} className="text-[11px] font-bold uppercase tracking-widest text-[#6A7686] hover:text-[#0F1722] flex items-center gap-1">
                    [← BACK]
                  </button>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#0F1722]">CONTEXT: REGULATORY WORKFLOW ATTRIBUTION</span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-white border border-[#E2E7EF] text-[10px] font-bold rounded-sm">[CASE-2026-001]</span>
                    <span className="px-1.5 py-0.5 bg-white border border-[#E2E7EF] text-[10px] font-bold rounded-sm text-[#D8454C]">[SEVERITY: CRITICAL]</span>
                  </div>
                </div>
                <div className="text-[10px] font-medium text-[#6A7686] uppercase tracking-wider">
                  MASTER AGENT: {ATTRIBUTION_DATA.master_agent.model}   |   ATTRIBUTION INITIATED: 2026-05-28 14:32:18   |   [● AGENTS: 7/7 ACTIVE]
                </div>
              </div>

              {/* Case Lock Strip */}
              <div className="h-[88px] bg-white border-b border-[#E2E7EF] flex items-stretch shrink-0">
                <div className="flex-1 border-r border-[#E2E7EF] p-4 flex flex-col justify-center">
                   <div className="text-[10px] text-[#98A1AA] font-bold uppercase mb-1">SUBJECT ENTERPRISE</div>
                   <div className="text-[13px] font-bold text-[#1A1E23]">{ATTRIBUTION_DATA.case.subject_enterprise.id}</div>
                   <div className="text-[11px] font-semibold text-[#1A1E23]">{ATTRIBUTION_DATA.case.subject_enterprise.name_en}</div>
                   <div className="text-[10px] text-[#66707A] uppercase">OIL & GAS · AKTAU</div>
                </div>
                <div className="flex-1 border-r border-[#E2E7EF] p-4 flex flex-col justify-center">
                   <div className="text-[10px] text-[#98A1AA] font-bold uppercase mb-1">TRIGGERING ANOMALY</div>
                   <div className="text-[13px] font-bold text-[#1A1E23]">{ATTRIBUTION_DATA.case.triggering_anomaly.id}</div>
                   <div className="text-[11px] font-semibold text-[#1A1E23]">{ATTRIBUTION_DATA.case.triggering_anomaly.headline}</div>
                   <div className="h-px bg-[#E2E7EF] w-12 my-1" />
                   <div className="text-[10px] text-[#66707A] uppercase">LAST DETECTED: 2026-05-28</div>
                </div>
                <div className="flex-1 border-r border-[#E2E7EF] p-4 flex flex-col justify-center">
                   <div className="text-[10px] text-[#98A1AA] font-bold uppercase mb-1">FACILITY</div>
                   <div className="text-[13px] font-bold text-[#1A1E23]">{ATTRIBUTION_DATA.case.subject_facility.id}</div>
                   <div className="text-[11px] font-semibold text-[#1A1E23]">{ATTRIBUTION_DATA.case.subject_facility.name}</div>
                   <div className="text-[10px] text-[#66707A] uppercase">{ATTRIBUTION_DATA.case.subject_facility.type}</div>
                </div>
                <div className="flex-1 p-4 flex flex-col justify-center">
                   <div className="text-[10px] text-[#98A1AA] font-bold uppercase mb-1">ATTRIBUTION WINDOW</div>
                   <div className="text-[13px] font-bold text-[#1A1E23]">2025-05-28 → 2026-05-28</div>
                   <div className="text-[11px] font-semibold text-[#1A1E23]">12 MONTHS · 27 EVENTS</div>
                </div>
              </div>

              {/* Main Body (Lanes + Verdict) */}
              <div className="flex-1 flex overflow-hidden">
                {/* Lane Timeline Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F7FA]">
                   <div className="flex-1 relative overflow-hidden flex">
                      {/* Lane Labels (Sticky Left) - Stretched and reorganized */}
                      <div className="w-[580px] bg-white border-r border-[#E2E7EF] flex flex-col shrink-0 z-20 overflow-y-auto no-scrollbar">
                         {ATTRIBUTION_DATA.lanes.map((lane, idx) => {
                           const verdict = VERDICT_STYLES[lane.agent.verdict_status];
                           return (
                             <div 
                               key={lane.id} 
                               className={cn(
                                 "h-[96px] px-8 py-4 border-b border-[#E2E7EF] flex items-center justify-between hover:bg-[#F9FAFB] cursor-pointer transition-colors group relative",
                                 selectedAgentId === lane.agent.id && "bg-[#EEF2F8]",
                                 idx % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]/50"
                               )}
                               onClick={() => setSelectedAgentId(lane.agent.id)}
                             >
                                <div className="flex-1 flex items-center justify-between pr-12">
                                  <div className="flex items-center gap-6">
                                    <div className="text-[#0F1722] p-2.5 bg-[#F4F6FA] rounded-md group-hover:bg-white transition-colors shadow-sm">
                                      {getIcon(lane.icon, 24)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[15px] font-black uppercase leading-none mb-1 tracking-tight">{lane.label_en}</span>
                                      <span className="text-[10px] font-bold text-[#98A1AA] uppercase tracking-widest">{lane.agent.name_en}</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end text-right">
                                     <div className="text-[9px] font-black text-[#6A7686] uppercase tracking-[0.1em] opacity-80">{lane.agent.specialization}</div>
                                     <div className="text-[8px] font-bold text-[#2D6CDF] uppercase mt-1 tracking-widest border-b border-transparent hover:border-[#2D6CDF]">VIEW EVIDENCE</div>
                                  </div>
                                </div>
                               
                               <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                                 <div className={cn(
                                   "px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border shadow-sm",
                                   lane.agent.verdict_status === 'RED_FLAG' && "red-tag-pulse"
                                 )} style={{ backgroundColor: 'white', color: verdict.text, borderColor: verdict.text }}>
                                   {verdict.label}
                                 </div>
                                 <div className="flex flex-col items-end">
                                    <span className="text-[11px] font-black tabular-nums text-[#1A1E23]">{(lane.agent.confidence * 100).toFixed(0)}%</span>
                                    <div className="w-12 h-1 bg-[#E2E7EF] rounded-full mt-0.5 overflow-hidden">
                                       <div className="h-full bg-current transition-all duration-700" style={{ width: `${lane.agent.confidence * 100}%`, color: verdict.text }} />
                                    </div>
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                      </div>

                      {/* Timeline - Fixed without horizontal shifting */}
                      <div className="flex-1 relative overflow-hidden bg-white">
                         <svg className="w-full h-full" viewBox="0 0 1000 576" preserveAspectRatio="none">
                            {/* Alternating Row Backgrounds */}
                            {ATTRIBUTION_DATA.lanes.map((_, i) => (
                              <rect 
                                key={`bg-${i}`} 
                                x="0" y={i * 96} 
                                width="1000" height="96" 
                                fill={i % 2 === 0 ? '#FFFFFF' : '#F9FAFB'} 
                              />
                            ))}

                            {/* Horizontal Lines */}
                            {ATTRIBUTION_DATA.lanes.map((_, i) => (
                              <line key={i} x1="0" y1={(i+1)*96} x2="1000" y2={(i+1)*96} stroke="#E2E7EF" strokeWidth="1" />
                            ))}
                            <line x1="0" y1="0" x2="0" y2="576" stroke="#E2E7EF" strokeWidth="1" />

                            {/* Month Grid */}
                            {months.map((m, i) => {
                              const x = (i / 12) * 1000;
                              return (
                                <g key={i}>
                                  <line x1={x} y1="0" x2={x} y2="576" stroke="#E2E7EF" strokeWidth="0.5" strokeDasharray="2,2" />
                                  <text x={x + 4} y="570" className="text-[9px] font-bold fill-[#98A1AA]">{m}</text>
                                </g>
                              );
                            })}

                            {/* NOW Line */}
                            <g>
                               <line x1="1000" y1="0" x2="1000" y2="576" stroke="#0F1722" strokeWidth="1.5" strokeDasharray="4,2" />
                               <text x="975" y="15" className="text-[10px] font-black fill-[#0F1722] uppercase tracking-widest">NOW</text>
                            </g>

                            {/* Events */}
                            {ATTRIBUTION_DATA.events.map((ev) => {
                              const x = getX(ev.ts);
                              const y = getY(ev.lane);
                              const colors = STATUS_COLORS[ev.status];
                              const isSelected = selectedEventId === ev.id;
                              
                              const r = ev.status === 'CRITICAL' ? 9 : ev.status === 'WARNING' ? 7 : 5;

                              return (
                                <g 
                                  key={ev.id} 
                                  className="cursor-pointer"
                                  onClick={() => setSelectedEventId(ev.id)}
                                >
                                  <circle 
                                    cx={x} cy={y} r={r} 
                                    fill={colors.fill} 
                                    className={cn("transition-all", colors.className, isSelected ? "stroke-[3px] stroke-black" : "hover:scale-125")}
                                  />
                                </g>
                              );
                            })}
                         </svg>
                      </div>
                   </div>

                   {/* Bottom Footer Bar */}
                   <div className="h-14 bg-white border-t border-[#E2E7EF] flex items-center justify-between px-6 shrink-0 shrink-0">
                      <div className="flex gap-3">
                         <button className="px-4 py-2 border border-[#E2E7EF] rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-[#F9FAFB] flex items-center gap-2">
                           <Download size={14} /> EXPORT ATTRIBUTION REPORT
                         </button>
                         <button className="px-4 py-2 border border-[#E2E7EF] rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-[#F9FAFB] flex items-center gap-2">
                           <FileText size={14} /> VIEW EVIDENCE
                         </button>
                      </div>
                      <div className="flex gap-3">
                         <button 
                           onClick={() => navigate(`/attribution/graph/${ATTRIBUTION_DATA.case.id}`)}
                           className="px-6 py-2 bg-[#0F1722] text-white rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2"
                         >
                           VIEW KNOWLEDGE GRAPH <ArrowRight size={14} />
                         </button>
                         <button className="px-6 py-2 bg-[#D8454C] text-white rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors">
                           INITIATE CASE
                         </button>
                      </div>
                   </div>
                </div>

                {/* Right Panel (Master Agent Verdict) */}
                <div className="w-[320px] bg-white border-l border-[#E2E7EF] flex flex-col shrink-0 overflow-hidden">
                   <div className="p-6 border-b border-[#E2E7EF]">
                      <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-4">MASTER AUDIT AGENT</div>
                      <div className="mb-6">
                         <div className="text-[10px] font-bold text-[#66707A] uppercase mb-1">PRIMARY CAUSE</div>
                         <div className="text-[14px] font-bold text-[#E14B4B] uppercase leading-tight mb-0.5">
                           {ATTRIBUTION_DATA.master_verdict.primary_cause.title}
                         </div>
                      </div>

                      <div className="flex flex-col gap-2">
                         <div className="flex justify-between items-end">
                            <div className="text-[32px] font-bold text-[#E14B4B] leading-none tabular-nums">
                              {(ATTRIBUTION_DATA.master_verdict.primary_cause.probability * 100).toFixed(0)}%
                            </div>
                            <div className="text-[11px] font-bold text-[#E14B4B] uppercase tracking-widest">HIGH CONFIDENCE</div>
                         </div>
                         <div className="w-full h-3 bg-[#EEF2F8] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#D8454C] to-[#E14B4B]" style={{ width: `${ATTRIBUTION_DATA.master_verdict.primary_cause.probability * 100}%` }} />
                         </div>
                      </div>
                      <p className="mt-4 text-[11px] leading-relaxed text-[#66707A]">
                        {ATTRIBUTION_DATA.master_verdict.primary_cause.rationale}
                      </p>
                   </div>

                   <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                      <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-4">EVIDENCE CHAIN (6 LANES)</div>
                      <div className="space-y-4">
                        {ATTRIBUTION_DATA.master_verdict.primary_cause.evidence_chain.map((ev, i) => (
                           <div 
                             key={i} 
                             className="p-3 bg-[#F9FAFB] border border-[#E2E7EF] rounded-sm hover:border-[#2D6CDF] cursor-pointer group transition-all"
                             onClick={() => setSelectedAgentId((ATTRIBUTION_DATA.lanes as any).find((l: any) => l.id === ev.from_lane)?.agent.id)}
                           >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-4 h-4 rounded-full bg-[#0F1722] text-white text-[9px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
                                <span className="text-[10px] font-bold text-[#1A1E23] uppercase">{ev.from_lane.replace('LANE_', '')}</span>
                              </div>
                              <p className="text-[10px] leading-tight text-[#66707A] group-hover:text-[#1A1E23]">{ev.evidence}</p>
                           </div>
                        ))}
                      </div>

                      <div className="mt-8">
                         <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-4">SECONDARY CAUSES</div>
                         <div className="space-y-4">
                            {[ATTRIBUTION_DATA.master_verdict.secondary_cause, ATTRIBUTION_DATA.master_verdict.tertiary_cause].map((cause, i) => (
                               <div key={i}>
                                  <div className="flex justify-between items-center mb-1">
                                    <div className="text-[10px] font-bold text-[#1A1E23] uppercase">{i+1}. {cause.title}</div>
                                    <div className="text-[10px] font-bold tabular-nums">{(cause.probability*100).toFixed(0)}%</div>
                                  </div>
                                  <div className="w-full h-1 bg-[#EEF2F8] rounded-full overflow-hidden">
                                     <div className="h-full bg-[#B23A6A]" style={{ width: `${cause.probability*100}%` }} />
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="mt-8">
                        <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-4">RECOMMENDED ACTIONS</div>
                        <div className="space-y-3">
                          {ATTRIBUTION_DATA.master_verdict.recommended_actions.map((act) => (
                             <div key={act.action_id} className="p-3 border border-[#E2E7EF] rounded-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn("text-[9px] font-black", act.priority === 'IMMEDIATE' ? "text-[#E14B4B]" : "text-[#2D6CDF]")}>
                                    {act.priority === 'IMMEDIATE' ? '◆' : '▲'}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#1A1E23] uppercase leading-tight">{act.title}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                   <span className="text-[8px] font-black text-[#66707A] uppercase">{act.priority} · {act.owner}</span>
                                </div>
                             </div>
                          ))}
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Event Detail Drawer (Bottom) */}
              <AnimatePresence>
                {selectedEventId && selectedEvent && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-40"
                      onClick={() => setSelectedEventId(null)}
                    />
                    <motion.div 
                      key="bottom-drawer"
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="absolute bottom-0 left-0 right-0 h-[280px] bg-white border-t border-[#E2E7EF] shadow-2xl z-50 flex"
                    >
                      <div className="flex-1 p-8 overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase", STATUS_COLORS[selectedEvent.status].label_bg)} style={{ color: STATUS_COLORS[selectedEvent.status].label_text }}>
                                  {selectedEvent.status}
                                </span>
                                <span className="text-[11px] font-bold text-[#98A1AA] uppercase">{selectedEvent.id}</span>
                              </div>
                              <h2 className="text-[20px] font-bold text-[#1A1E23] uppercase tracking-tight">{selectedEvent.title}</h2>
                              <div className="text-[13px] font-medium text-[#66707A]">{selectedEvent.subtitle}</div>
                           </div>
                           <button onClick={() => setSelectedEventId(null)} className="p-2 hover:bg-[#F4F6FA] rounded-full">
                              <X size={20} />
                           </button>
                        </div>

                        <div className="grid grid-cols-3 gap-12">
                           <div className="col-span-2">
                              <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-3">EVENT DESCRIPTION</div>
                              <p className="text-[13px] leading-relaxed text-[#1A1E23]">{selectedEvent.detail}</p>
                              {selectedEvent.ai_inference && (
                                <div className="mt-4 p-3 bg-[#FDECEC] border-l-2 border-[#E14B4B] flex items-center gap-3">
                                   <Zap size={16} className="text-[#E14B4B]" />
                                   <div className="text-[12px] font-bold text-[#E14B4B] uppercase">AI INFERENCE: {selectedEvent.ai_inference}</div>
                                </div>
                              )}
                           </div>
                           <div className="space-y-4">
                              <div>
                                 <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-1">TIMESTAMP</div>
                                 <div className="text-[13px] font-bold text-[#1A1E23]">{selectedEvent.ts}</div>
                              </div>
                              <div>
                                 <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-1">DOCUMENT REFERENCE</div>
                                 <div className="text-[13px] font-bold text-[#2D6CDF] flex items-center gap-1 cursor-pointer hover:underline">
                                    {selectedEvent.doc_ref || 'INTERNAL LOG'} <ExternalLink size={12} />
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Agent Reasoning Drawer (Right) */}
              <AnimatePresence>
                {selectedAgentId && selectedAgentReasoning && selectedAgent && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-40"
                      onClick={() => setSelectedAgentId(null)}
                    />
                    <motion.div 
                      key="right-drawer"
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="absolute top-0 right-0 bottom-0 w-[380px] bg-white border-l border-[#E2E7EF] shadow-2xl z-50 flex flex-col"
                    >
                      <div className="p-8 border-b border-[#E2E7EF] shrink-0">
                         <div className="flex justify-between items-center mb-6">
                            <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest">AGENT REASONING ENGINE</div>
                            <button onClick={() => setSelectedAgentId(null)} className="p-2 hover:bg-[#F4F6FA] rounded-full">
                               <X size={20} />
                            </button>
                         </div>
                         <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-[#EEF2F8] rounded-full flex items-center justify-center text-[#0F1722]">
                               {getIcon(ATTRIBUTION_DATA.lanes.find(l => l.agent.id === selectedAgentId)?.icon || '', 24)}
                            </div>
                            <div>
                               <div className="text-[16px] font-bold text-[#1A1E23] uppercase">{selectedAgent.name_en}</div>
                               <div className="text-[11px] font-bold text-[#66707A] uppercase">{selectedAgent.specialization}</div>
                            </div>
                         </div>
                         <div className="flex items-center justify-between">
                            <div className={cn("px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase", VERDICT_STYLES[selectedAgent.verdict_status].background)} style={{ color: VERDICT_STYLES[selectedAgent.verdict_status].text }}>
                               {VERDICT_STYLES[selectedAgent.verdict_status].label}
                            </div>
                            <div className="text-[14px] font-bold text-[#1A1E23]">CONF {(selectedAgent.confidence * 100).toFixed(0)}%</div>
                         </div>
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                         <h3 className="text-[14px] font-bold text-[#1A1E23] leading-tight mb-6">{selectedAgentReasoning.headline}</h3>
                         
                         <div className="mb-8">
                            <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-4">KEY FINDINGS</div>
                            <div className="space-y-4">
                               {selectedAgentReasoning.key_findings.map((f: string, i: number) => (
                                 <div key={i} className="flex gap-3">
                                    <span className="mt-1 text-[#2D6CDF]"><CheckCircle2 size={12} /></span>
                                    <span className="text-[12px] leading-tight text-[#1A1E23]">{f}</span>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="mb-8">
                            <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-4">SUPPORTING EVIDENCE</div>
                            <div className="flex flex-wrap gap-2">
                               {selectedAgentReasoning.supporting_events.map((eid: string) => (
                                 <button 
                                   key={eid} 
                                   onClick={() => setSelectedEventId(eid)}
                                   className="px-2 py-1 bg-[#EEF2F8] border border-[#E2E7EF] text-[10px] font-bold text-[#2D6CDF] rounded-sm hover:bg-[#2D6CDF] hover:text-white transition-colors"
                                 >
                                    {eid}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div>
                            <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-4">NATURAL LANGUAGE REASONING</div>
                            <p className="text-[12px] leading-relaxed text-[#66707A] italic">"{selectedAgentReasoning.natural_language}"</p>
                         </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
               key="workflow" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
               className="h-full flex-1 flex flex-col overflow-hidden bg-[#F4F6FA]"
            >
              <WorkflowTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const WorkflowTab = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    // Zoom removed for stability as per user request
  }, []);

  const AGENTS = [
    { y: 100, label: 'INGEST · Permits', sub: 'MoE registry feed' },
    { y: 220, label: 'INGEST · Reports', sub: 'self-disclosure stream' },
    { y: 340, label: 'INGEST · Inspect.', sub: 'field logs + SCADA' },
    { y: 460, label: 'INGEST · Sanctions', sub: 'penalty issuance' },
    { y: 580, label: 'INGEST · Rectif.', sub: 'compliance restoration' },
    { y: 700, label: 'INGEST · Reviews', sub: 'closure & audit' },
  ];

  const FEATURES = [
    { y: 150, label: 'SCHEMA GUARD' },
    { y: 250, label: 'ENTITY RESOLVE' },
    { y: 350, label: 'TIMELINE BUILD' },
  ];

  const CLASSIFIER = { y: 420, label: 'CLASSIFIER · stage' };

  const COMPUTE_AGENTS = ATTRIBUTION_DATA.lanes.map((l, i) => ({
    y: 220 + i * 60,
    label: `${l.label_en} AGENT`,
    color: l.agent.verdict_status === 'RED_FLAG' ? COLORS.RED : l.agent.verdict_status === 'YELLOW_FLAG' ? COLORS.AMBER : COLORS.GREEN,
    code: l.id.replace('LANE_', '')
  }));

  return (
    <div className="flex-1 flex overflow-hidden relative" ref={containerRef}>
      {/* LEFT SIDEBAR */}
      <div className="w-[188px] h-full bg-white border-r border-[#E2E7EF] flex flex-col py-6 px-4 z-40">
        <div className="space-y-6">
          {[
            { group: 'Core', items: [{ icon: '◆', label: 'Agent' }, { icon: '◎', label: 'Classify' }, { icon: '■', label: 'End' }, { icon: '✎', label: 'Note' }] },
            { group: 'Tools', items: [{ icon: '🛡', label: 'Guardrails' }, { icon: '✨', label: 'AI Verify' }, { icon: '⚠️', label: 'Anomaly det.' }, { icon: '★', label: 'Score' }] },
            { group: 'Logic', items: [{ icon: '⌥', label: 'If / Else' }, { icon: '⟳', label: 'While' }, { icon: '✓', label: 'User approval' }] },
            { group: 'Data', items: [{ icon: '⇄', label: 'Transform' }, { icon: '⚿', label: 'Set state' }, { icon: '📥', label: 'Load source' }] },
          ].map((cat, i) => (
            <div key={i}>
              <h4 className="text-[10px] font-black text-[#6A7686] uppercase tracking-widest mb-3">{cat.group}</h4>
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

      <div className="flex-1 relative bg-[#F4F6FA] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #D9DEE6 0.6px, transparent 0.6px)', backgroundSize: '18px 18px' }} />

        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" viewBox="0 0 2000 850">
          <g className="zoom-container">
             <defs>
               <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                 <polygon points="0 0, 6 2, 0 4" fill="#C9D0D8" />
               </marker>
             </defs>

             {/* 6-Column Attribution DAG */}
             {/* Connections A to B */}
             {AGENTS.map((a, i) => (
                <path key={`a-b-${i}`} d={`M 402,${a.y + 26} C 424,${a.y + 26} 424,178 440,${i < 3 ? 178 + i * 100 : 278 + (i-3) * 100}`} stroke="#D1D5DB" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
             ))}

             {/* B to C (Classifier) */}
             {FEATURES.map((f, i) => (
                <path key={i} d={`M 614,${f.y + 28} C 640,${f.y + 28} 640,420 666,420`} stroke="#D1D5DB" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
             ))}

             {/* C to D (Attribution Agents) */}
             {COMPUTE_AGENTS.map((_, i) => (
                <path key={i} d={`M 906,${420 + i * 20} C 918,${420 + i * 20} 925,${220 + i * 60 + 25} 930,${220 + i * 60 + 25}`} stroke="#D1D5DB" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
             ))}

             {/* D to F (Master) */}
             {COMPUTE_AGENTS.map((_, i) => (
               <path key={`d-f-${i}`} d={`M 1110,${220 + i * 60 + 25} C 1400,${220 + i * 60 + 25} 1500,284 1620,284`} stroke="#D1D5DB" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" className="opacity-30" />
             ))}

             {/* Feedback & End */}
             <path d="M 1620,264 C 1500,100 600,100 402,126" stroke="#D1D5DB" strokeWidth="0.8" fill="none" strokeDasharray="5,5" markerEnd="url(#arrowhead)" className="opacity-20" />
             <path d="M 1780,264 C 1820,264 1820,441 1620,441" stroke="#D1D5DB" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
             <path d="M 1780,284 C 1820,284 1820,493 1620,493" stroke="#D1D5DB" strokeDasharray="4,4" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" className="opacity-50" />

             {/* COL A: INGEST */}
             <text x="246" y="60" className="text-[10px] font-black fill-[#6A7686] uppercase tracking-[0.2em]">AGENTS · SOURCE</text>
             {AGENTS.map((n, i) => (
                <foreignObject key={i} x="246" y={n.y} width="156" height="52">
                   <div className="w-full h-full bg-white border border-[#E2E7EF] flex group hover:border-[#2D6CDF] transition-all">
                     <div className="w-1 bg-[#2D6CDF] h-full" />
                     <div className="flex-1 p-2 flex flex-col justify-center">
                        <div className="flex items-center gap-1 mb-0.5">
                           <span className="text-[8px] text-[#2D6CDF]">◆</span>
                           <span className="text-[8.4px] font-black uppercase truncate">{n.label}</span>
                        </div>
                        <div className="text-[6.8px] text-[#6A7686] uppercase truncate font-bold">{n.sub}</div>
                     </div>
                   </div>
                </foreignObject>
             ))}

             {/* COL B: FEATURES */}
             <text x="446" y="60" className="text-[10px] font-black fill-[#6A7686] uppercase tracking-[0.2em]">FEATURE PIPELINE</text>
             {FEATURES.map((n, i) => (
                <foreignObject key={i} x="446" y={n.y} width="168" height="56">
                   <div className="w-full h-full bg-white border border-[#2AB3A6] flex group hover:border-[#2D6CDF] transition-all">
                     <div className="w-1 bg-[#2AB3A6] h-full" />
                     <div className="flex-1 p-2 flex flex-col justify-between">
                        <div className="flex items-center gap-1.5">
                           <span className="text-[10px] text-[#2AB3A6]">◎</span>
                           <span className="text-[8.4px] font-black uppercase">{n.label}</span>
                        </div>
                        <div className="px-1.5 py-0.5 bg-[#2FA862]15 text-[#2FA862] text-[7px] font-black border border-[#2FA862]30 rounded-[2px] w-fit">PASS</div>
                     </div>
                   </div>
                </foreignObject>
             ))}

             {/* COL C: CLASSIFIER */}
             <text x="666" y="60" className="text-[10px] font-black fill-[#6A7686] uppercase tracking-[0.2em]">CONDITION</text>
             <foreignObject x="666" y={CLASSIFIER.y} width="240" height="260">
                <div className="w-full h-full bg-white border border-[#C9CFDA] p-4 flex flex-col rounded-[4px] shadow-sm">
                   <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] text-[#0F1722]">◇</span>
                      <span className="text-[8.4px] font-black uppercase tracking-tight">{CLASSIFIER.label}</span>
                   </div>
                   <div className="text-[6.8px] text-[#6A7686] uppercase font-black mb-4">routes event to attribution agent</div>
                   <div className="flex-1 space-y-1.5">
                      {['APPROVAL', 'REPORTING', 'INSPECTION', 'SANCTION', 'RECTIFICATION', 'REVIEW'].map((s, i) => (
                        <div key={i} className="h-[28px] bg-[#FAFBFD] border border-[#E2E7EF] flex items-center justify-between px-2 hover:border-[#2D6CDF] transition-all group">
                           <span className="text-[7.4px] font-black font-mono text-[#0F1722]">stage == {s}</span>
                           <div className="w-1.5 h-1.5 rounded-full bg-[#DDE3EC] group-hover:bg-[#2D6CDF]" />
                        </div>
                      ))}
                   </div>
                </div>
             </foreignObject>

             {/* COL D: ATTRIBUTION AGENTS */}
             <text x="930" y="60" className="text-[10px] font-black fill-[#6A7686] uppercase tracking-[0.2em]">ATTRIBUTION AGENTS</text>
             {COMPUTE_AGENTS.map((agent, i) => (
               <g key={agent.code}>
                  <foreignObject x="930" y={220 + i * 60} width="180" height="50">
                    <div className="w-full h-full bg-white border border-[#E2E7EF] flex group hover:border-[#2D6CDF] transition-all">
                       <div className="w-1 h-full" style={{ backgroundColor: agent.color }} />
                       <div className="flex-1 p-2 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5 mb-1">
                             <span className="text-[8px]" style={{ color: agent.color }}>◆</span>
                             <span className="text-[8.4px] font-black uppercase tracking-tight">{agent.label}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="px-1.5 py-0.5 bg-[#EEF2F8] text-[#2D6CDF] text-[7px] font-black rounded-[2px]">ACTIVE</div>
                            <div className="text-[8px] font-black tabular-nums" style={{ color: agent.color }}>{agent.code}</div>
                          </div>
                       </div>
                    </div>
                  </foreignObject>
               </g>
             ))}

             {/* COL F: MASTER */}
             <text x="1620" y="60" className="text-[10px] font-black fill-[#6A7686] uppercase tracking-[0.2em]">MASTER & VERDICT</text>
             <foreignObject x="1620" y="200" width="160" height="168">
                <div className="w-full h-full bg-[#0F1722] border-2 border-dashed border-[#D8454C] p-4 flex flex-col items-center justify-between rounded-[4px]">
                    <div className="w-full text-center">
                       <div className="text-[8.4px] font-black text-white uppercase tracking-widest mb-1">◆ MASTER AUDIT</div>
                       <div className="text-[6.8px] text-white/40 uppercase font-black tracking-widest">Bayesian ensemble</div>
                    </div>
                    <div className="flex flex-col items-center">
                       <div className="text-[36px] font-black text-[#D8454C] leading-none mb-1 tabular-nums">0.85</div>
                       <div className="text-[10px] font-black text-[#D8454C] uppercase tracking-widest leading-none">POSTERIOR</div>
                    </div>
                    <div className="flex gap-2 w-full">
                       <div className="flex-1 bg-white/10 px-1 py-1.5 text-center text-[7px] text-white/60 font-black uppercase tracking-widest">prior 0.71</div>
                       <div className="flex-1 bg-[#D8454C]/20 px-1 py-1.5 text-center text-[7px] text-[#D8454C] font-black uppercase tracking-widest">Δ +0.14</div>
                    </div>
                    <div className="text-[6.6px] font-black text-white uppercase tracking-[0.2em] border-t border-white/20 pt-2 w-full text-center leading-tight">UNREPORTED CAP. EXP.</div>
                </div>
             </foreignObject>

             {/* END NODES */}
             <foreignObject x="1620" y="420" width="160" height="42">
                <div className="w-full h-full border border-[#E2E7EF] bg-white p-2.5 flex items-center gap-2 group hover:border-[#2FA862] transition-colors cursor-pointer rounded-[2px]">
                   <div className="w-2 h-2 bg-[#2FA862] rounded-full" />
                   <span className="text-[10px] font-black text-[#0F1722] uppercase tracking-[0.1em]">□ End · CASE OPEN</span>
                </div>
             </foreignObject>
             <foreignObject x="1620" y="472" width="160" height="42">
                <div className="w-full h-full border border-[#E2E7EF] bg-[#0F1722] p-2.5 flex items-center gap-2 group hover:border-white transition-colors cursor-pointer rounded-[2px]">
                   <div className="w-2 h-2 bg-white/20 rounded-full" />
                   <span className="text-[10px] font-black text-white uppercase tracking-[0.1em]">□ End · CASE CLOSE</span>
                </div>
             </foreignObject>
          </g>
        </svg>

        {/* TOOLBAR */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur border border-[#E2E7EF] p-1.5 flex items-center gap-1 shadow-2xl rounded-sm z-[100]">
           {[Hand, MousePointer2, RotateCcw, RotateCcw].map((Icon, i) => (
             <button key={i} className={cn("w-9 h-9 flex items-center justify-center text-[#6A7686] hover:bg-[#F4F6FA] hover:text-[#0F1722] transition-colors", i === 3 && "-scale-x-100")}>
                <Icon size={18} />
             </button>
           ))}
        </div>

        {/* ZOOM */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-1.5 z-[100]">
           <button className="w-9 h-9 bg-white border border-[#E2E7EF] shadow-lg flex items-center justify-center font-black text-[15px] hover:bg-bg-secondary">+</button>
           <button className="w-9 h-9 bg-white border border-[#E2E7EF] shadow-lg flex items-center justify-center font-black text-[15px] hover:bg-bg-secondary">−</button>
           <button className="w-9 h-9 bg-white border border-[#E2E7EF] shadow-lg flex items-center justify-center hover:bg-bg-secondary"><Maximize2 size={14} /></button>
           <button className="w-9 h-9 bg-white border border-[#E2E7EF] shadow-lg flex items-center justify-center hover:bg-bg-secondary"><Lock size={14} /></button>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-4 left-[220px] text-[8.5px] font-black text-[#6A7686] uppercase tracking-[0.25em]">
           15 agents · 6 attribution branches · 72 monthly result cards · ensemble 0.85
        </div>
        <button className="absolute bottom-4 right-8 bg-[#2D6CDF] text-white px-4 py-1.5 text-[8.5px] font-black uppercase tracking-[0.15em] rounded-sm hover:opacity-90 shadow-lg">
           EXPORT JSON
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  ArrowLeft,
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

const PREVENTIVE_INTERVENTION = {
  deadline: '36H',
  risk: '68%',
  owner: 'Inspection Dept',
  target: 'Unit-2C + 12 substations',
  effect: 'prevent escalation before safety / revenue loss window opens',
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

// --- Page Component ---

export default function WorkflowAttribution() {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow'>('overview');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const navigate = useNavigate();

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

  const handleTabChange = (tab: 'overview' | 'workflow') => {
    setActiveTab(tab);
  };

  const selectedEvent = ATTRIBUTION_DATA.events.find(e => e.id === selectedEventId);
  const selectedAgentReasoning = selectedAgentId ? (ATTRIBUTION_DATA.agent_reasoning as any)[selectedAgentId] : null;
  const selectedAgent = selectedAgentId ? ATTRIBUTION_DATA.lanes.find(l => l.agent.id === selectedAgentId)?.agent : null;

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6FA] text-[#1A2330] font-sans overflow-hidden">
      {/* TOP BAR */}
      <div className="h-10 border-b border-[#E2E7EF] bg-white flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1 text-[10px] font-bold text-text-tertiary hover:text-text-primary uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={12} /> Back
          </button>
          <div className="w-px h-3 bg-[#E2E7EF]" />
          <span className="text-[11px] font-bold uppercase tracking-tight text-[#0F1722]">Agent Attribution Workflow</span>
        </div>

        <div className="flex items-center bg-[#EEF2F8] rounded-full p-0.5 border border-[#E2E7EF] mx-auto">
          <button onClick={() => handleTabChange('overview')} className={cn("px-5 py-1 text-[9px] font-bold rounded-full transition-all", activeTab === 'overview' ? "bg-[#0F1722] text-white" : "text-[#6A7686]")}>EVIDENCE SUMMARY</button>
          <button onClick={() => handleTabChange('workflow')} className={cn("px-5 py-1 text-[9px] font-bold rounded-full transition-all flex items-center gap-1.5", activeTab === 'workflow' ? "bg-[#0F1722] text-white" : "text-[#6A7686]")}>
            AGENT COMPUTATION DAG
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-[#0F1722] text-white text-[8px] font-bold rounded-[3px]">CASE-2026-001</div>
          <div className="px-2 py-0.5 bg-[#D8454C] text-white text-[8px] font-bold rounded-[3px]">POSTERIOR 0.85</div>
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
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-text-secondary font-bold uppercase">Oversight Incident Attribution Workflow</span>
                  <span className="px-1.5 py-0.5 bg-white border border-[#E2E7EF] text-[9px] font-bold rounded-sm text-[#D8454C]">[SEVERITY: CRITICAL]</span>
                </div>
                <div className="text-[9px] font-bold text-[#6A7686] uppercase tracking-wider">
                  Master Agent Model: {ATTRIBUTION_DATA.master_agent.model}   |   7/7 Sub-Agents Active
                </div>
              </div>

              {/* Main Body (Split into Left: Content & Right: Master Verdict) */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Area (Actions + Collapsible Timeline) */}
                <div className="flex-1 flex flex-col bg-[#F5F7FA] p-6 overflow-y-auto space-y-6 custom-scrollbar">
                  
                  {/* Premium Action Summary Card (First Fold Focus) */}
                  <div className="bg-[#1A1E23] text-white p-6 rounded-md shadow-md border-b-2 border-status-critical">
                    <div className="flex justify-between items-start gap-6">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">
                          <ShieldCheck size={14} className="text-white/72" /> Joint Agent Consensus Verdict
                        </div>
                        <h3 className="text-[19px] font-black tracking-tight leading-tight uppercase text-status-critical">
                          Primary Cause: {ATTRIBUTION_DATA.master_verdict.primary_cause.title} (Confidence: {(ATTRIBUTION_DATA.master_verdict.primary_cause.probability * 100).toFixed(0)}%)
                        </h3>
                        <p className="text-[11.5px] text-white/72 mt-2 leading-relaxed max-w-[720px]">
                          {ATTRIBUTION_DATA.master_verdict.primary_cause.rationale}
                        </p>
                      </div>
                      <div className="bg-status-critical/10 border border-status-critical/30 p-3 text-center shrink-0 min-w-[120px] rounded-sm">
                        <span className="text-[8px] text-white/50 font-bold uppercase tracking-wider block">90D Safety Risk</span>
                        <span className="text-[26px] font-black text-status-critical leading-none mt-1 block font-mono">68%</span>
                        <span className="text-[8px] text-white/60 font-bold mt-1 block">Thermal Overload</span>
                      </div>
                    </div>
                  </div>

                  {/* 36H Dispatch SLA Box */}
                  <div className="bg-[#0F1722] text-white p-5 rounded-md border border-[#0F1722] flex items-center justify-between gap-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white/10 rounded-sm text-status-warning">
                        <Clock size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Immediate Preventive Intervention</div>
                        <h4 className="text-[14px] font-bold text-white mt-0.5">
                          {PREVENTIVE_INTERVENTION.owner} suggested to inspect <span className="text-status-warning">{PREVENTIVE_INTERVENTION.target}</span>
                        </h4>
                        <p className="text-[11px] text-white/72 mt-0.5">
                          Prevent incident escalation before the safety and capacity-breach window opens.
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[8px] text-white/50 font-bold uppercase tracking-wider block">Intervention Window</span>
                      <span className="text-[20px] font-black text-status-warning leading-none block font-mono mt-1">36 Hours</span>
                    </div>
                  </div>

                  {/* Collapsible Accordion: Deep-Dive Evidence Chain: 6-Agent Timeline Analysis */}
                  <div className="bg-white border border-border-default rounded-md shadow-sm overflow-hidden">
                    <button 
                      onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-text-primary border-b border-border-default hover:bg-bg-hover transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck size={16} className="text-text-tertiary" />
                        <span className="text-[13px] uppercase tracking-wider">Deep-Dive Evidence Chain: 6-Agent Timeline Analysis</span>
                      </div>
                      {isTimelineExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isTimelineExpanded && (
                      <div className="p-4 bg-white flex flex-col">
                        <div className="text-[10px] text-text-tertiary mb-3 flex justify-between items-center">
                          <span>Timeline view of verified events across 6 distinct sub-agent specializations</span>
                          <span className="font-bold">Select any node/agent to open details</span>
                        </div>
                        
                        <div className="flex border border-border-default h-[580px] rounded-sm overflow-hidden">
                          {/* Swimlane Labels (Sticky Left) */}
                          <div className="w-[280px] bg-white border-r border-[#E2E7EF] flex flex-col shrink-0 overflow-y-auto no-scrollbar">
                            {ATTRIBUTION_DATA.lanes.map((lane, idx) => {
                              const verdict = VERDICT_STYLES[lane.agent.verdict_status];
                              return (
                                <div 
                                  key={lane.id} 
                                  className={cn(
                                    "h-[96px] px-4 py-3 border-b border-[#E2E7EF] flex flex-col justify-between hover:bg-[#F9FAFB] cursor-pointer transition-colors group relative",
                                    selectedAgentId === lane.agent.id && "bg-[#EEF2F8]",
                                    idx % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]/50"
                                  )}
                                  onClick={() => setSelectedAgentId(lane.agent.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="text-[#0F1722] p-1.5 bg-[#F4F6FA] rounded-md group-hover:bg-white transition-colors shadow-sm">
                                      {getIcon(lane.icon, 18)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[12px] font-black uppercase leading-tight truncate">{lane.label_en}</span>
                                      <span className="text-[9px] font-bold text-[#98A1AA] uppercase tracking-wider truncate">{lane.agent.name_en}</span>
                                    </div>
                                  </div>
                                 
                                  <div className="flex justify-between items-end mt-2">
                                    <span className={cn(
                                      "px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border",
                                      lane.agent.verdict_status === 'RED_FLAG' && "red-tag-pulse"
                                    )} style={{ backgroundColor: 'white', color: verdict.text, borderColor: verdict.text }}>
                                      {verdict.label}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                       <span className="text-[10px] font-black tabular-nums text-[#1A1E23]">{(lane.agent.confidence * 100).toFixed(0)}%</span>
                                       <div className="w-8 h-1 bg-[#E2E7EF] rounded-full overflow-hidden">
                                          <div className="h-full bg-current transition-all" style={{ width: `${lane.agent.confidence * 100}%`, color: verdict.text }} />
                                       </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Timeline Swimlane SVG */}
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

                        {/* Timeline Actions Footer */}
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-default">
                          <div className="flex gap-2">
                            <span className="text-[10px] text-text-tertiary font-bold flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-[#E14B4B] rounded-full shrink-0" /> Critical Anomaly
                            </span>
                            <span className="text-[10px] text-text-tertiary font-bold flex items-center gap-1.5 ml-3">
                              <span className="w-2.5 h-2.5 bg-[#E7A53A] rounded-full shrink-0" /> Warning Trigger
                            </span>
                            <span className="text-[10px] text-text-tertiary font-bold flex items-center gap-1.5 ml-3">
                              <span className="w-2.5 h-2.5 bg-[#2FBF71] rounded-full shrink-0" /> Nominal State
                            </span>
                          </div>
                          <button 
                            onClick={() => navigate('/attribution/graph')}
                            className="text-[11px] font-bold text-text-primary hover:text-bg-dark transition-colors uppercase tracking-wider flex items-center gap-1.5"
                          >
                            Explore Knowledge Graph <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel (Consensus Details & Evidence Chain) */}
                <div className="w-[340px] bg-white border-l border-[#E2E7EF] flex flex-col shrink-0 overflow-y-auto p-6 space-y-6 z-10 custom-scrollbar">
                  <div>
                    <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-3">AI Evidence Chain</div>
                    <div className="space-y-3">
                      {ATTRIBUTION_DATA.master_verdict.primary_cause.evidence_chain.map((ev, i) => (
                         <div 
                           key={i} 
                           className="p-3 bg-[#F9FAFB] border border-[#E2E7EF] rounded-sm hover:border-[#2D6CDF] cursor-pointer group transition-all"
                           onClick={() => {
                             setIsTimelineExpanded(true);
                             setSelectedAgentId((ATTRIBUTION_DATA.lanes as any).find((l: any) => l.id === ev.from_lane)?.agent.id);
                           }}
                         >
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-4 h-4 rounded-full bg-[#0F1722] text-white text-[9px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
                              <span className="text-[9.5px] font-bold text-[#1A1E23] uppercase tracking-wider">{ev.from_lane.replace('LANE_', '')}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-[#66707A] group-hover:text-[#1A1E23]">{ev.evidence}</p>
                         </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border-default pt-5">
                    <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-3">Secondary Hypotheses</div>
                    <div className="space-y-4">
                       {[ATTRIBUTION_DATA.master_verdict.secondary_cause, ATTRIBUTION_DATA.master_verdict.tertiary_cause].map((cause, i) => (
                          <div key={i}>
                             <div className="flex justify-between items-center mb-1">
                               <div className="text-[10px] font-bold text-[#1A1E23] uppercase">{i+1}. {cause.title}</div>
                               <div className="text-[10px] font-bold font-mono">{(cause.probability*100).toFixed(0)}%</div>
                             </div>
                             <div className="w-full h-1 bg-[#EEF2F8] rounded-full overflow-hidden">
                                <div className="h-full bg-[#B23A6A]" style={{ width: `${cause.probability*100}%` }} />
                             </div>
                          </div>
                       ))}
                    </div>
                  </div>

                  <div className="border-t border-border-default pt-5">
                    <div className="text-[11px] font-bold text-[#98A1AA] uppercase tracking-widest mb-3">Action Recommendations</div>
                    <div className="space-y-3">
                      {ATTRIBUTION_DATA.master_verdict.recommended_actions.map((act) => (
                         <div key={act.action_id} className="p-3 border border-[#E2E7EF] bg-[#FAFAFA] rounded-sm">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className={cn("text-[9px] font-black", act.priority === 'IMMEDIATE' ? "text-[#E14B4B]" : "text-[#2D6CDF]")}>
                                {act.priority === 'IMMEDIATE' ? '◆' : '▲'}
                              </span>
                              <span className="text-[10px] font-bold text-[#1A1E23] uppercase leading-tight">{act.title}</span>
                            </div>
                            <div className="flex justify-between items-center text-[8.5px] font-bold text-[#66707A] uppercase tracking-wider">
                               <span>Priority: {act.priority}</span>
                               <span>{act.owner}</span>
                            </div>
                         </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-default space-y-2">
                    <button 
                      onClick={() => navigate('/audit/event/CASE-2026-001')}
                      className="w-full min-h-[44px] bg-status-critical text-white text-[11px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all rounded-sm flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileCheck size={14} /> Dispatch Inspection SLA
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Detail Drawer (Bottom popup when clicking nodes) */}
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

              {/* Agent Reasoning Drawer (Right popup when clicking swimlanes) */}
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
               key="workflow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
               className="h-full flex-1 flex flex-col overflow-hidden bg-white p-6 max-w-[1200px] mx-auto space-y-6"
            >
              {/* DAG Header */}
              <div className="shrink-0">
                <h3 className="text-[14px] font-bold uppercase tracking-tight text-text-primary">Bayesian Ensemble Computation Flow DAG</h3>
                <p className="text-[11px] text-text-tertiary mt-1">
                  Visualization of parallel ingestion streams, range validation filters, classification routing, compute agents, and master agent consensus verdict logic.
                </p>
              </div>

              {/* Dotted Grid and SVG Workflow Canvas */}
              <div className="flex-1 relative bg-[#FAFBFD] border border-border-default overflow-hidden rounded-md">
                <div 
                  className="absolute inset-0 pointer-events-none" 
                  style={{ 
                    backgroundImage: 'radial-gradient(circle, #D9DEE6 0.6px, transparent 0.6px)', 
                    backgroundSize: '18px 18px' 
                  }} 
                />

                <svg className="w-full h-full cursor-grab" viewBox="0 0 2000 850" preserveAspectRatio="xMidYMid meet">
                  <g className="zoom-container" transform="translate(40, 20) scale(0.9)">
                     <defs>
                       <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                         <polygon points="0 0, 6 2, 0 4" fill="#C9D0D8" />
                       </marker>
                     </defs>

                     {/* 6-Column Attribution DAG Connections */}
                     {[100, 220, 340, 460, 580, 700].map((y, i) => (
                        <path key={`a-b-${i}`} d={`M 402,${y + 26} C 424,${y + 26} 424,178 440,${i < 3 ? 178 + i * 100 : 278 + (i-3) * 100}`} stroke="#D1D5DB" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                     ))}

                     {[150, 250, 350].map((y, i) => (
                        <path key={i} d={`M 614,${y + 28} C 640,${y + 28} 640,420 666,420`} stroke="#D1D5DB" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                     ))}

                     {[220, 280, 340, 400, 460, 520].map((y, i) => (
                        <path key={i} d={`M 906,${420 + i * 20} C 918,${420 + i * 20} 925,${y + 25} 930,${y + 25}`} stroke="#D1D5DB" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" />
                     ))}

                     {[220, 280, 340, 400, 460, 520].map((y, i) => (
                       <path key={`d-f-${i}`} d={`M 1110,${y + 25} C 1400,${y + 25} 1500,284 1620,284`} stroke="#D1D5DB" strokeWidth="1.2" fill="none" markerEnd="url(#arrowhead)" className="opacity-30" />
                     ))}

                     <path d="M 1620,264 C 1500,100 600,100 402,126" stroke="#D1D5DB" strokeWidth="0.8" fill="none" strokeDasharray="5,5" markerEnd="url(#arrowhead)" className="opacity-20" />
                     <path d="M 1780,264 C 1820,264 1820,441 1620,441" stroke="#D1D5DB" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
                     <path d="M 1780,284 C 1820,284 1820,493 1620,493" stroke="#D1D5DB" strokeDasharray="4,4" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" className="opacity-50" />

                     {/* COL A: INGEST */}
                     <text x="246" y="60" className="text-[11px] font-black fill-[#6A7686] uppercase tracking-widest">INGESTION AGENTS</text>
                     {[
                       { y: 100, label: 'INGEST · Permits', sub: 'MoE registry feed' },
                       { y: 220, label: 'INGEST · Reports', sub: 'self-disclosure stream' },
                       { y: 340, label: 'INGEST · Inspect.', sub: 'field logs + SCADA' },
                       { y: 460, label: 'INGEST · Sanctions', sub: 'penalty issuance' },
                       { y: 580, label: 'INGEST · Rectif.', sub: 'compliance restoration' },
                       { y: 700, label: 'INGEST · Reviews', sub: 'closure & audit' },
                     ].map((n, i) => (
                        <foreignObject key={i} x="246" y={n.y} width="156" height="52">
                           <div className="w-full h-full bg-white border border-[#E2E7EF] flex group hover:border-[#2D6CDF] transition-all rounded-sm">
                             <div className="w-1 bg-[#2D6CDF] h-full" />
                             <div className="flex-1 p-2 flex flex-col justify-center">
                                <div className="flex items-center gap-1 mb-0.5">
                                   <span className="text-[8px] text-[#2D6CDF]">◆</span>
                                   <span className="text-[8.5px] font-black uppercase truncate">{n.label}</span>
                                </div>
                                <div className="text-[7px] text-[#6A7686] uppercase truncate font-bold">{n.sub}</div>
                             </div>
                           </div>
                        </foreignObject>
                     ))}

                     {/* COL B: FEATURES */}
                     <text x="446" y="60" className="text-[11px] font-black fill-[#6A7686] uppercase tracking-widest">FEATURE PIPELINE</text>
                     {[
                       { y: 150, label: 'SCHEMA GUARD' },
                       { y: 250, label: 'ENTITY RESOLVE' },
                       { y: 350, label: 'TIMELINE BUILD' },
                     ].map((n, i) => (
                        <foreignObject key={i} x="446" y={n.y} width="168" height="56">
                           <div className="w-full h-full bg-white border border-[#2AB3A6] flex group hover:border-[#2D6CDF] transition-all rounded-sm">
                             <div className="w-1 bg-[#2AB3A6] h-full" />
                             <div className="flex-1 p-2 flex flex-col justify-between">
                                <div className="flex items-center gap-1.5">
                                   <span className="text-[10px] text-[#2AB3A6]">◎</span>
                                   <span className="text-[8.5px] font-black uppercase">{n.label}</span>
                                </div>
                                <div className="px-1.5 py-0.5 bg-[#2FA862]15 text-[#2FA862] text-[7px] font-black rounded-sm border border-[#2FA862]30 w-fit">PASS</div>
                             </div>
                           </div>
                        </foreignObject>
                     ))}

                     {/* COL C: CLASSIFIER */}
                     <text x="666" y="60" className="text-[11px] font-black fill-[#6A7686] uppercase tracking-widest">CLASSIFIER</text>
                     <foreignObject x="666" y="320" width="240" height="220">
                        <div className="w-full h-full bg-white border border-[#C9CFDA] rounded-[4px] p-3 flex flex-col overflow-hidden">
                           <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] text-[#0F1722]">◇</span>
                              <span className="text-[8.5px] font-bold uppercase">CLASSIFIER · stage</span>
                           </div>
                           <div className="text-[7px] text-[#6A7686] uppercase mb-3 font-bold">routes signal to matching branch</div>
                           <div className="flex-1 space-y-1">
                              {['PERMITS', 'REPORTS', 'INSPECT.', 'SANCTIONS', 'RECTIF.', 'REVIEWS'].map((b, i) => (
                                 <div key={i} className="h-[24px] bg-[#FAFBFD] border border-[#E2E7EF] flex items-center justify-between px-2 group hover:border-[#2D6CDF] transition-all rounded-sm">
                                    <span className="text-[7.5px] font-bold font-mono text-[#0F1722]">stage == {b}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#DDE3EC] group-hover:bg-[#2D6CDF]" />
                                 </div>
                              ))}
                           </div>
                        </div>
                     </foreignObject>

                     {/* COL D: COMPUTE */}
                     <text x="930" y="60" className="text-[11px] font-black fill-[#6A7686] uppercase tracking-widest">COMPUTE AGENTS</text>
                     {ATTRIBUTION_DATA.lanes.map((l, i) => {
                       const computeColor = l.agent.verdict_status === 'RED_FLAG' ? COLORS.RED : l.agent.verdict_status === 'YELLOW_FLAG' ? COLORS.AMBER : COLORS.GREEN;
                       return (
                        <g key={i}>
                          <foreignObject x="930" y={220 + i * 60} width="180" height="50">
                             <div className="w-full h-full bg-white border border-[#E2E7EF] flex rounded-sm">
                                <div className="w-1 h-full" style={{ backgroundColor: computeColor }} />
                                <div className="flex-1 p-2 flex flex-col justify-center gap-1">
                                   <div className="flex items-center gap-1">
                                      <span className="text-[9px]" style={{ color: computeColor }}>◆</span>
                                      <span className="text-[8.5px] font-black uppercase truncate">{l.label_en} AGENT</span>
                                   </div>
                                   <div className="px-1.5 py-0.5 bg-[#EEF2F8] text-[#2D6CDF] text-[7.5px] font-bold rounded-sm w-fit">ACTIVE</div>
                                </div>
                             </div>
                          </foreignObject>
                        </g>
                       );
                     })}

                     {/* COL F: MASTER */}
                     <text x="1620" y="60" className="text-[11px] font-black fill-[#6A7686] uppercase tracking-widest">MASTER AGENT</text>
                     <foreignObject x="1620" y="180" width="180" height="168">
                       <div className="w-full h-full bg-[#0F1722] border-2 border-dashed border-[#D8454C] p-4 flex flex-col items-center justify-between rounded-sm">
                          <div className="w-full text-center">
                             <div className="text-[8.5px] font-black text-white uppercase tracking-widest mb-1">◆ MASTER AUDIT</div>
                             <div className="text-[7px] text-white/40 uppercase font-black font-mono">Bayesian ensemble</div>
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

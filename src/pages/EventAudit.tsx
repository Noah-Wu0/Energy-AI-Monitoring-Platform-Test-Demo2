import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  User,
  Star,
  Zap,
  X,
  History,
  ShieldCheck,
  TrendingDown,
  ChevronRight,
  GitBranch,
  Search,
  Maximize,
  Download,
  Filter,
  FileCheck,
  FileText
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Data import
import { case001LifecycleMatrix as DATA } from '../data/audit/case_001_lifecycle_matrix';

// --- Types ---
type NodeStatus = 'NORMAL' | 'PROGRESS' | 'WARNING' | 'CRITICAL' | 'PENDING';

const STATUS_COLORS: Record<NodeStatus, { fill: string; border: string; text: string; label: string }> = {
  NORMAL:   { fill: '#E6F6EC', border: '#1E9E54', text: '#1E9E54', label: 'NORMAL' },
  PROGRESS: { fill: '#FFF6E1', border: '#D38B0A', text: '#D38B0A', label: 'PROGRESS' },
  WARNING:  { fill: '#FEEBC8', border: '#DD6B20', text: '#DD6B20', label: 'WARNING' },
  CRITICAL: { fill: '#FDE7E7', border: '#D92D20', text: '#D92D20', label: 'CRITICAL' },
  PENDING:  { fill: '#F1F4F8', border: '#B5BFCC', text: '#64748B', label: 'PENDING' },
};

// --- Sub-components ---

const ProcessCard = ({ node, onClick, isSelected }: { node: any; onClick: () => void; isSelected: boolean }) => {
  const status = STATUS_COLORS[node.status as NodeStatus] || STATUS_COLORS.PENDING;
  
  return (
    <motion.div
      layoutId={node.id}
      onClick={onClick}
      className={cn(
        "relative w-[132px] h-[54px] rounded-md p-2 flex flex-col justify-between cursor-pointer transition-all border shrink-0",
        isSelected ? "ring-2 ring-bg-dark border-transparent z-10" : "border-[#D8DEE8] hover:border-text-tertiary",
        node.ai_flag && "ring-[1.4px] ring-[#1570EF] ring-offset-1"
      )}
      style={{ backgroundColor: status.fill }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
           <div className={cn("w-1.5 h-1.5 rounded-full", node.status === 'CRITICAL' && "agent-dot-pulse")} style={{ backgroundColor: status.border }} />
           <span className="text-[7px] font-bold tracking-widest text-text-tertiary uppercase">{status.label}</span>
        </div>
        {node.ai_flag && (
           <span className="text-[7px] font-bold text-[#1570EF] bg-[#1570EF]/10 px-1 rounded-sm">AI</span>
        )}
      </div>
      <div className="text-[8.5px] font-bold text-bg-dark leading-tight line-clamp-1 truncate uppercase tracking-tight">{node.title}</div>
      <div className="flex justify-between items-end">
         <span className="text-[6.5px] text-text-tertiary font-mono truncate max-w-[60px]">{node.owner}</span>
         {node.badges?.[0] && (
           <span className="text-[6px] font-bold bg-white/60 px-1 border border-black/5 rounded-[2px]">{node.badges[0]}</span>
         )}
      </div>
    </motion.div>
  );
};

// --- Main Page Component ---

export default function EventAudit() {
  const navigate = useNavigate();
  const { caseId = 'CASE-2026-001' } = useParams();
  
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeStrategies, setActiveStrategies] = useState<Set<string>>(new Set(['OPT-01', 'OPT-02', 'OPT-04']));
  const [isApplying, setIsApplying] = useState(false);
  const [scale, setScale] = useState(1);
  const [isBottomExpanded, setIsBottomExpanded] = useState(true);
  const [minimizedPanels, setMinimizedPanels] = useState<Set<string>>(new Set());
  
  const matrixRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [edgePaths, setEdgePaths] = useState<any[]>([]);

  // Calculate edges on mount and resize
  const calculateEdges = useCallback(() => {
    if (!matrixRef.current || !canvasRef.current) return;
    
    const container = matrixRef.current;
    const canvas = canvasRef.current;
    const containerRect = container.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    // Coordinates need to be relative to the canvas origin (top-left of the matrix grid)
    // When scaled, getBoundingClientRect returns the visually transformed size.
    // We need the raw coordinates before scaling for the SVG internal paths IF the SVG scales with the canvas.
    // If the SVG is INSIDE the scaled content, we just need the relative positions of the nodes.
    
    const paths = DATA.edges.map(edge => {
      const fromNode = nodeRefs.current[edge.from];
      const toNode = nodeRefs.current[edge.to];
      if (!fromNode || !toNode) return null;

      const fromRect = fromNode.getBoundingClientRect();
      const toRect = toNode.getBoundingClientRect();

      // Get center points of nodes relative to the canvas top-left
      // We divide by scale if calculating paths of an SVG that IS SCALED.
      const s = scale;
      const x1_center = (fromRect.left + fromRect.width / 2 - canvasRect.left) / s;
      const y1_center = (fromRect.top + fromRect.height / 2 - canvasRect.top) / s;
      const x2_center = (toRect.left + toRect.width / 2 - canvasRect.left) / s;
      const y2_center = (toRect.top + toRect.height / 2 - canvasRect.top) / s;

      const fromWidth = fromRect.width / s;
      const fromHeight = fromRect.height / s;
      const toWidth = toRect.width / s;
      const toHeight = toRect.height / s;

      let x1 = x1_center;
      let y1 = y1_center;
      let x2 = x2_center;
      let y2 = y2_center;

      const dx = x2_center - x1_center;
      const dy = y2_center - y1_center;

      // Smart boundary connection points avoiding cards overlap
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          x1 = x1_center + fromWidth / 2;
          x2 = x2_center - toWidth / 2;
        } else {
          x1 = x1_center - fromWidth / 2;
          x2 = x2_center + toWidth / 2;
        }
      } else {
        if (dy > 0) {
          y1 = y1_center + fromHeight / 2;
          y2 = y2_center - toHeight / 2;
        } else {
          y1 = y1_center - fromHeight / 2;
          y2 = y2_center + toHeight / 2;
        }
      }

      let d = "";
      const isReturn = edge.type === 'RETURN';
      
      if (isReturn) {
        // Curve downwards if low y, curve upwards if high y
        const midX = (x1 + x2) / 2;
        const curveOffset = y1 < 250 ? 80 : -100;
        const midY = Math.min(y1, y2) + curveOffset;
        d = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
      } else {
        // Smooth S-curve
        if (Math.abs(dx) > Math.abs(dy)) {
          const midX = (x1 + x2) / 2;
          d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
        } else {
          const midY = (y1 + y2) / 2;
          d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
        }
      }

      return { ...edge, d, x1, y1, x2, y2 };
    }).filter(Boolean);

    setEdgePaths(paths);
  }, [scale]);

  useEffect(() => {
    // Initial calculation
    const timer = setTimeout(calculateEdges, 100); 
    
    // Resize handler
    const handleResize = () => {
      calculateEdges();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateEdges, isDrawerOpen, scale, isBottomExpanded, minimizedPanels]);

  // Recalculate if scrolling, though we might want to use relative coordinates in SVG to avoid this
  const onScroll = () => {
    // calculateEdges(); // Optimization: maybe only on end of scroll or use better coordinate system
  };

  const applySimulation = () => {
    setIsApplying(true);
    setTimeout(() => setIsApplying(false), 2000);
  };

  const toggleStrategy = (id: string) => {
    const next = new Set(activeStrategies);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveStrategies(next);
  };

  const optimizedStats = useMemo(() => {
    return { 
      time: DATA.optimization.optimized_total_time, 
      pct: DATA.optimization.saved_percent 
    };
  }, []);

  const togglePanel = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = new Set(minimizedPanels);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setMinimizedPanels(next);
    if (!isBottomExpanded) setIsBottomExpanded(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F6F8FB] overflow-hidden font-sans">
      {/* Context Bar */}
      <div className="h-10 bg-white border-b border-[#D8DEE8] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-text-tertiary hover:text-text-primary transition-colors pr-4 border-r border-[#D8DEE8] uppercase tracking-widest text-[10px] font-bold"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-6">
            <span className="text-[10px] text-text-secondary uppercase tracking-[0.1em] font-bold">CONTEXT: REGULATORY LIFECYCLE — PROCESS × LEVEL MATRIX</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-text-tertiary uppercase font-mono">{DATA.meta.case_id} | {DATA.meta.enterprise_id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
          <span className="text-bg-dark">MODE: ACTIVE INVESTIGATION</span>
          <span className="opacity-40">|</span>
          <span className="text-bg-dark">PROGRESS {DATA.kpis.overall_progress_percent}%</span>
          <span className="opacity-40">|</span>
          <span className="text-[#1570EF]">AI ASSISTED</span>
          <span className="opacity-40">|</span>
          <span className="text-status-warning">72H WINDOW</span>
        </div>
      </div>

      {/* Case Lock Strip */}
      <div className="h-[88px] bg-white border-b border-[#D8DEE8] flex items-center px-8 shrink-0 relative overflow-hidden z-40">
         <div className="grid grid-cols-6 gap-12 w-full max-w-7xl">
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Case Progress</span>
               <span className="text-[22px] font-bold leading-none text-bg-dark">{DATA.kpis.overall_progress_percent}%</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Stages</span>
               <span className="text-[18px] font-bold leading-none">{DATA.kpis.stages_total} / 9</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Levels</span>
               <span className="text-[18px] font-bold leading-none">{DATA.kpis.levels_total}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Critical Nodes</span>
               <span className="text-[22px] font-bold leading-none text-status-critical">{DATA.kpis.critical_nodes}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-1">AI Flagged</span>
               <span className="text-[22px] font-bold leading-none text-[#1570EF] font-mono">{DATA.kpis.ai_flagged_nodes}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Returns</span>
               <span className="text-[22px] font-bold leading-none text-status-critical font-mono">{DATA.kpis.return_edges}</span>
            </div>
         </div>
         <div className="absolute top-0 right-0 h-full flex items-center opacity-5 select-none pointer-events-none pr-10">
            <ShieldCheck size={120} />
         </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Floating Zoom Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 z-[70]">
           <button 
             onClick={() => setScale(s => Math.min(s + 0.1, 1.5))}
             className="w-10 h-10 bg-white border border-[#D8DEE8] rounded-full shadow-lg flex items-center justify-center text-bg-dark hover:bg-bg-secondary transition-all"
           >
              <Maximize size={18} />
           </button>
           <button 
             onClick={() => setScale(s => Math.max(s - 0.1, 0.5))}
             className="w-10 h-10 bg-white border border-[#D8DEE8] rounded-full shadow-lg flex items-center justify-center text-bg-dark hover:bg-bg-secondary transition-all"
           >
              <Search size={18} />
           </button>
           <button 
             onClick={() => setScale(1)}
             className="w-10 h-10 bg-white border border-[#D8DEE8] rounded-full shadow-lg flex items-center justify-center text-[10px] font-bold text-bg-dark hover:bg-bg-secondary transition-all"
           >
              100%
           </button>
        </div>

        {/* The Matrix Body */}
        <div 
          className="flex-1 overflow-auto custom-scrollbar bg-white relative p-12" 
          ref={matrixRef}
          onScroll={onScroll}
        >
          <motion.div 
            ref={canvasRef}
            animate={{ scale }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="origin-top-left relative"
            style={{ width: 'max-content' }}
          >
            {/* SVG Overlay for Edges */}
            <svg 
              className="absolute inset-0 pointer-events-none" 
              style={{ 
                zIndex: 5, 
                width: '100%', 
                height: '100%',
                overflow: 'visible' 
              }}
            >
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                </marker>
              </defs>
              {edgePaths.map((edge, i) => (
                <g key={i} className={cn(
                  "transition-all duration-300",
                  edge.type === 'RETURN' ? "text-status-critical" : "text-[#94A3B8]",
                  "hover:text-bg-dark"
                )}>
                  <path 
                    d={edge.d} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth={edge.type === 'RETURN' ? 2 : 1} 
                    strokeDasharray={edge.type === 'RETURN' ? "5,3" : "none"}
                    markerEnd="url(#arrow)"
                  />
                  {edge.label && edge.type === 'RETURN' && (
                    <text 
                      x={(edge.x1 + edge.x2) / 2} 
                      y={Math.min(edge.y1, edge.y2) - 40} 
                      textAnchor="middle" 
                      className="text-[9px] font-bold fill-status-critical uppercase tracking-widest"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            <div className="grid grid-cols-[240px_repeat(9,minmax(180px,1fr))] w-full min-w-[max-content] border border-[#E5EAF1] shadow-2xl">
              {/* Headers (Stages now columns) */}
              <div className="h-14 bg-bg-secondary/20 border-b border-r border-[#E5EAF1] sticky top-0 left-0 z-30" />
              {DATA.stages.map((stage, colIdx) => (
                <div key={stage.id} className="h-14 bg-bg-secondary/20 border-b border-r border-[#E5EAF1] flex flex-col items-center justify-center p-2 sticky top-0 z-20">
                   <div className="text-[10px] font-bold text-bg-dark tracking-wider uppercase">{stage.name_en}</div>
                   <div className="text-[7px] text-text-tertiary uppercase truncate max-w-full font-bold">Stage {colIdx + 1}</div>
                </div>
              ))}

              {/* Rows (Levels now rows) */}
              {DATA.levels.map((level, rowIdx) => (
                <React.Fragment key={level.id}>
                  {/* Row Header (Level) */}
                  <div className={cn(
                    "h-[130px] p-4 flex flex-col justify-center border-b border-r border-[#E5EAF1] sticky left-0 z-10 shadow-sm transition-all",
                    rowIdx % 2 === 0 ? "bg-[#FAFBFD]" : "bg-[#F4F7FB]"
                  )}>
                     <div className="text-[12px] font-black text-bg-dark uppercase tracking-widest">{level.name_en}</div>
                     <div className="text-[8px] text-text-tertiary leading-tight opacity-70 uppercase font-black mt-1">{level.org}</div>
                     <div className="mt-4 flex items-center gap-2">
                        <div className="px-2 py-0.5 bg-bg-dark text-white text-[8px] font-bold rounded-[2px]">{level.id}</div>
                        <div className="text-[8px] font-bold text-text-tertiary">LVL: {level.key}</div>
                     </div>
                  </div>

                  {/* Cells (Stages) */}
                  {DATA.stages.map(stage => {
                    const cellNodes = DATA.nodes.filter(n => n.stage === stage.key && n.level === level.key);
                    return (
                      <div 
                        key={`${level.id}-${stage.id}`} 
                        className={cn(
                          "h-[130px] p-2 border-b border-r border-[#E5EAF1] flex flex-col items-center gap-1.5 overflow-y-auto custom-scrollbar-hidden hover:custom-scrollbar justify-start pt-3",
                          rowIdx % 2 === 0 ? "bg-[#FAFBFD]" : "bg-[#F4F7FB]"
                        )}
                      >
                        {cellNodes.map(node => (
                          <div key={node.id} ref={el => nodeRefs.current[node.id] = el}>
                            <ProcessCard 
                              node={node} 
                              onClick={() => {
                                setSelectedNode(node);
                                setIsDrawerOpen(true);
                              }}
                              isSelected={selectedNode?.id === node.id}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 left-6 flex items-center gap-4 bg-white/90 backdrop-blur border border-[#D8DEE8] p-2 px-4 shadow-xl z-[60] rounded-full">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#1E9E54]" /><span className="text-[9px] font-bold text-text-tertiary">NORMAL</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#D38B0A]" /><span className="text-[9px] font-bold text-text-tertiary">PROGRESS</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#DD6B20]" /><span className="text-[9px] font-bold text-text-tertiary">WARNING</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#D92D20]" /><span className="text-[9px] font-bold text-text-tertiary">CRITICAL</span></div>
           <div className="w-px h-3 bg-border-default h-full mx-1" />
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full ring-2 ring-[#1570EF] ring-offset-1" /><span className="text-[9px] font-bold text-[#1570EF]">AI</span></div>
           <div className="flex items-center gap-1.5"><div className="w-4 h-[1px] border-t-2 border-dashed border-status-critical" /><span className="text-[9px] font-bold text-status-critical">RETURN</span></div>
        </div>
      </div>

      {/* Bottom Split Section */}
      <motion.div 
        animate={{ height: isBottomExpanded ? 180 : 32 }}
        className="bg-white border-t border-[#D8DEE8] flex flex-col overflow-hidden z-50 transition-all font-sans"
      >
         <div 
           onClick={() => setIsBottomExpanded(!isBottomExpanded)}
           className="h-8 w-full flex items-center justify-between px-6 bg-bg-secondary/10 hover:bg-bg-secondary/20 transition-colors border-b border-[#D8DEE8] shrink-0 group cursor-pointer"
         >
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-[0.2em]">ANALYTICS & OPTIMIZATION PANEL</span>
               
               <div className="flex items-center gap-4 ml-8">
                  {minimizedPanels.has('bottleneck') && (
                    <button onClick={(e) => togglePanel('bottleneck', e)} className="flex items-center gap-1 text-[8px] font-bold text-status-critical bg-status-critical/10 px-2 py-0.5 rounded-sm hover:bg-status-critical/20">
                      <AlertTriangle size={10} /> BOTTLENECK
                    </button>
                  )}
                  {minimizedPanels.has('timing') && (
                    <button onClick={(e) => togglePanel('timing', e)} className="flex items-center gap-1 text-[8px] font-bold text-bg-dark bg-bg-dark/10 px-2 py-0.5 rounded-sm hover:bg-bg-dark/20">
                      <Clock size={10} /> TIMING
                    </button>
                  )}
                  {minimizedPanels.has('simulator') && (
                    <button onClick={(e) => togglePanel('simulator', e)} className="flex items-center gap-1 text-[8px] font-bold text-[#1570EF] bg-[#1570EF]/10 px-2 py-0.5 rounded-sm hover:bg-[#1570EF]/20 transition-all">
                      <Zap size={10} /> SIMULATOR
                    </button>
                  )}
               </div>

               {!isBottomExpanded && minimizedPanels.size === 0 && (
                 <div className="flex items-center gap-4 ml-4">
                    <span className="text-[9px] font-bold text-status-critical flex items-center gap-1">
                      <AlertTriangle size={10} /> BOTTLENECKS FOUND
                    </span>
                    <span className="text-[9px] font-bold text-[#1570EF] flex items-center gap-1">
                      <Zap size={10} /> AI SIMULATOR READY
                    </span>
                 </div>
               )}
            </div>
            {isBottomExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
         </div>

         <div className="flex-1 flex overflow-hidden">
            {/* Bottleneck Ranking */}
            {!minimizedPanels.has('bottleneck') && (
              <div className="w-[300px] border-r border-[#D8DEE8] p-4 flex flex-col overflow-hidden bg-white">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-bg-dark flex items-center gap-2">
                    <AlertTriangle size={14} className="text-status-critical" /> Bottleneck Ranking
                  </h3>
                  <button onClick={(e) => togglePanel('bottleneck', e)} className="text-text-tertiary hover:text-bg-dark"><X size={12} /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                   {DATA.bottlenecks.map((b, i) => (
                     <div key={i} className="flex gap-3 group cursor-pointer hover:bg-bg-secondary/30 p-2 border border-transparent hover:border-[#D8DEE8] rounded-sm transition-all">
                        <span className="text-[10px] font-bold text-status-critical shrink-0">#{i+1}</span>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-baseline mb-0.5">
                              <span className="text-[10px] font-bold text-bg-dark uppercase truncate">{b.stage} × {b.level}</span>
                              <span className="text-[11px] font-bold text-status-critical font-mono shrink-0 ml-2">{b.duration}</span>
                           </div>
                           <p className="text-[9px] text-text-tertiary leading-tight line-clamp-1">{b.reason}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* Layer Timing */}
            {!minimizedPanels.has('timing') && (
              <div className="w-[300px] border-r border-[#D8DEE8] p-4 flex flex-col bg-[#F9FAFB]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                     <Clock size={14} /> Layer Timing (Hrs)
                  </div>
                  <button onClick={(e) => togglePanel('timing', e)} className="text-text-tertiary hover:text-bg-dark"><X size={12} /></button>
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                   {DATA.layer_timing.map((layer) => {
                     const pct = (layer.mean_hours / 110) * 100;
                     return (
                       <div key={layer.level} className="flex items-center gap-3">
                          <span className="w-16 text-[8px] font-bold text-text-tertiary truncate uppercase">{layer.level}</span>
                          <div className="flex-1 h-2 bg-bg-secondary/60 relative rounded-full overflow-hidden">
                             <div 
                               className={cn("h-full transition-all", layer.mean_hours > 70 ? "bg-status-critical" : "bg-bg-dark")} 
                               style={{ width: `${pct}%` }} 
                             />
                          </div>
                          <span className="w-8 text-[9px] font-mono font-bold text-right text-bg-dark">{layer.mean_hours}</span>
                       </div>
                     );
                   })}
                </div>
              </div>
            )}

            {/* Optimization Simulator */}
            {!minimizedPanels.has('simulator') && (
              <div className="flex-1 bg-[#1A1E23] p-4 flex flex-col text-white relative">
                <button onClick={(e) => togglePanel('simulator', e)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={14} /></button>
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                     <Zap size={14} className="text-status-warning" />
                     <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Optimization Simulator</span>
                   </div>
                   <div className="flex items-center gap-8 pr-10">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Current State</span>
                        <span className="text-[14px] font-mono text-white/40 line-through">{DATA.optimization.current_total_time}</span>
                      </div>
                      <ChevronRight size={20} className="text-white/20" />
                      <div className="flex flex-col">
                        <span className="text-[8px] text-status-success uppercase font-bold tracking-widest flex items-center gap-1">
                          <TrendingDown size={10} /> Optimized
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[20px] font-bold text-status-success font-mono leading-none">{optimizedStats.time}</span>
                          <span className="text-[12px] font-bold text-status-success">-{optimizedStats.pct}%</span>
                        </div>
                      </div>
                      <button 
                        onClick={applySimulation}
                        disabled={isApplying}
                        className="h-9 px-6 bg-white text-bg-dark font-bold text-[10px] uppercase tracking-widest hover:bg-bg-secondary transition-all disabled:opacity-50 flex items-center gap-2 rounded-sm"
                      >
                        {isApplying ? 'Applying...' : 'Apply Strategy'}
                      </button>
                   </div>
                </div>
                
                <div className="flex-1 flex gap-2">
                   {DATA.optimization.strategies.map(strat => {
                     const isActive = activeStrategies.has(strat.id);
                     return (
                       <div 
                         key={strat.id}
                         onClick={() => toggleStrategy(strat.id)}
                         className={cn(
                           "flex-1 h-full rounded-sm p-2.5 flex flex-col justify-between border cursor-pointer transition-all",
                           isActive ? "bg-white/10 border-white/40" : "bg-white/5 border-white/5 opacity-40 hover:opacity-70"
                         )}
                       >
                         <div className="flex justify-between items-start">
                            <span className="text-[9px] font-bold uppercase tracking-tight leading-tight max-w-[80px]">{strat.label}</span>
                            <div className={cn(
                              "w-6 h-3 rounded-full relative transition-colors",
                              isActive ? "bg-status-success" : "bg-white/20"
                            )}>
                               <div className={cn("absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all", isActive ? "right-0.5" : "left-0.5")} />
                            </div>
                         </div>
                         <span className="text-[9px] font-bold text-status-success">-{strat.saves}</span>
                       </div>
                     );
                   })}
                </div>
              </div>
            )}
         </div>
      </motion.div>

      {/* Right Inspector Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-bg-dark/20 backdrop-blur-[1px] z-[99]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[380px] bg-white border-l border-[#D8DEE8] z-[100] shadow-2xl flex flex-col"
            >
              <div className="h-16 border-b border-[#D8DEE8] flex items-center justify-between px-6 shrink-0">
                 <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-mono text-text-tertiary">[{selectedNode?.id}]</span>
                       <div className={cn(
                         "px-1.5 py-0.5 text-[8px] font-bold rounded-sm uppercase",
                         STATUS_COLORS[selectedNode?.status as NodeStatus]?.fill === '#E6F6EC' ? "bg-status-success/10 text-status-success" : "bg-status-warning/10 text-status-warning"
                       )}>
                          {selectedNode?.status}
                       </div>
                    </div>
                    <h2 className="text-[14px] font-bold text-bg-dark leading-tight uppercase truncate">{selectedNode?.title}</h2>
                 </div>
                 <button onClick={() => setIsDrawerOpen(false)} className="text-text-tertiary hover:text-text-primary p-2">
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-bg-secondary/30 rounded-sm border border-[#E5EAF1]">
                       <div className="text-[8px] text-text-tertiary mb-0.5 uppercase tracking-widest font-bold">Stage</div>
                       <div className="text-[10px] font-bold text-bg-dark uppercase">{selectedNode?.stage}</div>
                    </div>
                    <div className="p-2.5 bg-bg-secondary/30 rounded-sm border border-[#E5EAF1]">
                       <div className="text-[8px] text-text-tertiary mb-0.5 uppercase tracking-widest font-bold">Level</div>
                       <div className="text-[10px] font-bold text-bg-dark uppercase">{selectedNode?.level}</div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-bg-dark"><User size={18} /></div>
                       <div>
                          <div className="text-[12px] font-bold text-bg-dark uppercase truncate max-w-[240px]">{selectedNode?.owner}</div>
                          <div className="text-[9px] text-text-tertiary uppercase tracking-widest font-bold">Primary Action Owner</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-6 p-1">
                       <div className="flex items-center gap-2">
                          <Clock size={14} className="text-text-tertiary" />
                          <div className="text-[10px] font-mono font-bold text-bg-dark">{selectedNode?.timestamp || 'PENDING'}</div>
                       </div>
                       {selectedNode?.duration && (
                         <div className="flex items-center gap-2 text-status-warning">
                            <Clock size={14} />
                            <div className="text-[10px] font-bold uppercase tracking-widest">{selectedNode.duration} Duration</div>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="p-4 bg-[#F8FAFC] border-l-4 border-bg-dark rounded-sm">
                    <p className="text-[12px] text-text-primary leading-relaxed italic">"{selectedNode?.summary}"</p>
                 </div>

                 <div className="space-y-4">
                    {selectedNode?.badges && selectedNode.badges.length > 0 && (
                      <div>
                        <div className="text-[9px] font-bold text-text-tertiary mb-2 uppercase tracking-widest">Metadata Context</div>
                        <div className="flex flex-wrap gap-1.5">
                            {selectedNode.badges.map((b: string) => (
                              <span key={b} className="text-[9px] font-bold text-bg-dark bg-white border border-[#D8DEE8] px-2 py-0.5 rounded-sm">{b}</span>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedNode?.evidence_refs && selectedNode.evidence_refs.length > 0 && (
                      <div>
                         <div className="text-[9px] font-bold text-text-tertiary mb-2 uppercase tracking-widest">Evidence Linkage</div>
                         <div className="space-y-2">
                            {selectedNode.evidence_refs.map((ref: string) => (
                              <button 
                                key={ref} 
                                onClick={() => {
                                  if (ref === 'SRC-31') navigate('/attribution/workflow');
                                  if (ref === 'SRC-21') navigate('/audit/report');
                                }}
                                className="w-full flex items-center justify-between p-2.5 bg-white border border-[#D8DEE8] hover:border-[#1570EF] hover:bg-[#1570EF]/5 transition-all group rounded-sm"
                              >
                                <div className="flex items-center gap-3">
                                   <Zap size={14} className="text-[#1570EF]" />
                                   <span className="text-[11px] font-bold text-bg-dark uppercase tracking-tight">{ref} Source Data</span>
                                </div>
                                <ChevronRight size={14} className="text-text-tertiary group-hover:text-[#1570EF] transition-colors" />
                              </button>
                            ))}
                         </div>
                      </div>
                    )}
                 </div>

                 {selectedNode?.ai_flag && (
                   <div className="p-4 bg-[#1570EF]/5 border border-[#1570EF]/20 rounded-sm">
                      <div className="flex items-center gap-2 mb-2 text-[#1570EF]">
                         <Zap size={16} fill="currentColor" />
                         <span className="text-[10px] font-bold uppercase tracking-[0.1em]">AI Assisted Step</span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-normal">
                         Non-linear verification performed via Agent Cluster 09. Evidence consistency confirmed against cross-domain data sources.
                      </p>
                   </div>
                 )}
              </div>

              <div className="p-6 border-t border-[#D8DEE8] grid grid-cols-2 gap-3 shrink-0">
                 <button className="h-10 bg-white border border-[#D8DEE8] text-bg-dark text-[10px] font-bold uppercase tracking-widest hover:bg-bg-secondary flex items-center justify-center gap-2 rounded-sm transition-all">
                    <Download size={14} /> Export
                 </button>
                 <button 
                   onClick={() => navigate('/audit/report')}
                   className="h-10 bg-bg-dark text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2 rounded-sm transition-all"
                 >
                    <FileText size={14} /> Full Report
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Applying Simulation Animation */}
      <AnimatePresence>
         {isApplying && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 bg-white/40 backdrop-blur-[2px] pointer-events-none z-[110] flex items-center justify-center"
           >
              <motion.div 
                animate={{ scale: [0.95, 1.05, 1] }} 
                className="bg-bg-dark p-8 shadow-2xl rounded-lg border-2 border-status-success flex flex-col items-center gap-4"
              >
                 <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                    <Zap size={40} className="text-status-success" fill="currentColor" />
                 </motion.div>
                 <div className="text-center">
                    <div className="text-[16px] font-bold text-white uppercase tracking-widest mb-1">Applying Strategy</div>
                    <div className="text-[12px] text-status-success font-bold uppercase font-mono tracking-tighter">Recalculating Matrix Vectors...</div>
                 </div>
              </motion.div>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}

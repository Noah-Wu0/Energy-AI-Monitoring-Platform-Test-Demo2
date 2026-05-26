import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Map as MapIcon,
  Activity,
  AlertTriangle,
  FileCheck,
  GitBranch,
  ShieldCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  Zap
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const MENU_ACTS = [
  {
    num: 'I',
    title: 'Panoramic Risk Sensing',
    subtitle: 'Vice Minister View · 3-Second Awareness',
    color: '#2FBF71',
    items: [
      { id: 'dashboard', label: 'Energy Oversight Dashboard', path: '/sensing/national-grid', icon: ShieldCheck, count: 12 },
      { id: 'regional', label: 'Regional Facility Drill-Down', path: '/sensing/regional/aktau', icon: MapIcon, count: 88 },
    ]
  },
  {
    num: 'II',
    title: 'Alert to Attribution',
    subtitle: 'AI Prediction · Pre-emptive Warning',
    color: '#E14B4B',
    items: [
      { id: 'timeseries', label: 'AI Risk & Action Forecast', path: '/warning/timeseries/ANO-2026-0512', icon: AlertTriangle, count: 2 },
      { id: 'enterprise', label: 'Enterprise Cross-Reference', path: '/warning/enterprise', icon: Search, count: 5 },
    ]
  },
  {
    num: 'III',
    title: 'Regulatory Closed Loop',
    subtitle: 'Attribute · Dispatch · Review · Audit Trail',
    color: '#4A90E2',
    items: [
      { id: 'workflow', label: 'Agent Attribution Workflow', path: '/attribution/workflow', icon: GitBranch, count: 8 },
      { id: 'audit', label: 'Preventive SLA Audit', path: '/audit/event/CASE-2026-001', icon: FileCheck, count: 42 },
    ]
  },
  {
    num: 'IV',
    title: 'Efficacy Quantification',
    subtitle: 'Reports · Graph · Optimization',
    color: '#E7A53A',
    items: [
      { id: 'graph', label: 'Knowledge Graph Mining', path: '/attribution/graph', icon: Activity, count: 15 },
      { id: 'report', label: 'Regulatory Report Generation', path: '/audit/report', icon: FileText, count: null },
    ]
  }
];

export const LeftMenu = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <aside className={cn(
      "bg-white border-r border-border-default flex flex-col shrink-0 transition-all duration-300 relative",
      isCollapsed ? "w-[56px]" : "w-[240px]"
    )}>
      <div className={cn(
        "p-4 flex items-center justify-between border-b border-border-default",
        isCollapsed ? "flex-col gap-4" : ""
      )}>
        {!isCollapsed && (
          <div>
            <div className="text-[13px] font-bold text-[#1A1E23] tracking-tight">AI Oversight System</div>
            <div className="text-[9px] text-[#98A1AA] uppercase tracking-widest">Energy Oversight</div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-bg-hover rounded-md transition-colors text-text-tertiary hover:text-text-primary"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        {MENU_ACTS.map((act) => (
          <div key={act.num} className="mb-5 last:mb-0">
            {!isCollapsed && (
              <div className="px-2 mb-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <div
                    className="w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: act.color }}
                  >
                    {act.num}
                  </div>
                  <h3 className="text-[11px] font-bold text-[#1A1E23]">{act.title}</h3>
                </div>
                <p className="text-[9px] text-[#98A1AA] ml-6">{act.subtitle}</p>
              </div>
            )}
            {isCollapsed && (
              <div className="flex justify-center mb-3">
                <div
                  className="w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: act.color }}
                >
                  {act.num}
                </div>
              </div>
            )}

            <div className="space-y-0.5">
              {act.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center px-2.5 py-2 rounded-[4px] transition-colors group relative",
                    isActive
                      ? "text-white"
                      : "text-[#66707A] hover:bg-[#F5F7FA] hover:text-[#1A1E23]",
                    isCollapsed ? "justify-center" : "justify-between"
                  )}
                  style={({ isActive }) => isActive ? { backgroundColor: act.color } : {}}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon size={14} className={cn("shrink-0")} />
                    {!isCollapsed && (
                      <span className="text-[11px] font-medium whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && item.count !== null && (
                    <span className="text-[9px] tabular-nums font-mono opacity-50">
                      [{item.count.toString().padStart(2, '0')}]
                    </span>
                  )}

                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A1E23] text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="p-4 border-t border-border-default">
          <div className="flex items-center gap-2 text-[9px] text-[#98A1AA]">
            <Zap size={10} className="text-[#E7A53A]" />
            <span>AI Pattern Matching · 28 Risk Patterns</span>
          </div>
        </div>
      )}
    </aside>
  );
};

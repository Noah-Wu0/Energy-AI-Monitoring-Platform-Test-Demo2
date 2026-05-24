import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bell, User, Globe, ChevronDown } from 'lucide-react';

export const Header = () => {
  const [latency, setLatency] = useState(14);
  const [ingest, setIngest] = useState(1.25);

  useEffect(() => {
    const timer = setInterval(() => {
      setLatency(prev => Math.max(10, Math.min(18, prev + (Math.random() > 0.5 ? 1 : -1))));
      setIngest(prev => Number((prev + (Math.random() - 0.5) * 0.05).toFixed(2)));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-[60px] bg-white border-b border-border-default flex items-center justify-between px-6 shrink-0 z-50">
      {/* Left LOGO */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-medium tracking-[0.14em] text-text-secondary leading-none uppercase">AI Statecraft</span>
          <span className="text-[10px] font-medium tracking-[0.14em] text-text-secondary leading-none uppercase mt-0.5">For Minister</span>
        </div>
        <div className="w-[1px] h-[26px] bg-border-strong"></div>
        <div className="text-[22px] font-semibold text-text-primary uppercase tracking-tight leading-none">Energy</div>
      </div>

      {/* Middle Controls */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[10px] all-caps-label">
          <span>Scenario</span>
          <div className="bg-bg-secondary px-2 py-1 flex items-center gap-2 cursor-pointer hover:bg-bg-hover">
            <span className="text-text-primary font-semibold">National Fuel & Energy Oversight — 2026.Q2</span>
            <ChevronDown size={12} />
          </div>
        </div>
        <div className="flex items-center gap-px bg-border-default p-[1px]">
          <button className="px-3 py-1 text-[10px] font-medium all-caps-label bg-white text-text-tertiary">Field</button>
          <button className="px-3 py-1 text-[10px] font-medium all-caps-label bg-bg-dark text-white">Analyst</button>
          <button className="px-3 py-1 text-[10px] font-medium all-caps-label bg-white text-text-tertiary">Executive</button>
        </div>
        <button className="text-[10px] all-caps-label hover:text-text-primary">Reset System</button>
      </div>

      {/* Right Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 text-[10px] font-mono whitespace-nowrap text-text-tertiary">
          <span>LATENCY: <span className="text-text-primary tabular-nums">{latency}MS</span></span>
          <span>INGEST: <span className="text-text-primary tabular-nums">{ingest.toFixed(2)}GB/S</span></span>
        </div>
        <div className="flex items-center gap-1.5 text-status-success text-[10px] font-semibold uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          Secure Enclave Active
        </div>
        <div className="flex items-center gap-4 ml-2 border-l border-border-default pl-4">
          <button className="flex items-center gap-1 text-text-primary">
            <Globe size={16} />
            <span className="text-[11px] font-medium uppercase">En</span>
            <ChevronDown size={12} />
          </button>
          <div className="relative cursor-pointer">
            <Bell size={18} className="text-text-secondary" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-status-critical border-2 border-white rounded-full" />
          </div>
          <div className="bg-bg-secondary px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-bg-hover">
            <User size={16} className="text-text-secondary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">Operator Minister_Office</span>
          </div>
        </div>
      </div>
    </header>
  );
};

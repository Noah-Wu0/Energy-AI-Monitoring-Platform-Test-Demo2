import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  RotateCw, 
  ShieldCheck, 
  Layers, 
  Eye, 
  Save,
  CheckCircle2,
  ChevronRight,
  Edit3
} from 'lucide-react';
import { SectionTitle, Button, StatusChip } from '../components/UI';

export default function ReportGeneration() {
  const [template, setTemplate] = useState('MINISTER BRIEFING');

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-page">
      {/* Top Status Bar */}
      <div className="h-10 bg-white border-b border-border-default flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <span className="all-caps-label text-[10px]">Context: Auto Regulatory Report Generation</span>
          <div className="flex items-center gap-4 border-l border-border-default pl-4">
             <span className="all-caps-label text-[10px] text-text-primary px-2 bg-bg-secondary rounded-sm">Template: {template}</span>
             <span className="all-caps-label text-[10px] text-text-tertiary">Draft Version: 2026.05.28-V1</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Template Selection */}
        <div className="w-[220px] border-r border-border-default bg-white p-5 flex flex-col shrink-0 overflow-y-auto">
           <SectionTitle>Report Templates</SectionTitle>
           <div className="space-y-1 mb-8">
             {[
               'MINISTER BRIEFING',
               'DAILY DIGEST',
               'WEEKLY REGULATORY',
               'EMERGENCY ALERT',
               'ENVIRONMENTAL IMPACT'
             ].map(t => (
               <button
                 key={t}
                 onClick={() => setTemplate(t)}
                 className={`w-full text-left px-3 py-2 rounded-sm text-[11px] font-bold transition-all
                   ${template === t ? 'bg-bg-dark text-white' : 'text-text-secondary hover:bg-bg-hover'}`}
               >
                 {template === t ? '●' : '○'} {t}
               </button>
             ))}
           </div>

           <SectionTitle>Recent Reports</SectionTitle>
           <div className="space-y-3">
             {[
               { id: 'REP-0524', date: '2026-05-24', type: 'Daily' },
               { id: 'REP-0523', date: '2026-05-23', type: 'Daily' },
               { id: 'REP-WEEK-20', date: '2026-05-21', type: 'Weekly' }
             ].map(r => (
               <div key={r.id} className="p-3 border border-border-default hover:bg-bg-hover cursor-pointer group">
                  <div className="text-[10px] font-bold text-text-primary mb-1 uppercase tracking-tight">{r.id}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-text-tertiary">{r.date}</span>
                    <span className="text-[9px] text-text-secondary font-bold uppercase">{r.type}</span>
                  </div>
               </div>
             ))}
           </div>
        </div>

        {/* Center Report Preview Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-bg-secondary p-8">
           <div className="bg-white flex-1 max-w-[800px] mx-auto w-full shadow-lg border border-border-default flex flex-col overflow-hidden">
              {/* Document Header Controls */}
              <div className="h-10 border-b border-border-default flex items-center justify-between px-6 bg-white shrink-0">
                 <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-text-primary"><Edit3 size={12}/> Edit</button>
                    <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-text-tertiary"><Eye size={12}/> Preview</button>
                    <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-text-tertiary"><Printer size={12}/> Print View</button>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-success" />
                    <span className="all-caps-label text-[9px] text-text-tertiary uppercase">Auto-save: On</span>
                 </div>
              </div>

              {/* Document Content (Scrollable) */}
              <div className="flex-1 p-16 overflow-y-auto bg-white font-serif">
                 <div className="flex flex-col items-center mb-16 gap-2">
                    <div className="text-[16px] font-bold uppercase tracking-[0.2em] text-text-secondary font-sans">AI Statecraft for Minister</div>
                    <div className="text-[12px] font-medium uppercase tracking-[0.1em] text-text-tertiary font-sans">Energy Oversight Module</div>
                    <div className="w-32 h-px bg-border-strong my-4" />
                    <div className="text-[28px] font-bold text-text-primary tracking-tight font-sans uppercase">Minister Briefing Report</div>
                    <div className="text-[13px] text-text-secondary font-sans all-caps-label">REPORT PERIOD: APRIL 1, 2026 — APRIL 30, 2026</div>
                    <div className="text-[11px] text-text-tertiary font-sans mt-1">Generated: 2026-05-28 15:42:00</div>
                 </div>

                 <div className="space-y-12 max-w-[600px] mx-auto text-[14px] leading-relaxed text-text-primary selection:bg-status-warning/20">
                    <section>
                       <h2 className="text-[14px] font-bold uppercase font-sans border-b border-border-default pb-2 mb-4">1. Executive Summary</h2>
                       <div className="bg-status-warning/5 p-4 border-l-2 border-status-warning relative group cursor-pointer">
                          <p className="italic">
                            During Q2 2026, the national energy oversight system detected 42 anomalies across 237 monitored facilities, of which 12 were classified as high-severity. Key focus remains on the Aktau regional cluster where production reporting discrepancies have reached critical thresholds...
                          </p>
                          <div className="absolute right-0 top-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <RotateCw size={12} className="text-status-warning" />
                          </div>
                          <div className="hidden group-hover:block absolute -right-32 top-0 w-28 bg-bg-dark text-white text-[9px] p-2 rounded-sm shadow-xl z-20 font-sans">
                             Generated from 14 source data points. Confidence 94%.
                          </div>
                       </div>
                    </section>

                    <section>
                       <h2 className="text-[14px] font-bold uppercase font-sans border-b border-border-default pb-2 mb-4">2. National Grid Status</h2>
                       <p className="mb-4">
                         Primary power generation index remains within nominal boundaries at <span className="font-bold">6.7 GW</span> aggregate capacity. Coal reliance stabilized at 60%, with renewable integration increasing by 2.4% following the completion of the Karaganda-West solar farm expansion.
                       </p>
                       <div className="h-40 bg-bg-secondary w-full flex items-center justify-center text-[11px] text-text-tertiary uppercase font-sans font-bold border border-border-default">
                          [Spatial Data Matrix: National Capacity Heatmap]
                       </div>
                    </section>

                    <section>
                       <h2 className="text-[14px] font-bold uppercase font-sans border-b border-border-default pb-2 mb-4">3. Regulatory Anomaly Detail</h2>
                       <div className="space-y-4">
                          <div className="flex gap-4">
                             <div className="w-1.5 h-1.5 rounded-full bg-status-critical mt-2 shrink-0" />
                             <div>
                                <span className="font-bold">ENT-KZ-AKT-0091 (+20% Gap):</span>
                                <p className="text-text-secondary mt-1">Cross-system audit triggered by Master Agent identified significant discrepancy between reported production and derived energy capacity. Referral to Joint Investigation Taskforce recommended.</p>
                             </div>
                          </div>
                          <div className="flex gap-4">
                             <div className="w-1.5 h-1.5 rounded-full bg-status-warning mt-2 shrink-0" />
                             <div>
                                <span className="font-bold">ANO-2026-0512 (Pressure):</span>
                                <p className="text-text-secondary mt-1">GCS-001 pipeline segment N04 showing sustained pressure oscillation. Pattern matches historical pump failure signature.</p>
                             </div>
                          </div>
                       </div>
                    </section>
                 </div>

                 <div className="mt-24 border-t border-border-default pt-8 text-[11px] text-text-tertiary flex justify-between items-center font-sans uppercase font-bold tracking-widest">
                    <span>Restricted Content — For Minister Use Only</span>
                    <span>Page 1 / 18</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Data Sources Panel */}
        <div className="w-[340px] border-l border-border-default bg-white p-6 flex flex-col shrink-0 overflow-y-auto">
           <SectionTitle>Data Sources Snapshot</SectionTitle>
           <div className="space-y-3 mb-8">
              {[
                { id: 'ANO-2026-0512', type: 'Telemetry Anomaly', date: '14:32 05-18' },
                { id: 'CASE-2026-001', type: 'Attribution Verdict', date: '16:00 05-18' },
                { id: 'SYS-GRID-CAP', type: 'Static Capacity Data', date: 'Latest' },
                { id: 'ENT-DB-AKT', type: 'Master Business Registry', date: 'Latest' }
              ].map(source => (
                <div key={source.id} className="border border-border-default p-3 flex flex-col gap-1 hover:border-text-tertiary cursor-pointer transition-colors">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-text-primary uppercase tracking-tight">{source.id}</span>
                      <ShieldCheck size={12} className="text-status-success" />
                   </div>
                   <div className="text-[9px] all-caps-label text-text-secondary">{source.type}</div>
                   <div className="text-[9px] text-text-tertiary font-mono">Snapshot: {source.date}</div>
                </div>
              ))}
           </div>

           <SectionTitle>Approval Workflow</SectionTitle>
           <div className="space-y-6 relative">
              <div className="absolute left-[13px] top-6 bottom-6 w-px bg-border-default" />
              {[
                { actor: 'AI (Statecraft Core)', action: 'Drafted & Validated', status: 'COMPLETE', time: '15:42' },
                { actor: 'Senior Analyst (L2)', action: 'Human Review & Edit', status: 'COMPLETE', time: '16:15' },
                { actor: 'Regulatory Director', action: 'Compliance Approval', status: 'PENDING', time: '--:--' },
                { actor: 'Office of Minister', action: 'Final Publication', status: 'LOCKED', time: '--:--' }
              ].map((step, i) => (
                <div key={i} className="flex gap-4 relative z-10">
                   <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white shrink-0 shadow-sm
                     ${step.status === 'COMPLETE' ? 'bg-status-success' : step.status === 'PENDING' ? 'bg-bg-dark border-bg-dark text-white' : 'bg-bg-secondary text-text-tertiary'}`}>
                      {step.status === 'COMPLETE' ? <CheckCircle2 size={14} /> : i+1}
                   </div>
                   <div className="flex flex-col gap-0.5">
                      <div className="text-[11px] font-bold uppercase text-text-primary leading-tight">{step.actor}</div>
                      <div className="text-[9px] text-text-secondary uppercase">{step.action}</div>
                      <div className="text-[9px] font-mono text-text-tertiary mt-1">{step.status} — {step.time}</div>
                   </div>
                </div>
              ))}
           </div>

           <div className="mt-auto pt-8 flex flex-col gap-2">
              <Button variant="secondary" className="w-full" icon={Download}>Export as Secured PDF</Button>
              <Button variant="secondary" className="w-full" icon={RotateCw}>Regenerate with AI</Button>
              <Button variant="primary" className="w-full" icon={ChevronRight}>Submit for Approval</Button>
           </div>
        </div>
      </div>
    </div>
  );
}

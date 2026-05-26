import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  RotateCw, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  FileCheck,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  Lock,
  Layers,
  ChevronDown
} from 'lucide-react';
import { SectionTitle, Button, StatusChip } from '../components/UI';
import { useNavigate } from 'react-router-dom';

export default function ReportGeneration() {
  const [template, setTemplate] = useState('MINISTER BRIEFING');
  const [isApproved, setIsApproved] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F6FA] text-text-primary">
      {/* Top Status Bar */}
      <div className="h-10 bg-white border-b border-border-default flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <span className="all-caps-label text-[10px] font-bold text-text-secondary tracking-wider">Context: Minister Briefing Output</span>
          <div className="flex items-center gap-4 border-l border-border-default pl-4">
             <span className="all-caps-label text-[10px] text-white px-2 py-0.5 bg-bg-dark rounded-sm font-bold">Template: {template}</span>
             <span className="all-caps-label text-[10px] text-text-tertiary">Draft: 2026.05.28-V1</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
          <span className="all-caps-label text-[9px] text-text-tertiary font-bold">Closed-Loop Integrity Verified</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Briefing List & Templates (Simplified) */}
        <div className="w-[220px] border-r border-border-default bg-white p-5 flex flex-col shrink-0 overflow-y-auto">
          <div className="mb-6">
            <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">Briefing Templates</h4>
            <div className="space-y-1">
              {[
                'MINISTER BRIEFING',
                'DAILY DIGEST',
                'WEEKLY REGULATORY',
                'EMERGENCY ALERT',
                'ENVIRO IMPACT'
              ].map(t => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`w-full text-left px-3 py-2 rounded-sm text-[11px] font-bold transition-all flex items-center justify-between
                    ${template === t ? 'bg-bg-dark text-white' : 'text-text-secondary hover:bg-bg-hover'}`}
                >
                  <span>{t}</span>
                  {template === t && <div className="w-1 h-1 rounded-full bg-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border-default pt-5">
            <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">Active Case Archives</h4>
            <div className="space-y-2">
              {[
                { id: 'CASE-2026-001', title: 'Western Caspian Gas', date: 'May 28', status: 'CRITICAL' },
                { id: 'CASE-2026-002', title: 'Pavlodar Coal GRES-1', date: 'May 24', status: 'WARNING' },
                { id: 'CASE-2026-003', title: 'Karaganda Power Grid', date: 'May 20', status: 'RESOLVED' }
              ].map(c => (
                <div 
                  key={c.id} 
                  onClick={() => c.id === 'CASE-2026-001' ? null : navigate(`/attribution/workflow`)}
                  className={`p-3 border border-border-default rounded-sm bg-white cursor-pointer transition-all hover:shadow-sm hover:border-text-tertiary group
                    ${c.id === 'CASE-2026-001' ? 'border-status-critical/30 bg-status-critical/5' : ''}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-bold font-mono text-text-primary">{c.id}</span>
                    <span className={`text-[7px] font-bold px-1 rounded-sm uppercase
                      ${c.status === 'CRITICAL' ? 'bg-status-critical/10 text-status-critical' : c.status === 'WARNING' ? 'bg-status-warning/10 text-status-warning' : 'bg-status-success/10 text-status-success'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-text-secondary truncate">{c.title}</div>
                  <div className="text-[9px] text-text-tertiary mt-1">{c.date} · 6-Agent Verified</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Briefing Preview Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-bg-secondary p-6 overflow-y-auto">
          <div className="bg-white max-w-[840px] mx-auto w-full shadow-lg border border-border-default flex flex-col overflow-hidden shrink-0">
            {/* Document Header Controls */}
            <div className="h-10 border-b border-border-default flex items-center justify-between px-6 bg-white shrink-0">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-text-primary hover:text-text-secondary transition-colors">
                  <FileText size={12}/> View Original Data
                </button>
                <button 
                  onClick={() => navigate('/warning/timeseries/ANO-2026-0512')}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-text-tertiary hover:text-text-primary transition-colors border-l border-border-default pl-4"
                >
                  <Clock size={12}/> Anomaly Forecast
                </button>
                <button 
                  onClick={() => navigate('/audit/event/CASE-2026-001')}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-text-tertiary hover:text-text-primary transition-colors border-l border-border-default pl-4"
                >
                  <FileCheck size={12}/> SLA Audit Trail
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Printer size={12} className="text-text-tertiary hover:text-text-primary cursor-pointer" />
                <Download size={12} className="text-text-tertiary hover:text-text-primary cursor-pointer ml-2" />
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 p-10 md:p-14 bg-white font-serif relative">
              {/* Official Seal / Header */}
              <div className="flex flex-col items-center mb-10 gap-2 text-center">
                <div className="text-[12px] font-bold uppercase tracking-[0.25em] text-text-secondary font-sans">Ministry of Energy of the Republic of Kazakhstan</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary font-sans">State AI Regulatory Oversight Directorate</div>
                <div className="w-24 h-0.5 bg-text-primary my-3" />
                <h1 className="text-[26px] font-black text-text-primary tracking-tight font-sans uppercase">Ministerial Briefing & Action Proposal</h1>
                <div className="text-[10px] text-text-tertiary font-mono uppercase tracking-widest mt-1">
                  CASE-ID: CASE-2026-001 / REGION: Mangystau / DATE: 2026-05-28
                </div>
              </div>

              {/* Minister Briefing Dashboard Block (The Executive 5-Point Summary First Fold) */}
              <div className="mb-10 p-6 border-2 border-bg-dark bg-[#FAFAFA] font-sans rounded-sm shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-border-default">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-bg-dark flex items-center gap-2">
                    <ShieldCheck size={15} /> Executive Briefing Summary
                  </div>
                  <span className="text-[9px] font-mono text-text-tertiary">Confidence Limit: 95% CI (Backtest: 94.2%)</span>
                </div>
                
                <div className="space-y-4">
                  {/* 1. Risk Finding */}
                  <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[12px]">
                    <span className="font-bold text-text-secondary uppercase tracking-wider text-[10px] mt-0.5">1. Risk Finding</span>
                    <div>
                      <div className="font-bold text-[13px] text-status-critical">
                        92% breach risk within 48H predicted at Aktau GCS-001
                      </div>
                      <p className="text-text-secondary text-[11px] mt-0.5 leading-relaxed font-medium">
                        Continuous SCADA telemetry shows physical generation decoupling. Unabated anomaly will exceed threshold capacity within two days.
                      </p>
                    </div>
                  </div>

                  {/* 2. Preventive Action */}
                  <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[12px] border-t border-border-default/60 pt-3">
                    <span className="font-bold text-text-secondary uppercase tracking-wider text-[10px] mt-0.5">2. Preventive Action</span>
                    <div>
                      <div className="font-bold text-[13px] text-text-primary">
                        Dispatch preventive on-site inspection within remaining 22H window
                      </div>
                      <p className="text-text-secondary text-[11px] mt-0.5 leading-relaxed font-medium">
                        Initiate mechanical validation and emissions metering checks. Action before the 36H window preserves a gas waste mitigation threshold of <span className="font-bold text-text-primary">75 MMcm</span>.
                      </p>
                    </div>
                  </div>

                  {/* 3. Evidence Basis */}
                  <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[12px] border-t border-border-default/60 pt-3">
                    <span className="font-bold text-text-secondary uppercase tracking-wider text-[10px] mt-0.5">3. Evidence Basis</span>
                    <div>
                      <div className="font-bold text-[13px] text-text-primary">
                        Cross-System Multi-Point Mismatch Confirmed
                      </div>
                      <div className="text-text-secondary text-[11px] mt-0.5 leading-relaxed font-medium flex flex-wrap gap-x-2 gap-y-1">
                        <span className="px-1.5 py-0.5 bg-white border border-border-default font-bold rounded-sm">SCADA (+15.7% Output)</span>
                        <span className="px-1.5 py-0.5 bg-white border border-border-default font-bold rounded-sm">Fuel Gas (-13.5% Under-reporting)</span>
                        <span className="px-1.5 py-0.5 bg-white border border-border-default font-bold rounded-sm">License Cap (+18% Exceedance)</span>
                        <span className="px-1.5 py-0.5 bg-white border border-border-default font-bold rounded-sm">Tariff Invoice (+21.2%)</span>
                        <span className="px-1.5 py-0.5 bg-white border border-border-default font-bold rounded-sm">CEMS Emission (-20.0%)</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. SLA Status */}
                  <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[12px] border-t border-border-default/60 pt-3">
                    <span className="font-bold text-text-secondary uppercase tracking-wider text-[10px] mt-0.5">4. SLA Status</span>
                    <div>
                      <div className="font-bold text-[13px] text-status-warning">
                        Dispatch phase is currently the critical path
                      </div>
                      <p className="text-text-secondary text-[11px] mt-0.5 leading-relaxed font-medium">
                        Inspection Dept has completed automated attribution routing (18 min). Task sent to Mangystau Regional Inspectorate. Acknowledgment pending.
                      </p>
                    </div>
                  </div>

                  {/* 5. Minister Decision */}
                  <div className="grid grid-cols-[160px_1fr] items-start gap-4 text-[12px] border-t border-border-default/60 pt-3">
                    <span className="font-bold text-text-secondary uppercase tracking-wider text-[10px] mt-0.5 text-status-critical">5. Decision Needed</span>
                    <div>
                      <div className="font-bold text-[13px] text-status-critical flex items-center gap-1.5">
                        <AlertTriangle size={13} /> Approve formal cross-agency preventive audit
                      </div>
                      <p className="text-text-secondary text-[11px] mt-0.5 leading-relaxed font-medium">
                        Authorizing joint inspection task force (Ministry of Energy, Ecology, and Customs) to inspect Turbine Units 1-4.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Narrative / Detailed Case Study Section */}
              <div className="space-y-8 max-w-[660px] mx-auto text-[13px] leading-relaxed text-text-primary">
                <section>
                  <h3 className="text-[12px] font-bold uppercase tracking-wider font-sans border-b border-border-default pb-1 mb-3">I. Background & Telemetry Analysis</h3>
                  <p className="mb-3">
                    On May 28, 2026, the state AI oversight platform detected persistent night-time deviations at <span className="font-bold">Aktau GCS-001 (Western Caspian Energy LLC)</span>. The continuous risk scoring algorithm identified an anomalous physical-thermal operating profile.
                  </p>
                  <p>
                    SCADA telemetry indicates generator outputs averaging <span className="font-bold">118 MW</span>, representing a <span className="font-bold">+15.7% deviation</span> from the expected baseline given the company's submitted regulatory schedules. This operating rate represents a direct exceedance of their approved industrial permit capacity limit of <span className="font-bold">100 MW</span> by <span className="font-bold">+18.0%</span>.
                  </p>
                </section>

                <section>
                  <h3 className="text-[12px] font-bold uppercase tracking-wider font-sans border-b border-border-default pb-1 mb-3">II. Cross-System Consistency Auditing</h3>
                  <p className="mb-4">
                    The Bayesian Master Agent cross-referenced five primary source records to reconstruct a verified evidence trail. Mismatch analysis confirms a high-confidence overproduction scenario:
                  </p>

                  <table className="w-full border border-border-default text-left text-[11px] font-sans mb-4">
                    <thead>
                      <tr className="bg-bg-secondary font-bold text-text-secondary border-b border-border-default">
                        <th className="p-2 border-r border-border-default">Monitored Parameter</th>
                        <th className="p-2 border-r border-border-default text-center">Nominal Value</th>
                        <th className="p-2 border-r border-border-default text-center">Reported Value</th>
                        <th className="p-2 text-center">Deviation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border-default">
                        <td className="p-2 border-r border-border-default font-bold">SCADA Output (KEGOC)</td>
                        <td className="p-2 border-r border-border-default text-center font-mono">102 MW</td>
                        <td className="p-2 border-r border-border-default text-center font-mono">118 MW</td>
                        <td className="p-2 text-center font-bold text-status-warning">+15.7%</td>
                      </tr>
                      <tr className="border-b border-border-default bg-[#FAFAFA]">
                        <td className="p-2 border-r border-border-default font-bold">Fuel Gas Consumption (UNG)</td>
                        <td className="p-2 border-r border-border-default text-center font-mono">111 MMcm</td>
                        <td className="p-2 border-r border-border-default text-center font-mono">96 MMcm</td>
                        <td className="p-2 text-center font-bold text-status-warning">-13.5%</td>
                      </tr>
                      <tr className="border-b border-border-default">
                        <td className="p-2 border-r border-border-default font-bold">Financial Billing Invoice</td>
                        <td className="p-2 border-r border-border-default text-center font-mono">104 BN KZT</td>
                        <td className="p-2 border-r border-border-default text-center font-mono">126 BN KZT</td>
                        <td className="p-2 text-center font-bold text-status-critical">+21.2%</td>
                      </tr>
                      <tr className="bg-[#FAFAFA]">
                        <td className="p-2 border-r border-border-default font-bold">Emissions Factor (MOE CEMS)</td>
                        <td className="p-2 border-r border-border-default text-center font-mono">115 Tons</td>
                        <td className="p-2 border-r border-border-default text-center font-mono">92 Tons</td>
                        <td className="p-2 text-center font-bold text-status-critical">-20.0%</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <p>
                    The physical heat-rate triangle is mathematically irreconcilable. The low fuel consumption (-13.5%) and suppressed emissions reporting (-20.0%) directly contradict the high electrical outputs logged by the grid operator. This signature matches historical capacity concealment cases (morphology similarity <span className="font-bold">0.87</span>).
                  </p>
                </section>

                <section>
                  <h3 className="text-[12px] font-bold uppercase tracking-wider font-sans border-b border-border-default pb-1 mb-3">III. Risk Exposure & Preventive Value</h3>
                  <p className="mb-3">
                    If this pattern is permitted to continue without regulatory response, the AI forecasting engine estimates a <span className="font-bold text-status-critical">68% probability of safety-critical failure or emission breach within 90 days</span> due to sustained thermal strain on turbine components.
                  </p>
                  <p>
                    By initiating immediate preventive field verification, the Ministry mitigates an estimated cumulative exposure equivalent to <span className="font-bold text-text-primary">75 MMcm in unmetered gas volume</span> and preserves full regulatory integrity.
                  </p>
                </section>
              </div>

              {/* Document Signatures */}
              <div className="mt-16 border-t border-border-default pt-6 text-[10px] text-text-tertiary flex justify-between items-center font-sans font-bold tracking-wider uppercase">
                <span>CONFIDENTIAL Briefing — FOR MINISTERIAL USE ONLY</span>
                <span>Page 1 / 2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Status & CTA Panel */}
        <div className="w-[340px] border-l border-border-default bg-white p-6 flex flex-col shrink-0 overflow-y-auto z-10">
          <SectionTitle>Briefing Metadata</SectionTitle>
          <div className="space-y-3 mb-6">
            {[
              { label: 'Oversight Case', value: 'CASE-2026-001', detail: 'Critical Severity' },
              { label: 'Attributed Subject', value: 'Western Caspian Energy LLC', detail: 'ENT-KZ-AKT-0091' },
              { label: 'Asset Inspected', value: 'Aktau GCS-001 / Turbine Units 1-4', detail: 'Mangystau Province' },
              { label: 'Preventive SLA Window', value: '36 Hours Total', detail: '22 Hours Remaining' }
            ].map((meta, i) => (
              <div key={i} className="border border-border-default p-3 bg-[#FAFBFD] rounded-sm">
                <div className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">{meta.label}</div>
                <div className="text-[11px] font-bold text-text-primary mt-1 uppercase">{meta.value}</div>
                <div className="text-[9px] text-text-secondary mt-0.5 font-mono">{meta.detail}</div>
              </div>
            ))}
          </div>

          <SectionTitle>Ministerial Approval Loop</SectionTitle>
          <div className="space-y-4 relative mb-8">
            <div className="absolute left-[13px] top-6 bottom-6 w-px bg-border-default" />
            {[
              { actor: 'AI (Oversight Engine)', action: 'Telemetry anomaly matched & compiled', status: 'COMPLETE', time: '14:32' },
              { actor: 'Attribution Master Agent', action: '6-agent cross-system verification', status: 'COMPLETE', time: '14:50' },
              { actor: 'Inspection Directorate', action: 'Dispatched to Mangystau region', status: 'COMPLETE', time: '15:20' },
              { actor: 'Vice-Minister Approval', action: 'Approve Briefing & Joint Audit', status: isApproved ? 'COMPLETE' : 'PENDING', time: isApproved ? 'Just Now' : '--:--' }
            ].map((step, i) => (
              <div key={i} className="flex gap-4 relative z-10">
                <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white shrink-0 shadow-sm text-[10px] font-bold
                  ${step.status === 'COMPLETE' ? 'bg-status-success' : 'bg-bg-dark border-bg-dark text-white animate-pulse'}`}>
                  {step.status === 'COMPLETE' ? <CheckCircle2 size={13} /> : i + 1}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-[11px] font-black uppercase text-text-primary leading-tight">{step.actor}</div>
                  <div className="text-[11px] text-text-secondary font-medium">{step.action}</div>
                  <div className="text-[9.5px] font-mono font-bold text-text-tertiary mt-0.5 uppercase tracking-wider">{step.status} — {step.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-border-default space-y-2">
            {!isApproved ? (
              <button
                onClick={() => setIsApproved(true)}
                className="w-full min-h-[44px] bg-status-critical text-white text-[11px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all rounded-sm shadow-md flex items-center justify-center gap-2"
              >
                <Send size={14} /> Approve & Publish Briefing
              </button>
            ) : (
              <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-sm text-center text-status-success">
                <div className="text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 mb-1">
                  <CheckCircle2 size={16} /> Briefing Approved
                </div>
                <div className="text-[10px] text-text-secondary leading-snug font-medium">
                  Sent to the Office of the Minister. Joint inspection dispatched.
                </div>
              </div>
            )}
            <button
              onClick={() => navigate('/audit/event/CASE-2026-001')}
              className="w-full min-h-[40px] bg-white border border-border-default text-text-primary text-[11px] font-bold uppercase tracking-wider hover:bg-bg-hover transition-all rounded-sm flex items-center justify-center gap-2"
            >
              <RotateCw size={12} /> View Active Audit Timeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

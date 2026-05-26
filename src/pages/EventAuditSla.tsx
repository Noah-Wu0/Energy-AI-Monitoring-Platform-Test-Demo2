import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { SectionTitle } from '../components/UI';
import { case001LifecycleMatrix as DATA } from '../data/audit/case_001_lifecycle_matrix';

const SLA_STEPS = [
  {
    id: 'detect',
    title: 'AI risk detected',
    owner: 'AI Oversight Engine',
    status: 'DONE',
    expected: '< 5 min',
    actual: '42 sec',
    note: 'Detected abnormal night-time throughput before confirmed violation.',
  },
  {
    id: 'attribute',
    title: 'Attribution completed',
    owner: 'Master Audit Agent',
    status: 'DONE',
    expected: '2H',
    actual: '18 min',
    note: 'Cross-checked approval, reporting, inspection, sanction and audit lanes.',
  },
  {
    id: 'dispatch',
    title: 'Preventive inspection dispatch',
    owner: 'Inspection Dept',
    status: 'ACTIVE',
    expected: '36H window',
    actual: '22H remaining',
    note: 'Dispatch team before escalation window closes.',
  },
  {
    id: 'field',
    title: 'On-site verification',
    owner: 'Mangystau Regional Inspectorate',
    status: 'RISK',
    expected: '72H',
    actual: 'Not started',
    note: 'Risk of losing prevention window if regional task is not acknowledged.',
  },
  {
    id: 'brief',
    title: 'Minister briefing',
    owner: 'Vice-Minister Office',
    status: 'PENDING',
    expected: 'Same day',
    actual: 'Pending',
    note: 'Briefing package becomes available after dispatch acknowledgement.',
  },
];

const STATUS_STYLES: Record<string, string> = {
  DONE: 'bg-[#E8F7EF] text-[#1E9E54] border-[#BFE8D0]',
  ACTIVE: 'bg-[#E8F1FC] text-[#2D6CDF] border-[#BFD4F6]',
  RISK: 'bg-[#FDECEC] text-[#E14B4B] border-[#F6C4C4]',
  PENDING: 'bg-[#F1F4F8] text-[#64748B] border-[#D8DEE8]',
};

export default function EventAuditSla() {
  const navigate = useNavigate();
  const { caseId = DATA.meta.case_id } = useParams();

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      <div className="h-10 bg-white border-b border-border-default flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-h-9 flex items-center gap-1.5 text-text-tertiary hover:text-text-primary transition-colors pr-4 border-r border-border-default"
          >
            <ArrowLeft size={14} />
            <span className="all-caps-label text-[10px]">Back</span>
          </button>
          <span className="all-caps-label text-[10px] text-text-secondary">Question: Is preventive intervention still on time?</span>
          <span className="px-2 py-1 bg-bg-dark text-white rounded-sm text-[10px] font-bold uppercase tracking-wider">{caseId}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-status-success font-bold uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
          Prevention window monitored
        </div>
      </div>

      <div className="h-[132px] bg-white border-b border-border-default shrink-0 grid grid-cols-[1.35fr_repeat(4,1fr)] gap-px overflow-hidden">
        <div className="bg-[#1A1E23] text-white p-6 flex flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-2 text-[24px] font-bold leading-tight">
            <ShieldCheck size={22} className="shrink-0 text-white/70" />
            22H left to prevent escalation
          </div>
          <div className="mt-2 text-[12px] text-white/72 leading-relaxed max-w-[520px]">
            Still inside the 36H window. Dispatch delay is the main risk.
          </div>
        </div>
        {[
          ['AI detection', '42 sec', 'before confirmed incident'],
          ['Dispatch SLA', '36H', 'preventive inspection window'],
          ['Bottleneck', 'Dispatch', 'regional acknowledgement pending'],
          ['Avoided exposure', '75 MMcm', '30D estimated gas loss'],
        ].map(([label, value, sub]) => (
          <div key={label} className="bg-white p-4 border-l border-border-default flex flex-col justify-center">
            <div className="all-caps-label text-[10px] mb-2">{label}</div>
            <div className="text-[27px] font-semibold tracking-tight text-text-primary tabular-nums leading-none">{value}</div>
            <div className="mt-2 text-[11px] text-text-secondary leading-snug">{sub}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="grid grid-cols-[1fr_340px] gap-6">
          <section className="bg-white border border-border-default p-6">
            <div className="flex items-center justify-between mb-6">
              <SectionTitle className="mb-0">Preventive SLA Timeline</SectionTitle>
              <span className="px-2 py-1 bg-status-critical/10 text-status-critical text-[10px] font-bold uppercase tracking-wider rounded-sm">
                Dispatch is the critical path
              </span>
            </div>

            <div className="space-y-4">
              {SLA_STEPS.map((step, index) => (
                <div key={step.id} className="grid grid-cols-[42px_1fr_150px_150px] gap-4 items-stretch">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-9 h-9 rounded-full border flex items-center justify-center",
                      STATUS_STYLES[step.status]
                    )}>
                      {step.status === 'DONE' ? <CheckCircle2 size={16} /> : step.status === 'RISK' ? <AlertTriangle size={16} /> : <Clock size={16} />}
                    </div>
                    {index < SLA_STEPS.length - 1 && <div className="w-px flex-1 bg-border-default mt-2" />}
                  </div>

                  <div className="border border-border-default bg-[#FAFBFD] p-4 min-h-[92px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("px-2 py-0.5 border rounded-sm text-[9px] font-bold uppercase tracking-wider", STATUS_STYLES[step.status])}>
                        {step.status}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">{step.owner}</span>
                    </div>
                    <div className="text-[15px] font-bold text-text-primary mb-1">{step.title}</div>
                    <p className="text-[12px] leading-relaxed text-text-secondary">{step.note}</p>
                  </div>

                  <div className="border border-border-default bg-white p-4">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary mb-2">Expected</div>
                    <div className="text-[18px] font-bold text-text-primary tabular-nums">{step.expected}</div>
                  </div>

                  <div className={cn(
                    "border p-4",
                    step.status === 'RISK' ? "border-status-critical bg-status-critical/5" : "border-border-default bg-white"
                  )}>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary mb-2">Current</div>
                    <div className={cn("text-[18px] font-bold tabular-nums", step.status === 'RISK' ? "text-status-critical" : "text-text-primary")}>
                      {step.actual}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white border border-border-default p-6">
              <SectionTitle>Why It Matters</SectionTitle>
              <div className="space-y-4">
                <div className="p-4 border border-border-default bg-[#FDECEC]">
                  <div className="flex items-center gap-2 mb-2">
                    <TimerReset size={16} className="text-status-critical" />
                    <div className="text-[12px] font-bold text-status-critical uppercase tracking-wider">Prevention window</div>
                  </div>
                  <p className="text-[12px] leading-relaxed text-[#6A2830]">
                    Energy supervision value is created before incident escalation, not after a perfect retrospective audit.
                  </p>
                </div>
                <div className="p-4 border border-border-default">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2">AI role</div>
                  <p className="text-[12px] leading-relaxed text-text-secondary">
                    AI keeps the intervention window visible, flags the slow owner, and preserves the evidence trail for human approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-border-default p-6">
              <SectionTitle>Bottlenecks From Matrix</SectionTitle>
              <div className="space-y-3">
                {DATA.bottlenecks.slice(0, 3).map(item => (
                  <div key={`${item.stage}-${item.level}`} className="border border-border-default p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase text-text-primary">{item.stage}</span>
                      <span className="text-[11px] font-bold tabular-nums text-status-critical">{item.duration}</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-text-secondary">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-bg-secondary/30 border border-border-default p-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate(`/audit/event/${caseId}/matrix`)}
                className="w-full min-h-11 bg-white border border-border-default text-text-primary text-[11px] font-bold uppercase tracking-wider hover:bg-bg-hover transition-all flex items-center justify-center gap-2"
              >
                <FileCheck size={16} />
                View Full Audit Matrix
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/audit/report')}
                className="w-full min-h-11 bg-[#1A1E23] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                Generate Minister Brief
                <ChevronRight size={15} />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

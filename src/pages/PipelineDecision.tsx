import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  History,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { KpiCard, SectionTitle } from '../components/UI';
import queueData from '../data/anomaly/anomaly_queue';
import metadata512 from '../data/anomaly/ano_0512_metadata';
import similarCase from '../data/anomaly/similar_case';

const IMPACT_ITEMS = [
  ['Risk scoring', 'Continuous'],
  ['Action window', `${metadata512.kpis.action_window_h}H`],
  ['Owner suggested', 'Inspection Dept'],
  ['Evidence mode', 'Cross-system'],
];

export default function PipelineDecision() {
  const navigate = useNavigate();
  const { anomalyId } = useParams();
  const [activeAnomaly, setActiveAnomaly] = useState(anomalyId || 'ANO-2026-0512');
  const metadata = metadata512;

  useEffect(() => {
    if (anomalyId) setActiveAnomaly(anomalyId);
  }, [anomalyId]);

  const handleQueueClick = (id: string) => {
    setActiveAnomaly(id);
    navigate(`/warning/timeseries/${id}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      <div className="h-10 bg-white border-b border-border-default flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-h-9 flex items-center gap-1.5 text-text-tertiary hover:text-text-primary transition-colors pr-4 border-r border-border-default"
          >
            <ArrowLeft size={14} />
            <span className="all-caps-label text-[10px]">Back</span>
          </button>
          <span className="all-caps-label text-[10px] text-text-secondary">Question: Future risk and intervention window</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-status-critical/10 border border-status-critical/20 rounded-sm text-[10px] font-bold text-status-critical uppercase tracking-wider">
              {activeAnomaly}
            </span>
            <span className="px-2 py-1 bg-bg-dark text-white rounded-sm text-[10px] font-bold uppercase tracking-wider">
              {metadata.severity}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-status-success font-bold uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
          Inference Engine Active
        </div>
      </div>

      <div className="h-[132px] bg-white border-b border-border-default shrink-0 grid grid-cols-[1.35fr_repeat(4,1fr)] gap-px">
        <div className="bg-[#1A1E23] text-white p-6 flex flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 mb-2">
            <BrainCircuit size={15} />
            AI Regulatory Decision
          </div>
          <div className="text-[24px] font-bold leading-tight">
            92% breach risk within {metadata.kpis.predicted_next_breach_h}H
          </div>
          <div className="mt-2 text-[12px] text-white/72 leading-relaxed max-w-[520px]">
            Start preventive inspection within {metadata.kpis.action_window_h}H. Diagnostics remain available for evidence challenge.
          </div>
        </div>
        <KpiCard label="Action Deadline" value={`${metadata.kpis.action_window_h} H`} subLabel="recommended intervention window" />
        <KpiCard label="Avoided Exposure" value={`${metadata.kpis.predicted_cumulative_loss_mmcm} MMcm`} subLabel="30D estimated gas-loss threshold" />
        <KpiCard label="Pattern Match" value={metadata.kpis.morphology_similarity_score.toFixed(2)} subLabel={metadata.kpis.morphology_ci} />
        <KpiCard label="Confidence" value={metadata.kpis.ai_confidence.toFixed(2)} subLabel={metadata.kpis.ai_confidence_ci} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[76px] border-r border-border-default bg-white flex flex-col shrink-0">
          <div className="p-4 border-b border-border-default flex items-center justify-between">
            <span className="all-caps-label text-[9px] text-text-secondary">Queue</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {queueData.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleQueueClick(item.id)}
                className={cn(
                  "w-full min-h-14 rounded-md border flex flex-col items-center justify-center gap-1 transition-all",
                  activeAnomaly === item.id ? "bg-bg-dark border-bg-dark text-white shadow-lg z-10" : "bg-white border-border-default hover:bg-bg-hover"
                )}
                aria-label={`Open anomaly ${item.id}`}
              >
                <AlertTriangle size={14} className={activeAnomaly === item.id ? "text-white" : "text-status-critical"} />
                <span className="text-[10px] font-mono font-bold leading-none">{item.id.slice(-4)}</span>
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <section className="grid grid-cols-[1fr_320px] gap-6">
            <div className="bg-white border border-border-default p-6">
              <div className="flex items-center justify-between mb-6">
                <SectionTitle className="mb-0">Regulatory Action Brief</SectionTitle>
                <span className="text-[10px] font-bold uppercase tracking-wider text-status-critical bg-status-critical/10 px-2 py-1 rounded-sm">
                  Immediate attention required
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 border border-border-default bg-[#FDECEC]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-status-critical mb-2">Predicted risk</div>
                  <div className="text-[34px] font-bold text-status-critical leading-none">92%</div>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#6A2830]">Pipeline throughput breach within 48H.</p>
                </div>
                <div className="p-4 border border-border-default bg-bg-secondary/30">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2">Required action</div>
                  <div className="text-[20px] font-bold text-text-primary leading-tight">Preventive inspection</div>
                  <p className="mt-2 text-[12px] leading-relaxed text-text-secondary">Dispatch inspection team before the intervention window closes.</p>
                </div>
                <div className="p-4 border border-border-default bg-bg-secondary/30">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2">Responsible owner</div>
                  <div className="text-[20px] font-bold text-text-primary leading-tight">Inspection Dept</div>
                  <p className="mt-2 text-[12px] leading-relaxed text-text-secondary">Focus: Aktau GCS-001, Unit-2C operating pattern.</p>
                </div>
              </div>

              <div className="p-5 border border-border-default bg-[#FAFBFD]">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="text-status-success shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] font-bold text-text-primary mb-1">Recommended regulatory move</div>
                    <p className="text-[12px] leading-relaxed text-text-secondary">
                      Trigger preventive inspection within {metadata.kpis.action_window_h}H, reconcile SCADA versus self-reporting, and preserve evidence chain for case attribution if abnormal throughput continues.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-border-default p-6">
              <SectionTitle>AI Regulatory Impact</SectionTitle>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {IMPACT_ITEMS.map(([label, value]) => (
                  <div key={label} className="border border-border-default bg-bg-secondary/20 p-3 min-h-[64px]">
                    <div className="text-[9px] text-text-tertiary uppercase font-bold tracking-wider">{label}</div>
                    <div className="text-[13px] font-bold text-text-primary mt-1">{value}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-default pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <History size={15} className="text-text-tertiary" />
                  <div className="text-[12px] font-bold uppercase tracking-wider text-text-primary">Historical pattern support</div>
                </div>
                <div className="text-[12px] font-bold text-text-primary">{similarCase.id}</div>
                <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
                  Similarity {metadata.kpis.morphology_similarity_score.toFixed(2)} is used as a pattern signal for inspection, not as direct enforcement proof.
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-[1fr_320px] gap-6 mt-6">
            <div className="grid grid-cols-3 gap-4">
            {metadata.hypotheses.slice(0, 3).map(hypo => (
              <div key={hypo.rank} className="bg-white border border-border-default p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Hypothesis #{hypo.rank}</span>
                  <span className={cn("text-[16px] font-bold tabular-nums", hypo.rank === 1 ? "text-status-critical" : "text-text-primary")}>
                    {Math.round(hypo.probability * 100)}%
                  </span>
                </div>
                <div className="text-[12px] font-bold uppercase tracking-tight mb-2">{hypo.title}</div>
                <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">{hypo.rationale}</p>
              </div>
            ))}
            </div>
            <div className="bg-white border border-border-default p-6">
              <SectionTitle>Decision Support</SectionTitle>
              <div className="p-4 border border-border-default mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={15} className="text-status-critical" />
                  <div className="text-[11px] font-bold uppercase tracking-wider">30D horizon</div>
                </div>
                <p className="text-[11px] leading-relaxed text-text-secondary">
                  {metadata.future_risk_forecast.horizon_30d.predicted_outcome}
                </p>
              </div>
              <div className="p-4 border border-border-default">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={15} className="text-status-success" />
                  <div className="text-[11px] font-bold uppercase tracking-wider">Evidence standard</div>
                </div>
                <p className="text-[11px] leading-relaxed text-text-secondary">
                  Probability and similarity are recommendation signals. Human review is required before enforcement.
                </p>
              </div>
              <div className="pt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/warning/timeseries/${activeAnomaly}/diagnostics`)}
                  className="w-full min-h-11 bg-white border border-border-default text-text-primary text-[11px] font-bold uppercase tracking-wider hover:bg-bg-hover transition-all flex items-center justify-center gap-2"
                >
                  View Diagnostics
                  <ChevronRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/attribution/workflow/${metadata.case_id}`)}
                  className="w-full min-h-11 bg-[#E14B4B] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <GitBranch size={16} />
                  Launch Attribution
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

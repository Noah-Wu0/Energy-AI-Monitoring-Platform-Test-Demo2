import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { 
  ArrowLeft, 
  BrainCircuit, 
  GitBranch, 
  Map as MapIcon, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  History,
  TrendingUp,
  Info,
  ChevronRight
} from 'lucide-react';
import { StatusChip, SectionTitle, Button, KpiCard } from '../components/UI';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';

// Data imports
import queueData from '../data/anomaly/anomaly_queue';
import metadata512 from '../data/anomaly/ano_0512_metadata';
import timeseries512 from '../data/anomaly/ano_0512_timeseries';
import algoComparison from '../data/anomaly/algorithm_comparison';
import similarCase from '../data/anomaly/similar_case';

const chartPalette = {
  llm_band: '#4A90E2',  // alpha 0.15
  llm_p50: '#1F5BA8',
  actual_normal: '#52B788',
  actual_anomaly: '#E14B4B',
  actual_line: '#666666', // alpha 0.5
  stat_band: '#E7A53A', // alpha 0.18
  threshold_band: '#98A1AA', // alpha 0.12
  future_bg: '#F2F4F7',
  now_line: '#1A1E23',
  grid: '#EEF1F4',
};

export default function PipelineTimeSeries() {
  const navigate = useNavigate();
  const { anomalyId } = useParams();
  const [selectedAlgo, setSelectedAlgo] = useState('LLM_TS');
  const [activeAnomaly, setActiveAnomaly] = useState(anomalyId || 'ANO-2026-0512');

  useEffect(() => {
    if (anomalyId) setActiveAnomaly(anomalyId);
  }, [anomalyId]);

  // For this demo, we mainly show data for 0512. 
  // If another is selected, we'd ideally load its data. For now we show 0512 logic.
  const metadata = metadata512;
  const tsData = timeseries512;

  const chartOption = useMemo(() => {
    const dates = tsData.series.map(d => d.ts);
    const actuals = tsData.series.map(d => d.actual);
    const llm_p50 = tsData.series.map(d => d.llm_p50);
    const llm_p10 = tsData.series.map(d => d.llm_p10);
    const llm_p90 = tsData.series.map(d => d.llm_p90);
    const stat_p10 = tsData.series.map(d => d.stat_p10);
    const stat_p90 = tsData.series.map(d => d.stat_p90);
    const threshold_lo = tsData.series.map(d => d.threshold_lo);
    const threshold_hi = tsData.series.map(d => d.threshold_hi);

    const series: any[] = [];

    if (selectedAlgo === 'LLM_TS') {
      series.push(
        {
          name: 'P10-P90 Band',
          type: 'line',
          data: llm_p10,
          lineStyle: { opacity: 0 },
          stack: 'llm',
          symbol: 'none'
        },
        {
          name: 'LLM Confidence Band',
          type: 'line',
          data: llm_p90.map((v, i) => v - (llm_p10[i] || 0)),
          stack: 'llm',
          areaStyle: {
            color: chartPalette.llm_band,
            opacity: 0.15
          },
          lineStyle: { opacity: 0 },
          symbol: 'none'
        },
        {
          name: 'LLM P50',
          type: 'line',
          data: llm_p50,
          lineStyle: { color: chartPalette.llm_p50, width: 1 },
          symbol: 'none'
        }
      );
    } else if (selectedAlgo === 'STATISTICAL') {
      series.push(
        {
          name: 'Stat P10',
          type: 'line',
          data: stat_p10,
          lineStyle: { opacity: 0 },
          symbol: 'none',
          stack: 'stat'
        },
        {
          name: 'Statistical Band',
          type: 'line',
          data: stat_p90.map((v, i) => v ? (v - (stat_p10[i] || 0)) : null),
          stack: 'stat',
          areaStyle: {
            color: chartPalette.stat_band,
            opacity: 0.18
          },
          lineStyle: { opacity: 0 },
          symbol: 'none'
        }
      );
    } else if (selectedAlgo === 'THRESHOLD') {
      series.push(
        {
          name: 'Threshold Lo',
          type: 'line',
          data: threshold_lo,
          lineStyle: { opacity: 0 },
          symbol: 'none',
          stack: 'threshold'
        },
        {
          name: 'Fixed Threshold Band',
          type: 'line',
          data: threshold_hi.map((v, i) => v - threshold_lo[i]),
          stack: 'threshold',
          areaStyle: {
            color: chartPalette.threshold_band,
            opacity: 0.12
          },
          lineStyle: { opacity: 0 },
          symbol: 'none'
        }
      );
    }

    // Actual line (faint)
    series.push({
      name: 'Actual Line',
      type: 'line',
      data: actuals,
      lineStyle: { color: chartPalette.actual_line, width: 0.6, opacity: 0.5 },
      symbol: 'none',
      connectNulls: false
    });

    // Actual Points (colored by anomaly)
    series.push({
      name: 'Observations',
      type: 'scatter',
      data: tsData.series.map((d, i) => [i, d.actual]),
      symbolSize: (val: any, params: any) => {
        return tsData.series[params.dataIndex].is_anomaly ? 6 : 3;
      },
      itemStyle: {
        color: (params: any) => {
          return tsData.series[params.dataIndex].is_anomaly ? chartPalette.actual_anomaly : chartPalette.actual_normal;
        }
      }
    });

    return {
      grid: { top: 40, left: 40, right: 20, bottom: 40, containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const idx = params[0].dataIndex;
          const d = tsData.series[idx];
          const time = new Date(d.ts).toLocaleString();
          let html = `<div class="font-sans p-1">
            <div class="text-[10px] text-text-tertiary mb-1">${time}</div>
            <div class="flex justify-between gap-4 text-[11px]">
              <span>Observed:</span>
              <span class="font-bold">${d.actual !== null ? d.actual.toFixed(3) : 'N/A'}</span>
            </div>`;
          if (selectedAlgo === 'LLM_TS') {
            html += `<div class="flex justify-between gap-4 text-[11px]">
              <span>LLM P50:</span>
              <span class="font-bold text-status-info">${d.llm_p50.toFixed(3)}</span>
            </div>`;
          }
          html += `</div>`;
          return html;
        }
      },
      xAxis: {
        type: 'category',
        data: dates.map(ts => {
           const d = new Date(ts);
           return d.getHours() === 0 ? `${d.getMonth()+1}/${d.getDate()}` : '';
        }),
        axisLine: { lineStyle: { color: '#E2E6EB' } },
        axisTick: { show: false },
        axisLabel: { interval: 0, fontSize: 9, color: '#98A1AA' }
      },
      yAxis: {
        type: 'value',
        min: 0.03,
        max: 0.22,
        splitLine: { lineStyle: { color: chartPalette.grid } },
        axisLabel: { fontSize: 9, color: '#98A1AA' }
      },
      series,
      markLine: {
        symbol: ['none', 'none'],
        label: { show: false },
        data: [{ xAxis: tsData.series.findIndex(d => d.ts === tsData.now), lineStyle: { color: '#1A1E23', type: 'dashed' } }]
      },
      markArea: {
        silent: true,
        itemStyle: { color: chartPalette.future_bg, opacity: 0.5 },
        data: [[{
          xAxis: tsData.series.findIndex(d => d.ts === tsData.now)
        }, {
          xAxis: dates.length - 1
        }]]
      }
    };
  }, [selectedAlgo, tsData]);

  const handleQueueClick = (id: string) => {
    setActiveAnomaly(id);
    navigate(`/warning/timeseries/${id}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Context Bar */}
      <div className="h-10 bg-white border-b border-border-default flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-text-tertiary hover:text-text-primary transition-colors pr-4 border-r border-border-default"
          >
            <ArrowLeft size={14} />
            <span className="all-caps-label text-[10px]">Back</span>
          </button>
          <div className="flex items-center gap-6">
            <span className="all-caps-label text-[10px] text-text-secondary">Context: Pipeline Anomaly Prediction</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-status-critical/10 border border-status-critical/20 rounded-sm">
                <span className="text-[10px] font-bold text-status-critical uppercase tracking-wider">Anomaly: {activeAnomaly}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-bg-dark text-white rounded-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider">Severity: {metadata.severity}</span>
              </div>
              <span className="all-caps-label text-[10px] text-text-tertiary">Facility: {metadata.facility_id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-text-tertiary">
          <span className="font-mono">MODEL: LLM-TS-FOUNDATION-V2.3</span>
          <span className="opacity-50">|</span>
          <span>LAST INFERENCE: 2026-05-28 14:32:18</span>
          <span className="opacity-50">|</span>
          <div className="flex items-center gap-1.5 text-status-success">
            <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
            <span className="font-bold tracking-wider uppercase">Inference Engine: Active</span>
          </div>
        </div>
      </div>

      {/* AI Decision Strip — Prediction-Focused */}
      <div className="h-[132px] bg-white border-b border-border-default shrink-0 grid grid-cols-[1.35fr_repeat(4,1fr)] gap-px">
        <div className="bg-[#1A1E23] text-white p-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 mb-2">
            <BrainCircuit size={15} />
            AI Regulatory Decision
          </div>
          <div className="text-[22px] font-bold leading-tight">
            92% breach risk within {metadata.kpis.predicted_next_breach_h}H
          </div>
          <div className="mt-2 text-[12px] text-white/70 leading-relaxed max-w-[520px]">
            Start preventive inspection within {metadata.kpis.action_window_h}H to avoid escalation at {metadata.facility_name}.
          </div>
        </div>
        <KpiCard
          label="Action Deadline"
          value={`${metadata.kpis.action_window_h} H`}
          subLabel="recommended intervention window"
        />
        <KpiCard
          label="Avoided Exposure"
          value={`${metadata.kpis.predicted_cumulative_loss_mmcm} MMcm`}
          subLabel="30D estimated gas-loss threshold"
        />
        <KpiCard
          label="Pattern Match"
          value={metadata.kpis.morphology_similarity_score.toFixed(2)}
          subLabel={metadata.kpis.morphology_ci}
        />
        <KpiCard
          label="Confidence"
          value={metadata.kpis.ai_confidence.toFixed(2)}
          subLabel={metadata.kpis.ai_confidence_ci}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Anomaly Queue */}
        <div className="w-[260px] border-r border-border-default bg-white flex flex-col shrink-0">
          <div className="p-4 border-b border-border-default flex items-center justify-between">
            <span className="all-caps-label text-[10px] text-text-secondary">Anomaly Queue</span>
            <span className="text-[10px] font-mono opacity-60">[{queueData.length} Active]</span>
          </div>
          <div className="flex gap-1 p-2 border-b border-border-default bg-bg-secondary/20">
            <button className="flex-1 h-6 text-[9px] font-bold bg-bg-dark text-white rounded">ALL {queueData.length}</button>
            <button className="flex-1 h-6 text-[9px] font-bold bg-white border border-border-default text-text-tertiary rounded">CRITICAL 1</button>
            <button className="flex-1 h-6 text-[9px] font-bold bg-white border border-border-default text-text-tertiary rounded">WARNING 5</button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {queueData.map(item => (
              <button 
                key={item.id}
                onClick={() => handleQueueClick(item.id)}
                className={cn(
                  "w-full p-4 border-b border-border-default flex flex-col text-left transition-all",
                  activeAnomaly === item.id ? "bg-bg-dark text-white shadow-lg z-10" : "bg-white hover:bg-bg-hover"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.severity === 'CRITICAL' ? <AlertTriangle size={12} className={activeAnomaly === item.id ? "text-white" : "text-status-critical"} /> : <ShieldAlert size={12} className={activeAnomaly === item.id ? "text-white" : "text-status-warning"} />}
                    <span className="text-[10px] font-mono leading-none">{item.id}</span>
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-[2px]",
                    activeAnomaly === item.id ? "bg-white/20" : (item.severity === 'CRITICAL' ? "bg-status-critical/10 text-status-critical" : "bg-status-warning/10 text-status-warning")
                  )}>
                    {item.severity}
                  </span>
                </div>
                <div className="text-[11px] font-bold truncate mb-1">{item.headline || item.facility_name}</div>
                <div className={cn("text-[10px] mb-1 opacity-80", activeAnomaly === item.id ? "text-white/80" : "text-text-secondary")}>
                  {item.metric_name} · <span className={activeAnomaly === item.id ? "text-white" : (item.max_deviation_pct > 30 ? "text-status-critical font-bold" : "text-text-primary")}>+{item.max_deviation_pct}%</span>
                  {item.max_deviation_ci && <span className="text-[8px] ml-1 opacity-60">({item.max_deviation_ci})</span>}
                </div>
                <div className={cn("text-[9px] flex items-center justify-between mt-auto opacity-60", activeAnomaly === item.id ? "text-white/60" : "text-text-tertiary")}>
                  <span>Action window {item.action_window_h || '--'}H</span>
                  <span>{(item.ai_confidence * 100).toFixed(0)}% {(item as any).ai_confidence_ci ? '· ' + (item as any).ai_confidence_ci : ''}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Middle Cluster: Mini Map & Algo Switcher */}
          <div className="h-1/3 flex border-b border-border-default shrink-0">
            {/* Mini Map */}
            <div className="hidden border-r border-border-default relative bg-bg-secondary/20">
               <MapContainer center={[43.65, 51.16]} zoom={9} className="h-full w-full grayscale-[0.5] contrast-[0.8]" zoomControl={false} dragging={false} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                  <Polyline 
                    positions={[[43.7, 51.1], [43.65, 51.16], [43.6, 51.2]] as any} 
                    color="#66707A" 
                    weight={2}
                    opacity={0.6}
                  />
                  <Polyline 
                    positions={[[43.7, 51.1], [43.65, 51.16]] as any} 
                    color="#E14B4B" 
                    weight={3}
                  />
                  <CircleMarker center={[43.65, 51.16]} radius={6} color="#E14B4B" fillColor="#E14B4B" fillOpacity={0.8} />
               </MapContainer>
               <div className="absolute bottom-2 left-2 z-[1000] flex flex-col gap-1 items-start">
                  <span className="all-caps-label text-[9px] bg-white border border-border-default px-1.5 py-0.5">Spatial Localization: High</span>
                  <div className="bg-white/90 border border-border-default p-2 text-[9px] flex flex-col gap-1">
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-status-critical" /> Anomaly Hub</div>
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-0.5 bg-[#66707A]" /> Normal Link</div>
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-0.5 bg-status-critical" /> Anomaly Segment</div>
                  </div>
               </div>
            </div>

            {/* AI Regulatory Impact */}
            <div className="w-full flex flex-col bg-white p-4 justify-between">
              <SectionTitle>AI Regulatory Impact</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Risk scoring', 'Continuous'],
                  ['Action window', `${metadata.kpis.action_window_h}H`],
                  ['Owner suggested', 'Inspection'],
                  ['Evidence mode', 'Cross-system'],
                ].map(([label, value]) => (
                  <div key={label} className="border border-border-default bg-bg-secondary/20 p-2 rounded-sm min-h-[48px]">
                    <div className="text-[8px] text-text-tertiary uppercase font-bold tracking-wider">{label}</div>
                    <div className="text-[11px] font-bold text-text-primary mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-px bg-border-default border border-border-default">
                {algoComparison.algorithms.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAlgo(a.id)}
                    className={cn(
                      "flex-1 min-h-9 text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-0.5 px-2 text-center",
                      selectedAlgo === a.id ? "bg-bg-dark text-white" : "bg-white text-text-tertiary hover:bg-bg-hover"
                    )}
                  >
                    <span className="leading-tight">{a.name}</span>
                    {a.id === 'LLM_TS' && <span className="text-[7px] opacity-70">RECOMMENDED</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core Timeseries Chart */}
          <div className="flex-1 min-h-[300px] bg-white p-6 relative">
            <div className="absolute top-6 left-10 z-10 flex items-center gap-1.5 text-text-tertiary">
              <TrendingUp size={14} />
              <span className="all-caps-label text-[10px]">Pipeline Throughput Forecast (10-Day Window)</span>
            </div>
            
            <div className="absolute top-6 right-6 z-10 flex items-center gap-4 bg-bg-secondary/50 border border-border-default px-3 py-1.5 rounded-sm">
               <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-text-tertiary uppercase font-bold">Algorithm</span>
                  <span className="text-[10px] font-bold">{selectedAlgo === 'LLM_TS' ? 'LLM-TS-V2.3' : (selectedAlgo === 'THRESHOLD' ? 'FIXED-THRES' : 'STAT-ROLL')}</span>
               </div>
               <div className="w-px h-6 bg-border-default" />
               <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-text-tertiary uppercase font-bold">Resolution</span>
                  <span className="text-[10px] font-bold">15-min feed</span>
               </div>
               <div className="w-px h-6 bg-border-default" />
               <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-text-tertiary uppercase font-bold">Anomaly Points</span>
                  <span className="text-[10px] font-bold text-status-critical">156 / 673 (23.2%)</span>
               </div>
            </div>

            <ReactECharts 
              option={chartOption} 
              style={{ height: '100%', width: '100%' }}
            />

            <div className="absolute bottom-10 right-10 flex items-center gap-6 all-caps-label text-[9px] text-text-secondary">
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 bg-[#666666]" /> Actual Trend</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-status-critical" /> Anomaly Event</div>
               <div className="flex items-center gap-1.5"><div className="w-3 h-2 bg-status-info/15" /> Conf. Band ({selectedAlgo === 'LLM_TS' ? 'P10-P90' : '2σ'})</div>
               <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-status-info border-dashed border-opacity-50" /> Forecast Mean</div>
            </div>
          </div>

          {/* Lower Strip: Hypothesis cards */}
          <div className="h-[200px] border-t border-border-default grid grid-cols-3 gap-px bg-border-default shrink-0 overflow-x-auto">
             {metadata.hypotheses.map(hypo => (
               <div key={hypo.rank} className="bg-white p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="all-caps-label text-[10px] font-bold">Hypothesis #{hypo.rank}</span>
                    <span className={cn("text-[13px] font-bold tabular-nums", hypo.rank === 1 ? "text-status-critical" : "text-text-primary")}>
                      {Math.round(hypo.probability * 100)}%
                    </span>
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-tight mb-2 truncate" title={hypo.title}>{hypo.title}</div>
                  <p className="text-[10px] text-text-secondary leading-normal mb-3 line-clamp-2">
                    {hypo.rationale}
                  </p>
                  
                  <div className="flex flex-col gap-1 mb-4">
                    <div className="text-[9px] font-bold text-text-tertiary uppercase flex items-center gap-1">
                      <Info size={10} /> Evidence ({hypo.evidence.length})
                    </div>
                    {hypo.evidence.slice(0, 2).map((e, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[9px] text-text-secondary">
                        <div className="w-1 h-1 rounded-full bg-text-tertiary shrink-0" />
                        <span className="truncate">{e}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <button className="w-full h-7 bg-bg-dark text-white rounded-[2px] text-[9px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
                      Verify & Action
                    </button>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Right Column: AI Explainer & Similar Cases */}
        <div className="w-[360px] border-l border-border-default bg-white flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            {/* AI Prediction & Attribution */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit size={16} className="text-status-info" />
                <h3 className="section-title text-[13px] font-bold uppercase tracking-tight mb-0">AI Prediction & Attribution</h3>
              </div>

              <div className="space-y-6">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-status-critical animate-pulse" />
                     <div className="all-caps-label text-[10px] text-status-critical font-bold">Immediate Attention Required</div>
                   </div>
                   <p className="text-[13px] font-semibold text-text-primary leading-snug">
                     {metadata.ai_explanation.headline}
                   </p>
                </div>

                <div className="p-4 bg-bg-secondary/30 border border-border-default rounded-[2px]">
                   <div className="all-caps-label text-[9px] text-text-tertiary mb-2">Reasoning Basis</div>
                   <p className="text-[11px] leading-relaxed text-text-secondary">
                     {metadata.ai_explanation.detail}
                   </p>
                </div>
              </div>
            </div>

            {/* Historical Case Match */}
            <div className="mb-8 pt-8 border-t border-border-default">
              <div className="flex items-center gap-2 mb-4">
                <History size={16} className="text-text-tertiary" />
                <h3 className="section-title text-[13px] font-bold uppercase tracking-tight mb-0">Historical Case Match</h3>
              </div>
              
              <div className="border border-border-default p-4">
                <div className="flex items-center justify-between mb-3">
                   <span className="text-[11px] font-mono leading-none">{similarCase.id}</span>
                   <span className="all-caps-label text-[10px] bg-status-critical/10 text-status-critical px-1.5 py-0.5">Similarity 0.87</span>
                </div>
                <div className="text-[12px] font-bold mb-3 uppercase tracking-tight">{similarCase.title}</div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
                  <div>
                    <div className="all-caps-label text-[8px] text-text-tertiary">Occurred</div>
                    <div className="text-[10px] font-bold">{similarCase.occurred}</div>
                  </div>
                  <div>
                    <div className="all-caps-label text-[8px] text-text-tertiary">Resolved</div>
                    <div className="text-[10px] font-bold">{similarCase.resolved}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="all-caps-label text-[8px] text-text-tertiary mb-1">Outcome</div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-status-success" />
                      <span className="text-[10px] font-bold text-status-success">CONFIRMED VIOLATION</span>
                    </div>
                    <p className="text-[9px] text-text-secondary mt-1">Fine: 240 M KZT (~540 K USD)</p>
                  </div>
                  <button className="flex items-center gap-1 text-[10px] font-bold text-status-info hover:underline">
                    View Full Audit Chain <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Future Risk Forecast */}
            <div className="pt-8 border-t border-border-default">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-status-critical" />
                <h3 className="section-title text-[13px] font-bold uppercase tracking-tight mb-0 text-status-critical">Future Risk Forecast</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border border-border-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="all-caps-label text-[10px]">30-Day Horizon</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-status-warning/10 text-status-warning rounded-sm">HIGH RISK</span>
                  </div>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    {metadata.future_risk_forecast.horizon_30d.predicted_outcome}
                  </p>
                </div>

                <div className="p-4 border border-border-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="all-caps-label text-[10px]">90-Day Horizon</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-status-critical/10 text-status-critical rounded-sm">CRITICAL ESCALATION</span>
                  </div>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    {metadata.future_risk_forecast.horizon_90d.predicted_outcome}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border-default bg-bg-secondary/30 flex flex-col gap-2 shrink-0">
             <button className="w-full h-11 bg-white border border-border-default text-text-primary text-[11px] font-bold uppercase tracking-wider hover:bg-bg-hover relative overflow-hidden transition-all group">
                <span className="relative z-10">Mark as Acknowledged</span>
             </button>
             <button
                onClick={() => navigate(`/attribution/workflow/${metadata.case_id}`)}
                className="w-full h-11 bg-[#E14B4B] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-red-700 relative overflow-hidden transition-all group flex items-center justify-center gap-2"
             >
                <GitBranch size={16} />
                <span>Launch Attribution ▶</span>
             </button>
          </div>
        </div>
      </div>
      
      {/* Visual Indicator for Time Machine */}
      <AnimatePresence>
        {selectedAlgo === 'LLM_TS' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none"
          >
             <div className="bg-bg-dark/90 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10">
                <BrainCircuit size={18} className="text-status-info" />
                <span className="text-[12px] font-bold tracking-widest uppercase">LLM Forecasting Engaged: Residual Confidence {metadata.kpis.ai_confidence.toFixed(2)}</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

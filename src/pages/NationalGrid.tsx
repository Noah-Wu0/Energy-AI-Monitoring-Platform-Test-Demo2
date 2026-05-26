import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, ZoomControl, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KpiCard, SectionTitle, SummaryRow } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { CITIES } from '../data/geo';
import { KZ_BORDER_DETAILED } from '../data/kazakhstan-border';
import { KZ_REGIONS, type KZRegion } from '../data/kz-regions';
import { POWER_PLANTS, SUBSTATIONS, TRANSMISSION_LINES } from '../data/electricity';
import { OIL_FIELDS, GAS_FIELDS, REFINERIES, PIPELINES } from '../data/oilgas';
import { COAL_BASINS, COAL_MINES, MINE_MOUTH_PLANTS, URANIUM_MINES, COAL_RAIL } from '../data/coal';
import { ChevronRight, ChevronDown, ChevronUp, ShieldCheck, Clock, FileCheck, FileText, Bell, Layers, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

// ─── Map Auto-fit component: constrains view to Kazakhstan ───
function SetMapView() {
  const map = useMap();
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    // Fit to Kazakhstan bounds with padding
    const kzBounds = L.latLngBounds(KZ_BORDER_DETAILED.map(c => L.latLng(c[0], c[1])));
    map.fitBounds(kzBounds, { padding: [20, 20], maxZoom: 5.5 });
    
    // Constrain panning so the user can't wander far from Kazakhstan
    const sw = L.latLng(kzBounds.getSouth() - 5, kzBounds.getWest() - 10);
    const ne = L.latLng(kzBounds.getNorth() + 5, kzBounds.getEast() + 10);
    map.setMaxBounds(L.latLngBounds(sw, ne));
  }, [map]);
  
  return null;
}

// Marker icon factories
const createDivIcon = (html: string, size: [number, number] = [12, 12]) => L.divIcon({
  className: 'custom-div-icon',
  html,
  iconSize: size,
  iconAnchor: [size[0] / 2, size[1] / 2]
});

const ICONS = {
  CITY: (name: string, isCapital?: boolean) => createDivIcon(`
    <div class="flex flex-col items-center">
      <div class="w-2 h-2 ${isCapital ? 'bg-[#264653] border-[1.5px] border-[#C5A059] scale-125' : 'bg-[#264653]'} border border-white rounded-full shadow-sm"></div>
      <div class="mt-1 text-[8px] font-bold text-[#2F4858] uppercase tracking-wider drop-shadow-sm whitespace-nowrap">${name}${isCapital ? ' ★' : ''}</div>
    </div>`, [40, 30]),
  
  // Electricity
  THERMAL: createDivIcon('<div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-[#1A1A1A]"></div>', [8, 8]),
  HYDRO: createDivIcon('<div class="w-[5px] h-[5px] bg-[#1F77B4] rounded-full border border-white/80 shadow-sm"></div>', [6, 6]),
  SOLAR: createDivIcon('<div class="w-[5px] h-[5px] bg-[#F4B400] rotate-45 border border-white/40"></div>', [6, 6]),
  WIND: createDivIcon('<div class="text-[#2E8B57] flex items-center justify-center text-[10px] leading-none">✦</div>', [10, 10]),
  HUB: createDivIcon('<div class="w-[7px] h-[7px] bg-[#FF8C00] border border-[#1A1A1A] rounded-full shadow-sm"></div>', [8, 8]),
  SUB_500: createDivIcon('<div class="w-[5px] h-[5px] bg-[#FF8C00] rounded-full border border-black/10 shadow-sm"></div>', [6, 6]),
  SUB_220: createDivIcon('<div class="w-[4px] h-[4px] bg-[#FFD700] rounded-full shadow-sm"></div>', [5, 5]),

  // Oil & Gas
  OIL_FIELD: (size: number) => createDivIcon(`<div class="w-[${size}px] h-[${size}px] bg-[#FF6B35] border border-black/40 clip-hex flex items-center justify-center shadow-sm"></div>`, [size, size]),
  GAS_FIELD: (size: number) => createDivIcon(`<div class="w-[${size}px] h-[${size}px] bg-[#00A6D6] border border-black/40 clip-hex"></div>`, [size, size]),
  REFINERY: (size: number) => createDivIcon(`<div class="w-[${size}px] h-[${size}px] bg-[#8B4513] border border-black/10 flex items-center justify-center relative overflow-hidden"><div class="absolute bottom-0 w-full h-1/2 bg-black/10"></div></div>`, [size, size]),

  // Coal
  MINE: createDivIcon('<div class="w-[7px] h-[7px] bg-[#1A1A1A] border border-black/10"></div>', [8, 8]),
  MINE_MOUTH: createDivIcon('<div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-[#1A1A1A] border-2 border-status-critical p-[1px]"></div>', [10, 10]),
  URANIUM: createDivIcon('<div class="w-[7px] h-[7px] bg-[#C5E000] clip-hex border border-black/20"></div>', [8, 8]),
};

function DashboardKpi({ label, value, sub, status }: { label: string; value: string; sub: string; status: 'good' | 'warn' | 'critical' }) {
  const colors = {
    good: { dot: '#2FBF71', bg: '#E8F7EF' },
    warn: { dot: '#E7A53A', bg: '#FCF3E0' },
    critical: { dot: '#E14B4B', bg: '#FDECEC' },
  };
  const c = colors[status];
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md" style={{ backgroundColor: c.bg }}>
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.dot }} />
      <div>
        <div className="text-[9px] text-[#66707A] uppercase tracking-wider font-bold">{label}</div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-bold text-[#1A1E23] tabular-nums">{value}</span>
          <span className="text-[10px] text-[#66707A]">{sub}</span>
        </div>
      </div>
    </div>
  );
}

const LAYER_TABS = [
  { key: 'ELECTRICITY', label: 'Power' },
  { key: 'OIL & GAS', label: 'Oil & Gas' },
  { key: 'COAL', label: 'Coal & Uranium' },
];

const RISK_EVENTS = [
  { severity: 'Critical', time: '14:28', title: 'Pipeline Throughput Deviating from LLM Confidence Band', desc: 'ANO-2026-0512 — 92% breach probability within 48H, investigation recommended', location: 'Aktau · GCS-001', route: '/warning/timeseries/ANO-2026-0512' },
  { severity: 'Critical', time: '13:15', title: 'Western Caspian Energy — High-Risk Pattern Match', desc: 'SCADA pattern matches confirmed overproduction cases (similarity 0.87); cross-anomalies in financial & emissions data', location: 'Aktau · ENT-0091', route: '/warning/enterprise/ENT-0091' },
  { severity: 'Warning', time: '11:42', title: 'Pavlodar GRES-1 Coal Consumption Drift', desc: '24H coal consumption rate 2.1σ above historical average; may impact supply stability if sustained', location: 'Pavlodar · GRES-1' },
  { severity: 'Warning', time: '10:08', title: 'Atyrau Refinery Emissions Exceedance Warning', desc: '3 consecutive days near threshold; 68% probability of exceedance within 72H without intervention', location: 'Atyrau · ATY-REF-01' },
  { severity: 'Warning', time: '09:30', title: 'KEGOC 220kV Line Imbalance', desc: 'Three-phase imbalance on North-South transmission corridor exceeds warning threshold; may impact supply reliability', location: 'Astana · KEGOC-220' },
  { severity: 'Info', time: '08:15', title: 'Mangystau SCADA Data Delay', desc: '3 telemetry stations reporting delay >30min; gateway status under investigation', location: 'Mangystau · 3 Sites' },
  { severity: 'Info', time: '07:00', title: 'Routine Compliance Scan Complete', desc: '1,247 enterprises scanned today; 0 new high-risk items', location: 'Nationwide' },
];

// World mask polygon: covers the entire world, with a hole for Kazakhstan
const WORLD_OUTER: [number, number][] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
  [-90, -180]
];
const maskCoordinates = [WORLD_OUTER, KZ_BORDER_DETAILED];

// No colorful regions anymore; we use a minimalistic approach.

export default function NationalGrid() {
  const [tab, setTab] = useState('ELECTRICITY');
  const [countdown, setCountdown] = useState(299);
  const [isLeftOpen, setIsLeftOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const navigate = useNavigate();

  // Simulated countdown
  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 863)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `00:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };


  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFAFA] select-none">
      {/* KPI Strip — Vice Minister Dashboard */}
      <div className="h-16 bg-white border-b border-border-default flex items-center px-6 shrink-0 gap-6">
        <div className="flex items-center gap-2 mr-4">
          <ShieldCheck size={20} className="text-[#1A1E23]" />
          <span className="text-[13px] font-bold text-[#1A1E23] tracking-tight">Energy Oversight</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#2FBF71] animate-pulse ml-1" />
          <span className="text-[10px] text-[#2FBF71] font-bold uppercase tracking-wider">Live</span>
        </div>

        <div className="h-8 w-px bg-border-default" />

        <DashboardKpi label="Supply Stability" value="98.2%" sub="national index" status="good" />
        <DashboardKpi label="High-Risk Events" value="2" sub="requires HQ action" status="critical" />
        <DashboardKpi label="Pending Decisions" value="5" sub="dispatch / review" status="warn" />
        <DashboardKpi label="Avoided Exposure" value="75 MMcm" sub="30D estimated gas loss" status="critical" />

        <div className="flex-1" />

        <div className="flex items-center gap-3 text-[11px] text-[#66707A]">
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            <span className="tabular-nums">{formatCountdown(countdown)}</span>
            <span className="text-[#98A1AA]">to refresh</span>
          </span>
        </div>
      </div>

      {/* Closed-Loop Tracker */}
      <div className="h-9 bg-[#F5F7FA] border-b border-border-default flex items-center px-6 gap-1 shrink-0">
        {[
          { label: 'Detect', count: 12, active: true, color: '#355C7D' }, // 数据监管链路: #355C7D
          { label: 'Attribute', count: 8, active: true, color: '#355C7D' }, // 数据监管链路: #355C7D
          { label: 'Dispatch', count: 5, active: true, color: '#355C7D' }, // 数据监管链路: #355C7D
          { label: 'Resolve', count: 3, active: true, color: '#355C7D' }, // 数据监管链路: #355C7D
          { label: 'Review', count: 2, active: false, color: '#9A9A9A' }, // 规划/外部连接: #9A9A9A
          { label: 'Archive', count: 1, active: false, color: '#9A9A9A' }, // 规划/外部连接: #9A9A9A
        ].map((step, i, arr) => (
          <React.Fragment key={step.label}>
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-sm",
              step.active ? "bg-white border border-border-default" : "opacity-40"
            )}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.color }} />
              <span className="text-[11px] font-bold text-[#1A1E23]">{step.label}</span>
              <span className="text-[10px] font-mono text-[#66707A]">[{step.count}]</span>
            </div>
            {i < arr.length - 1 && <ChevronRight size={12} className="text-[#C9CDD4] shrink-0" />}
          </React.Fragment>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => navigate('/audit/report')}
          className="flex items-center gap-1 text-[10px] font-bold text-[#4A90E2] hover:underline uppercase tracking-wider"
        >
          <FileText size={12} /> Report
        </button>
      </div>

      {/* Tab Switcher — Layer Selector */}
      <div className="h-9 border-b border-border-default bg-white flex shrink-0 px-6 gap-1 items-center">
        <div className="flex items-center gap-2 mr-3 text-[10px] font-bold uppercase tracking-wider text-[#66707A]">
          <Layers size={13} />
          Energy Layer
        </div>
        {LAYER_TABS.map(t => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 h-7 text-[11px] font-bold tracking-wide rounded-full transition-all",
                isActive
                  ? "bg-[#1A1E23] text-white"
                  : "text-[#66707A] hover:bg-[#F5F7FA] hover:text-[#1A1E23]"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Stats Column */}
        <div className={cn(
          "border-r border-border-default bg-white overflow-y-auto flex flex-col shrink-0 transition-all duration-300",
          isLeftOpen ? "w-[240px] p-5 gap-6" : "w-[56px] p-2 gap-2"
        )}>
          <button
            type="button"
            aria-label={isLeftOpen ? "Collapse energy details panel" : "Expand energy details panel"}
            onClick={() => setIsLeftOpen(open => !open)}
            className={cn(
              "min-h-11 rounded-md border border-border-default bg-white text-[#66707A] hover:text-[#1A1E23] hover:bg-[#F5F7FA] transition-colors flex items-center",
              isLeftOpen ? "justify-between px-3" : "justify-center"
            )}
          >
            {isLeftOpen && <span className="text-[10px] font-bold uppercase tracking-wider">Energy Details</span>}
            {isLeftOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>

          {!isLeftOpen && (
            <div className="flex flex-col gap-2">
              {LAYER_TABS.map(t => (
                <button
                  key={t.key}
                  type="button"
                  aria-label={`Show ${t.label} layer`}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "min-h-11 rounded-md border text-[10px] font-bold leading-tight transition-colors px-1",
                    tab === t.key
                      ? "bg-[#1A1E23] border-[#1A1E23] text-white"
                      : "bg-white border-border-default text-[#66707A] hover:bg-[#F5F7FA] hover:text-[#1A1E23]"
                  )}
                >
                  {t.label.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {isLeftOpen && (
          <>
          {tab === 'ELECTRICITY' && (
            <>
              <KpiCard label="Total Electricity Generation" value="118.92 TWh" subLabel="2023 Gross Generation" />
              <div>
                <SectionTitle>Generation Mix</SectionTitle>
                <div className="space-y-4">
                  {[
                    { label: 'Fossil Fuels', val: 87.7, color: 'bg-[#1A1E23]' },
                    { label: 'Hydroelectricity', val: 8.2, color: 'bg-[#4A90E2]' },
                    { label: 'Other Renewables', val: 4.1, color: 'bg-[#2FBF71]' }
                  ].map(m => (
                    <div key={m.label} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-[#66707A]">{m.label}</span>
                        <span className="tabular-nums text-[#1A1E23]">{m.val}%</span>
                      </div>
                      <div className="h-1 bg-[#F5F7F9] w-full rounded-full overflow-hidden">
                        <div className={cn("h-full", m.color)} style={{ width: `${m.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <SectionTitle>Power Plants</SectionTitle>
                <div className="space-y-1">
                  <SummaryRow label="Thermal" value="42" />
                  <SummaryRow label="Hydro" value="06" />
                  <SummaryRow label="Solar" value="35" />
                  <SummaryRow label="Wind" value="28" />
                </div>
              </div>
              <div>
                <SectionTitle>Transmission Grid</SectionTitle>
                <div className="space-y-1">
                  <SummaryRow label="1150/500 kV" value="11" />
                  <SummaryRow label="500 kV" value="18" />
                  <SummaryRow label="220 kV (KEGOC)" value="124" />
                </div>
              </div>
            </>
          )}

          {tab === 'OIL & GAS' && (
            <>
              <KpiCard label="Fossil Fuel Reserves" value="24.18 BN" subLabel="Conventional Proved (TOE)" />
              <div>
                <SectionTitle>Reserves Breakdown</SectionTitle>
                <div className="space-y-1">
                  <SummaryRow label="Coal" value="74.1%" />
                  <SummaryRow label="Oil" value="16.9%" />
                  <SummaryRow label="Natural Gas" value="9.0%" />
                </div>
              </div>
              <div>
                <SectionTitle>Oil Infrastructure</SectionTitle>
                <div className="space-y-1">
                  <SummaryRow label="Oil Fields" value="07" />
                  <SummaryRow label="Gas Fields" value="05" />
                  <SummaryRow label="Refineries" value="03" />
                  <SummaryRow label="Storage Units" value="07" />
                </div>
              </div>
              <div>
                <SectionTitle>Pipeline Network</SectionTitle>
                <div className="space-y-1">
                  <SummaryRow label="Crude Oil" value="11,313 km" />
                  <SummaryRow label="Natural Gas" value="15,256 km" />
                  <SummaryRow label="Refined" value="1,095 km" />
                </div>
              </div>
            </>
          )}

          {tab === 'COAL' && (
            <>
              <KpiCard label="Coal Reserves" value="17.92 BN" subLabel="74.1% of Fossil Total (TOE)" />
              <div>
                <SectionTitle>Major Coal Basins</SectionTitle>
                <div className="space-y-1">
                  <SummaryRow label="Ekibastuz" value="Active" />
                  <SummaryRow label="Karaganda" value="Active" />
                  <SummaryRow label="Maikuben" value="Strategic" />
                  <SummaryRow label="Turgay" value="Strategic" />
                </div>
              </div>
              <div>
                <SectionTitle>Uranium Production</SectionTitle>
                <div className="space-y-3">
                  <SummaryRow label="Chu-Sarysu" value="18,225 tU" />
                  <SummaryRow label="Syrdarya" value="5,825 tU" />
                  <div className="pt-2 border-t border-border-default flex items-center justify-between font-bold uppercase tracking-wider text-[11px] text-[#E7A53A]">
                    <span>Global Rank</span>
                    <span>#1</span>
                  </div>
                </div>
              </div>
            </>
          )}
          </>
          )}

        </div>

        {/* Center Map Area */}
          <div className="flex-1 relative bg-[#E5DFD2] overflow-hidden">
            <MapContainer
              center={[48.0, 67.0]}
              zoom={5}
              className="h-full w-full"
              style={{ background: '#E5DFD2' }}
              zoomControl={false}
              attributionControl={false}
              minZoom={4}
              maxZoom={7}
            >
              <SetMapView />
              
              {/* Tile Layer — CartoDB Light (muted, no labels) */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                errorTileUrl=""
                className="map-tiles-layer"
                opacity={0.15} // Extremely low opacity so terrain/boundaries inside background do not distract from the main grid
              />

              {/* Base Kazakhstan Mainland filled with Warmer White (#F8F6EF) */}
              <Polygon
                positions={KZ_BORDER_DETAILED as any}
                pathOptions={{
                  fillColor: '#F8F6EF',
                  fillOpacity: 1,
                  color: 'transparent',
                  weight: 0,
                  interactive: false,
                }}
              />

              {/* 1) Per-region subtle boundaries — minimalistic professional look */}
              {KZ_REGIONS.map(region => {
                const isHovered = hoveredRegion === region.name;
                return region.polygons.map((poly, i) => (
                  <Polygon
                    key={`${region.name}-${i}`}
                    positions={poly as any}
                    pathOptions={{
                      fillColor: '#C8CEC6', // 行政边界 浅灰绿色
                      fillOpacity: isHovered ? 0.08 : 0, 
                      color: '#C8CEC6',
                      weight: isHovered ? 1.8 : 0.8, // thin borders
                      opacity: isHovered ? 0.8 : 0.5, // low opacity to remain very weak
                      className: 'glowing-light-green-border'
                    }}
                    eventHandlers={{
                      mouseover: () => setHoveredRegion(region.name),
                      mouseout: () => setHoveredRegion(null),
                    }}
                  />
                ));
              })}

              {/* 2) World Dimming Mask — surrounding region mask (#E5DFD2) */}
              <Polygon
                positions={maskCoordinates as any}
                pathOptions={{
                  fillColor: '#E5DFD2', // 周边区域 稍暗的灰米色
                  fillOpacity: 1.0,
                  color: 'transparent',
                  weight: 0,
                  interactive: false,
                }}
              />

              {/* 3a) National border outer stroke layer (soft white outline #FFFFFF, opacity 35%, 3px weight for contrast) */}
              <Polygon
                positions={KZ_BORDER_DETAILED as any}
                pathOptions={{
                  fill: false,
                  color: '#FFFFFF',
                  weight: 3.0,
                  opacity: 0.35,
                  interactive: false,
                }}
              />

              {/* 3b) National border highlight — dark grey-green main stroke (#5F746D, opacity 90%, 1.7px width) */}
              <Polygon
                positions={KZ_BORDER_DETAILED as any}
                pathOptions={{
                  fill: false,
                  color: '#5F746D', // 国界 低饱和深灰绿色
                  weight: 1.7,
                  opacity: 0.9,
                  className: 'glowing-border'
                }}
              />
              {/* Electricity Layer */}
              {tab === 'ELECTRICITY' && (
                <>
                  {TRANSMISSION_LINES.map(line => (
                    <Polyline 
                      key={line.id} 
                      positions={[line.from as any, line.to as any]} 
                      color={
                        line.status === 'PLANNED' || line.type === 'INTER' ? '#9A9A9A' : // 外部连接和规划线: #9A9A9A
                        line.type === '220kV' ? '#A78257' : // 普通线路: #A78257
                        '#8A623B' // 主线路: #8A623B 深棕铜色 (1150kV, 500kV, etc.)
                      } 
                      weight={
                        line.type === '1150kV' ? 2.4 : 
                        line.type === '500kV' ? 1.8 : 
                        line.type === 'INTER' ? 2.0 : 
                        1.2
                      } 
                      dashArray={
                        line.status === 'PLANNED' ? '5, 5' : 
                        line.type === 'INTER' ? '5, 3' : 
                        undefined
                      }
                      opacity={
                        line.status === 'PLANNED' || line.type === 'INTER' ? 0.75 : 
                        line.type === '220kV' ? 0.75 : // 普通线路降低透明度至 70%-80%
                        0.88 // Main lines also slightly muted so they do not overpower the country outline
                      } 
                    />
                  ))}
                  {POWER_PLANTS.map(p => (
                    <Marker 
                      key={p.id} 
                      position={p.coords as any} 
                      icon={p.type === 'thermal' ? ICONS.THERMAL : p.type === 'hydro' ? ICONS.HYDRO : p.type === 'solar' ? ICONS.SOLAR : ICONS.WIND} 
                    >
                      <Popup className="custom-popup">
                        <div className="p-2 min-w-[140px]">
                          <div className="all-caps-label text-[9px] mb-1 uppercase text-[#66707A] font-bold">{p.type} Station</div>
                          <div className="text-[12px] font-bold text-[#1A1E23] tracking-tight">{p.name}</div>
                          <div className="h-px bg-border-default my-2" />
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-[#98A1AA]">Output Capacity</span>
                            <span className="tabular-nums font-bold text-[#1A1E23]">{p.mw} MW</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {SUBSTATIONS.map(s => (
                    <Marker key={s.id} position={s.coords as any} icon={s.isHub ? ICONS.HUB : ICONS.SUB_500} />
                  ))}
                </>
              )}

              {/* Oil & Gas Layer */}
              {tab === 'OIL & GAS' && (
                <>
                  {PIPELINES.map(p => (
                    <Polyline 
                      key={p.id} 
                      positions={[p.from as any, p.to as any]} 
                      color={p.type === 'OIL' ? '#8A623B' : '#8A623B'} // Oil & Gas major lines both use #8A623B
                      weight={p.width || 2} 
                      opacity={0.85} 
                    />
                  ))}
                  {OIL_FIELDS.map(f => (
                     <Marker key={f.id} position={f.coords as any} icon={ICONS.OIL_FIELD(f.size === 'XXL' ? 12 : f.size === 'XL' ? 10 : 8)}>
                       <Popup className="custom-popup">
                         <div className="p-2 min-w-[140px]">
                           <div className="all-caps-label text-[9px] mb-1 text-[#FF6B35] font-bold">Oil Field</div>
                           <div className="text-[12px] font-bold text-[#1A1E23]">{f.name}</div>
                           <div className="text-[10px] text-[#98A1AA] mt-1 uppercase tracking-wider">{f.size} Reserve</div>
                         </div>
                       </Popup>
                     </Marker>
                  ))}
                  {GAS_FIELDS.map(f => (
                     <Marker key={f.id} position={f.coords as any} icon={ICONS.GAS_FIELD(f.size === 'XL' ? 10 : 7)} />
                  ))}
                  {REFINERIES.map(r => (
                     <Marker key={r.id} position={r.coords as any} icon={ICONS.REFINERY(9)}>
                        <Popup className="custom-popup">
                          <div className="p-2">
                           <div className="all-caps-label text-[9px] mb-1 text-[#8B4513] font-bold">Refinery Complex</div>
                           <div className="text-[12px] font-bold text-[#1A1E23]">{r.name}</div>
                           <div className="h-px bg-border-default my-2" />
                           <div className="flex justify-between text-[11px] mb-1">
                             <span className="text-[#66707A]">State Capacity</span>
                             <span className="text-[#1A1E23] font-bold">{r.capacity}</span>
                           </div>
                          </div>
                        </Popup>
                     </Marker>
                  ))}
                </>
              )}

              {/* Coal Layer */}
              {tab === 'COAL' && (
                <>
                  {COAL_BASINS.map(b => {
                    const isLargest = (b as any).isLargest;
                    return (
                    <Circle
                      key={b.id}
                      center={b.coords as any}
                      radius={isLargest ? 80000 : 50000}
                      pathOptions={{
                        color: b.color || '#3A3A3A',
                        weight: isLargest ? 2.5 : 1,
                        fillOpacity: isLargest ? 0.25 : 0.12,
                        fillColor: b.color || '#3A3A3A',
                        dashArray: isLargest ? undefined : undefined,
                      }}
                    >
                      <Popup className="custom-popup">
                        <div className="p-2">
                          <div className="all-caps-label text-[9px] mb-1 uppercase text-[#98A1AA]">Coal Basin</div>
                          <div className="text-[12px] font-bold uppercase tracking-tight text-[#1A1E23]">{b.name}</div>
                          <div className="text-[10px] text-[#66707A] mt-1">{b.type} · {b.reserves}</div>
                          {isLargest && <div className="text-[10px] font-bold text-[#D8454C] mt-1 uppercase">★ Largest Coal Basin · Data Center Power Source</div>}
                          {(b as any).region && <div className="text-[9px] text-[#98A1AA] mt-0.5">{(b as any).region} Region</div>}
                        </div>
                      </Popup>
                    </Circle>
                  )})}
                  {COAL_MINES.map(m => (
                    <Marker key={m.id} position={m.coords as any} icon={ICONS.MINE}>
                      <Popup className="custom-popup">
                        <div className="p-2">
                          <div className="all-caps-label text-[9px] mb-1 text-[#98A1AA]">Coal Mine</div>
                          <div className="text-[12px] font-bold text-[#1A1E23]">{m.name}</div>
                          <div className="text-[10px] text-[#66707A] mt-1">{m.basin} Basin · {m.type}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {MINE_MOUTH_PLANTS.map(p => (
                    <Marker key={p.id} position={p.coords as any} icon={ICONS.MINE_MOUTH}>
                      <Popup className="custom-popup">
                        <div className="p-2 min-w-[160px]">
                          <div className="all-caps-label text-[9px] mb-1 text-[#98A1AA]">Mine-Mouth Plant</div>
                          <div className="text-[12px] font-bold text-[#1A1E23]">{p.name}</div>
                          <div className="text-[10px] text-[#66707A] mt-1">{p.mw} MW · {(p as any).fuel}</div>
                          {(p as any).note && <div className="text-[10px] font-bold text-[#D8454C] mt-1">⚡ {(p as any).note}</div>}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {URANIUM_MINES.map(u => (
                    <Marker key={u.id} position={u.coords as any} icon={ICONS.URANIUM}>
                      <Popup className="custom-popup">
                         <div className="p-2">
                           <div className="all-caps-label text-[9px] mb-1 text-[#C5E000] font-bold">Uranium Mine</div>
                           <div className="text-[12px] font-bold text-[#1A1E23]">{u.name}</div>
                           <div className="text-[11px] text-[#98A1AA] mt-1 tabular-nums">{u.capacity}</div>
                         </div>
                      </Popup>
                    </Marker>
                  ))}
                  {COAL_RAIL.map(r => (
                    <Polyline key={r.id} positions={[r.from as any, r.to as any]} color="#9A9A9A" weight={1.5} dashArray="5, 3" opacity={0.75} /> // 规划/外部连接 中性灰虚线
                  ))}
                </>
              )}

              {/* Base City Layer (Always On) */}
              {CITIES.map(c => (
                <Marker 
                  key={c.code} 
                  position={c.coords as any} 
                  icon={ICONS.CITY(c.name, c.isCapital)}
                  eventHandlers={{ click: () => navigate(`/sensing/regional/${c.name.toLowerCase()}`) }}
                  zIndexOffset={100}
                >
                  <Popup className="custom-popup">
                    <div className="p-3 min-w-[160px]">
                      <div className="text-[14px] font-bold text-[#1A1E23] tracking-tight leading-none mb-0.5">{c.name}</div>
                      <div className="text-[10px] text-[#98A1AA] uppercase font-bold tracking-widest">{c.region} Region</div>
                      <div className="w-full h-px bg-[#E2E6EB] my-3" />
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#66707A]">Population</span>
                          <span className="font-bold tabular-nums text-[#1A1E23]">{c.population}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#66707A]">State Facilities</span>
                          <span className="font-bold tabular-nums text-[#1A1E23]">{c.facilities}</span>
                        </div>
                        <div className="pt-2 text-[11px] text-[#4A90E2] font-bold uppercase tracking-wider flex items-center justify-between cursor-pointer group">
                          View details <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              <ZoomControl position="topright" />
            </MapContainer>

          <MapLegend tab={tab} />
          
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/80 backdrop-blur-md border border-border-default px-3 py-1.5 shadow-xl rounded-sm">
             <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#66707A]">
               <div className="w-1.5 h-1.5 rounded-full bg-[#2FBF71] animate-pulse" />
               Telemetry &lt;1s capable · SCADA 15-min current feed · AI continuous inference
             </div>
          </div>
        </div>

        {/* Right Risk Panel */}
        <div className={cn(
          "border-l border-border-default bg-white flex flex-col overflow-hidden shrink-0 transition-all duration-300",
          isRightOpen ? "w-[320px]" : "w-[64px]"
        )}>
          <div className="p-4 border-b border-border-default flex items-center justify-between bg-white shrink-0">
            <button
              type="button"
              aria-label={isRightOpen ? "Collapse risk events panel" : "Expand risk events panel"}
              onClick={() => setIsRightOpen(open => !open)}
              className="min-h-11 min-w-11 rounded-md border border-border-default text-[#66707A] hover:text-[#1A1E23] hover:bg-[#F5F7FA] transition-colors flex items-center justify-center"
            >
              {isRightOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>
            {isRightOpen && <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#1A1E23]" />
              <span className="text-[11px] font-bold text-[#1A1E23] uppercase tracking-wider">Risk Events</span>
            </div>}
            {isRightOpen && <div className="flex items-center gap-3">
              <button className="text-[10px] font-bold text-[#E14B4B] border-b border-[#E14B4B]">Critical 2</button>
              <button className="text-[10px] font-bold text-[#98A1AA] hover:text-[#E7A53A]">Warning 5</button>
              <button className="text-[10px] font-bold text-[#98A1AA] hover:text-[#66707A]">Info 5</button>
            </div>}
          </div>
          {!isRightOpen && (
            <div className="flex-1 flex flex-col items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-md bg-[#FDECEC] text-[#E14B4B] flex flex-col items-center justify-center">
                <span className="text-[15px] font-bold leading-none">2</span>
                <span className="text-[7px] font-bold uppercase leading-none">Crit</span>
              </div>
              <div className="w-10 h-10 rounded-md bg-[#FCF3E0] text-[#A96705] flex flex-col items-center justify-center">
                <span className="text-[15px] font-bold leading-none">5</span>
                <span className="text-[7px] font-bold uppercase leading-none">Warn</span>
              </div>
              <div className="h-px w-8 bg-border-default" />
              <div
                className="rotate-180 text-[10px] font-bold uppercase tracking-wider text-[#66707A]"
                style={{ writingMode: 'vertical-rl' }}
              >
                Risk Queue
              </div>
            </div>
          )}
          {isRightOpen && (
          <>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {RISK_EVENTS.map((ev, idx) => (
              <div
                key={idx}
                onClick={() => ev.route && navigate(ev.route)}
                className={cn(
                  "p-4 border-b border-border-default cursor-pointer hover:bg-[#FAFAFA] transition-colors group",
                  ev.severity === 'Critical' ? "border-l-[3px] border-l-[#E14B4B]" : "border-l-[3px] border-l-transparent"
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider",
                    ev.severity === 'Critical' ? "bg-[#E14B4B]/10 text-[#E14B4B]" :
                    ev.severity === 'Warning' ? "bg-[#E7A53A]/10 text-[#E7A53A]" :
                    "bg-[#98A1AA]/10 text-[#66707A]"
                  )}>
                    {ev.severity}
                  </span>
                  <span className="text-[9px] text-[#98A1AA] font-mono">{ev.time}</span>
                </div>
                <div className="text-[11px] font-bold text-[#1A1E23] mb-1 leading-tight">{ev.title}</div>
                <div className="text-[10px] text-[#66707A] leading-relaxed line-clamp-2 mb-2">{ev.desc}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[#98A1AA] font-bold uppercase">{ev.location}</span>
                  <span className="text-[9px] font-bold text-[#4A90E2] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Drill Down <ChevronRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-white border-t border-border-default shrink-0">
            <button onClick={() => navigate('/audit/report')} className="w-full h-10 bg-[#1A1E23] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center justify-center gap-2 rounded-sm">
              <FileCheck size={14} /> View All Events
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

function MapLegend({ tab }: { tab: string }) {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="absolute bottom-6 right-6 z-[1000] w-56 flex flex-col bg-white/90 backdrop-blur-md border border-border-default overflow-hidden shadow-2xl rounded-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 flex items-center justify-between bg-bg-hover/10 border-b border-border-default hover:bg-bg-hover transition-colors"
      >
        <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#66707A]">Legend</div>
        {isOpen ? <ChevronDown size={12} className="text-[#66707A]" /> : <ChevronUp size={12} className="text-[#66707A]" />}
      </button>
      
      {isOpen && (
        <div className="p-3 flex flex-col gap-4">
          <div>
            <div className="text-[8px] font-bold text-[#98A1AA] uppercase tracking-[0.15em] mb-2">Network</div>
            <div className="space-y-1.5">
              {tab === 'ELECTRICITY' ? (
                <>
                  <LegendItem color="#8A623B" label="1150 kV Backbone (Main Line)" />
                  <LegendItem color="#8A623B" label="500 kV Grid (Main Line)" />
                  <LegendItem color="#A78257" label="220 kV Grid (Ordinary Line)" opacity={0.75} />
                  <LegendItem color="#9A9A9A" label="Transit Interconnects (Planned)" dashed />
                </>
              ) : (
                <>
                  <LegendItem color="#8A623B" label="Oil Trunk (Main Line)" />
                  <LegendItem color="#8A623B" label="Gas Trunk (Main Line)" />
                  <LegendItem color="#9A9A9A" label="Energy Rail Link (External)" dashed />
                </>
              )}
            </div>
          </div>

          <div>
            <div className="text-[8px] font-bold text-[#98A1AA] uppercase tracking-[0.15em] mb-2">Nodes</div>
            <div className="grid grid-cols-2 gap-2">
              <LegendIcon symbol="▲" label="Thermal" color="#1A1A1A" />
              <LegendIcon symbol="●" label="Hydro" color="#1F77B4" />
              <LegendIcon symbol="◆" label="Solar" color="#F4B400" />
              <LegendIcon symbol="✦" label="Wind" color="#2E8B57" />
              <LegendIcon symbol="⬣" label="Oil Field" color="#FF6B35" />
              <LegendIcon symbol="⬡" label="Gas Field" color="#00A6D6" />
              <LegendIcon symbol="▣" label="Refinery" color="#8B4513" />
              <LegendIcon symbol="■" label="Coal Mine" color="#1A1A1A" />
              <LegendIcon symbol="⬢" label="Uranium" color="#A5B500" />
            </div>
          </div>

          <div>
             <div className="text-[8px] font-bold text-[#98A1AA] uppercase tracking-[0.15em] mb-2">Hubs</div>
             <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 bg-[#FF8C00] border border-[#1A1A1A] rounded-full" />
                   <span className="text-[9px] text-[#66707A] uppercase tracking-[0.08em]">1150/500 kV (KEGOC)</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-status-critical rounded-full" />
                   <span className="text-[9px] text-[#66707A] uppercase tracking-[0.08em]">Regional Center</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label, dashed, weight = 2 }: { color: string, label: string, dashed?: boolean, weight?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-6 transition-all", dashed ? "border-t border-dashed" : "bg-current")} style={{ color, height: dashed ? 0 : weight }} />
      <span className="text-[9px] text-[#66707A] uppercase tracking-[0.08em] whitespace-nowrap">{label}</span>
    </div>
  );
}

function LegendIcon({ symbol, label, color }: { symbol: string, label: string, color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold leading-none" style={{ color }}>{symbol}</span>
      <span className="text-[9px] text-[#66707A] uppercase tracking-[0.08em] truncate">{label}</span>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KpiCard, SectionTitle, SummaryRow, Button } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { CITIES } from '../data/geo';
import { POWER_PLANTS, SUBSTATIONS, TRANSMISSION_LINES } from '../data/electricity';
import { OIL_FIELDS, GAS_FIELDS, REFINERIES, PIPELINES } from '../data/oilgas';
import { COAL_BASINS, COAL_MINES, MINE_MOUTH_PLANTS, URANIUM_MINES, COAL_RAIL } from '../data/coal';
import { Info, Flame, ChevronRight, AlertTriangle, Layers, ChevronDown, ChevronUp } from 'lucide-react';

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
      <div class="w-2 h-2 ${isCapital ? 'bg-white border-2 border-status-critical scale-150' : 'bg-status-critical'} border border-white rounded-full shadow-lg"></div>
      <div class="mt-1 text-[8px] font-bold text-[#1A1A1A] uppercase tracking-wider drop-shadow-sm whitespace-nowrap">${name}${isCapital ? ' ★' : ''}</div>
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

export default function NationalGrid() {
  const [tab, setTab] = useState('ELECTRICITY');
  const [events, setEvents] = useState<any[]>([]);
  const [countdown, setCountdown] = useState(863); // 14:23 as seconds
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

  // Event feed simulation based on tab
  useEffect(() => {
    const generateEvent = () => {
      const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const prefixes = {
        ELECTRICITY: ['TELEMETRY SYNC', 'LINE STATUS', 'HEARTBEAT', 'AI INFERENCE', 'LOAD UPDATE'],
        'OIL & GAS': ['PIPELINE FLOW', 'FIELD OUTPUT', 'STORAGE LEVEL', 'REFINERY STATUS', 'PORT TELEMETRY'],
        COAL: ['EXTRACTION', 'TRANSPORT', 'POWER GEN', 'STOCKPILE', 'RADIATION CHECK']
      };
      const targets = {
        ELECTRICITY: ['SUB-500-AST-001', '500KV-PAV-EKB', 'NODE-237', 'GRES-1'],
        'OIL & GAS': ['PL-CPC-001', 'TENGIZ-01', 'BOZOI-ST', 'PAVLODAR-REF'],
        COAL: ['EKB-MINE-2', 'RAIL-UKG-1', 'GRES-2', 'KAR-STOCK-A']
      };
      
      const currentPrefixes = (prefixes as any)[tab] || prefixes.ELECTRICITY;
      const currentTargets = (targets as any)[tab] || targets.ELECTRICITY;

      return {
        time,
        type: currentPrefixes[Math.floor(Math.random() * currentPrefixes.length)],
        target: currentTargets[Math.floor(Math.random() * currentTargets.length)],
        status: Math.random() > 0.9 ? 'FLAG' : 'NOMINAL'
      };
    };

    setEvents(Array.from({ length: 12 }).map(() => generateEvent()));

    const interval = setInterval(() => {
      setEvents(prev => [generateEvent(), ...prev].slice(0, 20));
    }, 5000);
    return () => clearInterval(interval);
  }, [tab]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFAFA] select-none">
      {/* Context Bar */}
      <div className="h-10 bg-white border-b border-border-default flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-[0.1em] text-[#98A1AA] font-medium">Context: National Energy Grid</span>
          <div className="flex gap-2">
            <span className="bg-[#2FBF71]/10 text-[#2FBF71] px-2 py-0.5 text-[9px] font-bold rounded-sm border border-[#2FBF71]/20 uppercase tracking-widest">Live</span>
            <span className="bg-[#F5F7F9] text-[#98A1AA] px-2 py-0.5 text-[9px] font-bold rounded-sm border border-[#E2E6EB] uppercase tracking-widest">Pre-Event</span>
            <span className="bg-[#F5F7F9] text-[#98A1AA] px-2 py-0.5 text-[9px] font-bold rounded-sm border border-[#E2E6EB] uppercase tracking-widest">Traceability</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-[11px] text-[#66707A] font-medium">
          <span>LAST SYNC: 2026-05-28 14:32</span>
          <span>NEXT REFRESH: <span className="text-[#1A1E23] tabular-nums">{formatCountdown(countdown)}</span></span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="h-11 border-b border-border-default bg-white flex shrink-0">
        {['ELECTRICITY', 'OIL & GAS', 'COAL', 'HEATING (PENDING)'].map(t => {
          const isPending = t.includes('PENDING');
          const isActive = tab === t;
          return (
            <button
              key={t}
              disabled={isPending}
              onClick={() => setTab(t)}
              className={cn(
                "px-8 h-full text-[11px] font-bold tracking-[0.1em] transition-all relative flex items-center gap-2",
                isActive ? "text-[#1A1E23] bg-white" : "text-[#98A1AA] hover:text-[#66707A]",
                isPending ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              )}
            >
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#1A1E23]" />}
              {t}
              {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1E23]" />}
              {isPending && (
                <div className="absolute left-1/2 -top-8 -translate-x-1/2 bg-[#1A1E23] text-white text-[9px] px-2 py-1 rounded shadow-sm opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Data source pending integration
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Stats Column */}
        <div className="w-[240px] border-r border-border-default bg-white p-5 overflow-y-auto flex flex-col shrink-0 gap-6">
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

          {tab.includes('HEATING') && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center p-6 gap-4">
              <Flame size={48} className="text-[#98A1AA]" />
              <div className="all-caps-label text-[10px]">Architecture Pending</div>
            </div>
          )}
        </div>

        {/* Center Map Area */}
        <div className="flex-1 relative bg-[#FAFAF8] overflow-hidden">
          {tab.includes('HEATING') ? (
            <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
              <div className="bg-white border border-border-default p-10 rounded shadow-2xl flex flex-col items-center text-center max-w-sm gap-6">
                <div className="w-16 h-16 bg-[#F5F7F9] rounded-full flex items-center justify-center text-[#98A1AA]">
                   <Info size={32} />
                </div>
                <div className="space-y-2">
                  <div className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#1A1E23]">No Data Source</div>
                  <div className="text-[12px] font-medium uppercase tracking-[0.1em] text-[#66707A]">Heating Domain Data integration pending</div>
                  <p className="text-[11px] text-[#98A1AA] leading-relaxed mt-2">
                    This module will be activated after heating sector data is integrated into the National Energy Technology platform.
                  </p>
                </div>
                <Button variant="primary" className="w-full h-10 text-[11px] uppercase tracking-widest">Request Data Integration</Button>
              </div>
            </div>
          ) : (
            <MapContainer 
              center={[48.5, 68.0]} 
              zoom={4.3} 
              className="h-full w-full bg-[#FAFAF8]" 
              zoomControl={false}
              attributionControl={false}
              minZoom={3.8}
              maxZoom={7}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
              
              {/* Electricity Layer */}
              {tab === 'ELECTRICITY' && (
                <>
                  {TRANSMISSION_LINES.map(line => (
                    <Polyline 
                      key={line.id} 
                      positions={[line.from as any, line.to as any]} 
                      color={
                        line.type === '1150kV' ? '#9D4EDD' : 
                        line.type === '500kV' ? '#E63946' : 
                        line.type === 'INTER' ? '#666666' :
                        '#4A90E2'
                      } 
                      weight={
                        line.type === '1150kV' ? 2.8 : 
                        line.type === '500kV' ? 2.2 : 
                        line.type === 'INTER' ? 3.0 : 
                        1.4
                      } 
                      dashArray={
                        line.status === 'PLANNED' ? '8, 8' : 
                        line.type === 'INTER' ? '6, 4' : 
                        undefined
                      }
                      opacity={line.type === 'INTER' ? 0.8 : 0.7} 
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
                      color={p.type === 'OIL' ? '#FF6B35' : '#00A6D6'} 
                      weight={p.width || 2} 
                      opacity={0.9} 
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
                  {COAL_BASINS.map(b => (
                    <Circle 
                      key={b.id} 
                      center={b.coords as any} 
                      radius={50000} // Approximate radius for visualization
                      pathOptions={{ color: b.color || '#3A3A3A', weight: 1, fillOpacity: 0.15, fillColor: b.color || '#3A3A3A' }} 
                    >
                      <Popup className="custom-popup">
                        <div className="p-2">
                          <div className="all-caps-label text-[9px] mb-1 uppercase text-[#98A1AA]">Coal Basin</div>
                          <div className="text-[12px] font-bold uppercase tracking-tight text-[#1A1E23]">{b.name}</div>
                          <div className="text-[10px] text-[#66707A] mt-1">{b.type} · {b.reserves}</div>
                        </div>
                      </Popup>
                    </Circle>
                  ))}
                  {COAL_MINES.map(m => (
                    <Marker key={m.id} position={m.coords as any} icon={ICONS.MINE} />
                  ))}
                  {MINE_MOUTH_PLANTS.map(p => (
                    <Marker key={p.id} position={p.coords as any} icon={ICONS.MINE_MOUTH} />
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
                    <Polyline key={r.id} positions={[r.from as any, r.to as any]} color="#888888" weight={1.6} dashArray="4, 4" opacity={0.6} />
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
          )}

          <MapLegend tab={tab} />
          
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/80 backdrop-blur-md border border-border-default px-3 py-1.5 shadow-xl rounded-sm">
             <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#98A1AA]">
               <div className="w-1.5 h-1.5 rounded-full bg-[#2FBF71] animate-pulse" />
               Live Telemetry · 15-Min Cycle · National Overlay
             </div>
          </div>
        </div>

        {/* Right Event Feed Column */}
        <div className="w-[320px] border-l border-border-default bg-white flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-border-default flex items-center justify-between bg-white shrink-0">
            <SectionTitle className="mb-0">Live Event Feed</SectionTitle>
            <span className="flex items-center gap-1.5 text-[#2FBF71] text-[10px] font-bold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2FBF71]" />
              Live
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 font-mono select-text bg-[#FAFAFA]">
            {events.map((e, idx) => (
              <div key={idx} className={cn(
                "text-[11px] leading-relaxed border-l-2 pl-3 py-1 transition-all",
                e.status === 'FLAG' ? "border-[#E7A53A] bg-[#E7A53A]/5 shadow-sm" : "border-[#E2E6EB] hover:border-[#1A1E23]"
              )}>
                <div className="flex items-center gap-2 text-[#98A1AA] mb-0.5">
                  <span className="tabular-nums">[{e.time}]</span>
                  {e.status === 'FLAG' && <AlertTriangle size={10} className="text-[#E7A53A]" />}
                </div>
                <div className="flex flex-wrap items-center gap-x-2">
                   <span className="text-[#1A1E23] font-bold uppercase tracking-tighter">{e.type}</span>
                   <span className="text-[#98A1AA]">/</span>
                   <span className={cn("font-medium", e.status === 'FLAG' ? "text-[#E7A53A]" : "text-[#66707A]")}>
                     {e.target}
                   </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-5 bg-white border-t border-border-default shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="all-caps-label text-[9px] text-[#98A1AA]">Past 24H Activity Density</div>
              <div className="text-[9px] font-bold tabular-nums text-[#66707A]">v.0.98.4</div>
            </div>
            <div className="h-12 flex items-end gap-[1.5px] px-0.5">
              {Array.from({ length: 54 }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex-1 rounded-t-[1px] transition-all duration-300 hover:scale-y-110 cursor-help",
                    i === 53 ? "bg-[#E14B4B]" : "bg-[#1A1E23]/20"
                  )} 
                  style={{ height: `${Math.random() * 80 + 20}%` }} 
                  title={`${Math.floor(Math.random() * 50)} events`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[8px] all-caps-label text-[#98A1AA] tracking-widest font-bold">
              <span>Past 24H</span>
              <span>NOMINAL</span>
              <span>Now</span>
            </div>
            <Button variant="secondary" className="w-full h-9 mt-5 text-[10px] uppercase tracking-widest font-bold group" onClick={() => {}}>
              View All Events <ChevronRight size={12} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
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
                  <LegendItem color="#9D4EDD" label="1150 kV Backbone" />
                  <LegendItem color="#E63946" label="500 kV Grid" />
                  <LegendItem color="#4A90E2" label="220 kV Grid" />
                  <LegendItem color="#666666" label="Transit Interconnects" weight={3} />
                </>
              ) : (
                <>
                  <LegendItem color="#FF6B35" label="Oil Trunk" />
                  <LegendItem color="#00A6D6" label="Gas Trunk" />
                  <LegendItem color="#888" label="Energy Rail Link" dashed />
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

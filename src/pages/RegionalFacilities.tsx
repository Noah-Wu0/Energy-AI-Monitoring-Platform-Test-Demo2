import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, GeoJSON, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ChevronRight, 
  AlertCircle, 
  Activity, 
  Zap, 
  Droplets, 
  Flame, 
  AlertTriangle,
  ExternalLink,
  Map as MapIcon,
  Filter,
  RefreshCw,
  Search,
  Plus
} from 'lucide-react';
import { KpiCard, SectionTitle, StatusChip, Button, SummaryRow } from '../components/UI';
import { RightDrawer } from '../components/RightDrawer';
import { cn } from '@/src/lib/utils';
import { KAZAKHSTAN_BORDER } from '../data/geo';

// Data Imports
import MANGYSTAU_BOUNDS from '../data/aktau/mangystau_oblast';
import AKTAU_NODES from '../data/aktau/aktau_nodes';
import AKTAU_CONNECTIONS from '../data/aktau/aktau_connections';
import AKTAU_ALERTS from '../data/aktau/aktau_alerts';
import AKTAU_DEVICES from '../data/aktau/aktau_devices_GCS001';
import AKTAU_ENTERPRISE from '../data/aktau/aktau_enterprise_0091';

const STATUS_COLORS: any = {
  NORMAL:   { fill: '#2FBF71', pulse: false },
  WARNING:  { fill: '#E7A53A', pulse: 'pulse-warning' },
  CRITICAL: { fill: '#E14B4B', pulse: 'pulse-critical' },
  OFFLINE:  { fill: '#98A1AA', pulse: false },
};

const LINE_STATUS_COLORS: any = {
  NORMAL:   { color: '#52B788', width: 1.4, style: 'solid' },
  WARNING:  { color: '#E7A53A', width: 1.6, style: 'solid' },
  CRITICAL: { color: '#E14B4B', width: 2.0, style: 'solid', flow: true },
  OFFLINE:  { color: '#98A1AA', width: 1.4, style: 'dashed' },
};

const createIcon = (status: string, nodeType: string) => {
  const config = STATUS_COLORS[status] || STATUS_COLORS.NORMAL;
  const isCritical = status === 'CRITICAL';
  
  return L.divIcon({
    className: 'custom-node-container',
    html: `
      <div class="relative flex items-center justify-center">
        ${isCritical ? `<div class="absolute w-6 h-6 bg-status-critical/20 rounded-full pulse-critical"></div>` : ''}
        ${status === 'WARNING' ? `<div class="absolute w-5 h-5 bg-status-warning/20 rounded-full pulse-warning"></div>` : ''}
        <div class="relative w-[14px] h-[14px] rounded-full border-2 border-white shadow-md flex items-center justify-center overflow-hidden" 
             style="background-color: ${config.fill}">
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export default function RegionalFacilities() {
  const { regionId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [tab, setTab] = useState('LINK STATUS');
  const [layerFilter, setLayerFilter] = useState('OIL');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isSecondLayerOpen, setSecondLayerOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nodeFilter, setNodeFilter] = useState('ALL');

  // Map settings
  const center: [number, number] = [44.20, 51.50];
  const zoom = 7.5;

  // Filtered Data
  const nodes = useMemo(() => {
    let baseNodes = AKTAU_NODES.features;
    
    if (tab === 'ANOMALY MAP') {
      return baseNodes; // We handle opacity in the render
    }
    
    if (tab === 'LAYER VIEW') {
      if (layerFilter === 'OIL') return baseNodes.filter(n => n.properties.type.includes('OIL') || n.properties.type.includes('WELLFIELD') || n.properties.type.includes('TERMINAL') || n.properties.type.includes('PUMP'));
      if (layerFilter === 'GAS') return baseNodes.filter(n => n.properties.type.includes('GAS') || n.properties.type.includes('COMPRESSOR') || n.properties.type.includes('STORAGE'));
      if (layerFilter === 'ELECTRICITY') return baseNodes.filter(n => n.properties.type.includes('SUBSTATION') || n.properties.type.includes('SOLAR') || n.properties.type.includes('WIND') || n.properties.type.includes('PLANT'));
      if (layerFilter === 'COAL') return [];
    }
    
    return baseNodes;
  }, [tab, layerFilter]);

  const connections = useMemo(() => {
    let baseLines = AKTAU_CONNECTIONS.features;
    if (tab === 'LAYER VIEW') {
      if (layerFilter === 'OIL') return baseLines.filter(l => l.properties.type.includes('OIL') || l.properties.type.includes('REFINERY'));
      if (layerFilter === 'GAS') return baseLines.filter(l => l.properties.type.includes('GAS'));
      if (layerFilter === 'ELECTRICITY') return baseLines.filter(l => l.properties.type.includes('TRANSMISSION') || l.properties.type.includes('PLANT'));
      if (layerFilter === 'COAL') return [];
    }
    return baseLines;
  }, [tab, layerFilter]);

  const filteredNodesList = useMemo(() => {
    let list = AKTAU_NODES.features.map(f => f.properties);
    if (nodeFilter !== 'ALL') {
      list = list.filter(n => n.status === nodeFilter);
    }
    if (searchTerm) {
      list = list.filter(n => n.name_en.toLowerCase().includes(searchTerm.toLowerCase()) || n.id.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    // Sort by severity
    const order: any = { CRITICAL: 0, OFFLINE: 1, WARNING: 2, NORMAL: 3 };
    return list.sort((a, b) => order[a.status] - order[b.status]);
  }, [nodeFilter, searchTerm]);

  const stats = useMemo(() => {
    const list = AKTAU_NODES.features.map(f => f.properties);
    return {
      all: list.length,
      normal: list.filter(n => n.status === 'NORMAL').length,
      warning: list.filter(n => n.status === 'WARNING').length,
      critical: list.filter(n => n.status === 'CRITICAL').length,
      offline: list.filter(n => n.status === 'OFFLINE').length,
    };
  }, []);

  const openNode = (nodeProperties: any) => {
    setSelectedNode(nodeProperties);
    setDrawerOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-page font-sans">
      {/* Context Bar */}
      <div className="h-10 bg-white border-b border-border-default flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sensing/national-grid')} className="text-text-primary hover:text-text-secondary flex items-center gap-1.5 transition-colors">
            <ArrowLeft size={16} />
            <span className="all-caps-label text-[10px] font-bold">Back</span>
          </button>
          <div className="w-px h-4 bg-border-default" />
          <div className="flex flex-col">
            <div className="all-caps-label text-[9px] translate-y-0.5">Context: Regional Facilities</div>
            <div className="text-[11px] font-bold text-text-primary flex items-center gap-1">
              AKTAU (43.65°N, 51.16°E)
              <span className="text-[10px] font-normal text-text-tertiary">› KZ-AKT › MANGISTAU OBLAST</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
            <span className="text-[10px] font-mono text-text-secondary uppercase">Live Stream Connected</span>
          </div>
          <div className="text-[10px] tabular-nums text-text-tertiary font-mono">
             LAST SYNC: 2026-05-28 14:32:18
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="h-10 border-b border-border-default bg-white flex shrink-0 z-10">
        {['LINK STATUS', 'LAYER VIEW', 'ANOMALY MAP'].map(t => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-6 text-[10px] font-bold tracking-[0.12em] transition-all relative border-r border-border-default/50",
              tab === t ? "text-text-primary bg-bg-secondary/20" : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            {t}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary" />}
          </button>
        ))}
      </div>

      {/* Layer Views Sub-tabs (only for LAYER VIEW) */}
      <AnimatePresence mode="wait">
        {tab === 'LAYER VIEW' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 36, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-bg-secondary/40 border-b border-border-default flex items-center px-6 gap-6 shrink-0 overflow-hidden"
          >
            {['OIL', 'GAS', 'ELECTRICITY', 'COAL'].map(l => (
              <button 
                key={l}
                onClick={() => setLayerFilter(l)}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider transition-colors",
                  layerFilter === l ? "text-status-info border-b-2 border-status-info h-full px-2 mt-[2px]" : "text-text-tertiary hover:text-text-primary"
                )}
              >
                {l}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: KPI + Node List */}
        <div className="w-[280px] bg-white border-r border-border-default flex flex-col shrink-0">
          <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-2">
              <KpiCard label="Total Nodes" value="45" />
              <KpiCard label="Health Score" value="80%" subLabel="Mangystau Index" />
              <KpiCard label="Anomalies" value="09" color="text-status-warning" />
              <KpiCard label="Ingest" value="14ms" subLabel="1.22 GB/s" />
            </div>

            <div className="pt-4 pb-2">
              <SectionTitle className="text-[10px]">Regional Nodes</SectionTitle>
              <div className="flex items-center gap-1 mb-3">
                 <button onClick={() => setNodeFilter('ALL')} className={cn("px-2 py-1 text-[9px] font-bold rounded", nodeFilter === 'ALL' ? "bg-bg-dark text-white" : "bg-bg-secondary text-text-tertiary")}>ALL {stats.all}</button>
                 <button onClick={() => setNodeFilter('NORMAL')} className={cn("px-2 py-1 text-[9px] font-bold rounded", nodeFilter === 'NORMAL' ? "bg-status-success text-white" : "bg-bg-secondary text-text-tertiary")}>● {stats.normal}</button>
                 <button onClick={() => setNodeFilter('WARNING')} className={cn("px-2 py-1 text-[9px] font-bold rounded", nodeFilter === 'WARNING' ? "bg-status-warning text-white" : "bg-bg-secondary text-text-tertiary")}>▲ {stats.warning}</button>
                 <button onClick={() => setNodeFilter('CRITICAL')} className={cn("px-2 py-1 text-[9px] font-bold rounded", nodeFilter === 'CRITICAL' ? "bg-status-critical text-white" : "bg-bg-secondary text-text-tertiary")}>◆ {stats.critical}</button>
                 <button onClick={() => setNodeFilter('OFFLINE')} className={cn("px-2 py-1 text-[9px] font-bold rounded", nodeFilter === 'OFFLINE' ? "bg-status-neutral text-white" : "bg-bg-secondary text-text-tertiary")}>⊗ {stats.offline}</button>
              </div>
              <div className="relative mb-3">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input 
                  type="text" 
                  placeholder="Filter nodes..." 
                  className="w-full h-8 pl-8 pr-3 bg-bg-secondary border border-border-default text-[11px] rounded-sm focus:outline-none focus:ring-1 focus:ring-text-tertiary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pb-4">
              {filteredNodesList.map(node => (
                <button 
                  key={node.id}
                  onClick={() => openNode(node)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-sm transition-all text-left",
                    selectedNode?.id === node.id ? "bg-bg-secondary border-l-2 border-bg-dark" : "hover:bg-bg-hover"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      node.status === 'NORMAL' ? "bg-status-success" : 
                      node.status === 'WARNING' ? "bg-status-warning" : 
                      node.status === 'CRITICAL' ? "bg-status-critical animate-pulse" : 
                      "bg-status-neutral"
                    )} />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold leading-none mb-0.5">{node.id.split('-').slice(3).join('-')}</span>
                      <span className="text-[9px] text-text-tertiary truncate max-w-[140px] uppercase font-mono">{node.name_en}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-[8px] font-bold uppercase",
                      node.status === 'CRITICAL' ? "text-status-critical" : 
                      node.status === 'WARNING' ? "text-status-warning" : 
                      "text-text-tertiary"
                    )}>{node.status[0]}</span>
                    <span className="text-[9px] font-mono font-medium text-text-secondary leading-none">{node.health_score}%</span>
                  </div>
                </button>
              ))}
              {filteredNodesList.length === 0 && (
                <div className="text-center py-8 text-[11px] text-text-tertiary italic">No facilities matches filter</div>
              )}
            </div>
          </div>
        </div>

        {/* Map Center */}
        <div className="flex-1 relative bg-[#F5F7FA]">
          {tab === 'LAYER VIEW' && layerFilter === 'COAL' ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-[1000] bg-white/60 backdrop-blur-sm">
                <Flame size={48} className="text-text-tertiary mb-4 opacity-20" />
                <div className="text-[14px] font-bold text-text-primary uppercase tracking-widest mb-1">NO COAL FACILITIES IN AKTAU REGION</div>
                <div className="text-[11px] text-text-secondary">Mangystau region focuses on Oil, Gas, and Power Generation only.</div>
             </div>
          ) : (
            <MapContainer center={center} zoom={zoom} className="h-full w-full" zoomControl={false} scrollWheelZoom={true}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
              
              {/* Kazakhstan Border Line */}
              <Polyline positions={KAZAKHSTAN_BORDER} color="#E63946" weight={1.6} opacity={0.6} />

              {/* Mangystau Oblast Boundary */}
              <GeoJSON 
                data={MANGYSTAU_BOUNDS as any} 
                style={{
                  color: '#D4A72C',
                  weight: 1.2,
                  dashArray: '4, 3',
                  fillColor: 'transparent',
                  fillOpacity: 0
                }}
              />

              {/* Neighbors Labels (Mock positions for visual) */}
              <div className="absolute top-10 left-10 pointer-events-none opacity-30 select-none z-[1000]">
                <div className="all-caps-label text-[24px] tracking-[1em]">RUSSIAN FEDERATION</div>
              </div>

              {/* Caspian Sea Label */}
              <div className="absolute bottom-24 left-24 pointer-events-none opacity-40 select-none z-[1000] text-status-info">
                <div className="font-bold text-[20px] tracking-[0.5em] italic">CASPIAN SEA</div>
              </div>

              {/* Connections */}
              {connections.map((conn: any) => {
                const status = conn.properties.status;
                const config = LINE_STATUS_COLORS[status] || LINE_STATUS_COLORS.NORMAL;
                const isAnomalyTab = tab === 'ANOMALY MAP';
                const opacity = isAnomalyTab ? (status === 'NORMAL' ? 0.05 : 0.8) : 0.6;
                
                return (
                  <Polyline 
                    key={conn.properties.id}
                    // Leaflet Polyline expects [[lat, lon], [lat, lon]]
                    positions={conn.geometry.coordinates.map((p: any) => [p[1], p[0]])}
                    color={config.color}
                    weight={config.width}
                    dashArray={status === 'OFFLINE' ? '4, 3' : undefined}
                    opacity={opacity}
                    className={config.flowAnimation || (isAnomalyTab && status !== 'NORMAL') ? 'line-flow-animation' : ''}
                  >
                    <Tooltip sticky>
                       <div className="p-1">
                          <div className="text-[10px] font-bold text-text-primary uppercase mb-0.5">{conn.properties.id}</div>
                          <div className="text-[9px] text-text-secondary uppercase">{conn.properties.type.replace('_', ' ')}</div>
                          <div className="flex items-center gap-1.5 mt-1 border-t border-border-default pt-1">
                             <div className={cn("w-1.5 h-1.5 rounded-full", conn.properties.status === 'NORMAL' ? "bg-status-success" : "bg-status-warning")} />
                             <span className="text-[9px] font-bold uppercase">{conn.properties.status}</span>
                          </div>
                       </div>
                    </Tooltip>
                  </Polyline>
                );
              })}

              {/* Nodes */}
              {nodes.map((node: any) => {
                const status = node.properties.status;
                const isAnomalyTab = tab === 'ANOMALY MAP';
                const opacity = isAnomalyTab ? (status === 'NORMAL' ? 0.15 : 1) : 1;
                
                return (
                  <Marker 
                    key={node.properties.id}
                    position={[node.geometry.coordinates[1], node.geometry.coordinates[0]]}
                    icon={createIcon(status, node.properties.type)}
                    opacity={opacity}
                    eventHandlers={{ click: () => openNode(node.properties) }}
                  >
                    <Tooltip sticky>
                      <div className="p-2 min-w-[120px]">
                        <div className="flex justify-between items-start mb-0.5">
                           <div className="text-[11px] font-bold text-text-primary uppercase leading-tight">{node.properties.name_en}</div>
                           <StatusChip status={status[0]} />
                        </div>
                        <div className="text-[9px] text-text-secondary uppercase mb-2 font-mono">{node.properties.id}</div>
                        <div className="space-y-1 border-t border-border-default pt-2">
                           <div className="flex justify-between text-[10px]">
                              <span className="text-text-tertiary uppercase">Type</span>
                              <span className="font-medium">{node.properties.type.split('_')[0]}</span>
                           </div>
                           <div className="flex justify-between text-[10px]">
                              <span className="text-text-tertiary uppercase">Health</span>
                              <span className="font-bold tabular-nums">{node.properties.health_score}%</span>
                           </div>
                        </div>
                        <div className="mt-2 text-[9px] font-bold text-status-info flex items-center justify-center gap-1 hover:underline cursor-pointer">
                           inspect facility <ChevronRight size={10} />
                        </div>
                      </div>
                    </Tooltip>
                  </Marker>
                );
              })}
            </MapContainer>
          )}

          {/* Map Overlays */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <div className="bg-white/80 backdrop-blur-md border border-border-default p-3 shadow-xl rounded-sm">
               <div className="text-[9px] font-bold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapIcon size={12} />
                  Map Layers
               </div>
               <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                     <div className="w-5 h-[2px] bg-status-critical" />
                     <span className="text-[9px] text-text-secondary uppercase">National Border</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-5 h-[2px] border-t border-dashed border-[#D4A72C]" />
                     <span className="text-[9px] text-text-secondary uppercase">Mangystau Limits</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-status-success border border-white" />
                     <span className="text-[9px] text-text-secondary uppercase">Normal Node</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-status-critical animate-pulse border border-white" />
                     <span className="text-[9px] text-text-secondary uppercase font-bold text-status-critical">Anomaly Risk</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 z-[1000] bg-white/80 backdrop-blur-md border border-border-default px-4 py-2 shadow-sm rounded-sm">
             <div className="flex items-center gap-4">
                <div className="flex flex-col">
                   <span className="text-[9px] all-caps-label text-text-tertiary">Coord Index</span>
                   <span className="text-[12px] font-mono font-bold text-text-primary tabular-nums">43.653° , 51.161°</span>
                </div>
                <div className="w-px h-6 bg-border-default" />
                <div className="flex flex-col">
                   <span className="text-[9px] all-caps-label text-text-tertiary">View Focus</span>
                   <span className="text-[11px] font-medium text-text-secondary uppercase tracking-tight">Caspian Basin Central</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Panel: Alerts + Feed */}
        <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-5 flex flex-col gap-6">
            <div>
              <SectionTitle className="text-[11px] flex items-center justify-between">
                Regional Alerts 
                <span className="text-[9px] font-normal lowercase py-0.5 px-1.5 bg-status-critical/10 text-status-critical rounded-full">{AKTAU_ALERTS.alerts.length} New</span>
              </SectionTitle>
              <div className="space-y-3">
                {AKTAU_ALERTS.alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={cn(
                      "p-4 border-l-3 transition-colors group cursor-pointer",
                      alert.severity === 'CRITICAL' ? "bg-status-critical/5 border-status-critical" : 
                      alert.severity === 'WARNING' ? "bg-status-warning/5 border-status-warning" : 
                      "bg-bg-secondary border-status-neutral"
                    )}
                    onClick={() => navigate(`/warning/timeseries/${alert.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <StatusChip status={alert.severity} />
                      <span className="text-[10px] font-mono font-bold text-text-tertiary">{alert.id}</span>
                    </div>
                    <div className="text-[12px] font-bold text-text-primary leading-snug group-hover:underline mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      {alert.title}
                    </div>
                    <div className="text-[10px] text-text-secondary mb-3 leading-relaxed line-clamp-2">
                       {alert.description}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[9px] font-mono text-text-tertiary">
                         {new Date(alert.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-status-info text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                         Detail <ChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border-default pt-6">
              <SectionTitle className="text-[11px]">Live Event Feed</SectionTitle>
              <div className="space-y-4">
                {[
                  { time: '14:32', event: 'GCS-001 pressure crossing dynamic threshold (8.1 MPa)', type: 'ALGO' },
                  { time: '14:28', event: 'SCADA cross-validation fail on L-AKT-18', type: 'SYS' },
                  { time: '14:21', event: 'Weather alert: Regional storm approaching coast', type: 'ENV' },
                  { time: '14:15', event: 'Daily production report submitted for Uzen-Central', type: 'OPS' },
                  { time: '14:02', event: 'Zhanaozen Booster Station cold shutdown started', type: 'OPS' }
                ].map((ev, i) => (
                  <div key={i} className="flex gap-3 text-[11px] group opacity-70 hover:opacity-100 transition-opacity">
                    <span className="text-text-tertiary font-mono pt-0.5 shrink-0 tabular-nums">{ev.time}</span>
                    <div className="flex flex-col gap-0.5">
                       <span className="text-text-primary leading-normal">{ev.event}</span>
                       <span className="text-[9px] font-bold tracking-widest text-text-tertiary opacity-50 uppercase">Origin: {ev.type}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="w-full mt-6 h-8 text-[9px]">Load Historical Feed</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Facility Detail Drawer (1st Layer) */}
      <RightDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedNode?.id || 'FACILITY DETAIL'}
        subtitle={`${selectedNode?.type?.replace('_', ' ')} / ${selectedNode?.subtype || 'STANDARD_NODE'}`}
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="secondary" className="flex-1 shrink-0">Export Report</Button>
            <Button onClick={() => setSecondLayerOpen(true)} className="flex-[2] shrink-0">
               View Enterprise <ChevronRight size={14} className="ml-2" />
            </Button>
          </div>
        }
        secondLayer={{
          isOpen: isSecondLayerOpen,
          onClose: () => setSecondLayerOpen(false),
          title: AKTAU_ENTERPRISE.id,
          children: (
            <div className="space-y-6">
              <div className="bg-bg-dark p-6 text-white rounded-sm">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white/10 border border-white/20 flex items-center justify-center font-bold text-[18px]">WCE</div>
                    <StatusChip status="ACTIVE" />
                 </div>
                 <div className="text-[16px] font-bold mb-1 leading-tight">{AKTAU_ENTERPRISE.name_en}</div>
                 <div className="text-[11px] opacity-60 mb-4">{AKTAU_ENTERPRISE.name_ru}</div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <div className="text-[9px] opacity-50 uppercase tracking-widest">Industry</div>
                      <div className="text-[11px] font-bold">{AKTAU_ENTERPRISE.industry.replace('_', ' ')}</div>
                   </div>
                   <div>
                      <div className="text-[9px] opacity-50 uppercase tracking-widest">Since</div>
                      <div className="text-[11px] font-bold">{AKTAU_ENTERPRISE.registered}</div>
                   </div>
                 </div>
              </div>

              <SectionTitle className="text-[10px]">Governance & Risk</SectionTitle>
              <div className="space-y-1">
                 <SummaryRow label="Legal Representative" value={AKTAU_ENTERPRISE.legal_rep_name} />
                 <SummaryRow label="Head Office" value={AKTAU_ENTERPRISE.head_office} />
                 <SummaryRow label="Employee Count" value={AKTAU_ENTERPRISE.employees.toString()} />
                 <SummaryRow label="Current Load" value="74%" color="text-status-warning" />
              </div>

              <SectionTitle className="text-[10px] mt-2">Compliance Certificates</SectionTitle>
              <div className="space-y-2">
                 {AKTAU_ENTERPRISE.certificates.map(cert => (
                    <div key={cert.id} className="flex items-center justify-between p-2 border border-border-default hover:bg-bg-secondary transition-colors cursor-pointer group">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold">{cert.type.replace('_', ' ')}</span>
                          <span className="text-[9px] text-text-tertiary tabular-nums">{cert.id}</span>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className={cn("text-[9px] font-bold", cert.status === 'VALID' ? "text-status-success" : "text-status-critical")}>{cert.status}</span>
                          <span className="text-[9px] text-text-tertiary">thru {cert.valid_until}</span>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="bg-bg-secondary p-4 border border-border-default">
                 <SectionTitle className="text-[10px] mb-2">Inspection History (12M)</SectionTitle>
                 <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                       <span className="text-text-secondary">Last Inspection</span>
                       <span className="font-bold tabular-nums">{AKTAU_ENTERPRISE.regulatory_history_12m.last_inspection}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-text-secondary">AI Flagged Anomalies</span>
                       <span className="font-bold tabular-nums text-status-warning">{AKTAU_ENTERPRISE.regulatory_history_12m.anomalies_count}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-text-secondary">Active Legal Cases</span>
                       <span className="font-bold tabular-nums">{AKTAU_ENTERPRISE.regulatory_history_12m.active_cases}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-text-secondary">Completed Fixes</span>
                       <span className="font-bold tabular-nums text-status-success">{AKTAU_ENTERPRISE.regulatory_history_12m.completed_rectifications}</span>
                    </div>
                 </div>
              </div>

              <Button variant="primary" className="w-full h-10">
                 Explore Enterprise Knowledge Graph <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          )
        }}
      >
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-bg-secondary/50 p-4 rounded-sm border border-border-default">
              <div className="flex flex-col">
                 <div className="all-caps-label text-[9px]">Node Health</div>
                 <div className={cn(
                    "text-[24px] font-bold tabular-nums",
                    selectedNode?.health_score < 40 ? "text-status-critical" : 
                    selectedNode?.health_score < 75 ? "text-status-warning" : 
                    "text-status-success"
                 )}>{selectedNode?.health_score}%</div>
              </div>
              <div className="h-10 w-24 flex items-end gap-1">
                 {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className="flex-1 bg-text-tertiary/20 rounded-t-[1px]" style={{height: `${30 + Math.random() * 70}%`}} />
                 ))}
              </div>
           </div>

           {/* Facility Tabs */}
           <div className="border-b border-border-default flex gap-6 shrink-0 h-8">
              {['PROFILE', 'DEVICES', 'TELEMETRY', 'LINK'].map(ft => (
                 <button key={ft} className="text-[10px] font-bold uppercase tracking-wider relative h-full text-text-tertiary hover:text-text-primary px-1">
                    {ft}
                    {ft === 'DEVICES' && selectedNode?.id === 'FAC-KZ-AKT-GCS-001' && <div className="absolute top-[-2px] right-[-6px] w-1.5 h-1.5 rounded-full bg-status-critical" />}
                    {ft === 'PROFILE' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bg-dark" />}
                 </button>
              ))}
           </div>

           <div className="space-y-6">
              <div>
                 <SectionTitle className="text-[10px]">Operational Info</SectionTitle>
                 <div className="space-y-1">
                    <SummaryRow label="Status" value={selectedNode?.status} color={selectedNode?.status === 'NORMAL' ? 'text-status-success' : 'text-status-warning'} />
                    <SummaryRow label="Commissioned" value={selectedNode?.commissioned || '2016-08'} />
                    <SummaryRow label="Operator ID" value={selectedNode?.operator || 'N/A'} color="text-status-info cursor-pointer underline" />
                    <SummaryRow label="Design Cap" value={selectedNode?.design_capacity || 'N/A'} />
                    <SummaryRow label="Real-time Load" value="82%" color="text-status-warning" />
                 </div>
              </div>

              <div>
                 <SectionTitle className="text-[10px] flex justify-between">
                    Device Inventory (GCS-001)
                    <span className="text-[9px] font-normal lowercase opacity-50">{AKTAU_DEVICES.device_count} registered</span>
                 </SectionTitle>
                 <div className="border border-border-default overflow-hidden rounded-sm">
                    <div className="bg-bg-secondary h-7 flex items-center px-3 all-caps-label text-[8px] border-b border-border-default">
                       <span className="flex-1">Asset Name</span>
                       <span className="w-16 text-right">Value</span>
                       <span className="w-16 text-right">Dev</span>
                    </div>
                    {AKTAU_DEVICES.devices.slice(0, 6).map(dev => (
                       <div key={dev.id} className="h-9 flex items-center px-3 border-b border-border-default last:border-0 hover:bg-bg-hover group transition-colors">
                          <div className="flex-1 flex flex-col">
                             <span className="text-[11px] font-bold leading-tight flex items-center gap-2">
                                {dev.name}
                                {dev.status === 'CRITICAL' && <AlertCircle size={10} className="text-status-critical animate-pulse" />}
                             </span>
                             <span className="text-[9px] text-text-tertiary tabular-nums font-mono">{dev.id}</span>
                          </div>
                          <span className={cn("w-16 text-right text-[11px] font-mono font-bold", dev.status === 'CRITICAL' ? 'text-status-critical' : 'text-text-primary')}>{dev.reading}</span>
                          <span className={cn("w-16 text-right text-[10px] font-mono", dev.delta_pct && dev.delta_pct > 20 ? 'text-status-critical' : 'text-text-tertiary')}>
                             {dev.delta_pct ? `+${dev.delta_pct}%` : '--'}
                          </span>
                       </div>
                    ))}
                    <div className="bg-bg-hover/30 p-2 text-center text-[9px] font-bold text-text-tertiary uppercase cursor-pointer hover:bg-bg-hover">
                       View All 12 Devices
                    </div>
                 </div>
              </div>

              <div className="bg-bg-dark p-4 text-white rounded-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <Activity size={18} className="text-status-warning" />
                    <div>
                       <div className="text-[12px] font-bold tracking-tight">Active Anomaly Analysis</div>
                       <div className="text-[9px] opacity-60">ANO-2026-0512 · Cross-checked 8/8 streams</div>
                    </div>
                 </div>
                 <div className="text-[11px] leading-relaxed opacity-90 mb-4 bg-white/5 p-3 border border-white/10 italic">
                    "Discharge pressure surge (+38%) correlated with Compressor #2 vibration spike. Suggests imminent blade fatigue risk. Pattern similarity 87.2% to historical loss case."
                 </div>
                 <Button variant="secondary" className="w-full h-8 bg-transparent border-white/20 text-white hover:bg-white/10">
                    Run Digital Twin Simulation
                 </Button>
              </div>
           </div>
        </div>
      </RightDrawer>
    </div>
  );
}

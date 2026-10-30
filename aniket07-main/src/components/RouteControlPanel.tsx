import React from 'react';
import {
  Coordinates,
  GraphNode,
  TravelMode,
  MultiObjectiveWeights,
  VehicleConfig,
} from '../types/routing';
import { PRESET_DESTINATIONS } from '../data/networkData';
import {
  MapPin,
  Navigation,
  Sliders,
  Car,
  Bike,
  Bus,
  Footprints,
  Sparkles,
  Settings2,
  ArrowUpDown,
  Check,
} from 'lucide-react';

interface RouteControlPanelProps {
  nodes: GraphNode[];
  sourceId: string;
  targetId: string;
  onSelectSourceId: (id: string) => void;
  onSelectTargetId: (id: string) => void;
  onSwapEndpoints: () => void;
  mode: TravelMode;
  onSelectMode: (mode: TravelMode) => void;
  weights: MultiObjectiveWeights;
  onChangeWeights: (newWeights: MultiObjectiveWeights) => void;
  vehicleConfig: VehicleConfig;
  onChangeVehicleConfig: (cfg: VehicleConfig) => void;
}

export const RouteControlPanel: React.FC<RouteControlPanelProps> = ({
  nodes,
  sourceId,
  targetId,
  onSelectSourceId,
  onSelectTargetId,
  onSwapEndpoints,
  mode,
  onSelectMode,
  weights,
  onChangeWeights,
  vehicleConfig,
  onChangeVehicleConfig,
}) => {
  const sourceNode = nodes.find(n => n.id === sourceId) || nodes[0];
  const targetNode = nodes.find(n => n.id === targetId) || nodes[1];

  const applyPresetWeights = (preset: 'balanced' | 'fastest' | 'shortest' | 'cheapest' | 'eco') => {
    switch (preset) {
      case 'fastest':
        onChangeWeights({ time: 0.75, distance: 0.1, cost: 0.1, co2: 0.05 });
        break;
      case 'shortest':
        onChangeWeights({ distance: 0.75, time: 0.1, cost: 0.1, co2: 0.05 });
        break;
      case 'cheapest':
        onChangeWeights({ cost: 0.75, time: 0.1, distance: 0.1, co2: 0.05 });
        break;
      case 'eco':
        onChangeWeights({ co2: 0.7, cost: 0.15, distance: 0.1, time: 0.05 });
        break;
      case 'balanced':
      default:
        onChangeWeights({ distance: 0.25, time: 0.25, cost: 0.25, co2: 0.25 });
        break;
    }
  };

  const travelModes: { id: TravelMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'car', label: 'Car', icon: <Car className="w-4 h-4" />, desc: '16 km/L · ₹98/L' },
    { id: 'bike', label: 'Motorcycle', icon: <Bike className="w-4 h-4" />, desc: '48 km/L · Fast' },
    { id: 'bus', label: 'Public Bus', icon: <Bus className="w-4 h-4" />, desc: 'Fixed + ₹1.75/km' },
    { id: 'walk', label: 'Pedestrian', icon: <Footprints className="w-4 h-4" />, desc: 'Zero Cost & CO₂' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col gap-3 text-slate-200">
      {/* Route Endpoints Box with Swap Feature */}
      <div className="relative space-y-1.5 bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80">
        {/* Origin Selector */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
              Origin (Starting Point)
            </label>
            <select
              value={sourceId}
              onChange={e => onSelectSourceId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Origin / Destination Button */}
        <div className="flex justify-end pr-1 py-0.5">
          <button
            onClick={onSwapEndpoints}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[10px] font-semibold border border-slate-700 transition shadow btn-moving-shimmer"
            title="Swap Starting Point and Destination"
          >
            <ArrowUpDown className="w-3 h-3 text-emerald-400" />
            <span>Swap Journey</span>
          </button>
        </div>

        {/* Destination Selector */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-red-500/20 text-red-400 shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-[10px] uppercase font-bold tracking-wider text-red-400 block">
              Destination (Where to go)
            </label>
            <select
              value={targetId}
              onChange={e => onSelectTargetId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-semibold focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Location Pills: Touch to Route */}
      <div>
        <label className="text-xs font-bold text-slate-300 mb-1.5 block flex items-center justify-between">
          <span>Quick Destinations (1-Touch):</span>
          <span className="text-[10px] text-slate-400 font-normal">
            Or touch any node on the graph!
          </span>
        </label>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {PRESET_DESTINATIONS.map(preset => {
            const isTarget = preset.id === targetId;
            const isSource = preset.id === sourceId;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectTargetId(preset.id)}
                className={`p-1.5 px-2 rounded-xl text-left border transition text-xs flex flex-col justify-between ${
                  isTarget
                    ? 'bg-red-950/40 border-red-500 text-white shadow-sm'
                    : isSource
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate text-[11px]">{preset.name}</span>
                  {isTarget && <Check className="w-3 h-3 text-red-400 shrink-0 ml-1" />}
                  {isSource && <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />}
                </div>
                <span className="text-[9px] text-slate-400 truncate">{preset.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Travel Mode Selector */}
      <div>
        <label className="text-xs font-bold text-slate-300 mb-1.5 block">
          Travel Mode:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {travelModes.map(m => {
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMode(m.id)}
                className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 transition ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {m.icon}
                <span className="text-xs font-bold">{m.label}</span>
                <span className="text-[9px] text-slate-400">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Commute Route Priorities */}
      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-200">
              Trip Routing Preferences
            </h4>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Smart Adaptive
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 text-[10px] mr-1">Presets:</span>
          {(['balanced', 'fastest', 'shortest', 'cheapest', 'eco'] as const).map(p => (
            <button
              key={p}
              onClick={() => applyPresetWeights(p)}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white capitalize transition text-[10px]"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Weight Sliders */}
        <div className="space-y-2.5 text-xs">
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Fastest Time Priority:</span>
              <span className="font-mono text-blue-400 font-bold">
                {(weights.time * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.time}
              onChange={e => onChangeWeights({ ...weights, time: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Shortest Distance Priority:</span>
              <span className="font-mono text-purple-400 font-bold">
                {(weights.distance * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.distance}
              onChange={e => onChangeWeights({ ...weights, distance: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Cheapest Cost Priority:</span>
              <span className="font-mono text-amber-400 font-bold">
                {(weights.cost * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.cost}
              onChange={e => onChangeWeights({ ...weights, cost: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Eco & Carbon Priority:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {(weights.co2 * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.co2}
              onChange={e => onChangeWeights({ ...weights, co2: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

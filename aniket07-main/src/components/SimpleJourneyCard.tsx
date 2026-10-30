import React, { useState } from 'react';
import { RouteOption, TravelMode, GraphNode } from '../types/routing';
import {
  Navigation,
  Clock,
  Route as RouteIcon,
  IndianRupee,
  Leaf,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  MapPin,
  ArrowRight,
  Car,
  Bike,
  Bus,
  Footprints,
} from 'lucide-react';

interface SimpleJourneyCardProps {
  sourceNode: GraphNode | undefined;
  targetNode: GraphNode | undefined;
  activeRoute: RouteOption | null;
  mode: TravelMode;
  simulationProgress: number;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onSwapEndpoints: () => void;
}

export const SimpleJourneyCard: React.FC<SimpleJourneyCardProps> = ({
  sourceNode,
  targetNode,
  activeRoute,
  mode,
  simulationProgress,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  onSwapEndpoints,
}) => {
  const [showSteps, setShowSteps] = useState<boolean>(false);

  if (!activeRoute) return null;

  const modeIcon =
    mode === 'car' ? (
      <Car className="w-4 h-4 text-sky-400" />
    ) : mode === 'bike' ? (
      <Bike className="w-4 h-4 text-emerald-400" />
    ) : mode === 'bus' ? (
      <Bus className="w-4 h-4 text-amber-400" />
    ) : (
      <Footprints className="w-4 h-4 text-teal-400" />
    );

  const roundedCost = Math.round(activeRoute.costInr);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5 text-slate-200">
      {/* Route Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="truncate max-w-[130px]">{sourceNode?.name.split(',')[0]}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <div className="flex items-center gap-1.5 font-bold text-xs text-red-400 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="truncate max-w-[130px]">{targetNode?.name.split(',')[0]}</span>
          </div>
        </div>

        {/* Travel Mode Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs capitalize text-slate-300 shrink-0">
          {modeIcon}
          <span>{mode}</span>
        </div>
      </div>

      {/* 4 Clean Metric Tiles (Safe from text overflow) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Duration */}
        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Time</span>
          </div>
          <div className="mt-0.5 font-mono font-bold text-slate-100 text-base truncate">
            {activeRoute.durationMinutes} <span className="text-xs font-normal text-slate-400">mins</span>
          </div>
        </div>

        {/* Distance */}
        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <RouteIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Distance</span>
          </div>
          <div className="mt-0.5 font-mono font-bold text-slate-100 text-base truncate">
            {activeRoute.distanceKm} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
        </div>

        {/* Trip Cost (Safely inside box with rounded integer) */}
        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
            <span>Trip Cost</span>
          </div>
          <div className="mt-0.5 font-mono font-bold text-amber-400 text-base truncate">
            ₹{roundedCost}
          </div>
        </div>

        {/* Carbon Footprint */}
        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>Carbon CO₂</span>
          </div>
          <div className="mt-0.5 font-mono font-bold text-emerald-400 text-base truncate">
            {activeRoute.co2Kg} <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
        </div>
      </div>

      {/* Simple Animation Action Bar */}
      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSimulation}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-white font-bold text-xs shadow-lg transition btn-moving-shimmer btn-moving-border"
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Journey
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Play Moving Animation
              </>
            )}
          </button>

          <button
            onClick={onResetSimulation}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Reset Journey to Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-xs font-mono text-slate-300">
          Progress:{' '}
          <span className="font-bold text-emerald-400">
            {Math.round(simulationProgress * 100)}%
          </span>{' '}
          ({(activeRoute.distanceKm * simulationProgress).toFixed(1)} / {activeRoute.distanceKm} km)
        </div>
      </div>

      {/* Expandable Simple Turn-by-Turn Steps */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => setShowSteps(!showSteps)}
          className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition"
        >
          <span className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            Turn-by-Turn Road Legs ({activeRoute.turnByTurn.length} Waypoints)
          </span>
          {showSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showSteps && (
          <div className="p-3 pt-1 border-t border-slate-800/80 divide-y divide-slate-800/50 max-h-48 overflow-y-auto">
            {activeRoute.turnByTurn.map((step, idx) => (
              <div key={idx} className="py-2 flex items-start gap-2 text-xs">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[9px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 font-medium truncate">{step.instruction}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {step.roadName} · {(step.distanceMeters / 1000).toFixed(1)} km
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { RouteOption, TravelMode, MultiObjectiveWeights, VehicleConfig, ThemeAccent } from '../types/routing';
import {
  Clock,
  Route as RouteIcon,
  IndianRupee,
  Leaf,
  Sliders,
  TrendingDown,
  Sparkles,
  Zap,
  Fuel,
  Calculator,
  ArrowRight,
  Check,
  Flame,
  Palette,
} from 'lucide-react';

interface ComparePageProps {
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  mode: TravelMode;
  weights: MultiObjectiveWeights;
  onChangeWeights: (newWeights: MultiObjectiveWeights) => void;
  vehicleConfig: VehicleConfig;
  onChangeVehicleConfig: (cfg: VehicleConfig) => void;
  colorAccent?: ThemeAccent;
  onSelectColorAccent?: (accent: ThemeAccent) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  mode,
  weights,
  onChangeWeights,
  vehicleConfig,
  onChangeVehicleConfig,
  colorAccent,
  onSelectColorAccent,
}) => {
  const [commuteDaysPerMonth, setCommuteDaysPerMonth] = useState<number>(22);
  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

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

  const minTime = Math.min(...routes.map(r => r.durationMinutes)) || 1;
  const maxTime = Math.max(...routes.map(r => r.durationMinutes)) || 1;
  const minCost = Math.min(...routes.map(r => r.costInr)) || 1;
  const maxCost = Math.max(...routes.map(r => r.costInr)) || 1;
  const minDist = Math.min(...routes.map(r => r.distanceKm)) || 1;
  const maxDist = Math.max(...routes.map(r => r.distanceKm)) || 1;

  const monthlyCost = selectedRoute ? Math.round(selectedRoute.costInr * 2 * commuteDaysPerMonth) : 0;
  const monthlyDistance = selectedRoute ? Math.round(selectedRoute.distanceKm * 2 * commuteDaysPerMonth) : 0;
  const monthlyCo2 = selectedRoute ? (selectedRoute.co2Kg * 2 * commuteDaysPerMonth).toFixed(1) : '0';

  return (
    <div className="space-y-3.5">
      {/* Clean Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Route Options & Travel Budget
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              {routes.length} Available Routes
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare travel time, fuel cost, and distance to pick the best journey for your daily commute.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Quick Toggle Point */}
          {onSelectColorAccent && (
            <button
              onClick={() => {
                const themes: ThemeAccent[] = ['emerald', 'cyan', 'violet', 'amber', 'rose'];
                const next = (themes.indexOf(colorAccent || 'emerald') + 1) % themes.length;
                onSelectColorAccent(themes[next]);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs text-slate-200 transition"
              title="Cycle Next-Level Theme"
            >
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              <span className="capitalize font-semibold text-[11px]">{colorAccent || 'Theme'}</span>
            </button>
          )}

          {/* Selected Route Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel text-xs text-slate-300">
            <span className="text-slate-400">Selected:</span>
            <span className="font-bold text-emerald-400">{selectedRoute?.name}</span>
          </div>
        </div>
      </div>

      {/* 4 Route Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {routes.map(route => {
          const isSelected = route.id === selectedRoute?.id;
          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`p-3 rounded-2xl border transition flex flex-col justify-between cursor-pointer select-none ${
                isSelected
                  ? 'glass-panel border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-2xl shadow-emerald-500/10'
                  : 'glass-panel hover:border-cyan-500/40'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: route.color }}
                    ></span>
                    <h3 className="font-bold text-sm text-slate-100">{route.name}</h3>
                  </div>
                  {route.isRecommended && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                      Recommended
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mb-3">{route.tag}</p>

                {/* Metrics Breakdown */}
                <div className="space-y-2.5 text-xs">
                  {/* Time */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span className="text-slate-400">Travel Time:</span>
                      <span className="font-mono font-bold text-sky-400">{route.durationMinutes} mins</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full"
                        style={{ width: `${(route.durationMinutes / maxTime) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Distance */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span className="text-slate-400">Distance:</span>
                      <span className="font-mono font-bold text-purple-400">{route.distanceKm} km</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                        style={{ width: `${(route.distanceKm / maxDist) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Trip Cost */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span className="text-slate-400">Trip Cost:</span>
                      <span className="font-mono font-bold text-amber-400">₹{Math.round(route.costInr)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                        style={{ width: `${(route.costInr / maxCost) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* CO2 Emissions */}
                  <div className="flex justify-between text-slate-300 pt-1">
                    <span className="text-slate-400">Carbon (CO₂):</span>
                    <span className="font-mono font-bold text-emerald-400">{route.co2Kg} kg</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition ${
                  isSelected
                    ? 'btn-neon-glow btn-moving-shimmer text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {isSelected ? '✓ Active Route' : 'Choose This Route'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Monthly Commute Budget Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left: Monthly Commute Budget Estimator */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-3.5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-800">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-100">
              Monthly College Travel Budget Estimator
            </h3>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">College Travel Days per Month:</span>
            <div className="flex items-center gap-1.5">
              {[15, 20, 22, 26].map(days => (
                <button
                  key={days}
                  onClick={() => setCommuteDaysPerMonth(days)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition ${
                    commuteDaysPerMonth === days
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Projections */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Monthly Fuel / Fare</span>
              <div className="mt-0.5 font-mono font-extrabold text-amber-400 text-lg">
                ₹{monthlyCost.toLocaleString()}
              </div>
              <span className="text-[9px] text-slate-500">Round trip ({commuteDaysPerMonth}d)</span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Distance</span>
              <div className="mt-0.5 font-mono font-extrabold text-purple-400 text-lg">
                {monthlyDistance.toLocaleString()} km
              </div>
              <span className="text-[9px] text-slate-500">Monthly travel</span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Carbon Footprint</span>
              <div className="mt-0.5 font-mono font-extrabold text-emerald-400 text-lg">
                {monthlyCo2} kg
              </div>
              <span className="text-[9px] text-slate-500">Greenhouse gas</span>
            </div>
          </div>
        </div>

        {/* Right: Route Priority Preferences */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-3.5 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-100">Travel Priority Mode</h3>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            {(['fastest', 'shortest', 'cheapest', 'eco', 'balanced'] as const).map(p => (
              <button
                key={p}
                onClick={() => applyPresetWeights(p)}
                className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white capitalize text-xs font-semibold transition border border-slate-700/60"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Sliders */}
          <div className="space-y-3 text-xs pt-1">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Fastest Speed Priority:</span>
                <span className="font-mono text-blue-400 font-bold">{(weights.time * 100).toFixed(0)}%</span>
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
                <span className="font-mono text-purple-400 font-bold">{(weights.distance * 100).toFixed(0)}%</span>
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
                <span>Lowest Expense Priority:</span>
                <span className="font-mono text-amber-400 font-bold">{(weights.cost * 100).toFixed(0)}%</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

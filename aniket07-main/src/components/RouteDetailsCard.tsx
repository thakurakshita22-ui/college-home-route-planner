import React, { useState } from 'react';
import { RouteOption, TravelMode } from '../types/routing';
import {
  Award,
  Clock,
  Compass,
  DollarSign,
  IndianRupee,
  Leaf,
  ChevronDown,
  ChevronUp,
  Share2,
  FileText,
  Route as RouteIcon,
  CheckCircle,
} from 'lucide-react';

interface RouteDetailsCardProps {
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  rationale: string;
  mode: TravelMode;
}

export const RouteDetailsCard: React.FC<RouteDetailsCardProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  rationale,
  mode,
}) => {
  const [showTurnByTurn, setShowTurnByTurn] = useState<boolean>(false);
  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  if (!selectedRoute) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5 text-slate-200">
      {/* Route Tabs Selector */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Candidate Routes ({routes.length}):
          </span>
          <span className="text-emerald-400 font-medium text-[11px]">★ Best Match for Preferences</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {routes.map(route => {
            const isSelected = route.id === selectedRoute.id;
            return (
              <button
                key={route.id}
                onClick={() => onSelectRoute(route.id)}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: route.color }}
                    ></span>
                    <span className="text-xs font-bold text-slate-100 truncate">
                      {route.name}
                    </span>
                  </div>
                  {route.isRecommended && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded font-semibold shrink-0">
                      ★ Recommended
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[8.5px]">TIME</span>
                    <span className="font-bold">{route.durationMinutes}m</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[8.5px]">DIST</span>
                    <span>{route.distanceKm}km</span>
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-slate-400 block text-[8.5px]">FARE</span>
                    <span className="truncate block font-bold text-amber-400">₹{Math.round(route.costInr)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clean Route Recommendation Rationale */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-slate-300 flex items-start gap-2">
        <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 min-w-0">
          <h5 className="font-bold text-emerald-400 text-xs">Commute Recommendation</h5>
          <p className="leading-snug text-slate-300 text-[11px]">{rationale}</p>
        </div>
      </div>

      {/* Turn-by-Turn Directions Accordion */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => setShowTurnByTurn(!showTurnByTurn)}
          className="w-full p-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-850 transition"
        >
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            Turn-by-Turn Guidance ({selectedRoute.turnByTurn.length} Legs)
          </span>
          {showTurnByTurn ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTurnByTurn && (
          <div className="p-3 pt-0 border-t border-slate-800/80 divide-y divide-slate-800/50 max-h-60 overflow-y-auto">
            {selectedRoute.turnByTurn.map((step, idx) => (
              <div key={idx} className="py-2.5 flex items-start gap-2.5 text-xs">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-slate-200 font-medium">{step.instruction}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>Road: {step.roadName}</span>
                    <span>•</span>
                    <span className="font-mono">{(step.distanceMeters / 1000).toFixed(1)} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

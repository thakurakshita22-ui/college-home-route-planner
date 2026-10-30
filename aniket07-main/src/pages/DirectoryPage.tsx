import React, { useState } from 'react';
import { GraphNode, ThemeAccent } from '../types/routing';
import { COLLEGE_ORIGIN } from '../data/networkData';
import { calculateHaversineDistanceMeters } from '../algorithms/graphAlgorithms';
import {
  MapPin,
  Navigation,
  Sparkles,
  Search,
  Filter,
  Compass,
  ArrowRight,
  Landmark,
  Building2,
  Bus,
  Palette,
} from 'lucide-react';

interface DirectoryPageProps {
  nodes: GraphNode[];
  sourceId: string;
  targetId: string;
  onSetSourceId: (id: string) => void;
  onSetTargetId: (id: string) => void;
  onNavigateHere: (id: string) => void;
  colorAccent?: ThemeAccent;
  onSelectColorAccent?: (accent: ThemeAccent) => void;
}

export const DirectoryPage: React.FC<DirectoryPageProps> = ({
  nodes,
  sourceId,
  targetId,
  onSetSourceId,
  onSetTargetId,
  onNavigateHere,
  colorAccent,
  onSelectColorAccent,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredNodes = nodes.filter(node => {
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (node.description && node.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedFilter === 'all' || node.type === selectedFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-3.5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Campus & Tricity Station Directory
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {nodes.length} Intersections & Waypoints
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Browse all road intersections, flyovers, transit terminals, and suburbs across Kharar, Mohali, and Chandigarh.
          </p>
        </div>

        {/* Search, Filter & Theme Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search station or street..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedFilter}
            onChange={e => setSelectedFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="campus">College Campus</option>
            <option value="highway">Highways & Flyovers</option>
            <option value="transit">Bus & Train Terminals</option>
            <option value="junction">Boulevard Junctions</option>
            <option value="residential">Residential Suburbs</option>
          </select>
        </div>
      </div>

      {/* Grid of Stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredNodes.map(node => {
          const isSource = node.id === sourceId;
          const isTarget = node.id === targetId;

          // Distance from GGS College origin
          const distFromCampusKm = (
            calculateHaversineDistanceMeters(COLLEGE_ORIGIN.coords, node.coords) / 1000
          ).toFixed(1);

          return (
            <div
              key={node.id}
              className={`p-3 rounded-2xl border transition flex flex-col justify-between ${
                isSource
                  ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl'
                  : isTarget
                  ? 'bg-slate-900 border-red-500 ring-2 ring-red-500/40 shadow-xl'
                  : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {node.type}
                    </span>
                    <h3 className="font-bold text-xs text-slate-100 mt-1">{node.name}</h3>
                  </div>

                  {isSource && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Current Start
                    </span>
                  )}
                  {isTarget && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      Current Dest
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mb-2 line-clamp-2">{node.description || 'Regional road network vertex'}</p>

                <div className="flex items-center justify-between text-xs py-1.5 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Distance from College:</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">{distFromCampusKm} km</span>
                </div>
              </div>

              {/* Action Buttons with Moving Animation */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                <button
                  onClick={() => onSetSourceId(node.id)}
                  className="flex-1 py-1 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition"
                  title="Set as Trip Start"
                >
                  Set Start
                </button>

                <button
                  onClick={() => onSetTargetId(node.id)}
                  className="flex-1 py-1 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition"
                  title="Set as Destination"
                >
                  Set Dest
                </button>

                <button
                  onClick={() => onNavigateHere(node.id)}
                  className="py-1 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition btn-moving-shimmer shadow-md"
                  title="Navigate Here Immediately with Moving AI"
                >
                  <Sparkles className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

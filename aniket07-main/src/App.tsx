import React, { useState, useEffect } from 'react';
import {
  GraphNode,
  GraphEdge,
  TravelMode,
  MultiObjectiveWeights,
  VehicleConfig,
} from './types/routing';
import {
  COLLEGE_ORIGIN,
  INITIAL_NETWORK_NODES,
  INITIAL_NETWORK_EDGES,
} from './data/networkData';
import { computeMultiObjectiveRoutes, DEFAULT_VEHICLE_CONFIG } from './services/costOptimizer';
import { PlannerPage } from './pages/PlannerPage';
import { ComparePage } from './pages/ComparePage';
import { DirectoryPage } from './pages/DirectoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { LiveRoutesPage } from './pages/LiveRoutesPage';
import {
  GraduationCap,
  Compass,
  TrendingDown,
  MapPin,
  Settings,
  ArrowRight,
  Sparkles,
  Route,
} from 'lucide-react';

type PageId = 'planner' | 'routes' | 'stations' | 'settings' | 'live';

export default function App() {
  // Navigation Page State
  const [activePage, setActivePage] = useState<PageId>('planner');

  // Next-Level Color Mode State
  const [colorAccent, setColorAccent] = useState<'emerald' | 'cyan' | 'violet' | 'amber'>('emerald');

  // Graph Network State
  const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NETWORK_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(INITIAL_NETWORK_EDGES);

  // Dynamic Endpoints State (Touch any node to change start or destination!)
  const [sourceId, setSourceId] = useState<string>('ggs_college');
  const [targetId, setTargetId] = useState<string>('phase_7_market');

  // Routing Preferences State
  const [mode, setMode] = useState<TravelMode>('car');
  const [weights, setWeights] = useState<MultiObjectiveWeights>({
    time: 0.35,
    distance: 0.25,
    cost: 0.2,
    co2: 0.2,
  });
  const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>(DEFAULT_VEHICLE_CONFIG.car);
  const [trafficMultiplier, setTrafficMultiplier] = useState<number>(1.25);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Real-Time Moving Transit Animation State
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Update vehicle configs when travel mode changes
  const handleSelectMode = (newMode: TravelMode) => {
    setMode(newMode);
    setVehicleConfig(DEFAULT_VEHICLE_CONFIG[newMode]);
  };

  // Compute Multi-Objective Pareto Routes between chosen source and target
  const { routes, recommendedRoute, rationale } = computeMultiObjectiveRoutes(
    nodes,
    edges,
    sourceId,
    targetId,
    mode,
    weights,
    vehicleConfig,
    trafficMultiplier
  );

  // Auto-select recommended route if not selected
  useEffect(() => {
    if (routes.length > 0) {
      if (!selectedRouteId || !routes.some(r => r.id === selectedRouteId)) {
        setSelectedRouteId(routes[0].id);
      }
    }
  }, [routes, selectedRouteId]);

  // Handle setting destination and immediately traveling
  const handleStartTravelNow = (newTargetId: string) => {
    setTargetId(newTargetId);
    setSimulationProgress(0);
    setIsSimulating(true);
    setActivePage('planner'); // return to planner to watch live animation
  };

  // Swap endpoints
  const handleSwapEndpoints = () => {
    const temp = sourceId;
    setSourceId(targetId);
    setTargetId(temp);
    setSimulationProgress(0);
    setIsSimulating(false);
  };

  // Moving Transit Animation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const baseIncrement = 0.007 * simSpeed;
    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 1) {
          return 0; // loop transit smoothly
        }
        return Math.min(1, prev + baseIncrement);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed]);

  const sourceNode = nodes.find(n => n.id === sourceId);
  const targetNode = nodes.find(n => n.id === targetId);

  // 4 Clean Functional Pages (No learning/algorithm lab)
  const navTabs: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'planner', label: 'Route Navigator', icon: <Compass className="w-4 h-4" /> },
    { id: 'routes', label: 'Route & Fare Options', icon: <TrendingDown className="w-4 h-4" /> },
    { id: 'stations', label: 'Places & Stations', icon: <MapPin className="w-4 h-4" /> },
    { id: 'settings', label: 'Trip Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'live', label: 'Live Road Routes', icon: <Route className="w-4 h-4" /> },
  ];

  const themeOptions: { id: 'emerald' | 'cyan' | 'violet' | 'amber'; name: string; dotColor: string }[] = [
    { id: 'emerald', name: 'Emerald', dotColor: 'bg-emerald-400' },
    { id: 'cyan', name: 'Cyan', dotColor: 'bg-cyan-400' },
    { id: 'violet', name: 'Violet', dotColor: 'bg-purple-400' },
    { id: 'amber', name: 'Amber', dotColor: 'bg-amber-400' },
  ];

  return (
    <div data-theme={colorAccent} className="min-h-screen flex flex-col font-sans relative selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      {/* Dynamic Ambient Background Glow Orbs */}
      <div className="ambient-glow-container">
        <div className="ambient-glow-orb-1" />
        <div className="ambient-glow-orb-2" />
      </div>

      {/* Clean Premium Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand Heading */}
          <div
            onClick={() => setActivePage('planner')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 text-white transition-transform group-hover:scale-105">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white group-hover:text-cyan-400 transition">
                  GGS Route Navigator
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-mono font-bold uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  Kharar · Mohali · Chandigarh
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Origin: <span className="text-emerald-400 font-semibold">GGS College, Kharar, Punjab</span>
              </p>
            </div>
          </div>

          {/* Clean 4-Page Navigation Bar with Moving Animation Buttons */}
          <nav className="flex items-center gap-1.5 glass-panel p-1.5 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto max-w-full">
            {navTabs.map(tab => {
              const isActive = activePage === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePage(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'btn-neon-glow btn-moving-shimmer text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Next-Level Dark Color Mode Quick Switcher */}
          <div className="flex items-center gap-1.5 glass-panel px-2.5 py-1.5 rounded-xl border border-slate-800/90 text-xs">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline mr-1">Theme:</span>
            {themeOptions.map(t => {
              const isActive = colorAccent === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setColorAccent(t.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                    isActive
                      ? 'bg-slate-800 text-white shadow ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                  title={`${t.name} Neon Theme`}
                >
                  <span className={`w-2 h-2 rounded-full ${t.dotColor} ${isActive ? 'animate-pulse' : 'opacity-70'}`} />
                  <span className="hidden md:inline">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Multi-Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 relative z-10">
        {/* Page 1: Route Navigator (Interactive Graph & Touch Navigation) */}
        {activePage === 'planner' && (
          <PlannerPage
            nodes={nodes}
            edges={edges}
            sourceId={sourceId}
            targetId={targetId}
            onSetSourceId={id => {
              setSourceId(id);
              setSimulationProgress(0);
              setIsSimulating(false);
            }}
            onSetTargetId={id => {
              setTargetId(id);
              setSimulationProgress(0);
              setIsSimulating(false);
            }}
            onSwapEndpoints={handleSwapEndpoints}
            onStartTravelNow={handleStartTravelNow}
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            rationale={rationale}
            mode={mode}
            onSelectMode={handleSelectMode}
            weights={weights}
            onChangeWeights={setWeights}
            vehicleConfig={vehicleConfig}
            onChangeVehicleConfig={setVehicleConfig}
            trafficMultiplier={trafficMultiplier}
            simulationProgress={simulationProgress}
            isSimulating={isSimulating}
            onToggleSimulation={() => setIsSimulating(!isSimulating)}
            onResetSimulation={() => {
              setSimulationProgress(0);
              setIsSimulating(false);
            }}
            onSeekSimulation={setSimulationProgress}
            simSpeed={simSpeed}
            onChangeSimSpeed={setSimSpeed}
            colorAccent={colorAccent}
          />
        )}

        {/* Page 2: Route & Fare Options */}
        {activePage === 'routes' && (
          <ComparePage
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            mode={mode}
            weights={weights}
            onChangeWeights={setWeights}
            vehicleConfig={vehicleConfig}
            onChangeVehicleConfig={setVehicleConfig}
          />
        )}

        {/* Page 3: Places & Stations Directory */}
        {activePage === 'stations' && (
          <DirectoryPage
            nodes={nodes}
            sourceId={sourceId}
            targetId={targetId}
            onSetSourceId={id => {
              setSourceId(id);
              setSimulationProgress(0);
              setIsSimulating(false);
            }}
            onSetTargetId={id => {
              setTargetId(id);
              setSimulationProgress(0);
              setIsSimulating(false);
            }}
            onNavigateHere={handleStartTravelNow}
          />
        )}

        {/* Page 4: Trip Settings & Custom Rates */}
        {activePage === 'settings' && (
          <SettingsPage
            mode={mode}
            onSelectMode={handleSelectMode}
            vehicleConfig={vehicleConfig}
            onChangeVehicleConfig={setVehicleConfig}
            trafficMultiplier={trafficMultiplier}
            onTrafficMultiplierChange={setTrafficMultiplier}
            colorAccent={colorAccent}
            onSelectColorAccent={setColorAccent}
          />
        )}

        {activePage === 'live' && <LiveRoutesPage />}
      </main>
    </div>
  );
}

import React from 'react';
import {
  GraphNode,
  GraphEdge,
  RouteOption,
  TravelMode,
  MultiObjectiveWeights,
  VehicleConfig,
  ThemeAccent,
} from '../types/routing';
import { GraphTopologyViewer } from '../components/GraphTopologyViewer';
import { SimpleJourneyCard } from '../components/SimpleJourneyCard';
import { RouteControlPanel } from '../components/RouteControlPanel';
import { RouteDetailsCard } from '../components/RouteDetailsCard';

interface PlannerPageProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceId: string;
  targetId: string;
  onSetSourceId: (id: string) => void;
  onSetTargetId: (id: string) => void;
  onSwapEndpoints: () => void;
  onStartTravelNow: (targetId: string) => void;
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  rationale: string;
  mode: TravelMode;
  onSelectMode: (mode: TravelMode) => void;
  weights: MultiObjectiveWeights;
  onChangeWeights: (newWeights: MultiObjectiveWeights) => void;
  vehicleConfig: VehicleConfig;
  onChangeVehicleConfig: (cfg: VehicleConfig) => void;
  trafficMultiplier: number;
  simulationProgress: number;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onSeekSimulation: (progress: number) => void;
  simSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  colorAccent?: ThemeAccent;
  onSelectColorAccent?: (accent: ThemeAccent) => void;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({
  nodes,
  edges,
  sourceId,
  targetId,
  onSetSourceId,
  onSetTargetId,
  onSwapEndpoints,
  onStartTravelNow,
  routes,
  selectedRouteId,
  onSelectRoute,
  rationale,
  mode,
  onSelectMode,
  weights,
  onChangeWeights,
  vehicleConfig,
  onChangeVehicleConfig,
  trafficMultiplier,
  simulationProgress,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  onSeekSimulation,
  simSpeed,
  onChangeSimSpeed,
  colorAccent = 'emerald',
  onSelectColorAccent,
}) => {
  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || null;
  const sourceNode = nodes.find(n => n.id === sourceId);
  const targetNode = nodes.find(n => n.id === targetId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
      {/* Left Column (Parallel 1 - 5 Columns): Endpoints, Mode, Weights & Route Details */}
      <div className="lg:col-span-5 space-y-3">
        <RouteControlPanel
          nodes={nodes}
          sourceId={sourceId}
          targetId={targetId}
          onSelectSourceId={onSetSourceId}
          onSelectTargetId={onSetTargetId}
          onSwapEndpoints={onSwapEndpoints}
          mode={mode}
          onSelectMode={onSelectMode}
          weights={weights}
          onChangeWeights={onChangeWeights}
          vehicleConfig={vehicleConfig}
          onChangeVehicleConfig={onChangeVehicleConfig}
        />

        <RouteDetailsCard
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={onSelectRoute}
          rationale={rationale}
          mode={mode}
        />
      </div>

      {/* Right Column (Parallel 2 - 7 Columns): Graph with AI Transit & Simple Journey UI */}
      <div className="lg:col-span-7 space-y-3">
        {/* Compact Interactive Graph Canvas with Moving AI Transit */}
        <GraphTopologyViewer
          nodes={nodes}
          edges={edges}
          sourceId={sourceId}
          targetId={targetId}
          onSetSourceId={onSetSourceId}
          onSetTargetId={onSetTargetId}
          onStartTravelNow={onStartTravelNow}
          activeRoute={activeRoute}
          mode={mode}
          trafficMultiplier={trafficMultiplier}
          simulationProgress={simulationProgress}
          isSimulating={isSimulating}
          onToggleSimulation={onToggleSimulation}
          onResetSimulation={onResetSimulation}
          onSeekSimulation={onSeekSimulation}
          simSpeed={simSpeed}
          onChangeSimSpeed={onChangeSimSpeed}
          colorAccent={colorAccent}
          onSelectColorAccent={onSelectColorAccent}
        />

        {/* Clean, Simple Journey Card (No confusing computer diagnostics) */}
        <SimpleJourneyCard
          sourceNode={sourceNode}
          targetNode={targetNode}
          activeRoute={activeRoute}
          mode={mode}
          simulationProgress={simulationProgress}
          isSimulating={isSimulating}
          onToggleSimulation={onToggleSimulation}
          onResetSimulation={onResetSimulation}
          onSwapEndpoints={onSwapEndpoints}
        />
      </div>
    </div>
  );
};

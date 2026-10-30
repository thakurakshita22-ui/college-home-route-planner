export type TravelMode = 'car' | 'bike' | 'bus' | 'walk';
export type ThemeAccent = 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GraphNode {
  id: string;
  name: string;
  coords: Coordinates;
  type: 'campus' | 'junction' | 'roundabout' | 'highway' | 'transit' | 'residential';
  elevationMeters?: number;
  description?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  roadName: string;
  roadType: 'national_highway' | 'state_highway' | 'arterial' | 'expressway' | 'local';
  distanceMeters: number;
  speedLimitKmh: number;
  baseCongestion: number; // 1.0 = free flow, >1.0 = traffic delay
  isOneWay?: boolean;
}

export interface AlgorithmMetrics {
  executionTimeMs: number;
  nodesExplored: number;
  edgesRelaxed: number;
  pathFound: boolean;
  algorithmName: 'Dijkstra' | 'A*' | 'Bellman-Ford';
  heuristicUsed: string;
  timeComplexity: string;
  spaceComplexity: string;
}

export interface RouteOption {
  id: string;
  name: string;
  tag: string;
  pathNodeIds: string[];
  pathCoordinates: Coordinates[];
  distanceKm: number;
  durationMinutes: number;
  costInr: number;
  co2Kg: number;
  algorithmMetrics: AlgorithmMetrics;
  normalizedDistance?: number;
  normalizedDuration?: number;
  normalizedCost?: number;
  normalizedCo2?: number;
  compositeScore?: number;
  isRecommended?: boolean;
  color: string;
  turnByTurn: {
    instruction: string;
    roadName: string;
    distanceMeters: number;
    nodeName: string;
  }[];
}

export interface MultiObjectiveWeights {
  distance: number;
  time: number;
  cost: number;
  co2: number;
}

export interface VehicleConfig {
  fuelPricePerLiter: number;
  mileageKmPerLiter: number;
  busBaseFare: number;
  busPerKmFare: number;
}

export interface AlgorithmStep {
  stepNumber: number;
  currentNodeId: string;
  action: 'explore' | 'relax' | 'visited' | 'heuristic_eval' | 'path_backtrack';
  tentativeDistances: Record<string, number>;
  fScores?: Record<string, number>;
  openSet: string[];
  closedSet: string[];
  description: string;
}

export interface RealTimeTrafficConditions {
  peakFactor: number;
  timeOfDay: string;
  weather: 'Clear' | 'Rain' | 'Fog';
  activeIncidents: number;
}

export interface BenchmarkScaleResult {
  scaleName: string;
  nodesCount: number;
  edgesCount: number;
  dijkstraTimeMs: number;
  dijkstraNodes: number;
  aStarTimeMs: number;
  aStarNodes: number;
  aStarPruningPercent: number;
  bellmanFordTimeMs: number;
}

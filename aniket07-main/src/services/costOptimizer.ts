import {
  GraphNode,
  GraphEdge,
  RouteOption,
  TravelMode,
  MultiObjectiveWeights,
  VehicleConfig,
} from '../types/routing';
import { runDijkstra, runAStar, runBellmanFord } from '../algorithms/graphAlgorithms';

export const DEFAULT_VEHICLE_CONFIG: Record<TravelMode, VehicleConfig> = {
  car: {
    fuelPricePerLiter: 98.0, // Petrol price in Punjab / Tricity
    mileageKmPerLiter: 16.0,
    busBaseFare: 15,
    busPerKmFare: 1.75,
  },
  bike: {
    fuelPricePerLiter: 98.0,
    mileageKmPerLiter: 48.0,
    busBaseFare: 15,
    busPerKmFare: 1.75,
  },
  bus: {
    fuelPricePerLiter: 90.0,
    mileageKmPerLiter: 4.5,
    busBaseFare: 15,
    busPerKmFare: 1.75,
  },
  walk: {
    fuelPricePerLiter: 0,
    mileageKmPerLiter: 1,
    busBaseFare: 0,
    busPerKmFare: 0,
  },
};

/**
 * Calculates transit metrics for a specified sequence of road nodes
 */
export function calculatePathMetrics(
  pathNodeIds: string[],
  nodes: GraphNode[],
  edges: GraphEdge[],
  mode: TravelMode,
  vehicleConfig: VehicleConfig,
  trafficCongestionMultiplier: number
): {
  distanceKm: number;
  durationMinutes: number;
  costInr: number;
  co2Kg: number;
  turnByTurn: {
    instruction: string;
    roadName: string;
    distanceMeters: number;
    nodeName: string;
  }[];
} {
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  let totalDistanceMeters = 0;
  let totalTimeSeconds = 0;
  const turnByTurn: {
    instruction: string;
    roadName: string;
    distanceMeters: number;
    nodeName: string;
  }[] = [];

  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const u = pathNodeIds[i];
    const v = pathNodeIds[i + 1];
    const uNode = nodeMap.get(u);
    const vNode = nodeMap.get(v);

    // Find edge connecting u and v
    const edge = edges.find(
      e => (e.source === u && e.target === v) || (!e.isOneWay && e.source === v && e.target === u)
    );

    let distMeters = 1500;
    let speedKmh = 45;
    let congestion = 1.1;
    let roadName = 'Connecting Roadway';

    if (edge) {
      distMeters = edge.distanceMeters;
      speedKmh = edge.speedLimitKmh;
      congestion = edge.baseCongestion * trafficCongestionMultiplier;
      roadName = edge.roadName;
    }

    // Adjust speed by travel mode
    if (mode === 'bike') {
      speedKmh = Math.min(speedKmh, 50);
      congestion = Math.max(1.0, 1 + (congestion - 1) * 0.45); // bikes maneuver through traffic easier
    } else if (mode === 'bus') {
      speedKmh = Math.min(speedKmh, 35);
      congestion = congestion * 1.15; // bus stops and dwell time
    } else if (mode === 'walk') {
      speedKmh = 4.8;
      congestion = 1.0;
    }

    const speedMs = (speedKmh * 1000) / 3600;
    const timeSegmentSeconds = (distMeters / speedMs) * congestion;

    totalDistanceMeters += distMeters;
    totalTimeSeconds += timeSegmentSeconds;

    turnByTurn.push({
      instruction:
        i === 0
          ? `Depart from ${uNode?.name || u} on ${roadName}`
          : `Continue along ${roadName} towards ${vNode?.name || v}`,
      roadName,
      distanceMeters: distMeters,
      nodeName: vNode?.name || v,
    });
  }

  const distanceKm = parseFloat((totalDistanceMeters / 1000).toFixed(2));
  const durationMinutes = parseFloat((totalTimeSeconds / 60).toFixed(1));

  // Cost calculation
  let costInr = 0;
  if (mode === 'car' || mode === 'bike') {
    const litersUsed = distanceKm / vehicleConfig.mileageKmPerLiter;
    costInr = parseFloat((litersUsed * vehicleConfig.fuelPricePerLiter).toFixed(2));
  } else if (mode === 'bus') {
    costInr = parseFloat(
      (vehicleConfig.busBaseFare + distanceKm * vehicleConfig.busPerKmFare).toFixed(2)
    );
  } else {
    costInr = 0;
  }

  // Carbon Emission calculation (kg CO2)
  let co2Kg = 0;
  if (mode === 'car') {
    co2Kg = parseFloat((distanceKm * 0.14).toFixed(3)); // 140 g/km
  } else if (mode === 'bike') {
    co2Kg = parseFloat((distanceKm * 0.06).toFixed(3)); // 60 g/km
  } else if (mode === 'bus') {
    co2Kg = parseFloat((distanceKm * 0.042).toFixed(3)); // 42 g/passenger-km
  } else {
    co2Kg = 0;
  }

  return {
    distanceKm,
    durationMinutes,
    costInr,
    co2Kg,
    turnByTurn,
  };
}

/**
 * Computes multiple candidate paths using Dijkstra and A*, computes Pareto normalization,
 * applies user multi-objective weights, and selects the recommended route.
 */
export function computeMultiObjectiveRoutes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId: string,
  mode: TravelMode,
  weights: MultiObjectiveWeights,
  vehicleConfig: VehicleConfig,
  trafficCongestionMultiplier: number
): {
  routes: RouteOption[];
  recommendedRoute: RouteOption | null;
  rationale: string;
} {
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // 1. Run Shortest Distance route (Dijkstra on physical distance)
  const distResult = runDijkstra(nodes, edges, sourceId, targetId, 'distance', trafficCongestionMultiplier);

  // 2. Run Fastest Time route (A* on time with traffic multiplier)
  const timeResult = runAStar(nodes, edges, sourceId, targetId, 'time', trafficCongestionMultiplier);

  // 3. Run Bellman-Ford on cost / alternative
  const costResult = runBellmanFord(nodes, edges, sourceId, targetId, 'cost', trafficCongestionMultiplier);

  // 4. A* on distance for comparison
  const aStarDistResult = runAStar(nodes, edges, sourceId, targetId, 'distance', trafficCongestionMultiplier);

  const rawCandidatePaths = [
    {
      id: 'route_balanced',
      name: 'Multi-Objective Optimal',
      tag: 'Optimized Trade-Off',
      path: timeResult.path.length > 0 ? timeResult.path : distResult.path,
      color: '#10b981', // emerald
      algoMetrics: timeResult.metrics,
    },
    {
      id: 'route_fastest',
      name: 'Expressway / Fastest Path',
      tag: 'Min Traversal Time',
      path: timeResult.path,
      color: '#3b82f6', // blue
      algoMetrics: timeResult.metrics,
    },
    {
      id: 'route_shortest',
      name: 'Direct Geographic Shortest',
      tag: 'Min Distance',
      path: distResult.path,
      color: '#8b5cf6', // purple
      algoMetrics: distResult.metrics,
    },
    {
      id: 'route_eco',
      name: 'Eco & Budget Route',
      tag: 'Min Emissions & Cost',
      path: costResult.path.length > 0 ? costResult.path : distResult.path,
      color: '#f59e0b', // amber
      algoMetrics: costResult.metrics,
    },
  ];

  // Eliminate duplicates by unique path signature
  const uniqueCandidatePaths: typeof rawCandidatePaths = [];
  const seenPathKeys = new Set<string>();

  for (const c of rawCandidatePaths) {
    const key = c.path.join('->');
    if (key.length > 0 && !seenPathKeys.has(key)) {
      seenPathKeys.add(key);
      uniqueCandidatePaths.push(c);
    }
  }

  // If only 1 unique path was found, still retain distinct analytical labels
  if (uniqueCandidatePaths.length === 0 && distResult.path.length > 0) {
    uniqueCandidatePaths.push(rawCandidatePaths[0]);
  }

  // Calculate detailed travel metrics for each route
  const routes: RouteOption[] = uniqueCandidatePaths.map(c => {
    const metrics = calculatePathMetrics(
      c.path,
      nodes,
      edges,
      mode,
      vehicleConfig,
      trafficCongestionMultiplier
    );

    const pathCoordinates = c.path
      .map(id => nodeMap.get(id)?.coords)
      .filter((coord): coord is { lat: number; lng: number } => coord !== undefined);

    return {
      id: c.id,
      name: c.name,
      tag: c.tag,
      pathNodeIds: c.path,
      pathCoordinates,
      distanceKm: metrics.distanceKm,
      durationMinutes: metrics.durationMinutes,
      costInr: metrics.costInr,
      co2Kg: metrics.co2Kg,
      algorithmMetrics: c.algoMetrics,
      color: c.color,
      turnByTurn: metrics.turnByTurn,
    };
  });

  if (routes.length === 0) {
    return {
      routes: [],
      recommendedRoute: null,
      rationale: 'No connected path could be found between the origin and destination.',
    };
  }

  // Min-Max Normalization across candidates
  const minDistance = Math.min(...routes.map(r => r.distanceKm));
  const maxDistance = Math.max(...routes.map(r => r.distanceKm));

  const minDuration = Math.min(...routes.map(r => r.durationMinutes));
  const maxDuration = Math.max(...routes.map(r => r.durationMinutes));

  const minCost = Math.min(...routes.map(r => r.costInr));
  const maxCost = Math.max(...routes.map(r => r.costInr));

  const minCo2 = Math.min(...routes.map(r => r.co2Kg));
  const maxCo2 = Math.max(...routes.map(r => r.co2Kg));

  const totalWeight =
    weights.distance + weights.time + weights.cost + weights.co2 || 1;
  const wD = weights.distance / totalWeight;
  const wT = weights.time / totalWeight;
  const wC = weights.cost / totalWeight;
  const wE = weights.co2 / totalWeight;

  routes.forEach(route => {
    const normDist =
      maxDistance > minDistance
        ? (route.distanceKm - minDistance) / (maxDistance - minDistance)
        : 0;
    const normTime =
      maxDuration > minDuration
        ? (route.durationMinutes - minDuration) / (maxDuration - minDuration)
        : 0;
    const normCost =
      maxCost > minCost ? (route.costInr - minCost) / (maxCost - minCost) : 0;
    const normCo2 =
      maxCo2 > minCo2 ? (route.co2Kg - minCo2) / (maxCo2 - minCo2) : 0;

    const compositeScore = parseFloat(
      (wD * normDist + wT * normTime + wC * normCost + wE * normCo2).toFixed(4)
    );

    route.normalizedDistance = normDist;
    route.normalizedDuration = normTime;
    route.normalizedCost = normCost;
    route.normalizedCo2 = normCo2;
    route.compositeScore = compositeScore;
  });

  // Smallest penalty score wins
  routes.sort((a, b) => (a.compositeScore ?? 0) - (b.compositeScore ?? 0));
  routes[0].isRecommended = true;

  const recommendedRoute = routes[0];

  // Generate clean real-world commute recommendation
  let rationale = `"${recommendedRoute.name}" is the recommended route for your journey. `;

  if (wT >= 0.4) {
    rationale += `With time prioritized, this route takes advantage of open arterials and bypasses to deliver the fastest trip (${recommendedRoute.durationMinutes} mins).`;
  } else if (wD >= 0.4) {
    rationale += `With distance prioritized, this provides the most direct and shortest path (${recommendedRoute.distanceKm} km).`;
  } else if (wC >= 0.4 || wE >= 0.4) {
    rationale += `With budget and eco-efficiency prioritized, this trip cuts fuel expenses (₹${Math.round(recommendedRoute.costInr)}) and minimizes carbon footprint (${recommendedRoute.co2Kg} kg CO₂).`;
  } else {
    rationale += `It offers the best real-world balance between commute duration (${recommendedRoute.durationMinutes} mins), distance (${recommendedRoute.distanceKm} km), and fuel expenditure (₹${Math.round(recommendedRoute.costInr)}).`;
  }

  return {
    routes,
    recommendedRoute,
    rationale,
  };
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GraphNode, GraphEdge, RouteOption, TravelMode, ThemeAccent } from '../types/routing';
import {
  Navigation,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Gauge,
  Clock,
  Compass,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Cpu,
  Radio,
  Palette,
} from 'lucide-react';

interface GraphTopologyViewerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceId: string;
  targetId: string;
  onSetSourceId: (id: string) => void;
  onSetTargetId: (id: string) => void;
  onStartTravelNow: (targetId: string) => void;
  activeRoute: RouteOption | null;
  mode: TravelMode;
  trafficMultiplier: number;
  simulationProgress: number; // 0 to 1
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onSeekSimulation: (progress: number) => void;
  simSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  colorAccent?: ThemeAccent;
  onSelectColorAccent?: (accent: ThemeAccent) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const GraphTopologyViewer: React.FC<GraphTopologyViewerProps> = ({
  nodes,
  edges,
  sourceId,
  targetId,
  onSetSourceId,
  onSetTargetId,
  onStartTravelNow,
  activeRoute,
  mode,
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [aiGlowMode, setAiGlowMode] = useState<boolean>(true);

  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 350,
  });

  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  // AI Animation State: Particles, Radar angles, Ripples
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const globalTimeRef = useRef<number>(0);
  const [ripples, setRipples] = useState<{ x: number; y: number; radius: number; opacity: number; label?: string }[]>([]);

  // Responsive Canvas Sizing via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasDimensions({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute dynamic geographical bounding box around all nodes with margin
  const getBounds = useCallback(() => {
    if (nodes.length === 0) {
      return {
        minLat: 30.65,
        maxLat: 30.83,
        minLng: 76.57,
        maxLng: 76.87,
        centerLat: 30.74,
        centerLng: 76.72,
      };
    }
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;

    nodes.forEach(n => {
      if (n.coords.lat < minLat) minLat = n.coords.lat;
      if (n.coords.lat > maxLat) maxLat = n.coords.lat;
      if (n.coords.lng < minLng) minLng = n.coords.lng;
      if (n.coords.lng > maxLng) maxLng = n.coords.lng;
    });

    const latSpan = maxLat - minLat || 0.05;
    const lngSpan = maxLng - minLng || 0.05;
    const padLat = latSpan * 0.15;
    const padLng = lngSpan * 0.15;

    return {
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
      centerLat: (minLat + maxLat) / 2,
      centerLng: (minLng + maxLng) / 2,
    };
  }, [nodes]);

  // Project geographic coordinates onto Canvas with preserved aspect ratio
  const projectCoords = useCallback(
    (coords: { lat: number; lng: number }, width: number, height: number) => {
      const bounds = getBounds();
      const padding = 35;
      const effectiveW = Math.max(100, width - padding * 2);
      const effectiveH = Math.max(100, height - padding * 2);

      const spanLng = bounds.maxLng - bounds.minLng || 0.05;
      const spanLat = bounds.maxLat - bounds.minLat || 0.05;

      const latCorrection = Math.cos((bounds.centerLat * Math.PI) / 180);
      const scaleX = effectiveW / (spanLng * latCorrection);
      const scaleY = effectiveH / spanLat;
      const baseScale = Math.min(scaleX, scaleY);

      const cx = width / 2;
      const cy = height / 2;

      const dx = (coords.lng - bounds.centerLng) * latCorrection * baseScale * zoomLevel;
      const dy = (coords.lat - bounds.centerLat) * baseScale * zoomLevel;

      return {
        x: cx + dx + panOffset.x,
        y: cy - dy + panOffset.y,
      };
    },
    [getBounds, zoomLevel, panOffset]
  );

  // Calculate current vehicle position and which waypoints have been touched
  const getVehiclePosition = useCallback(
    (width: number, height: number) => {
      if (!activeRoute || activeRoute.pathNodeIds.length < 2) return null;

      const pathNodes = activeRoute.pathNodeIds
        .map(id => nodes.find(n => n.id === id))
        .filter((n): n is GraphNode => n !== undefined);

      if (pathNodes.length < 2) return null;

      const totalSegments = pathNodes.length - 1;
      const scaledProgress = simulationProgress * totalSegments;
      const segmentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
      const segmentFraction = scaledProgress - segmentIndex;

      const n1 = pathNodes[segmentIndex];
      const n2 = pathNodes[segmentIndex + 1];

      const p1 = projectCoords(n1.coords, width, height);
      const p2 = projectCoords(n2.coords, width, height);

      const currentX = p1.x + (p2.x - p1.x) * segmentFraction;
      const currentY = p1.y + (p2.y - p1.y) * segmentFraction;

      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      return {
        x: currentX,
        y: currentY,
        angle,
        segmentIndex,
        currentNode: n1,
        nextNode: n2,
        touchedNodeIds: activeRoute.pathNodeIds.slice(0, segmentIndex + 1),
      };
    },
    [activeRoute, nodes, simulationProgress, projectCoords]
  );

  // Trigger ripple and spawn AI particles when vehicle touches a node
  const lastTouchedIndexRef = useRef<number>(-1);
  useEffect(() => {
    if (!canvasRef.current || !activeRoute) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const veh = getVehiclePosition(rect.width, rect.height);
    if (!veh) return;

    if (veh.segmentIndex !== lastTouchedIndexRef.current) {
      lastTouchedIndexRef.current = veh.segmentIndex;
      const touchedNode = nodes.find(n => n.id === activeRoute.pathNodeIds[veh.segmentIndex]);
      if (touchedNode) {
        const pos = projectCoords(touchedNode.coords, rect.width, rect.height);
        setRipples(prev => [
          ...prev.slice(-3),
          { x: pos.x, y: pos.y, radius: 10, opacity: 1.0, label: touchedNode.name.split(',')[0] },
        ]);

        // Spawn extra burst of glowing AI particles
        for (let i = 0; i < 12; i++) {
          const pAngle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2.5 + 0.8;
          particlesRef.current.push({
            x: pos.x,
            y: pos.y,
            vx: Math.cos(pAngle) * speed,
            vy: Math.sin(pAngle) * speed,
            size: Math.random() * 3 + 1.5,
            alpha: 1.0,
            color: i % 2 === 0 ? '#38bdf8' : '#34d399',
          });
        }
      }
    }
  }, [simulationProgress, activeRoute, nodes, getVehiclePosition, projectCoords]);

  // Main Continuous Render Loop with AI Moving Effects
  useEffect(() => {
    let isRunning = true;

    const render = () => {
      globalTimeRef.current += 0.035;
      const time = globalTimeRef.current;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvasDimensions.width;
      const height = canvasDimensions.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Dynamic Next-Level Color Theme for Canvas
      const themeColors = {
        emerald: {
          bg: '#030712',
          traversed: '#10b981',
          ahead: '#34d399',
          glow: '#10b981',
          particle1: '#34d399',
          particle2: '#38bdf8',
          reticle: 'rgba(52, 211, 153, 0.7)',
        },
        cyan: {
          bg: '#020617',
          traversed: '#06b6d4',
          ahead: '#38bdf8',
          glow: '#06b6d4',
          particle1: '#38bdf8',
          particle2: '#60a5fa',
          reticle: 'rgba(6, 182, 212, 0.7)',
        },
        violet: {
          bg: '#070312',
          traversed: '#a855f7',
          ahead: '#c084fc',
          glow: '#a855f7',
          particle1: '#c084fc',
          particle2: '#f472b6',
          reticle: 'rgba(168, 85, 247, 0.7)',
        },
        amber: {
          bg: '#0c0804',
          traversed: '#f59e0b',
          ahead: '#fbbf24',
          glow: '#f59e0b',
          particle1: '#fbbf24',
          particle2: '#fb923c',
          reticle: 'rgba(245, 158, 11, 0.7)',
        },
        rose: {
          bg: '#0d0206',
          traversed: '#f43f5e',
          ahead: '#fb7185',
          glow: '#f43f5e',
          particle1: '#fb7185',
          particle2: '#fda4af',
          reticle: 'rgba(244, 63, 94, 0.7)',
        },
      }[colorAccent || 'emerald'];

      // 1. Sleek Cyber Dark Space Background with subtle scanning scanlines
      ctx.fillStyle = themeColors.bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle background neural grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 1;
      const gridSize = 32 * zoomLevel;
      const startX = panOffset.x % gridSize;
      const startY = panOffset.y % gridSize;

      ctx.beginPath();
      for (let x = startX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = startY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      const nodePositions = new Map<string, { x: number; y: number }>();
      nodes.forEach(n => {
        nodePositions.set(n.id, projectCoords(n.coords, width, height));
      });

      const activePathNodeSet = new Set(activeRoute?.pathNodeIds || []);
      const vehicleInfo = getVehiclePosition(width, height);
      const touchedNodeSet = new Set(vehicleInfo?.touchedNodeIds || []);

      // 2. Draw Road Segments (Edges) with AI Neural Energy Pulses
      edges.forEach((edge, edgeIdx) => {
        const p1 = nodePositions.get(edge.source);
        const p2 = nodePositions.get(edge.target);
        if (!p1 || !p2) return;

        let isPathEdge = false;
        let isTraversedEdge = false;

        if (activeRoute) {
          for (let i = 0; i < activeRoute.pathNodeIds.length - 1; i++) {
            const u = activeRoute.pathNodeIds[i];
            const v = activeRoute.pathNodeIds[i + 1];
            if (
              (edge.source === u && edge.target === v) ||
              (!edge.isOneWay && edge.source === v && edge.target === u)
            ) {
              isPathEdge = true;
              if (vehicleInfo && i < vehicleInfo.segmentIndex) {
                isTraversedEdge = true;
              }
              break;
            }
          }
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (isPathEdge) {
          if (isTraversedEdge) {
            ctx.strokeStyle = themeColors.traversed;
            ctx.lineWidth = 4 * zoomLevel;
            ctx.shadowColor = themeColors.traversed;
            ctx.shadowBlur = 10;
          } else {
            // Glowing theme color ahead
            ctx.strokeStyle = themeColors.ahead;
            ctx.lineWidth = 3.5 * zoomLevel;
            ctx.shadowColor = themeColors.glow;
            ctx.shadowBlur = 12;
          }
        } else {
          ctx.shadowBlur = 0;
          const liveCongestion = edge.baseCongestion * trafficMultiplier;
          if (liveCongestion > 1.6) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          } else if (edge.roadType === 'national_highway') {
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.38)';
          } else if (edge.roadType === 'expressway') {
            ctx.strokeStyle = 'rgba(14, 165, 233, 0.38)';
          } else {
            ctx.strokeStyle = 'rgba(71, 85, 105, 0.28)';
          }
          ctx.lineWidth = 1.6 * zoomLevel;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // AI Synaptic Edge Energy Pulses along active route
        if (isPathEdge && aiGlowMode) {
          const edgeLength = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const pulseOffset = ((time * 80 + edgeIdx * 45) % Math.max(10, edgeLength)) / edgeLength;
          const pulseX = p1.x + (p2.x - p1.x) * pulseOffset;
          const pulseY = p1.y + (p2.y - p1.y) * pulseOffset;

          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 3.5 * zoomLevel, 0, Math.PI * 2);
          ctx.fillStyle = '#67e8f9';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 3. Draw AI Neural Wave Ripples on Touched Waypoint Nodes
      setRipples(prev =>
        prev
          .map(r => ({ ...r, radius: r.radius + 1.2, opacity: r.opacity - 0.025 }))
          .filter(r => r.opacity > 0)
      );

      ripples.forEach(r => {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(52, 211, 153, ${r.opacity})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Floating label
        if (r.label && r.opacity > 0.4) {
          ctx.fillStyle = `rgba(240, 253, 250, ${r.opacity})`;
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`✓ ${r.label}`, r.x, r.y - r.radius - 4);
        }
      });

      // 4. Draw Nodes with AI Target HUD Brackets
      nodes.forEach(node => {
        const pos = nodePositions.get(node.id);
        if (!pos) return;

        const isSource = node.id === sourceId;
        const isTarget = node.id === targetId;
        const isOnPath = activePathNodeSet.has(node.id);
        const isTouched = touchedNodeSet.has(node.id);
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;

        let radius = (isSource || isTarget ? 11 : isOnPath ? 8 : 6) * zoomLevel;
        let fillColor = '#1e293b';
        let strokeColor = '#475569';

        if (isSource) {
          fillColor = '#059669';
          strokeColor = '#34d399';
        } else if (isTarget) {
          fillColor = '#dc2626';
          strokeColor = '#f87171';
        } else if (isTouched) {
          fillColor = '#10b981';
          strokeColor = '#6ee7b7';
        } else if (isOnPath) {
          fillColor = '#0284c7';
          strokeColor = '#38bdf8';
        } else if (node.type === 'transit') {
          fillColor = '#7c3aed';
          strokeColor = '#a78bfa';
        }

        if (isSource || isTarget || isSelected || isHovered) {
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = 16;
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.lineWidth = (isSelected ? 3 : isSource || isTarget ? 2.5 : 1.5) * zoomLevel;
        ctx.strokeStyle = isSelected ? '#ffffff' : strokeColor;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Holographic AI Target Reticle around Origin & Destination
        if (isSource || isTarget) {
          const reticleSize = (radius + 5) * zoomLevel;
          ctx.strokeStyle = isSource ? 'rgba(52, 211, 153, 0.7)' : 'rgba(248, 113, 113, 0.7)';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(pos.x - reticleSize, pos.y - reticleSize, reticleSize * 2, reticleSize * 2);
        }

        // Inner symbol
        if (isSource) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(8 * zoomLevel)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('START', pos.x, pos.y);
        } else if (isTarget) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(8 * zoomLevel)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('END', pos.x, pos.y);
        } else if (isTouched && isOnPath) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(8 * zoomLevel)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✓', pos.x, pos.y);
        }

        // Compact Node Label
        ctx.fillStyle = isSource || isTarget ? '#ffffff' : isOnPath ? '#e2e8f0' : '#94a3b8';
        ctx.font = `${isSource || isTarget ? 'bold 10px' : isOnPath ? '600 9px' : '8.5px'} "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const shortName = node.name.split(',')[0].replace('Chowk', '').replace('Junction', '').trim();
        ctx.fillText(shortName, pos.x, pos.y + radius + 3);
      });

      // 5. Draw THE MOVING AI ANIMATION EFFECT (The Neural Orb + Comet Sparks + Radar Scan)
      if (vehicleInfo) {
        const vx = vehicleInfo.x;
        const vy = vehicleInfo.y;

        // Add comet trail particles behind moving vehicle
        if (isSimulating) {
          for (let k = 0; k < 2; k++) {
            particlesRef.current.push({
              x: vx + (Math.random() - 0.5) * 6,
              y: vy + (Math.random() - 0.5) * 6,
              vx: -Math.cos(vehicleInfo.angle) * (Math.random() * 2 + 1) + (Math.random() - 0.5) * 0.8,
              vy: -Math.sin(vehicleInfo.angle) * (Math.random() * 2 + 1) + (Math.random() - 0.5) * 0.8,
              size: Math.random() * 3.5 + 1.5,
              alpha: 0.9,
              color: Math.random() > 0.4 ? '#38bdf8' : '#34d399',
            });
          }
        }

        // Forward Holographic AI Scanning Cone
        if (aiGlowMode) {
          const scanRadius = 38 * zoomLevel;
          const scanAngle = vehicleInfo.angle;
          const fov = Math.PI / 4; // 45 degree forward scan

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(vx, vy);
          ctx.arc(vx, vy, scanRadius, scanAngle - fov / 2, scanAngle + fov / 2);
          ctx.closePath();

          const scanGrad = ctx.createRadialGradient(vx, vy, 2, vx, vy, scanRadius);
          scanGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
          scanGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = scanGrad;
          ctx.fill();
          ctx.restore();
        }

        // Outer Rotating Holographic Rings around the AI Orb
        const ringRadius = 14 * zoomLevel;
        ctx.save();
        ctx.translate(vx, vy);
        ctx.rotate(time * 3); // Continuous rotating holographic ring

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.rotate(-time * 5); // Counter-rotating inner ring
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Glowing Radiant Energy Halo
        const glowRadius = 24 * zoomLevel + Math.sin(time * 6) * 3;
        const auraGrad = ctx.createRadialGradient(vx, vy, 2, vx, vy, glowRadius);
        auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
        auraGrad.addColorStop(0.4, 'rgba(16, 185, 129, 0.55)');
        auraGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');

        ctx.beginPath();
        ctx.arc(vx, vy, glowRadius, 0, 2 * Math.PI);
        ctx.fillStyle = auraGrad;
        ctx.fill();

        // Central AI Core Orb
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(vx, vy, 8.5 * zoomLevel, 0, 2 * Math.PI);
        ctx.fillStyle = '#0284c7';
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner glowing AI synapse dot
        ctx.beginPath();
        ctx.arc(vx, vy, 3.5 * zoomLevel, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // AI Mini HUD Floating Badge above vehicle
        ctx.fillStyle = '#0f172a';
        const hudW = 60;
        const hudH = 15;
        ctx.fillRect(vx - hudW / 2, vy - 24 * zoomLevel, hudW, hudH);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(vx - hudW / 2, vy - 24 * zoomLevel, hudW, hudH);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`AI NAV · ${Math.round(simulationProgress * 100)}%`, vx, vy - 24 * zoomLevel + hudH / 2);
      }

      // 6. Update and Draw Moving AI Comet Trail Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
        p.size = Math.max(0.5, p.size - 0.05);

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }

      if (isRunning) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    nodes,
    edges,
    sourceId,
    targetId,
    activeRoute,
    simulationProgress,
    trafficMultiplier,
    zoomLevel,
    panOffset,
    selectedNode,
    hoveredNode,
    ripples,
    canvasDimensions,
    aiGlowMode,
    isSimulating,
    projectCoords,
    getVehiclePosition,
  ]);

  // Touch & Click Node Selection Handling
  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    let clickedNode: GraphNode | null = null;
    nodes.forEach(node => {
      const pos = projectCoords(node.coords, rect.width, rect.height);
      const dist = Math.hypot(pos.x - clickX, pos.y - clickY);
      if (dist <= 20 * zoomLevel) {
        clickedNode = node;
      }
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setMenuPos({
        x: Math.min(clickX, rect.width - 220),
        y: Math.min(clickY, rect.height - 160),
      });
    } else {
      setSelectedNode(null);
      setMenuPos(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let found: GraphNode | null = null;
      nodes.forEach(n => {
        const p = projectCoords(n.coords, rect.width, rect.height);
        if (Math.hypot(p.x - mx, p.y - my) <= 16 * zoomLevel) found = n;
      });
      setHoveredNode(found);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: t.clientX - panOffset.x, y: t.clientY - panOffset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const t = e.touches[0];
      setPanOffset({
        x: t.clientX - dragStart.x,
        y: t.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    if (e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      handleCanvasInteraction(t.clientX, t.clientY);
    }
  };

  const resetCamera = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setSelectedNode(null);
    setMenuPos(null);
  };

  const sourceNode = nodes.find(n => n.id === sourceId);
  const targetNode = nodes.find(n => n.id === targetId);

  const distanceCovered = activeRoute
    ? (activeRoute.distanceKm * simulationProgress).toFixed(1)
    : '0.0';
  const durationRemaining = activeRoute
    ? Math.max(0, activeRoute.durationMinutes * (1 - simulationProgress)).toFixed(0)
    : '0';

  const baseSpeed = mode === 'car' ? 55 : mode === 'bike' ? 42 : mode === 'bus' ? 32 : 5;
  const currentSpeed = Math.round(baseSpeed / trafficMultiplier + Math.sin(simulationProgress * 15) * 4);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] md:h-[350px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col select-none"
    >
      {/* Top HUD: Current Journey & Live AI Status */}
      <div className="absolute top-2 left-2 right-2 z-20 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
        {/* Journey Endpoints Banner */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/80 shadow-lg text-xs">
          <div className="flex items-center gap-1 font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="truncate max-w-[95px]">{sourceNode?.name.split(',')[0]}</span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-500" />
          <div className="flex items-center gap-1 font-bold text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="truncate max-w-[95px]">{targetNode?.name.split(',')[0]}</span>
          </div>
        </div>

        {/* Live Transit Speedometer & Telemetry HUD */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/80 shadow-lg text-[11px] font-mono">
          <div className="flex items-center gap-1 text-sky-400 font-bold">
            <Gauge className="w-3.5 h-3.5" />
            <span>{currentSpeed} km/h</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{durationRemaining}m ETA</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            {distanceCovered} / {activeRoute?.distanceKm || 0} km
          </span>
        </div>

        {/* AI Glow Mode Toggle, Theme Point & Camera Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80">
          {/* One more point to change theme right on the map */}
          {onSelectColorAccent && (
            <button
              onClick={() => {
                const themeList: ThemeAccent[] = ['emerald', 'cyan', 'violet', 'amber', 'rose'];
                const nextIdx = (themeList.indexOf(colorAccent || 'emerald') + 1) % themeList.length;
                onSelectColorAccent(themeList[nextIdx]);
              }}
              className="p-1 px-1.5 rounded transition text-[10px] font-bold flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700"
              title="Change Theme (1-Touch from map)"
            >
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              <span className="capitalize hidden sm:inline">{colorAccent}</span>
            </button>
          )}

          <button
            onClick={() => setAiGlowMode(!aiGlowMode)}
            className={`p-1 rounded transition text-[10px] font-bold flex items-center gap-1 ${
              aiGlowMode ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle AI Moving Glow & Scan Effect"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">AI FX</span>
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 2.2))}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.7))}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetCamera}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition text-[10px] font-bold"
            title="Center Graph"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onClick={e => handleCanvasInteraction(e.clientX, e.clientY)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full block"
        />

        {/* Floating Action Menu when Touching any Node */}
        {selectedNode && menuPos && (
          <div
            style={{ left: menuPos.x, top: menuPos.y }}
            className="absolute z-30 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-2.5 shadow-2xl text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between pb-1.5 border-b border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">
                  Touched Location
                </span>
                <h4 className="font-bold text-white text-xs mt-0.5 truncate max-w-[180px]">
                  {selectedNode.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-0.5 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 flex flex-col gap-1">
              <button
                onClick={() => {
                  onSetSourceId(selectedNode.id);
                  setSelectedNode(null);
                }}
                className="flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] transition"
              >
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Start Journey Here</span>
              </button>

              <button
                onClick={() => {
                  onSetTargetId(selectedNode.id);
                  setSelectedNode(null);
                }}
                className="flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold text-[11px] transition"
              >
                <Navigation className="w-3 h-3 text-red-400" />
                <span>Set as Destination</span>
              </button>

              <button
                onClick={() => {
                  onStartTravelNow(selectedNode.id);
                  setSelectedNode(null);
                }}
                className="flex items-center justify-center gap-1.5 w-full px-2.5 py-2 rounded-lg text-white font-bold text-[11px] shadow-lg transition btn-moving-shimmer btn-moving-border"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Travel Here Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Hover Tooltip when moving cursor over nodes */}
        {hoveredNode && !selectedNode && (
          <div className="absolute top-12 left-3 z-20 pointer-events-none bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-200 shadow">
            <span className="font-semibold text-emerald-400">{hoveredNode.name}</span>
            <span className="text-[9px] text-slate-400 block">Touch/Click node to route</span>
          </div>
        )}
      </div>

      {/* Bottom Compact Animation Playback Controller */}
      <div className="px-3 py-2 bg-slate-900/95 border-t border-slate-800/90 z-20 backdrop-blur-md flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          {/* Play/Pause & Reset */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-lg transition btn-moving-shimmer btn-moving-border"
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Transit
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Start Moving AI
                </>
              )}
            </button>

            <button
              onClick={onResetSimulation}
              className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Reset Journey to Start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Multiplier Pill (1x, 2x, 4x) */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => onChangeSimSpeed(s)}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  simSpeed === s
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Waypoints Traversed Status */}
          <div className="text-[11px] font-mono text-slate-300">
            <span className="text-emerald-400 font-bold">
              {(simulationProgress * 100).toFixed(0)}%
            </span>
            <span className="hidden sm:inline"> ({activeRoute?.pathNodeIds.length || 0} waypoints)</span>
          </div>
        </div>

        {/* Progress Slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.005"
          value={simulationProgress}
          onChange={e => onSeekSimulation(parseFloat(e.target.value))}
          className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};

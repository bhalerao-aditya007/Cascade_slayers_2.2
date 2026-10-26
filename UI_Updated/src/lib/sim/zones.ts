// ─── per-city digital twins · hex zones on real district centroids ────────────
import type { HazardId, Zone } from './types'
import { CITIES } from './cities'

import floodBoundary from '@/data/boundaries/flood.json'
import heatBoundary from '@/data/boundaries/heat.json'
import epidemicBoundary from '@/data/boundaries/epidemic.json'
import gridBoundary from '@/data/boundaries/grid.json'
import quakeBoundary from '@/data/boundaries/quake.json'
import chemBoundary from '@/data/boundaries/chem.json'

export interface BoundaryFeature {
  type: 'Feature'
  properties: { key: string; name: string; osm: string }
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] }
}
export type BoundaryFC = { type: 'FeatureCollection'; features: BoundaryFeature[] }

const BOUNDARIES: Record<HazardId, BoundaryFC> = {
  flood: floodBoundary as unknown as BoundaryFC,
  heat: heatBoundary as unknown as BoundaryFC,
  epidemic: epidemicBoundary as unknown as BoundaryFC,
  grid: gridBoundary as unknown as BoundaryFC,
  quake: quakeBoundary as unknown as BoundaryFC,
  chem: chemBoundary as unknown as BoundaryFC,
}

/** deg per km at a given latitude */
const kmLng = (lat: number) => 1 / (111.32 * Math.cos((lat * Math.PI) / 180))
const kmLat = () => 1 / 110.57

function hexRing(center: [number, number], radiusKm: number): [number, number][] {
  const dLng = kmLng(center[1]) * radiusKm
  const dLat = kmLat() * radiusKm
  const pts: [number, number][] = []
  for (let i = 0; i < 6; i++) {
    const bearing = (Math.PI / 180) * (60 * i) // vertex at north
    pts.push([center[0] + Math.sin(bearing) * dLng, center[1] + Math.cos(bearing) * dLat])
  }
  pts.push(pts[0])
  return pts
}

const ZONE_CACHE = new Map<HazardId, Zone[]>()

export function zonesFor(hazard: HazardId): Zone[] {
  const cached = ZONE_CACHE.get(hazard)
  if (cached) return cached
  const city = CITIES[hazard]
  const zones: Zone[] = city.seeds.map((s) => ({
    id: s.id,
    name: s.name,
    center: s.center,
    hex: hexRing(s.center, city.hexR),
    population: s.population,
    elevation: s.elevation,
    beds: s.beds ?? 0,
    icu: s.icu ?? 0,
    lowLying: s.lowLying,
    substation: !!s.substation,
    plant: s.plant,
  }))
  ZONE_CACHE.set(hazard, zones)
  return zones
}

/** k-nearest neighbours within ~2.1 hex spacings (for spread arcs) */
const NEIGH_CACHE = new Map<HazardId, Record<string, string[]>>()

export function neighborsFor(hazard: HazardId): Record<string, string[]> {
  const cached = NEIGH_CACHE.get(hazard)
  if (cached) return cached
  const zones = zonesFor(hazard)
  const out: Record<string, string[]> = {}
  for (const z of zones) {
    const dLng = kmLng(z.center[1])
    const dist = (o: Zone) =>
      Math.hypot((o.center[0] - z.center[0]) / dLng, (o.center[1] - z.center[1]) / kmLat())
    out[z.id] = zones
      .filter((o) => o.id !== z.id)
      .map((o) => ({ id: o.id, d: dist(o) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 6)
      .map((o) => o.id)
  }
  NEIGH_CACHE.set(hazard, out)
  return out
}

export function boundaryFor(hazard: HazardId): BoundaryFC {
  return BOUNDARIES[hazard]
}

const BBOX_CACHE = new Map<HazardId, [[number, number], [number, number]]>()

export function cityBBoxFor(hazard: HazardId): [[number, number], [number, number]] {
  const cached = BBOX_CACHE.get(hazard)
  if (cached) return cached
  const zones = zonesFor(hazard)
  const lngs = zones.flatMap((z) => z.hex.map((p) => p[0]))
  const lats = zones.flatMap((z) => z.hex.map((p) => p[1]))
  const pad = Math.max(...zones.map((z) => 0)) + 0.022
  const bbox: [[number, number], [number, number]] = [
    [Math.min(...lngs) - pad, Math.min(...lats) - pad],
    [Math.max(...lngs) + pad, Math.max(...lats) + pad],
  ]
  BBOX_CACHE.set(hazard, bbox)
  return bbox
}

// ─── scroll-scrub camera path (Bruno-Simon-style: scroll drives the camera) ───
export interface CamState {
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
}

const smooth = (u: number) => u * u * (3 - 2 * u)

export function cameraAt(hazard: HazardId, p: number): CamState {
  const kfs = CITIES[hazard].camera
  const q = Math.max(0, Math.min(1, p))
  let i = 0
  while (i < kfs.length - 2 && q > kfs[i + 1].p) i++
  const a = kfs[i]
  const b = kfs[Math.min(i + 1, kfs.length - 1)]
  const span = Math.max(1e-6, b.p - a.p)
  const u = smooth(Math.max(0, Math.min(1, (q - a.p) / span)))
  return {
    center: [a.center[0] + (b.center[0] - a.center[0]) * u, a.center[1] + (b.center[1] - a.center[1]) * u],
    zoom: a.zoom + (b.zoom - a.zoom) * u,
    pitch: a.pitch + (b.pitch - a.pitch) * u,
    bearing: a.bearing + (b.bearing - a.bearing) * u,
  }
}

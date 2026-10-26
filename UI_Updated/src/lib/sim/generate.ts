// ─── episode assembler · deterministic generation from scenario scripts ───────
import type {
  Episode, EpisodeZone, HazardId, Intervention, LayerCode, ScenarioSpec, SourceStatus, ZoneSeries,
} from './types'
import { LAYER_CODES } from './types'
import { zonesFor } from './zones'
import { HAZARD_BY_ID } from './hazards'
import { CITIES } from './cities'
import { clamp, hash, logistic, rng, sramp } from './core'
import { floodSpec } from './scenarios/flood'
import { heatSpec } from './scenarios/heat'
import { epidemicSpec } from './scenarios/epidemic'
import { gridSpec } from './scenarios/grid'
import { quakeSpec } from './scenarios/quake'
import { chemSpec } from './scenarios/chem'

const SPECS: Record<HazardId, () => ScenarioSpec> = {
  flood: floodSpec, heat: heatSpec, epidemic: epidemicSpec, grid: gridSpec, quake: quakeSpec, chem: chemSpec,
}

const HORIZON = 72

function buildSources(hazard: HazardId): SourceStatus[] {
  const names = CITIES[hazard].sources
  const base: SourceStatus[] = [
    { id: 'imd_radar', kind: names.imd_radar ?? 'Weather radar + nowcast', reliability: 0.97, status: 'ok' },
    { id: 'gauge_net', kind: names.gauge_net ?? 'Rain & canal gauges (41)', reliability: 0.95, status: 'ok' },
    { id: 'scada_grid', kind: names.scada_grid ?? 'Grid SCADA (feeders)', reliability: 0.94, status: 'ok' },
    { id: 'er_108_dispatch', kind: names.er_108_dispatch ?? 'Emergency dispatch', reliability: 0.96, status: 'ok' },
    { id: 'hospital_his', kind: names.hospital_his ?? 'Hospital HIS', reliability: 0.9, status: 'degraded', note: '2 hospitals batch-upload every 6h' },
    { id: 'traffic_api', kind: names.traffic_api ?? 'Traffic telemetry', reliability: 0.91, status: 'ok' },
    { id: 'citizen_app', kind: 'Citizen reports', reliability: 0.71, status: 'ok' },
    { id: 'aq_stations', kind: names.aq_stations ?? 'Air / gas stations (9)', reliability: 0.62, status: 'degraded', note: '3 sensors drifting' },
    { id: 'citizen_cluster_17', kind: 'Coordinated report cluster', reliability: 0.04, status: 'quarantined', note: 'Truth discovery: geo-spoof burst — 214 false reports' },
  ]
  if (hazard === 'epidemic') {
    base[1] = { id: 'ww_survey', kind: names.ww_survey ?? 'Wastewater survey (7 catchments)', reliability: 0.93, status: 'ok' }
  }
  if (hazard === 'quake') {
    base[0] = { id: 'usgs_feed', kind: names.imd_radar ?? 'Seismic feed', reliability: 0.99, status: 'ok' }
  }
  return base
}

const PIPELINE_TEMPLATE: { id: string; name: string; detail: string }[] = [
  { id: 'L0', name: 'HARNESS', detail: 'Event log · as-of store · watermark' },
  { id: 'L1', name: 'STATE', detail: 'Truth discovery · robust fusion' },
  { id: 'L2', name: 'FORECAST', detail: 'Chronos-2 · 240 series · quantiles P10/50/90' },
  { id: 'L3', name: 'EVENTS', detail: 'Severity ladder · typed onset events' },
  { id: 'L4', name: 'CASCADE', detail: 'Online Hawkes graph · MC ×500 paths' },
  { id: 'L5', name: 'RISK', detail: 'LightGBM CDFs · conformal calibration' },
  { id: 'L6', name: 'DECISIONS', detail: 'Counterfactuals · MILP allocation' },
]

function buildInterventions(spec: ScenarioSpec, baseline: number[]): Intervention[] {
  const ts: number[] = []
  for (let t = 0; t <= HORIZON; t += 2) ts.push(t)
  return spec.interventions.map((iv) => {
    const intervened = ts.map((t) =>
      clamp(baseline[Math.min(t, baseline.length - 1)] * (1 - iv.deltaP * sramp(t, iv.deployLeadH * 0.4, iv.deployLeadH + 6)), 0.03, 1),
    )
    return { ...iv, cf: { t: ts, baseline: ts.map((t) => baseline[Math.min(t, baseline.length - 1)]), intervened } }
  })
}

export function generateEpisode(hazard: HazardId): Episode {
  const meta = HAZARD_BY_ID[hazard]
  const spec = SPECS[hazard]()
  const T0 = meta.simStart
  const N = -T0 + HORIZON + 1
  const noise = rng(hash(hazard + '::episode'))

  const zones: EpisodeZone[] = zonesFor(hazard).map((zone) => {
    const zr = rng(hash(hazard + zone.id))
    const series: ZoneSeries = {
      risk: [], pCritical: [], indicator: [],
      tcrit: null, pFinal: 0,
      layers: Object.fromEntries(LAYER_CODES.map((l) => [l, []])) as unknown as Record<LayerCode, number[]>,
    }
    for (let i = 0; i < N; i++) {
      const t = T0 + i
      const s = spec.stateAt(zone, t)
      const jl = (zr() - 0.5) * 0.08
      series.risk.push(clamp(s.risk + (zr() - 0.5) * 0.09, 0, 3))
      series.indicator.push(Math.max(0, s.indicator * (1 + (zr() - 0.5) * 0.05)))
      for (const l of LAYER_CODES) series.layers[l].push(clamp((s.layers[l] ?? 0) + jl, 0, 3))
    }
    // forecast-window derived quantities
    const f0 = -T0
    const fw = series.risk.slice(f0)
    const peak = Math.max(...fw)
    let eta = fw.findIndex((v) => v >= peak - 0.35)
    if (eta < 0) eta = fw.length - 1
    const rr = zr()
    const pFinal = peak >= 2.75 ? 0.78 + 0.17 * rr : peak >= 2.3 ? 0.42 + 0.15 * rr : peak >= 1.6 ? 0.16 + 0.08 * rr : 0.03 + 0.03 * rr
    for (let i = 0; i < N; i++) {
      const t = T0 + i
      series.pCritical.push(t < 0 ? 0 : clamp(pFinal * logistic((t - (eta - 16)) / 8), 0, 0.99))
    }
    const cross = fw.findIndex((v) => v >= 2.7)
    series.tcrit = cross >= 0 ? { median: cross, p10: Math.max(0, cross - (7 + 16 * (1 - peak / 3))), p90: Math.min(72, cross + (7 + 16 * (1 - peak / 3))) } : null
    series.pFinal = pFinal
    return { ...zone, series }
  })

  // city-level
  const cityRisk: number[] = []
  for (let i = 0; i < N; i++) cityRisk.push(Math.max(...zones.map((z) => z.series.risk[i])))

  const tc = spec.tCritical
  const center = tc ? tc.median * 0.55 : 40
  const scale = tc ? Math.max(1.1, tc.median * 0.28) : 16
  const baseline: number[] = []
  for (let t = 0; t <= HORIZON; t++) baseline.push(clamp(spec.pCascade * logistic((t - center) / scale), 0.02, 0.985))

  const clampIdx = (arr: number[], i: number) => arr[Math.max(0, Math.min(arr.length - 1, i))]
  const indicator = {
    ...spec.cityIndicator,
    series: Array.from({ length: N }, (_, i) => clampIdx(spec.cityIndicator.series, i)),
    p10: Array.from({ length: N }, (_, i) => clampIdx(spec.cityIndicator.p10, i)),
    p90: Array.from({ length: N }, (_, i) => clampIdx(spec.cityIndicator.p90, i)),
  }

  const pipeline = PIPELINE_TEMPLATE.map((p, i) => ({ ...p, ms: Math.round((60 + noise() * 120) * [1, 1.4, 8.6, 1.1, 5.4, 1.9, 3.1][i]) }))

  return {
    hazard,
    episodeId: meta.episodeId,
    simStart: T0,
    horizon: HORIZON,
    zones,
    events: [...spec.events].sort((a, b) => a.t - b.t),
    chains: spec.chains,
    loops: spec.loops,
    interventions: buildInterventions(spec, baseline),
    narrative: spec.narrative,
    metrics: spec.metrics,
    sources: buildSources(hazard),
    pipeline,
    city: {
      risk: cityRisk,
      pCascade: baseline,
      baseline,
      indicator,
      rho: spec.rho,
      rhoNote: spec.rhoNote,
      tCritical: spec.tCritical,
      headline: spec.headline,
      exposedNote: spec.exposedNote,
      assetsAtRisk: spec.assetsAtRisk,
    },
    honesty: spec.honesty,
    fx: spec.fx,
  }
}

// ─── derived helpers used across the UI ──────────────────────────────────────

export function idxOf(ep: Episode, t: number): number {
  return clamp(Math.round(t) - ep.simStart, 0, -ep.simStart + ep.horizon)
}

export function zoneRiskAt(ep: Episode, zoneId: string, t: number): number {
  const z = ep.zones.find((x) => x.id === zoneId)
  return z ? z.series.risk[idxOf(ep, t)] : 0
}

export function countsByLevel(ep: Episode, t: number): { level: 0 | 1 | 2 | 3; n: number }[] {
  const counts = [0, 0, 0, 0]
  for (const z of ep.zones) {
    const v = z.series.risk[idxOf(ep, t)]
    counts[v >= 2.55 ? 3 : v >= 1.6 ? 2 : v >= 0.72 ? 1 : 0]++
  }
  return counts.map((n, i) => ({ level: i as 0 | 1 | 2 | 3, n }))
}

export function cityLevelAt(ep: Episode, t: number): 0 | 1 | 2 | 3 {
  const v = ep.city.risk[idxOf(ep, t)]
  return v >= 2.55 ? 3 : v >= 1.6 ? 2 : v >= 0.72 ? 1 : 0
}

/** top severity layers for a zone at time t (driver attribution) */
export function zoneDrivers(ep: Episode, zoneId: string, t: number, top = 3): { layer: LayerCode; v: number }[] {
  const z = ep.zones.find((x) => x.id === zoneId)
  if (!z) return []
  const i = idxOf(ep, t)
  return LAYER_CODES
    .map((layer) => ({ layer, v: z.series.layers[layer][i] }))
    .filter((x) => x.v > 0.15)
    .sort((a, b) => b.v - a.v)
    .slice(0, top)
}

export function combinedPlan(ep: Episode, deployed: string[]): { t: number[]; p: number[]; deltaP: number } | null {
  if (deployed.length === 0) return null
  const first = ep.interventions.find((iv) => deployed.includes(iv.id))
  if (!first) return null
  const ts = first.cf.t
  const p = ts.map((t, k) => {
    let keep = 1
    for (const iv of ep.interventions) {
      if (!deployed.includes(iv.id)) continue
      keep *= 1 - iv.deltaP * sramp(t, iv.deployLeadH * 0.4, iv.deployLeadH + 6)
    }
    return clamp(first.cf.baseline[k] * keep, 0.02, 1)
  })
  return { t: ts, p, deltaP: first.cf.baseline[first.cf.baseline.length - 1] - p[p.length - 1] }
}

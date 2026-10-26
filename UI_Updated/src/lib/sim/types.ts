// ─── 72H WARNING · core types ────────────────────────────────────────────────

export type HazardId = 'flood' | 'heat' | 'epidemic' | 'grid' | 'quake' | 'chem'

export type LayerCode = 'WX' | 'HYD' | 'TRF' | 'PWR' | 'EMS' | 'HOS' | 'HLT' | 'AIR' | 'SEI' | 'COM'

export type Tone = 'info' | 'warn' | 'alert' | 'crit'

/** 0 NORMAL · 1 WATCH · 2 HIGH · 3 CRITICAL */
export type RiskLevel = 0 | 1 | 2 | 3

export interface Zone {
  id: string
  name: string
  center: [number, number] // [lng, lat]
  hex: [number, number][]  // closed ring
  population: number
  elevation: number // m
  beds: number
  icu: number
  lowLying: number // 0..1 flood susceptibility
  substation: boolean
  plant?: boolean
}

export interface ZoneSeries {
  /** severity 0..3 per hour (float), index = t - SIM_START */
  risk: number[]
  /** P(zone critical ≤ t) — forecast window only */
  pCritical: number[]
  /** per-layer severity 0..3 */
  layers: Record<LayerCode, number[]>
  /** hazard primary indicator (unit per hazard) */
  indicator: number[]
  /** modelled time-to-critical (first crossing ≥ 2.7), forecast window */
  tcrit: { median: number; p10: number; p90: number } | null
  /** P(zone critical ≤ 72h) */
  pFinal: number
}

export interface ChainStage {
  layer: LayerCode
  label: string
  zone?: string
  etaMedian: number
  etaP10: number
  etaP90: number
  pGate: number
  realized?: boolean
  realizedAt?: number
}

export interface Chain {
  id: string
  name: string
  probability: number
  stages: ChainStage[]
}

export interface InterventionSpec {
  id: string
  name: string
  detail: string
  cost: string
  resources: string
  deployLeadH: number
  /** Δ P(critical ≤ 72h) if deployed */
  deltaP: number
  /** latest start hour for ≥80% of max effect */
  deadlineH: number
  sideEffects: string[]
  confidence: 'HIGH' | 'MED' | 'LOW'
}

export interface Intervention extends InterventionSpec {
  cf: { t: number[]; baseline: number[]; intervened: number[] }
}

export interface FeedEvent {
  t: number
  source: string
  sourceType: 'sensor' | 'feed' | 'citizen' | 'forecast' | 'official'
  layer: LayerCode
  message: string
  tone: Tone
  mark?: boolean // show on timeline
}

export interface NarrativeStep {
  t: number
  title: string
  detail: string
}

export interface EpisodeMetrics {
  ece: number
  coverage80: number
  brier: number
  leadTimeH: number
  edgeF1: number
}

export interface SourceStatus {
  id: string
  kind: string
  reliability: number
  status: 'ok' | 'degraded' | 'quarantined'
  note?: string
}

export type FxSpec =
  | { kind: 'flood'; rain: number[] }
  | { kind: 'heat'; intensity: number[] }
  | { kind: 'epidemic'; spread: number[][] } // per zone intensity
  | { kind: 'grid'; origin: string; trips: { t: number; zone: string }[] }
  | { kind: 'quake'; epicenter: [number, number]; mainMag: number; aftershocks: { t: number; mag: number }[] }
  | { kind: 'chem'; source: [number, number]; windBearing: number; releaseT: number }

export interface ScenarioSpec {
  /** synthetic digital-twin state at (zone, hour) */
  stateAt(zone: Zone, t: number): { layers: Partial<Record<LayerCode, number>>; risk: number; indicator: number }
  cityIndicator: { label: string; unit: string; fmt: 'int' | 'pct' | 'temp' | 'x'; series: number[]; p10: number[]; p90: number[] }
  events: FeedEvent[]
  chains: Chain[]
  loops: string[]
  interventions: InterventionSpec[]
  narrative: NarrativeStep[]
  metrics: EpisodeMetrics
  pCascade: number
  rho: number
  rhoNote: string
  tCritical: { label: string; median: number; p10: number; p90: number } | null
  headline: string
  exposedNote: string
  assetsAtRisk: string[]
  honesty: string
  fx: FxSpec
}

export interface EpisodeZone extends Zone {
  series: ZoneSeries
}

export interface Episode {
  hazard: HazardId
  episodeId: string
  simStart: number // first simulated hour (negative)
  horizon: number  // 72
  zones: EpisodeZone[]
  events: FeedEvent[]
  chains: Chain[]
  loops: string[]
  interventions: Intervention[]
  narrative: NarrativeStep[]
  metrics: EpisodeMetrics
  sources: SourceStatus[]
  pipeline: { id: string; name: string; detail: string; ms: number }[]
  city: {
    risk: number[]
    pCascade: number[]
    baseline: number[] // P(critical ≤ t) reference for counterfactuals
    indicator: ScenarioSpec['cityIndicator']
    rho: number
    rhoNote: string
    tCritical: ScenarioSpec['tCritical']
    headline: string
    exposedNote: string
    assetsAtRisk: string[]
  }
  honesty: string
  fx: FxSpec
}

export const LAYER_CODES: LayerCode[] = ['WX', 'HYD', 'TRF', 'PWR', 'EMS', 'HOS', 'HLT', 'AIR', 'SEI', 'COM']

export const LAYER_META: Record<LayerCode, { name: string; short: string }> = {
  WX: { name: 'Weather', short: 'WX' },
  HYD: { name: 'Drainage & Water', short: 'HYD' },
  TRF: { name: 'Traffic & Access', short: 'TRF' },
  PWR: { name: 'Power Grid', short: 'PWR' },
  EMS: { name: 'Emergency Response', short: 'EMS' },
  HOS: { name: 'Hospitals', short: 'HOS' },
  HLT: { name: 'Health Surveillance', short: 'HLT' },
  AIR: { name: 'Air & Gas', short: 'AIR' },
  SEI: { name: 'Seismic & Structures', short: 'SEI' },
  COM: { name: 'Comms & Citizens', short: 'COM' },
}

export const RISK_COLORS = ['#30D158', '#FFD60A', '#FF9F0A', '#FF453A']
export const RISK_LABELS = ['NORMAL', 'WATCH', 'HIGH RISK', 'CRITICAL']

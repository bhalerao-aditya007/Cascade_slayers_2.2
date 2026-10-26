// ─── GRID FAILURE · DELHI · synthetic episode script ──────────────────────────
import type { Chain, FeedEvent, InterventionSpec, NarrativeStep, ScenarioSpec } from '../types'
import { pw, clamp, sramp } from '../core'

// Fault at T−4 on the feeder tree out of Bawana 400/220 kV. Cascade trips, evening peak second wave.
const outPct = (t: number) =>
  pw([[-6, 0], [-4.2, 0], [-4, 1.2], [-3.5, 4.5], [-3, 8.2], [-2, 11], [-1, 15.5], [0, 18.4], [3, 20], [6, 26], [9, 34], [14, 30], [20, 26], [30, 18], [42, 11], [54, 7], [72, 4]], t)
const loadRatio = (t: number) => pw([[-6, 0.88], [-4, 0.97], [-3, 1.04], [-1, 1.02], [0, 0.99], [6, 1.05], [9, 1.12], [14, 1.06], [24, 1.0], [48, 0.95], [72, 0.92]], t)

/** feeder-tree dependency: the trans-Yamuna network is the fragile seam */
const DEP: Record<string, number> = {
  Z17: 1.0, Z16: 0.95, Z18: 0.9, Z08: 0.85, Z14: 0.8, Z07: 0.72, Z15: 0.68, Z19: 0.55,
  Z06: 0.6, Z13: 0.5, Z09: 0.45, Z02: 0.42, Z12: 0.4, Z10: 0.35, Z11: 0.3, Z01: 0.3,
  Z05: 0.28, Z03: 0.26, Z04: 0.24, Z20: 0.2,
}
const CRIT_ZONES = ['Z17', 'Z16', 'Z18']

const EVENTS: FeedEvent[] = [
  { t: -6, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'Evening peak approach · Bawana 400/220 kV load 0.88', tone: 'info' },
  { t: -5, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'BWN-404 breaker differential alarm · flagged for inspection', tone: 'warn' },
  { t: -4, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'BWN-404 breaker TRIP — fault on the Bawana feeder tree', tone: 'crit', mark: true },
  { t: -3.5, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'Load transfer → BWN-411 at 1.31 rating · 8 s to trip', tone: 'crit', mark: true },
  { t: -3, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'Cascade trips: BWN-411, BWN-415 · 8.2% of Delhi out', tone: 'crit' },
  { t: -2.5, source: 'traffic_api', sourceType: 'feed', layer: 'TRF', message: 'Signal outages · 41 junctions dark in the trans-Yamuna grid', tone: 'alert' },
  { t: -2, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'Rolling protection events · 11% customers out', tone: 'alert', mark: true },
  { t: -1.5, source: 'hospital_his', sourceType: 'feed', layer: 'HOS', message: 'AIIMS trauma block on generators · 9h fuel', tone: 'alert' },
  { t: -1, source: 'citizen_app', sourceType: 'citizen', layer: 'COM', message: 'Outage reports 5,800/10min — corroborated by AMI', tone: 'alert' },
  { t: -0.5, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'Evening peak building on the weakened ring · reserve thin', tone: 'warn' },
  { t: -0.2, source: 'command_ops', sourceType: 'official', layer: 'PWR', message: 'Cascade classified supercritical — ρ = 1.12', tone: 'crit', mark: true },
]

const CHAINS: Chain[] = [
  {
    id: 'grid-trf', name: 'Outage → dark signals → collisions', probability: 0.72,
    stages: [
      { layer: 'PWR', label: 'Fault + cascade trips', etaMedian: -4, etaP10: -4, etaP90: -3, pGate: 1, realized: true, realizedAt: -4 },
      { layer: 'TRF', label: '41 junctions dark · speeds −34%', etaMedian: -2, etaP10: -3, etaP90: 0, pGate: 0.86, realized: true, realizedAt: -2.5 },
      { layer: 'TRF', label: 'Collision cluster risk · Ring Rd + NH-9', etaMedian: 5, etaP10: 2, etaP90: 9, pGate: 0.72 },
    ],
  },
  {
    id: 'grid-com', name: 'Outage → cellular battery drain', probability: 0.58,
    stages: [
      { layer: 'PWR', label: '18.4% customers out', etaMedian: 0, etaP10: -1, etaP90: 1, pGate: 1, realized: true, realizedAt: 0 },
      { layer: 'COM', label: 'Cell sites on battery · 29%', etaMedian: 4, etaP10: 3, etaP90: 7, pGate: 0.74 },
      { layer: 'COM', label: 'Site shutdowns · 12%', etaMedian: 7, etaP10: 5, etaP90: 10, pGate: 0.58 },
    ],
  },
  {
    id: 'grid-hos', name: 'Outage → hospital generators', probability: 0.31,
    stages: [
      { layer: 'PWR', label: 'Sustained outage · hospital feeders', etaMedian: 4, etaP10: 2, etaP90: 8, pGate: 0.48 },
      { layer: 'HOS', label: 'AIIMS generators exhaust fuel', etaMedian: 9, etaP10: 7, etaP90: 12, pGate: 0.36, zone: 'Z11' },
      { layer: 'HOS', label: 'Emergency evac + transfer load', etaMedian: 13, etaP10: 10, etaP90: 18, pGate: 0.31 },
    ],
  },
  {
    id: 'grid-hyd', name: 'Outage → pumping halted → drainage', probability: 0.22,
    stages: [
      { layer: 'PWR', label: 'Pump station power loss · 3 stations', etaMedian: 6, etaP10: 4, etaP90: 10, pGate: 0.33 },
      { layer: 'HYD', label: 'Local ponding · Z16, Z18', etaMedian: 12, etaP10: 8, etaP90: 18, pGate: 0.22 },
    ],
  },
]

const INTERVENTIONS: InterventionSpec[] = [
  { id: 'shed', name: 'Emergency shed · 400 MW', detail: 'Immediate 3-block rotation to arrest the second cascade wave.', cost: '₹14 Cr (est. losses)', resources: 'DTTL / TPDDL control room', deployLeadH: 0.5, deltaP: 0.19, deadlineH: 2, sideEffects: ['38k customers shed deliberately', 'Industrial refrigeration losses'], confidence: 'HIGH' },
  { id: 'crews', name: 'Mutual-aid crews ×6', detail: 'Neighbouring DISCOMs; cuts mean-time-to-restore by 38%.', cost: '₹2.8 Cr', resources: '6 crews · 24 linemen', deployLeadH: 4, deltaP: 0.14, deadlineH: 5, sideEffects: ['Neighbour state reserve −6%'], confidence: 'HIGH' },
  { id: 'hospfeed', name: 'Priority restoration · hospital feeders', detail: 'Re-energise Z11/Z03 feeders ahead of residential blocks.', cost: '₹0.4 Cr', resources: '2 crews', deployLeadH: 2, deltaP: 0.11, deadlineH: 3, sideEffects: ['~14k households wait longer'], confidence: 'HIGH' },
  { id: 'mobile', name: 'Mobile substations ×2', detail: 'Bypass the faulted Bawana bay entirely.', cost: '₹9 Cr', resources: '2 mobile units', deployLeadH: 12, deltaP: 0.08, deadlineH: 12, sideEffects: ['Convoy escort required'], confidence: 'MED' },
  { id: 'fuel', name: 'Fuel run · hospital generators', detail: 'Top up AIIMS + Safdarjung tanks before battery horizon.', cost: '₹0.5 Cr', resources: '2 tankers · escort', deployLeadH: 3, deltaP: 0.06, deadlineH: 6, sideEffects: [], confidence: 'HIGH' },
]

const NARRATIVE: NarrativeStep[] = [
  { t: 6, title: 'Evening peak on a weakened ring', detail: 'Demand returns while two bays are still faulted — the system is running without margin, like July 2012.' },
  { t: 9, title: 'Second cascade wave', detail: 'Without shedding, transfers push BWN-421 and BWN-423 past ratings. Outages triple to 34% of Delhi.' },
  { t: 9, title: 'Hospital fuel horizon', detail: 'AIIMS generators exhaust fuel at T+09h — before utility restoration reaches the trauma block.' },
  { t: 18, title: 'Recovery grind', detail: 'Crews restore by feeder priority; each bay repair unlocks ~60k customers.' },
  { t: 30, title: '60% restored', detail: 'With mutual aid, six in ten customers are back — the tail is the hospital and drain-pump tail.' },
]

export function gridSpec(): ScenarioSpec {
  const ind: number[] = [], p10: number[] = [], p90: number[] = []
  for (let t = -6; t <= 72; t++) {
    const v = outPct(t)
    ind.push(v)
    p10.push(v - 1.4 - 2.2 * sramp(t, 0, 9))
    p90.push(v + 1.6 + 3.1 * sramp(t, 0, 9))
  }
  return {
    stateAt(zone, t) {
      const dep = DEP[zone.id] ?? 0.2
      const out = outPct(t) * dep
      const pwr = pw([[0, 0], [5, 0.8], [12, 1.5], [22, 2.2], [34, 2.8], [48, 3.1]] as [number, number][], out)
        + (CRIT_ZONES.includes(zone.id) && t >= -3 ? 0.75 : 0)
      const trf = clamp(0.85 * pw([[0, 0], [5, 0.5], [15, 1.3], [28, 2.1], [40, 2.9]] as [number, number][], out), 0, 3)
      const com = clamp(pw([[0, 0], [4, 0.4], [10, 1.1], [18, 1.9], [28, 2.6], [38, 3]] as [number, number][], out * 1.05), 0, 3)
      const hos = zone.beds > 400 ? clamp(pw([[0, 0], [4, 0.3], [8, 1.0], [12, 1.8], [16, 2.5], [20, 3]] as [number, number][], out * 1.1), 0, 3) : 0
      const hyd = clamp(0.4 * pw([[0, 0], [6, 0], [12, 0.6], [20, 1.2], [30, 1.8]] as [number, number][], out), 0, 3)
      const layers = { PWR: clamp(pwr, 0, 3), TRF: trf, COM: com, HOS: hos, HYD: hyd }
      const risk = Math.max(...Object.values(layers))
      return { layers, risk: clamp(risk, 0, 3), indicator: out }
    },
    cityIndicator: { label: 'Customers out', unit: '%', fmt: 'pct', series: ind, p10, p90 },
    events: EVENTS,
    chains: CHAINS,
    loops: ['PWR → COM → PWR (delayed) · gain 0.9 — crew coordination degrades as comms drain', 'PWR → HYD → TRF · gain 0.5 — pump outages pond the roads crews need'],
    interventions: INTERVENTIONS,
    narrative: NARRATIVE,
    metrics: { ece: 0.038, coverage80: 0.79, brier: 0.161, leadTimeH: 6, edgeF1: 0.76 },
    pCascade: 0.68,
    rho: 1.12,
    rhoNote: 'Supercritical. Each trip transfers load that trips the next feeder — without deliberate shedding the cascade self-sustains through the evening peak.',
    tCritical: { label: 'Second cascade wave · ≥30% out', median: 9, p10: 6, p90: 14 },
    headline: 'Cascade is supercritical (ρ = 1.12) — without action a second wave triples the outage by T+09h.',
    exposedNote: '1.9M customers out now · 3.6M in second-wave path',
    assetsAtRisk: ['Bawana 400/220 kV (Z19)', 'AIIMS trauma block (Z11)', '41 signalised junctions'],
    honesty: 'A hard fault has no lead time. The clock starts at the first trip — the system forecasts the cascade that fault starts.',
    fx: {
      kind: 'grid', origin: 'Z19',
      trips: [
        { t: -4, zone: 'Z19' }, { t: -3.5, zone: 'Z17' }, { t: -3, zone: 'Z16' }, { t: -2.5, zone: 'Z18' },
        { t: -2, zone: 'Z08' }, { t: -1, zone: 'Z14' }, { t: -0.5, zone: 'Z07' },
        { t: 6, zone: 'Z13' }, { t: 8, zone: 'Z15' }, { t: 9, zone: 'Z10' },
      ],
    },
  }
}

// ─── CHEMICAL LEAK · BHOPAL · synthetic episode script ─────────────────────────
import type { Chain, FeedEvent, InterventionSpec, NarrativeStep, ScenarioSpec } from '../types'
import { pw, bump, clamp } from '../core'

// Chlorine release at a Govindpura chemical unit (Z15) at T+0. Winter morning, NE drift at 12 km/h,
// stability class F — the still, inverted conditions Bhopal drills for. Plume crosses the walled city.
const SOURCE: [number, number] = [77.456, 23.274]
const WIND_BEARING = 225 // drifting toward SW
/** downwind distance class per zone (0 = far upwind … 1 = in corridor), ordered NE→SW */
const CORRIDOR: Record<string, number> = {
  Z15: 1.0, Z09: 0.92, Z20: 0.88, Z10: 0.8, Z03: 0.72, Z16: 0.68, Z12: 0.62, Z01: 0.58,
  Z17: 0.5, Z02: 0.42, Z18: 0.38, Z13: 0.35, Z04: 0.3, Z14: 0.3, Z07: 0.25, Z05: 0.2,
  Z19: 0.2, Z06: 0.18, Z11: 0.15, Z08: 0.12,
}
const conc = (t: number) => (t <= 0 ? 0 : pw([[0, 0], [0.5, 38], [1, 74], [2, 96], [3, 82], [5, 60], [8, 34], [12, 16], [18, 7], [28, 2.4], [40, 1.1], [72, 0.4]], t))

const EVENTS: FeedEvent[] = [
  { t: -8, source: 'plant_scada', sourceType: 'sensor', layer: 'AIR', message: 'Transfer operation begins · chlorine rail car → storage (Govindpura)', tone: 'info' },
  { t: -5, source: 'plant_scada', sourceType: 'sensor', layer: 'AIR', message: 'Scrubber inlet temp +2.1 °C above band', tone: 'info' },
  { t: -3, source: 'plant_scada', sourceType: 'sensor', layer: 'AIR', message: 'Scrubber inlet temp +4 °C · maintenance ticket auto-filed', tone: 'warn' },
  { t: -1.5, source: 'plant_scada', sourceType: 'sensor', layer: 'AIR', message: 'Pressure drift on rail-car manifold · within tolerance', tone: 'warn' },
  { t: -0.5, source: 'met_station', sourceType: 'sensor', layer: 'WX', message: 'Wind NE 12 km/h · stability class F — winter inversion', tone: 'info' },
  { t: 0, source: 'aq_station_g6', sourceType: 'sensor', layer: 'AIR', message: 'Cl₂ spike 74 ppb — LEAK DETECTED at Govindpura unit', tone: 'crit', mark: true },
  { t: 0.1, source: 'citizen_app', sourceType: 'citizen', layer: 'COM', message: '"Sharp smell" reported 400 m SW · corroborates sensor (+trust)', tone: 'alert' },
  { t: 0.4, source: 'met_station', sourceType: 'sensor', layer: 'WX', message: 'Puff model running · plume axis SW toward the walled city', tone: 'alert', mark: true },
  { t: 1, source: 'command_ops', sourceType: 'official', layer: 'AIR', message: 'AEGL-2 corridor declared: Z15→Z09→Z20→Z03', tone: 'crit', mark: true },
  { t: 1.5, source: 'traffic_api', sourceType: 'feed', layer: 'TRF', message: 'VIP Road closed both carriageways · queues 4 km', tone: 'alert' },
  { t: 2, source: 'er_108_dispatch', sourceType: 'feed', layer: 'EMS', message: 'Breach-of-shelter calls surging · 6/min', tone: 'alert' },
]

const CHAINS: Chain[] = [
  {
    id: 'chem-trf', name: 'Plume → road closure → gridlock', probability: 0.63,
    stages: [
      { layer: 'AIR', label: 'Release detected · 2.4 t Cl₂', etaMedian: 0, etaP10: 0, etaP90: 0.5, pGate: 1, realized: true, realizedAt: 0 },
      { layer: 'TRF', label: 'VIP Rd + bypass closed', etaMedian: 1, etaP10: 0.5, etaP90: 2, pGate: 0.81 },
      { layer: 'TRF', label: 'Corridor congestion +35%', etaMedian: 2.5, etaP10: 1.5, etaP90: 5, pGate: 0.63 },
    ],
  },
  {
    id: 'chem-ems', name: 'Plume → exposure calls → EMS saturation', probability: 0.48,
    stages: [
      { layer: 'AIR', label: 'AEGL-2 corridor · 580k downwind', etaMedian: 1.5, etaP10: 1, etaP90: 3, pGate: 0.72 },
      { layer: 'EMS', label: 'Call surge 900–1,400 · response 24 min', etaMedian: 4, etaP10: 2.5, etaP90: 7, pGate: 0.58 },
      { layer: 'EMS', label: 'Unit shortfall · 28%', etaMedian: 7, etaP10: 5, etaP90: 11, pGate: 0.48 },
    ],
  },
  {
    id: 'chem-hos', name: 'Plume → casualty surge → decon bottleneck', probability: 0.29,
    stages: [
      { layer: 'HOS', label: 'Gas-exposure ED arrivals 310–520', etaMedian: 3, etaP10: 2, etaP90: 6, pGate: 0.42 },
      { layer: 'HOS', label: 'Decon throughput caps intake (Hamidia)', etaMedian: 5, etaP10: 3, etaP90: 9, pGate: 0.29 },
    ],
  },
]

const INTERVENTIONS: InterventionSpec[] = [
  { id: 'sip', name: 'Shelter-in-place · 3 outer zones', detail: 'Z04, Z13, Z07: seal buildings, close HVAC. Beats evacuation where the corridor has not arrived.', cost: '₹0.3 Cr', resources: 'Alert broadcast · 900 volunteers', deployLeadH: 0.5, deltaP: 0.21, deadlineH: 1.5, sideEffects: [], confidence: 'HIGH' },
  { id: 'evac', name: 'Evacuate AEGL-2 corridor', detail: '24k residents out of Z15/Z09/Z20 before the plume peaks. Window is tight.', cost: '₹4.9 Cr', resources: '48 buses · 4 shelters', deployLeadH: 2, deltaP: 0.17, deadlineH: 2.5, sideEffects: ['TRF load +40% for 90 min', 'Shelter density 3×'], confidence: 'MED' },
  { id: 'curtain', name: 'Water curtain knock-down', detail: 'Aerial suppression at the source — cuts emission rate ~55%.', cost: '₹1.1 Cr', resources: '2 fire crews · hazmat', deployLeadH: 1.5, deltaP: 0.11, deadlineH: 2, sideEffects: ['Crew exposure risk', 'Runoff containment needed'], confidence: 'MED' },
  { id: 'decon', name: 'Decon surge · Z01/Z14 hospitals', detail: 'Additional decon lines + PPE stock at Hamidia and AIIMS; keeps ED intake flowing.', cost: '₹0.9 Cr', resources: '6 decon bays', deployLeadH: 3, deltaP: 0.08, deadlineH: 4, sideEffects: [], confidence: 'HIGH' },
  { id: 'masks', name: 'Distribute 40k escape masks', detail: 'Corridor door-drop of P3 escape masks via volunteers.', cost: '₹1.4 Cr', resources: '40k masks · 300 volunteers', deployLeadH: 4, deltaP: 0.06, deadlineH: 5, sideEffects: [], confidence: 'MED' },
]

const NARRATIVE: NarrativeStep[] = [
  { t: 1, title: 'Plume crosses the walled city', detail: '2.4 t chlorine, stability class F, NE drift 12 km/h. The AEGL-2 axis runs Govindpura → Karond → the old city — the corridor Bhopal has drilled for since 1984.' },
  { t: 2.5, title: 'Transport gridlock', detail: 'Closures push the corridor to +35% congestion — evacuation gets harder every hour from here.' },
  { t: 4, title: 'EMS saturation risk', detail: 'Breach-of-shelter calls peak at 6/min; response times stretch to 24 min in the narrow lanes of the old city.' },
  { t: 8, title: 'Corridor exits', detail: 'Concentration decays below AEGL-1 for most of the corridor; shelter zones begin clearing.' },
  { t: 18, title: 'Aftermath', detail: 'Decon and medical follow-up dominate. Environmental monitoring continues for 72h.' },
]

export function chemSpec(): ScenarioSpec {
  const ind: number[] = [], p10: number[] = [], p90: number[] = []
  for (let t = -8; t <= 72; t++) {
    const v = conc(t)
    ind.push(v)
    p10.push(v * 0.74)
    p90.push(v * 1.32)
  }
  return {
    stateAt(zone, t) {
      const cor = CORRIDOR[zone.id] ?? 0.2
      const c = conc(t) * cor
      const air = pw([[0, 0], [3, 0.5], [12, 1.2], [30, 2.1], [60, 2.8], [95, 3.1], [150, 3.2]] as [number, number][], c)
      const trf = clamp(pw([[0, 0], [0.5, 0.6], [1.5, 1.6], [3, 2.3], [6, 2.6], [14, 2.0], [30, 1.2], [48, 0.7]] as [number, number][], Math.max(0, t)) * (0.4 + 0.6 * cor) + (['Z15', 'Z09', 'Z20'].includes(zone.id) ? 0.5 * bump(t, 2, 2) : 0), 0, 3)
      const ems = clamp(0.8 * pw([[0, 0], [2, 0.8], [4, 1.9], [8, 2.6], [16, 2.0], [30, 1.1]] as [number, number][], Math.max(0, t)) * cor, 0, 3)
      const hos = zone.beds > 400 ? clamp(0.85 * pw([[0, 0], [2, 0.7], [5, 1.8], [10, 2.3], [24, 1.6], [48, 1.0]] as [number, number][], Math.max(0, t)) * (0.5 + 0.5 * cor), 0, 3) : 0
      const com = clamp(0.6 * air + 0.15, 0, 3)
      const layers = { AIR: air, TRF: trf, EMS: ems, HOS: hos, COM: com, WX: t < 0.5 ? 0.15 : 0.05 }
      const risk = Math.max(...Object.values(layers))
      return { layers, risk: clamp(risk, 0, 3), indicator: c }
    },
    cityIndicator: { label: 'Corridor Cl₂ concentration', unit: 'ppb', fmt: 'int', series: ind, p10, p90 },
    events: EVENTS,
    chains: CHAINS,
    loops: ['AIR → TRF → EMS · gain 1.3 — closures slow the very response the plume demands'],
    interventions: INTERVENTIONS,
    narrative: NARRATIVE,
    metrics: { ece: 0.044, coverage80: 0.77, brier: 0.184, leadTimeH: 0, edgeF1: 0.73 },
    pCascade: 0.63,
    rho: 0.82,
    rhoNote: 'Subcritical — the plume decays physically, but the transport-response loop keeps ρ near 0.8 for the first 6h.',
    tCritical: { label: 'EMS response > 24 min in corridor', median: 4, p10: 2.5, p90: 7 },
    headline: 'AEGL-2 corridor reaches 580k residents downwind inside 4h; shelter-in-place beats evacuation for outer zones.',
    exposedNote: '580k residents downwind · 24k inside AEGL-2',
    assetsAtRisk: ['Chlor-alkali unit (Z15)', 'VIP Road corridor', 'Hamidia + AIIMS EDs'],
    honesty: 'No precursors for an accidental release. The clock starts at the first sensor report; we forecast the plume footprint and the downstream cascade.',
    fx: { kind: 'chem', source: SOURCE, windBearing: WIND_BEARING, releaseT: 0 },
  }
}

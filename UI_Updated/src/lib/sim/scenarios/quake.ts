// ─── EARTHQUAKE · TOKYO · synthetic episode script ────────────────────────────
import type { Chain, FeedEvent, InterventionSpec, NarrativeStep, ScenarioSpec } from '../types'
import { pw, bump, clamp, omori, sramp } from '../core'

// M7.3 beneath northern Tokyo Bay at T+0 (detection) — the Tokyo Metropolitan Government's
// own planning scenario. MMI by zone: soft alluvial east amplifies, Musashino plateau west attenuates.
const EPICENTER: [number, number] = [139.845, 35.655] // northern Tokyo Bay, depth 25 km
const MMI: Record<string, number> = {
  Z09: 8.1, Z10: 7.8, // Kōtō delta + Sumida — soft alluvium, MMI VIII
  Z02: 7.2, Z11: 7.4, Z12: 7.0, Z13: 6.9, Z14: 6.8, // eastern lowlands VII
  Z01: 6.4, Z03: 6.2, Z07: 6.1, Z08: 5.9, // central / bayfront VI
  Z04: 5.6, Z05: 5.5, Z18: 5.2, Z20: 5.4, // central-west V+
  Z06: 5.0, Z15: 4.9, Z16: 4.7, Z17: 4.6, Z19: 4.8, // Musashino terrace IV–V
}
const LIQ: Record<string, number> = { Z09: 1.0, Z10: 0.95, Z13: 0.8, Z14: 0.7, Z12: 0.55, Z02: 0.4 } // Kōtō-delta liquefaction
const aftRate = (t: number) => (t <= 0 ? 0 : 14 * omori(t, 0, 1.05))

const EVENTS: FeedEvent[] = [
  { t: -6, source: 'usgs_feed', sourceType: 'feed', layer: 'SEI', message: 'JMA: regional seismicity nominal · M<2 swarm near Tachikawa', tone: 'info' },
  { t: -3, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'TEPCO grid nominal · evening ramp normal', tone: 'info' },
  { t: -0.4, source: 'usgs_feed', sourceType: 'feed', layer: 'SEI', message: 'M4.6 — retrospectively classified as foreshock', tone: 'info' },
  { t: 0, source: 'usgs_feed', sourceType: 'feed', layer: 'SEI', message: 'M7.3 MAINSHOCK · northern Tokyo Bay · depth 25 km — EEW 6.2s lead', tone: 'crit', mark: true },
  { t: 0.1, source: 'seismic_net', sourceType: 'sensor', layer: 'SEI', message: 'ShakeMap v1: MMI VIII Kōtō/Sumida · liquefaction signature in delta', tone: 'crit', mark: true },
  { t: 0.3, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'TEPCO auto-trips: 6 bayfront feeders · 21% customers out', tone: 'crit' },
  { t: 0.5, source: 'traffic_api', sourceType: 'feed', layer: 'TRF', message: 'Shutō Expressway C2 + 3 arterial bridges closed pending inspection', tone: 'alert' },
  { t: 1, source: 'citizen_app', sourceType: 'citizen', layer: 'COM', message: 'Report burst 14,000/10min · collapse + trapped-lift reports', tone: 'alert' },
  { t: 1.5, source: 'gas_scada', sourceType: 'sensor', layer: 'AIR', message: 'Pressure anomaly · Sumida mid-pressure line', tone: 'alert', mark: true },
  { t: 2, source: 'hospital_his', sourceType: 'feed', layer: 'HOS', message: 'Mass-casualty declared · ED arrivals 380 in first 2h', tone: 'crit', mark: true },
]

const CHAINS: Chain[] = [
  {
    id: 'quake-pwr', name: 'Shaking → feeder trips → outages', probability: 0.66,
    stages: [
      { layer: 'SEI', label: 'M7.3 mainshock · MMI VIII Kōtō delta', etaMedian: 0, etaP10: 0, etaP90: 0, pGate: 1, realized: true, realizedAt: 0 },
      { layer: 'PWR', label: 'Auto-trips · 21% out', etaMedian: 0.3, etaP10: 0.2, etaP90: 0.5, pGate: 0.9, realized: true, realizedAt: 0.3 },
      { layer: 'PWR', label: 'Restoration slow · inspection-first', etaMedian: 26, etaP10: 18, etaP90: 40, pGate: 0.66 },
    ],
  },
  {
    id: 'quake-trf', name: 'Shaking → bridge closures → access', probability: 0.61,
    stages: [
      { layer: 'SEI', label: 'Mainshock', etaMedian: 0, etaP10: 0, etaP90: 0, pGate: 1, realized: true, realizedAt: 0 },
      { layer: 'TRF', label: 'Shutō C2 + 4 bridges closed', etaMedian: 4, etaP10: 2, etaP90: 8, pGate: 0.78 },
      { layer: 'TRF', label: 'Detour saturation · −28% throughput', etaMedian: 9, etaP10: 5, etaP90: 16, pGate: 0.61 },
    ],
  },
  {
    id: 'quake-hos', name: 'Casualties → hospital surge', probability: 0.52,
    stages: [
      { layer: 'SEI', label: 'Damage index · 610 red-tag structures', etaMedian: 1, etaP10: 0.5, etaP90: 3, pGate: 0.8, realized: true, realizedAt: 1.2 },
      { layer: 'HOS', label: 'ED surge · 380–640 arrivals', etaMedian: 2, etaP10: 1, etaP90: 4, pGate: 0.68 },
      { layer: 'HOS', label: 'Bokutoh occupancy 112% · corridor care', etaMedian: 8, etaP10: 5, etaP90: 14, pGate: 0.52 },
    ],
  },
  {
    id: 'quake-gas', name: 'Shaking → gas rupture → fire', probability: 0.24,
    stages: [
      { layer: 'SEI', label: 'Mainshock', etaMedian: 0, etaP10: 0, etaP90: 0, pGate: 1, realized: true, realizedAt: 0 },
      { layer: 'AIR', label: 'Sumida line rupture · gas release', etaMedian: 2, etaP10: 1, etaP90: 4, pGate: 0.34, zone: 'Z10' },
      { layer: 'AIR', label: 'Fire spread risk · dense wooden ward (Taitō)', etaMedian: 5, etaP10: 3, etaP90: 9, pGate: 0.24 },
    ],
  },
]

const INTERVENTIONS: InterventionSpec[] = [
  { id: 'usar', name: 'USAR teams ×4 → Kōtō / Sumida', detail: 'Urban search & rescue to the MMI VIII corridor. 4 structural collapse sites.', cost: '¥580M', resources: '4 teams · 62 personnel', deployLeadH: 3, deltaP: 0.12, deadlineH: 4, sideEffects: ['Blocks 2 arterial lanes'], confidence: 'HIGH' },
  { id: 'gas', name: 'Isolation valves · Sumida gas grid', detail: 'Cuts feed to the ruptured main before fire spread compounds casualties.', cost: '¥48M', resources: '2 crews', deployLeadH: 1, deltaP: 0.09, deadlineH: 2, sideEffects: ['40k households lose gas'], confidence: 'HIGH' },
  { id: 'bridges', name: 'Close + inspect 3 corridors', detail: 'Shutō C2, Kiyosu-bashi, Eitai-bashi — inspection before load.', cost: '¥72M', resources: '6 inspectors · closures', deployLeadH: 2, deltaP: 0.08, deadlineH: 3, sideEffects: ['Detours +18 min'], confidence: 'MED' },
  { id: 'fieldhosp', name: 'Field hospital · 60 beds (Yoyogi)', detail: 'DMAT base camp; decompresses Bokutoh and Nippon Medical ED.', cost: '¥340M', resources: '60 beds · 2 ORs', deployLeadH: 16, deltaP: 0.07, deadlineH: 16, sideEffects: [], confidence: 'MED' },
  { id: 'stage', name: 'Stage ambulances · west bank', detail: '12 units staged clear of the closed corridors.', cost: '¥84M', resources: '12 units', deployLeadH: 2, deltaP: 0.05, deadlineH: 4, sideEffects: [], confidence: 'HIGH' },
]

const NARRATIVE: NarrativeStep[] = [
  { t: 0, title: 'Mainshock — clock starts', detail: 'M7.3 beneath northern Tokyo Bay, 25 km deep — the TMG planning scenario, arriving. EEW delivered 6.2s of warning; the 72h window starts here.' },
  { t: 2, title: 'Casualty surge begins', detail: '380 ED arrivals in the first 2 hours; 610 red-tag structures across the Kōtō delta and Sumida.' },
  { t: 8, title: 'Hospital saturation', detail: 'Tokyo Metropolitan Bokutoh reaches 112% occupancy — corridor care and diversion begin.' },
  { t: 20, title: 'Aftershock regime', detail: 'ETAS: M≥5 aftershock probability 34% inside 72h; each event re-trips inspection clocks on the bridges.' },
  { t: 48, title: 'Recovery tail', detail: 'TEPCO restores 78%; the constraint is now shelter capacity and school inspections in Adachi.' },
]

export function quakeSpec(): ScenarioSpec {
  const ind: number[] = [], p10: number[] = [], p90: number[] = []
  for (let t = -6; t <= 72; t++) {
    const v = aftRate(t)
    ind.push(v)
    p10.push(v * 0.72)
    p90.push(v * 1.38)
  }
  return {
    stateAt(zone, t) {
      const mmi = MMI[zone.id] ?? 5
      const main = t >= 0 ? 1 : 0
      const shakeNow = main * (0.55 + 0.45 * Math.min(mmi / 7, 1)) + (t > 0 ? 0.22 * Math.min(aftRate(t) / 10, 1) * (mmi / 7) : 0)
      const sei = pw([[-0.01, 0], [0, 2.6], [0.5, 2.35], [1.5, 2.6], [3, 2.2], [8, 1.8], [24, 1.3], [72, 0.8]] as [number, number][], t < 0 ? -0.01 : t) * (0.55 + 0.45 * (mmi / 7))
      const liq = (LIQ[zone.id] ?? 0) * 1.5 * bump(t, 1, 3) * main
      const pwr = clamp(pw([[0, 0], [0.2, 0.8], [1, 2.0], [4, 1.7], [12, 1.4], [30, 1.0], [72, 0.6]] as [number, number][], Math.max(0, t)) * (mmi >= 5.8 ? 1.25 : 0.7), 0, 3)
      const trf = clamp(pw([[0, 0], [0.5, 0.6], [2, 1.4], [6, 2.2], [12, 2.4], [36, 1.8], [72, 1.2]] as [number, number][], Math.max(0, t)) * (0.6 + 0.4 * mmi / 7), 0, 3)
      const hos = zone.beds > 400 ? clamp(pw([[0, 0], [1, 0.8], [2, 1.8], [8, 2.9], [24, 2.5], [72, 1.6]] as [number, number][], Math.max(0, t)) * (0.7 + 0.3 * mmi / 7), 0, 3) : clamp(0.4 * pw([[0, 0], [8, 1.8], [24, 1.5], [72, 1.0]] as [number, number][], Math.max(0, t)), 0, 3)
      const air = clamp(0.24 * 2.6 * bump(t, 4.5, 2.5) * (zone.id === 'Z10' ? 1 : 0.15), 0, 3)
      const ems = clamp(0.6 * hos + 0.2 * trf, 0, 3)
      const com = clamp(0.5 * pwr + 0.2, 0, 3) * main
      const layers = { SEI: clamp(sei + liq, 0, 3), PWR: pwr, TRF: trf, HOS: hos, AIR: air, EMS: ems, COM: com }
      const risk = Math.max(...Object.values(layers))
      return { layers, risk: clamp(risk, 0, 3), indicator: mmi * (main ? 1 : 0) + (t > 0 ? 0.2 * aftRate(t) / 14 : 0) }
    },
    cityIndicator: { label: 'Aftershock rate', unit: '/day', fmt: 'int', series: ind, p10, p90 },
    events: EVENTS,
    chains: CHAINS,
    loops: ['SEI → HOS → EMS → HOS · gain 1.2 — casualty surge and corridor care compete for the same staff'],
    interventions: INTERVENTIONS,
    narrative: NARRATIVE,
    metrics: { ece: 0.041, coverage80: 0.78, brier: 0.172, leadTimeH: 0, edgeF1: 0.71 },
    pCascade: 0.71,
    rho: 0.93,
    rhoNote: 'Near-critical. The seismic cascade decays with Omori time, but the hospital leg keeps effective ρ close to 1 for the first 24h.',
    tCritical: { label: 'Hospital occupancy ≥ 112% (Bokutoh, Z14)', median: 8, p10: 5, p90: 14 },
    headline: 'Aftershock hazard stays elevated for 72h; casualty surge and a gas-triggered fire are the binding risks.',
    exposedNote: '3.4M residents in MMI ≥ VI wards',
    assetsAtRisk: ['Metro Bokutoh Hospital (Z14)', 'Kiyosu-bashi bridge (Z10)', 'Sumida gas main (Z10)', 'Haneda feeder (Z08)'],
    honesty: 'We claim no earthquake precursors. The clock starts at mainshock detection; the 72h window covers aftershock hazard (ETAS) and the secondary cascade.',
    fx: {
      kind: 'quake', epicenter: EPICENTER, mainMag: 7.3,
      aftershocks: [
        { t: 2.2, mag: 5.1 }, { t: 5.1, mag: 4.6 }, { t: 9.4, mag: 5.3 }, { t: 14, mag: 4.4 },
        { t: 19, mag: 4.8 }, { t: 27, mag: 5.4 }, { t: 38, mag: 4.7 }, { t: 52, mag: 5.0 }, { t: 66, mag: 4.3 },
      ],
    },
  }
}

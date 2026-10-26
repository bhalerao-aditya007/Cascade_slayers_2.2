// ─── FLOOD · DHAKA · synthetic episode script ─────────────────────────────────
import type { Chain, FeedEvent, InterventionSpec, NarrativeStep, ScenarioSpec } from '../types'
import { pw, sramp, bump, clamp } from '../core'

// rain mm/h, T−36 → T+72. Two bands: historical peak 62, forecast second band 36.
const RAIN_POINTS: [number, number][] = [
  [-36, 3], [-31, 4], [-30, 12], [-28, 22], [-26, 30], [-24, 42], [-22, 55], [-20, 62],
  [-18, 58], [-16, 47], [-14, 36], [-12, 28], [-10, 18], [-8, 12], [-6, 8], [-4, 6],
  [-2, 5], [0, 4], [4, 3], [8, 2], [10, 6], [12, 14], [14, 24], [16, 32], [18, 36],
  [20, 30], [22, 22], [24, 14], [26, 9], [30, 6], [36, 4], [48, 2], [72, 1],
]
const rain = (t: number) => pw(RAIN_POINTS, t)

/** effective basin water: rain integral with 0.97/h recession */
function effAt(t: number): number {
  let e = 0
  for (let τ = -36; τ <= t; τ++) e = e * 0.97 + rain(τ)
  return e
}
const EFF: number[] = []
for (let t = -36; t <= 72; t++) EFF.push(effAt(t))
const eff = (t: number) => EFF[clamp(Math.round(t) + 36, 0, EFF.length - 1)]

/** riverine pulses: Buriganga (Kamrangirchar), Sitalakshya (Demra), Turag (Mirpur), Buriganga-S (Keraniganj) */
const RIVER: Record<string, { cm: number; t: number }> = {
  Z03: { cm: 34, t: 18 }, Z16: { cm: 26, t: 16 }, Z17: { cm: 18, t: 20 }, Z04: { cm: 28, t: 18 },
}
/** arterial weighting: Motijheel CBD, Jatrabari junction, Old Dhaka, Karwan Bazar */
const ARTERIAL: Record<string, number> = { Z08: 1.15, Z15: 1.12, Z01: 1.1, Z11: 1.08 }

const depthAt = (z: { id: string; lowLying: number }, t: number) => {
  const mult = z.id === 'Z03' ? pw([[0, 1], [2, 1], [6, 2.6], [16, 2.6], [30, 1.6], [44, 1.2], [72, 1]], t) : 1
  const base = z.lowLying * mult * 0.09 * eff(t)
  const riv = RIVER[z.id] ? RIVER[z.id].cm * bump(t, RIVER[z.id].t, 8) : 0
  return base + riv
}

const sev = (v: number, pts: [number, number][]) => pw(pts, v)
const HYD_S: [number, number][] = [[0, 0], [8, 0.4], [18, 1], [28, 1.6], [38, 2.2], [48, 2.75], [58, 3.1], [90, 3.2]]
const TRF_S: [number, number][] = [[0, 0], [10, 0.3], [20, 0.9], [30, 1.5], [42, 2.2], [55, 2.85], [70, 3.1], [100, 3.2]]
const PWR_S: [number, number][] = [[0, 0], [33, 0], [40, 0.6], [48, 1.8], [55, 2.6], [62, 3]]
const OCC_S: [number, number][] = [[0.74, 0], [0.85, 0.5], [0.92, 1.3], [0.97, 2.15], [1.0, 2.6], [1.05, 3]]
const cityOcc = (t: number) =>
  pw([[-36, 0.74], [-20, 0.78], [-10, 0.83], [0, 0.86], [8, 0.89], [20, 0.97], [30, 0.99], [40, 1.01], [60, 1.0], [72, 0.98]], t)

const EVENTS: FeedEvent[] = [
  { t: -36, source: 'imd_radar', sourceType: 'forecast', layer: 'WX', message: 'BMD nowcast: monsoon low stalling over the Padma–Meghna basin', tone: 'info' },
  { t: -34, source: 'gauge_017', sourceType: 'sensor', layer: 'HYD', message: 'Antecedent soil moisture 74% · Turag baseflow elevated', tone: 'info' },
  { t: -33, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'DPDC load 0.89 · all feeders nominal', tone: 'info' },
  { t: -30, source: 'imd_radar', sourceType: 'forecast', layer: 'WX', message: 'Rain band onset · 12 mm/h and intensifying over Savar', tone: 'warn', mark: true },
  { t: -27, source: 'gauge_net', sourceType: 'sensor', layer: 'WX', message: '22 mm/h · 3h accumulation 58 mm', tone: 'warn' },
  { t: -25, source: 'scada_drain', sourceType: 'sensor', layer: 'HYD', message: 'Drain load ratio 0.78 · Z06, Z17 pumping at capacity', tone: 'warn' },
  { t: -23, source: 'citizen_app', sourceType: 'citizen', layer: 'COM', message: 'Waterlogging reported · Mouchak and Malibagh underpasses', tone: 'warn' },
  { t: -20, source: 'gauge_017', sourceType: 'sensor', layer: 'WX', message: 'Peak intensity 62 mm/h — 1-in-19-year rate for Dhaka', tone: 'alert', mark: true },
  { t: -19, source: 'scada_drain', sourceType: 'sensor', layer: 'HYD', message: 'Z03 Kamrangirchar drain load 1.31 · overflow imminent', tone: 'alert' },
  { t: -17, source: 'er_108_dispatch', sourceType: 'feed', layer: 'EMS', message: '999 call rate 2.2× baseline — rain incidents dominant', tone: 'warn' },
  { t: -15, source: 'command_ops', sourceType: 'official', layer: 'HYD', message: 'Kamrangirchar waterlogging 52 cm — CRITICAL declared', tone: 'crit', mark: true },
  { t: -14, source: 'traffic_api', sourceType: 'feed', layer: 'TRF', message: 'Mirpur Road speed index 0.31', tone: 'alert' },
  { t: -12, source: 'er_108_dispatch', sourceType: 'feed', layer: 'EMS', message: 'Median response 15 min (baseline 8)', tone: 'warn' },
  { t: -11, source: 'hospital_his', sourceType: 'feed', layer: 'HOS', message: 'DMCH ED arrivals +41% · trauma & near-drowning', tone: 'warn' },
  { t: -9, source: 'citizen_app', sourceType: 'citizen', layer: 'COM', message: 'Corroboration: 214 reports · southern corridor flooding (trust ✓)', tone: 'alert' },
  { t: -8, source: 'traffic_api', sourceType: 'feed', layer: 'TRF', message: 'Dhaka–Chattogram Hwy + Pragati Sarani access loss 41%', tone: 'alert', mark: true },
  { t: -6, source: 'gauge_net', sourceType: 'sensor', layer: 'HYD', message: 'Buriganga 0.9 m below danger mark · rising 6 cm/h at Sadarghat', tone: 'warn' },
  { t: -4, source: 'scada_drain', sourceType: 'sensor', layer: 'HYD', message: 'Z06, Z11 storm drains overdue desilting — capacity −22%', tone: 'warn' },
  { t: -2, source: 'command_ops', sourceType: 'official', layer: 'TRF', message: 'Z03 Kamrangirchar CRITICAL — sustained access loss 2 h', tone: 'crit', mark: true },
  { t: -1, source: 'imd_radar', sourceType: 'forecast', layer: 'WX', message: 'Band exits · BMD ensemble shows second band T+10 (p=0.78)', tone: 'alert', mark: true },
]

const CHAINS: Chain[] = [
  {
    id: 'flood-primary', name: 'Rain → access loss → EMS → hospitals', probability: 0.74,
    stages: [
      { layer: 'WX', label: 'Peak rain band · 62 mm/h', etaMedian: -20, etaP10: -22, etaP90: -18, pGate: 1, realized: true, realizedAt: -20 },
      { layer: 'HYD', label: 'Drainage overload · ≥4 zones', etaMedian: -12, etaP10: -16, etaP90: -8, pGate: 0.96, realized: true, realizedAt: -15 },
      { layer: 'TRF', label: 'Arterial access loss · 3+ zones', etaMedian: 4, etaP10: -2, etaP90: 12, pGate: 0.81 },
      { layer: 'EMS', label: 'Response time > 18 min city-wide', etaMedian: 9, etaP10: 3, etaP90: 17, pGate: 0.77 },
      { layer: 'HOS', label: 'Hospital saturation ≥ 95%', etaMedian: 20, etaP10: 12, etaP90: 34, pGate: 0.74 },
    ],
  },
  {
    id: 'flood-pwr', name: 'Drainage → substation → comms', probability: 0.42,
    stages: [
      { layer: 'HYD', label: 'Drainage overload', etaMedian: -12, etaP10: -16, etaP90: -8, pGate: 1, realized: true, realizedAt: -15 },
      { layer: 'PWR', label: 'Tejgaon 132/33 kV yard flood', etaMedian: 16, etaP10: 8, etaP90: 26, pGate: 0.55, zone: 'Z10' },
      { layer: 'COM', label: 'Cellular outage · 41% sites', etaMedian: 19, etaP10: 12, etaP90: 30, pGate: 0.42 },
    ],
  },
  {
    id: 'flood-compound', name: 'Compound · twin hospital saturation', probability: 0.18,
    stages: [
      { layer: 'HOS', label: 'Dhaka Medical College saturation', etaMedian: 20, etaP10: 12, etaP90: 32, pGate: 0.26, zone: 'Z01' },
      { layer: 'EMS', label: 'Diversion spiral · HOS↔EMS loop', etaMedian: 26, etaP10: 18, etaP90: 40, pGate: 0.21 },
      { layer: 'HOS', label: 'Second hospital breaches', etaMedian: 31, etaP10: 22, etaP90: 48, pGate: 0.18, zone: 'Z05' },
    ],
  },
]

const INTERVENTIONS: InterventionSpec[] = [
  { id: 'pumps', name: 'Pre-position 8 high-capacity pumps', detail: 'Kamrangirchar + Jatrabari low points. Combined 40 ML/h drawdown.', cost: '৳3.2 Cr', resources: '8 pumps · 6 crews', deployLeadH: 4, deltaP: 0.21, deadlineH: 6, sideEffects: ['Crews diverted from Z06 desilting', 'Generator noise + emissions in residential blocks'], confidence: 'HIGH' },
  { id: 'evac', name: 'Evacuate Kamrangirchar + Keraniganj chars', detail: '186k residents to 4 shelters on higher ground before the second band.', cost: '৳9.5 Cr', resources: '96 buses · 4 shelters', deployLeadH: 8, deltaP: 0.14, deadlineH: 10, sideEffects: ['TRF load +18% during window', 'Shelter density 4× design'], confidence: 'MED' },
  { id: 'stage', name: 'Stage 14 ambulances · pre-alert hospitals', detail: 'Pre-position at 4 nodes; DMCH and Square activate surge protocol.', cost: '৳1.4 Cr', resources: '14 units · 6 crews', deployLeadH: 2, deltaP: 0.11, deadlineH: 8, sideEffects: [], confidence: 'HIGH' },
  { id: 'roads', name: 'Pre-emptive closure · Mirpur Rd + Pragati Sarani', detail: 'Convert to emergency-vehicle-only corridors.', cost: '৳0.6 Cr', resources: '12 police units', deployLeadH: 1, deltaP: 0.09, deadlineH: 3, sideEffects: ['Congestion +22% on Z11 alternates'], confidence: 'MED' },
  { id: 'gens', name: 'Backup generators · 2 hospitals', detail: 'Dhaka Medical College + Square Hospital, 72h fuel.', cost: '৳1.8 Cr', resources: '2 gensets · fuel chain', deployLeadH: 3, deltaP: 0.07, deadlineH: 14, sideEffects: ['Fuel draw on Z10 depot'], confidence: 'HIGH' },
]

const NARRATIVE: NarrativeStep[] = [
  { t: 2, title: 'Second rain band enters the basin', detail: 'BMD ensemble: 30–40 mm/h from T+10 (p = 0.78). The delta soil has no capacity left — runoff is near-total.' },
  { t: 9, title: 'EMS response degrades city-wide', detail: 'Median response reaches 19 min; 22% of units committed to water rescues across the southern corridor.' },
  { t: 16, title: 'Tejgaon 132/33 kV yard floods', detail: 'Blocked drain backs up into the substation yard — rolling outages for 120k customers.' },
  { t: 20, title: 'Hospital saturation', detail: 'City occupancy crosses 95%. Diversion protocol engages and the HOS↔EMS loop begins to amplify.' },
  { t: 34, title: 'Cascade burns out', detail: 'Without intervention the band exits and the Buriganga falls — after 14h of sustained saturation.' },
]

export function floodSpec(): ScenarioSpec {
  const ind: number[] = [], p10: number[] = [], p90: number[] = []
  for (let t = -36; t <= 72; t++) {
    const v = cityOcc(t) * 100
    ind.push(v)
    const band = 1.5 + 4.5 * sramp(t, 0, 24)
    p10.push(v - band)
    p90.push(v + band * 1.15)
  }
  return {
    stateAt(zone, t) {
      const d = depthAt(zone, t)
      const hyd = sev(d, HYD_S)
      const art = ARTERIAL[zone.id] ?? 1
      const trf = sev(d * art, TRF_S)
      const ems = clamp(0.78 * sev(d * art, TRF_S) + 0.18 * clamp(rain(t) / 40), 0, 3) // TRF lagged ≈ shaped by same depth
      const hos = clamp(sev(cityOcc(t), OCC_S) * (zone.beds > 500 ? 1 : 0.75) + (zone.beds > 500 ? 0.22 : 0.04), 0, 3)
      const pwr = sev(d, PWR_S)
      const com = clamp(0.55 * pwr + (t > -24 && t < 4 ? 0.25 : 0.08), 0, 3)
      const layers = { WX: sev(rain(t), [[0, 0], [8, 0.35], [18, 0.9], [32, 1.5], [50, 2.1], [65, 2.4]]), HYD: hyd, TRF: trf, EMS: ems, HOS: hos, PWR: pwr, COM: com }
      const risk = Math.max(...Object.values(layers))
      return { layers, risk: clamp(risk, 0, 3), indicator: d }
    },
    cityIndicator: { label: 'Hospital occupancy', unit: '%', fmt: 'pct', series: ind, p10, p90 },
    events: EVENTS,
    chains: CHAINS,
    loops: ['HOS → EMS → HOS · loop gain 1.4 — saturation diverts ambulances, slower responses raise admissions', 'HYD → TRF → HYD (weak) · gain 0.8 — closures block pump tankers'],
    interventions: INTERVENTIONS,
    narrative: NARRATIVE,
    metrics: { ece: 0.034, coverage80: 0.81, brier: 0.148, leadTimeH: 31, edgeF1: 0.79 },
    pCascade: 0.74,
    rho: 0.86,
    rhoNote: 'Subcritical. The first cascade burns out in ~30h — the forecast second rain band re-ignites it past ρ = 1.',
    tCritical: { label: 'Hospital saturation ≥ 95% (city)', median: 20, p10: 12, p90: 34 },
    headline: 'City-wide access-loss cascade probable within 36h. Hospital saturation is the binding constraint.',
    exposedNote: '2.1M residents in HIGH+ zones',
    assetsAtRisk: ['Dhaka Medical College (Z01)', 'Square Hospital (Z05)', 'Tejgaon 132/33 kV (Z10)', 'Motijheel CBD (Z08)'],
    honesty: 'Flood has a physically real 72h lead: rain forecast, basin saturation and drainage state carry the signal 24–72h ahead of access loss.',
    fx: { kind: 'flood', rain: Array.from({ length: 109 }, (_, i) => rain(i - 36)) },
  }
}

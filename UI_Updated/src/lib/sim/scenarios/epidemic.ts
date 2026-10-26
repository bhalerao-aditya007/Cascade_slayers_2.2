// ─── EPIDEMIC SURGE · HONG KONG · synthetic episode script ─────────────────────
import type { Chain, FeedEvent, InterventionSpec, NarrativeStep, ScenarioSpec } from '../types'
import { pw, sramp, clamp, hash, rng } from '../core'

// ED syndromic multiplier + Rt — seeded outbreak, mobility-coupled spread
const syn = (t: number) => pw([[-36, 1.28], [-24, 1.45], [-12, 1.72], [0, 2.08], [12, 2.5], [24, 2.9], [36, 3.15], [48, 3.3], [60, 3.35], [72, 3.28]], t)
const rt = (t: number) => pw([[-36, 1.32], [-18, 1.51], [0, 1.68], [18, 1.74], [36, 1.7], [54, 1.62], [72, 1.5]], t)
const bedOcc = (t: number) => pw([[-36, 0.68], [-24, 0.72], [-12, 0.77], [0, 0.81], [12, 0.85], [24, 0.88], [38, 0.93], [52, 0.965], [60, 0.985], [66, 1.0], [72, 1.005]], t)
const icuOcc = (t: number) => pw([[-36, 0.71], [-24, 0.75], [-12, 0.79], [0, 0.82], [12, 0.86], [24, 0.9], [38, 0.94], [52, 0.97], [60, 0.99], [66, 1.01], [72, 1.03]], t)

/** attack-rate weight: densest Kowloon districts + new-town feeder estates */
const ATTACK: Record<string, number> = {
  Z08: 1.28, Z09: 1.25, Z07: 1.2, Z12: 1.16, Z11: 1.12, Z03: 1.12, Z10: 1.1, Z22: 1.08, Z14: 1.05,
}

const EVENTS: FeedEvent[] = [
  { t: -36, source: 'hospital_his', sourceType: 'feed', layer: 'HLT', message: 'HA syndromic (ILI/fever) 1.28× baseline — 6-day rise across Kowloon', tone: 'warn' },
  { t: -33, source: 'ww_survey', sourceType: 'feed', layer: 'HLT', message: 'Wastewater signal 2.4× rolling median · Sham Shui Po catchment', tone: 'warn', mark: true },
  { t: -30, source: 'hospital_his', sourceType: 'feed', layer: 'HLT', message: 'Test positivity 11.8% · cluster linkage to cross-harbour commute', tone: 'warn' },
  { t: -26, source: 'mobility_api', sourceType: 'feed', layer: 'COM', message: 'MTR ridership +18% — seeding pressure on Kowloon corridors', tone: 'info' },
  { t: -24, source: 'hospital_his', sourceType: 'feed', layer: 'HLT', message: 'Vertical cluster · Kwun Tong estate — 96 cases/24h, plumbing-sealed stack', tone: 'alert', mark: true },
  { t: -22, source: 'hospital_his', sourceType: 'feed', layer: 'HLT', message: 'Syndromic 1.45× · Rt point estimate 1.5 (CI 1.4–1.7)', tone: 'alert', mark: true },
  { t: -18, source: 'citizen_app', sourceType: 'citizen', layer: 'COM', message: 'Absenteeism reports · 6 schools queried, no official closure', tone: 'info' },
  { t: -14, source: 'hospital_his', sourceType: 'feed', layer: 'HOS', message: 'Admissions lag ED by ~44h · occupancy 77% and climbing', tone: 'warn' },
  { t: -10, source: 'ww_survey', sourceType: 'feed', layer: 'HLT', message: 'Wastewater signal 4.1× · now in 5 of 7 catchments', tone: 'alert', mark: true },
  { t: -6, source: 'er_108_dispatch', sourceType: 'feed', layer: 'EMS', message: 'Fever-line calls 1.9× baseline', tone: 'warn' },
  { t: -3, source: 'hospital_his', sourceType: 'feed', layer: 'HOS', message: 'ICU occupancy 82% · elective load still full', tone: 'alert', mark: true },
  { t: -1, source: 'command_ops', sourceType: 'official', layer: 'HLT', message: 'CHP surge signal confirmed — model flags HOS breach horizon', tone: 'alert', mark: true },
]

const CHAINS: Chain[] = [
  {
    id: 'epi-primary', name: 'Syndromic surge → bed breach → ICU breach', probability: 0.81,
    stages: [
      { layer: 'HLT', label: 'Syndromic ≥ 2× baseline', etaMedian: -8, etaP10: -14, etaP90: -2, pGate: 1, realized: true, realizedAt: -4 },
      { layer: 'HOS', label: 'Occupancy ≥ 88%', etaMedian: 22, etaP10: 14, etaP90: 32, pGate: 0.88 },
      { layer: 'HOS', label: 'Bed breach · ≥ 96%', etaMedian: 52, etaP10: 40, etaP90: 64, pGate: 0.81 },
      { layer: 'HOS', label: 'ICU breach · ≥ 100%', etaMedian: 66, etaP10: 56, etaP90: 72, pGate: 0.66 },
    ],
  },
  {
    id: 'epi-ems', name: 'Hospital strain → EMS diversion', probability: 0.35,
    stages: [
      { layer: 'HOS', label: 'Saturation + diversion protocol', etaMedian: 52, etaP10: 42, etaP90: 64, pGate: 0.48 },
      { layer: 'EMS', label: 'Diverted transports · +11 min median', etaMedian: 58, etaP10: 50, etaP90: 68, pGate: 0.35 },
    ],
  },
  {
    id: 'epi-staff', name: 'Staff absenteeism feedback', probability: 0.22,
    stages: [
      { layer: 'HOS', label: 'Clinical staff absenteeism ≥ 8%', etaMedian: 44, etaP10: 34, etaP90: 58, pGate: 0.31 },
      { layer: 'HOS', label: 'Effective capacity −12%', etaMedian: 56, etaP10: 46, etaP90: 68, pGate: 0.22 },
    ],
  },
]

const INTERVENTIONS: InterventionSpec[] = [
  { id: 'beds', name: 'Surge beds · +240 in 14h', detail: 'Convert HA wards + private-partner block booking.', cost: 'HK$32M', resources: '240 beds · 190 staff', deployLeadH: 14, deltaP: 0.17, deadlineH: 24, sideEffects: ['Elective cancellations −340 procedures'], confidence: 'HIGH' },
  { id: 'elective', name: 'Pause elective procedures', detail: 'Frees 12% bed-days immediately; deferral queue managed.', cost: 'HK$11M (deferred)', resources: 'Theatre scheduling', deployLeadH: 6, deltaP: 0.09, deadlineH: 30, sideEffects: ['340 deferred procedures', 'Surgical backlog +3 weeks'], confidence: 'HIGH' },
  { id: 'fever', name: '12 designated fever clinics', detail: 'Diverts mild presentations from A&E; tele-triage first.', cost: 'HK$8M', resources: '12 sites · 140 staff', deployLeadH: 10, deltaP: 0.06, deadlineH: 20, sideEffects: [], confidence: 'MED' },
  { id: 'staff', name: 'Staff pooling + PPE wave', detail: 'Cross-deployment pool, 96h PPE stock, isolation pay.', cost: 'HK$16M', resources: 'Pool of 380', deployLeadH: 12, deltaP: 0.05, deadlineH: 36, sideEffects: [], confidence: 'MED' },
  { id: 'staging', name: 'Stage 10 ambulances', detail: 'Pre-position for fever-line + inter-facility transfers.', cost: 'HK$5M', resources: '10 units', deployLeadH: 4, deltaP: 0.03, deadlineH: 40, sideEffects: [], confidence: 'HIGH' },
]

const NARRATIVE: NarrativeStep[] = [
  { t: 22, title: 'Occupancy crosses 88%', detail: 'Admissions follow the syndromic curve with a ~44h lag — this rise is already locked in.' },
  { t: 36, title: 'Growth peaks · Rt 1.74', detail: 'Mobility-coupled spread across Kowloon and the harbour crossings; the Kwun Tong cluster seeds new-town feeder estates.' },
  { t: 52, title: 'Bed breach', detail: 'HA occupancy reaches 96.5%. Without surge capacity, corridor care begins.' },
  { t: 66, title: 'ICU breach', detail: 'Critical care hits 100% — the binding constraint of the episode.' },
  { t: 72, title: 'Plateau visible', detail: 'Rt eases to 1.5 but occupancy stays above capacity into the following week.' },
]

export function epidemicSpec(): ScenarioSpec {
  const ind: number[] = [], p10: number[] = [], p90: number[] = []
  for (let t = -36; t <= 72; t++) {
    const v = bedOcc(t) * 100
    ind.push(v)
    const band = 1.2 + 3.6 * sramp(t, 0, 40)
    p10.push(v - band)
    p90.push(v + band)
  }
  return {
    stateAt(zone, t) {
      const r = rng(hash(zone.id) ^ 0x517d)
      const jit = 0.92 + 0.16 * r()
      const synZ = syn(t) * ((ATTACK[zone.id] ?? 0.85) * jit)
      const hlt = pw([[1.1, 0], [1.4, 0.6], [1.8, 1.2], [2.3, 1.9], [2.8, 2.5], [3.4, 3.1]] as [number, number][], synZ)
      const occZ = clamp(bedOcc(t) * (0.94 + 0.1 * ((ATTACK[zone.id] ?? 0.85) - 0.85) / 0.5) + (zone.beds > 500 ? 0.02 : 0), 0, 1.1)
      const hos = pw([[0.7, 0], [0.8, 0.5], [0.88, 1.2], [0.94, 2.0], [0.98, 2.6], [1.02, 3.1]] as [number, number][], occZ) * (zone.beds > 500 ? 1 : 0.82)
      const icuFlag = icuOcc(t) > 0.99 ? 0.35 : 0
      const ems = clamp(0.5 * hlt + (bedOcc(t) > 0.95 ? 0.6 : 0), 0, 3)
      const com = clamp(0.35 * hlt, 0, 3)
      const layers = { HLT: hlt, HOS: clamp(hos + icuFlag, 0, 3), EMS: ems, COM: com }
      const risk = Math.max(...Object.values(layers))
      return { layers, risk: clamp(risk, 0, 3), indicator: synZ }
    },
    cityIndicator: { label: 'Hospital bed occupancy', unit: '%', fmt: 'pct', series: ind, p10, p90 },
    events: EVENTS,
    chains: CHAINS,
    loops: ['HOS → staff → HOS · gain 1.1 — absenteeism cuts capacity exactly when demand peaks'],
    interventions: INTERVENTIONS,
    narrative: NARRATIVE,
    metrics: { ece: 0.031, coverage80: 0.80, brier: 0.139, leadTimeH: 52, edgeF1: 0.83 },
    pCascade: 0.9,
    rho: 0.71,
    rhoNote: 'Subcritical in grid terms — but the health loop (absenteeism) keeps effective ρ near 0.9 at the peak.',
    tCritical: { label: 'ICU breach ≥ 100% (HA network)', median: 66, p10: 56, p90: 72 },
    headline: 'ICU breach is the critical event — 90% probability inside 66h without surge capacity.',
    exposedNote: '3.9M residents in active-spread zones',
    assetsAtRisk: ['Queen Elizabeth Hospital ICU (Z07)', 'United Christian (Z12)', 'Prince of Wales (Z14)'],
    honesty: 'We do not forecast the pathogen. Syndromic and ED signals lead occupancy by days — the surge is already seeded when the model speaks.',
    fx: { kind: 'epidemic', spread: [] },
  }
}

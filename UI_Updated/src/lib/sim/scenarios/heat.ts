// ─── EXTREME HEAT · PHOENIX · synthetic episode script ─────────────────────────
import type { Chain, FeedEvent, InterventionSpec, NarrativeStep, ScenarioSpec } from '../types'
import { pw, sramp, bump, clamp } from '../core'

// WBGT °C — heat dome + monsoon moisture surge, tropical nights, peak T+14
const wbgt = (t: number) =>
  pw([[-36, 29.4], [-24, 30.8], [-16, 31.6], [-8, 32.4], [-4, 32.9], [0, 33.3], [6, 34.0], [14, 34.8], [22, 34.4], [30, 33.6], [42, 32.8], [54, 32.2], [72, 31.4]], t)
const load = (t: number) =>
  pw([[-36, 0.86], [-24, 0.89], [-12, 0.92], [0, 0.96], [6, 1.0], [10, 1.06], [14, 1.08], [20, 1.05], [30, 1.0], [48, 0.96], [72, 0.92]], t)
const outages = (t: number) => pw([[0, 0.01], [8, 0.02], [12, 0.04], [16, 0.08], [22, 0.09], [30, 0.07], [48, 0.04], [72, 0.02]], t)
const edHeat = (t: number) =>
  pw([[-36, 1.0], [-24, 1.08], [-12, 1.22], [0, 1.42], [12, 1.7], [24, 2.05], [36, 2.42], [48, 2.6], [60, 2.55], [72, 2.3]], t)

/** urban heat island — measured Maricopa pattern: low-canopy west side runs hottest */
const UHI: Record<string, number> = {
  Z13: 1.32, Z14: 1.26, Z15: 1.22, Z11: 1.16, Z01: 1.12, Z19: 1.1, Z12: 1.08, // Maryvale, Alhambra, West Phx, South Mtn, Downtown
  Z04: 0.84, Z08: 0.8, Z18: 0.9, Z09: 0.9, Z05: 0.94, Z07: 0.96, // Arcadia, Paradise Valley, Anthem (cool)
}

const EVENTS: FeedEvent[] = [
  { t: -36, source: 'imd_radar', sourceType: 'forecast', layer: 'WX', message: 'NWS Phoenix: excessive heat warning · WBGT 29.4 °C and rising', tone: 'info' },
  { t: -33, source: 'imd_radar', sourceType: 'forecast', layer: 'WX', message: 'Dome stalls: 5-day residence forecast (p = 0.84), monsoon moisture inbound', tone: 'warn' },
  { t: -30, source: 'hospital_his', sourceType: 'feed', layer: 'HLT', message: 'Syndromic heat visits 1.08× baseline — early signal', tone: 'warn', mark: true },
  { t: -26, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'APS/SRP load slope +2.4%/°C above 28 °C', tone: 'info' },
  { t: -22, source: 'gauge_net', sourceType: 'sensor', layer: 'WX', message: 'Overnight minimum 34.2 °C (94 °F) — no recovery window', tone: 'warn', mark: true },
  { t: -18, source: 'citizen_app', sourceType: 'citizen', layer: 'COM', message: 'Outage reports clustering · Maryvale, Alhambra', tone: 'warn' },
  { t: -14, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'Feeder MVL-12 load 0.97 · Maryvale transformer hot-spot alarm', tone: 'alert' },
  { t: -10, source: 'hospital_his', sourceType: 'feed', layer: 'HLT', message: 'ED heat visits 1.22× · renal + geriatric presentations up', tone: 'alert', mark: true },
  { t: -6, source: 'er_108_dispatch', sourceType: 'feed', layer: 'EMS', message: '911 heat collapse calls 2.6× baseline · outdoor workers', tone: 'alert' },
  { t: -3, source: 'imd_radar', sourceType: 'forecast', layer: 'WX', message: 'Peak WBGT 34.5–35.0 °C forecast T+12…T+16 (p = 0.79)', tone: 'alert', mark: true },
  { t: -1, source: 'scada_grid', sourceType: 'sensor', layer: 'PWR', message: 'Metro load 0.96 of rating · reserve margin 4.1%', tone: 'alert', mark: true },
]

const CHAINS: Chain[] = [
  {
    id: 'heat-pwr', name: 'Heat → grid strain → outages', probability: 0.62,
    stages: [
      { layer: 'WX', label: 'WBGT ≥ 33 °C sustained', etaMedian: -6, etaP10: -10, etaP90: -2, pGate: 1, realized: true, realizedAt: -4 },
      { layer: 'PWR', label: 'Load ratio ≥ 1.05', etaMedian: 10, etaP10: 6, etaP90: 15, pGate: 0.74 },
      { layer: 'PWR', label: 'Rolling outages · 8% customers', etaMedian: 16, etaP10: 11, etaP90: 24, pGate: 0.62 },
      { layer: 'COM', label: 'Cell sites on battery · 29%', etaMedian: 19, etaP10: 14, etaP90: 28, pGate: 0.31 },
    ],
  },
  {
    id: 'heat-hos', name: 'Heat → lagged ED surge → hospital strain', probability: 0.55,
    stages: [
      { layer: 'WX', label: 'Peak WBGT 34.8 °C', etaMedian: 14, etaP10: 10, etaP90: 18, pGate: 0.88 },
      { layer: 'HLT', label: 'Heat ED visits ≥ 2× baseline', etaMedian: 30, etaP10: 18, etaP90: 44, pGate: 0.71 },
      { layer: 'HOS', label: 'Occupancy ≥ 93%', etaMedian: 48, etaP10: 36, etaP90: 62, pGate: 0.55 },
      { layer: 'HOS', label: 'ICU breach · heat + deferred care', etaMedian: 60, etaP10: 50, etaP90: 72, pGate: 0.38 },
    ],
  },
  {
    id: 'heat-compound', name: 'Compound · outage during peak exposure', probability: 0.29,
    stages: [
      { layer: 'PWR', label: 'Outage in high-UHI zones', etaMedian: 16, etaP10: 12, etaP90: 22, pGate: 0.44, zone: 'Z13' },
      { layer: 'HLT', label: 'Exposure spike · no cooling in Maryvale', etaMedian: 22, etaP10: 17, etaP90: 30, pGate: 0.36 },
      { layer: 'HOS', label: 'Saturation from combined load', etaMedian: 44, etaP10: 34, etaP90: 58, pGate: 0.29 },
    ],
  },
]

const INTERVENTIONS: InterventionSpec[] = [
  { id: 'cooling', name: 'Open 14 cooling centres', detail: 'Prioritised by UHI + elderly density — Maryvale and Alhambra first. 60k person-hours of relief.', cost: '$0.9M', resources: '14 venues · 220 staff', deployLeadH: 6, deltaP: 0.12, deadlineH: 8, sideEffects: ['PWR load +1.2% locally'], confidence: 'HIGH' },
  { id: 'shed', name: 'Rolling load-shed · 180 MW', detail: 'Protects feeders from cascade trips; rotates 40-min blocks.', cost: '$0', resources: 'APS/SRP control', deployLeadH: 1, deltaP: 0.15, deadlineH: 6, sideEffects: ['Heat exposure +0.4 WBGT-hrs in shed zones', 'Commercial losses ≈ $2.1M'], confidence: 'MED' },
  { id: 'dr', name: 'Demand response · 240 MW', detail: 'Industrial + large-consumer curtailment contracts.', cost: '$1.2M', resources: '61 enrolled consumers', deployLeadH: 2, deltaP: 0.08, deadlineH: 5, sideEffects: [], confidence: 'HIGH' },
  { id: 'ors', name: 'Water + outreach wave', detail: 'Hydration stations + door-to-door checks for 96k elderly residents.', cost: '$0.4M', resources: '900 volunteers', deployLeadH: 4, deltaP: 0.05, deadlineH: 12, sideEffects: [], confidence: 'HIGH' },
  { id: 'genmed', name: 'Generators · medical zone', detail: 'Banner Good Sam + St. Joseph campus backup, 96h fuel.', cost: '$0.5M', resources: '3 gensets', deployLeadH: 3, deltaP: 0.04, deadlineH: 14, sideEffects: [], confidence: 'HIGH' },
]

const NARRATIVE: NarrativeStep[] = [
  { t: 10, title: 'Grid crosses 1.05 load ratio', detail: 'AC demand peaks with the afternoon WBGT. Reserve margin thins to 1.9%.' },
  { t: 14, title: 'Peak wet-bulb · 34.8 °C', detail: 'Monsoon moisture makes the dry 46 °C dangerous — sweat stops evaporating. Outdoor work bans advised.' },
  { t: 16, title: 'Rolling outages begin', detail: 'Transformers in Maryvale and Alhambra trip on sustained overload — the low-canopy core heats fastest.' },
  { t: 30, title: 'ED surge crosses 2×', detail: 'Heat visits lag the peak by 12–48h — renal, geriatric, outdoor workers dominate.' },
  { t: 60, title: 'ICU breach risk peaks', detail: 'Combined heat load + deferred care from the outage window pushes ICU past capacity.' },
]

export function heatSpec(): ScenarioSpec {
  const ind: number[] = [], p10: number[] = [], p90: number[] = []
  for (let t = -36; t <= 72; t++) {
    const v = wbgt(t)
    ind.push(v)
    const band = 0.5 + 0.9 * sramp(t, -8, 20)
    p10.push(v - band)
    p90.push(v + band)
  }
  return {
    stateAt(zone, t) {
      const w = wbgt(t) + (UHI[zone.id] ?? 1) * 0.35 - 0.35
      const wx = pw([[28, 0], [30, 0.4], [31.5, 0.9], [32.5, 1.4], [33.5, 1.9], [34.5, 2.3], [36, 2.5]] as [number, number][], w)
      const pwrLoad = load(t)
      const pwr = pw([[0.86, 0], [0.95, 0.7], [1.0, 1.4], [1.05, 2.1], [1.09, 2.8], [1.12, 3.1]] as [number, number][], pwrLoad) + (outages(t) > 0.03 && (UHI[zone.id] ?? 1) > 1.05 ? 0.7 : 0)
      const outSev = pw([[0, 0], [0.02, 0.5], [0.05, 1.4], [0.08, 2.3], [0.11, 3]] as [number, number][], outages(t) * ((UHI[zone.id] ?? 1) > 1.1 ? 1.5 : 1))
      const hlt = pw([[1, 0], [1.2, 0.4], [1.5, 0.9], [1.9, 1.5], [2.3, 2.1], [2.7, 2.7], [3.2, 3.1]] as [number, number][], edHeat(t))
      const hos = clamp(pw([[0.7, 0], [0.8, 0.4], [0.88, 1.0], [0.93, 1.8], [0.97, 2.5], [1.0, 3]] as [number, number][], 0.74 + 0.12 * (edHeat(t) - 1) + 0.06 * bump(t, 48, 14)) * (zone.beds > 500 ? 1 : 0.8) + (zone.beds > 500 ? 0.18 : 0), 0, 3)
      const ems = clamp(0.55 * hlt, 0, 3)
      const com = clamp(0.6 * outSev, 0, 3)
      const layers = { WX: wx, PWR: Math.max(pwr, outSev), HLT: hlt, HOS: hos, EMS: ems, COM: com }
      const risk = Math.max(...Object.values(layers))
      return { layers, risk: clamp(risk, 0, 3), indicator: w }
    },
    cityIndicator: { label: 'Wet-bulb globe temp', unit: '°C', fmt: 'temp', series: ind, p10, p90 },
    events: EVENTS,
    chains: CHAINS,
    loops: ['PWR → HLT → PWR (weak) · gain 0.7 — cooling demand rises as exposure drives response load'],
    interventions: INTERVENTIONS,
    narrative: NARRATIVE,
    metrics: { ece: 0.028, coverage80: 0.82, brier: 0.121, leadTimeH: 44, edgeF1: 0.74 },
    pCascade: 0.58,
    rho: 0.64,
    rhoNote: 'Subcritical — the heat cascade amplifies through load and lagged health demand, but decays once the dome exits.',
    tCritical: { label: 'ED heat surge ≥ 2× baseline (county)', median: 30, p10: 18, p90: 44 },
    headline: 'Humid heat peaks inside 18h; grid strain and a lagged ED surge compound inside 60h.',
    exposedNote: '1.3M residents under WBGT ≥ 33 °C · 96k elderly high-risk',
    assetsAtRisk: ['Maryvale feeder bank MVL-12 (Z13)', 'Banner Good Sam campus (Z02)', 'Sky Harbor substation (Z16)'],
    honesty: 'Heat domes are forecastable 3–5 days out; the cascade — load, outage, lagged health demand — is what the model owns.',
    fx: { kind: 'heat', intensity: Array.from({ length: 109 }, (_, i) => clamp((wbgt(i - 36) - 29) / 6, 0, 1)) },
  }
}

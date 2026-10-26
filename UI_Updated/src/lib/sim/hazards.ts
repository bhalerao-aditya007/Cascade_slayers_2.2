// ─── hazard catalogue · six calamities, six famous locations ──────────────────
import type { HazardId, LayerCode } from './types'
import { CITIES } from './cities'

export interface HazardMeta {
  id: HazardId
  name: string
  short: string
  tagline: string
  description: string
  icon: string // lucide icon key resolved in component
  accent: string
  accentSoft: string
  leadBadge: string
  leadReal: string
  chainPreview: string
  episodeId: string
  simStart: number
  honesty: string
  headline: string
  /** famous-location copy for the picker cards + city brief */
  city: {
    name: string
    nameLocal: string
    country: string
    famousFor: string
    coords: [number, number]
  }
}

const cityMeta = (h: HazardId): HazardMeta['city'] => {
  const c = CITIES[h]
  return { name: c.name, nameLocal: c.nameLocal, country: c.country, famousFor: c.famousFor, coords: c.globe }
}

export const HAZARDS: HazardMeta[] = [
  {
    id: 'flood',
    name: 'Flood',
    short: 'Riverine + urban flood',
    tagline: 'A 96-hour monsoon stall over the Dhaka basin.',
    description:
      'Persistent convection over an already saturated delta. Drainage overloads first in the low-lying chars and the Keraniganj floodplain, then the roads, then the hospitals that serve them.',
    icon: 'waves',
    accent: '#4CC2FF',
    accentSoft: 'rgba(76,194,255,0.14)',
    leadBadge: 'GENUINE 24–72H LEAD',
    leadReal: 'Rain forecast + basin saturation + drainage state',
    chainPreview: 'WX → HYD → TRF → EMS → HOS',
    episodeId: 'E-2417-F',
    simStart: -36,
    honesty:
      'Flood is the hazard with a physically real 72-hour lead: rain forecast, basin saturation and drainage state carry the signal 24–72h ahead of access loss.',
    headline: 'City-wide access-loss cascade probable within 36h; hospital saturation is the binding constraint.',
    city: cityMeta('flood'),
  },
  {
    id: 'heat',
    name: 'Extreme Heat',
    short: 'Heatwave + humidity',
    tagline: 'An urban heat dome over Phoenix with nights that never recover.',
    description:
      'Wet-bulb temperature is the killer variable. AC load surges as the Maryvale heat island peaks, outages strip cooling exactly when the vulnerable need it, and ED visits lag 12–48h behind.',
    icon: 'thermometer-sun',
    accent: '#FF9F0A',
    accentSoft: 'rgba(255,159,10,0.14)',
    leadBadge: 'GENUINE 3–5 DAY LEAD',
    leadReal: 'Temperature / humidity forecast; health effects lag',
    chainPreview: 'WX → PWR → HLT / HOS',
    episodeId: 'E-2033-H',
    simStart: -36,
    honesty:
      'Heat domes are forecastable 3–5 days out. The cascade is what needs the model: load → outage → exposure, with hospital effects lagging 12–48h behind peak WBGT.',
    headline: 'Humid heat peaks inside 18h; grid strain and a lagged ED surge compound inside 60h.',
    city: cityMeta('heat'),
  },
  {
    id: 'epidemic',
    name: 'Epidemic Surge',
    short: 'Epidemic / pandemic',
    tagline: 'Syndromic signals climb in Kowloon while hospitals still look calm.',
    description:
      'ED fever visits and wastewater signal lead hospital occupancy by days — the SARS lesson of 2003, instrumented. The system forecasts the surge — bed and ICU breach — not the pathogen.',
    icon: 'biohazard',
    accent: '#BF5AF2',
    accentSoft: 'rgba(191,90,242,0.14)',
    leadBadge: 'DAYS OF LEAD (HOSPITAL STRAIN)',
    leadReal: 'Syndromic / ED signals lead occupancy by days',
    chainPreview: 'HLT → HOS → EMS',
    episodeId: 'E-1902-P',
    simStart: -36,
    honesty:
      'We do not forecast the pathogen. Syndromic and ED signals lead hospital occupancy by days — the system forecasts the surge that is already seeded.',
    headline: 'ICU breach is the critical event: 90% probability inside 66h without surge capacity.',
    city: cityMeta('epidemic'),
  },
  {
    id: 'grid',
    name: 'Grid Failure',
    short: 'Infrastructure / power',
    tagline: 'One 400 kV trip cascades through Delhi’s stressed feeder tree.',
    description:
      'A fault during evening peak forces load onto neighbouring feeders across the Yamuna. Each transfer pushes the next component past its rating — the cascade feeds itself, exactly as it did in July 2012.',
    icon: 'zap',
    accent: '#FFD60A',
    accentSoft: 'rgba(255,214,10,0.14)',
    leadBadge: 'CLOCK STARTS AT FAULT',
    leadReal: 'Fault-triggered; we forecast the cascade',
    chainPreview: 'PWR → TRF / COM / HOS',
    episodeId: 'E-0874-G',
    simStart: -6,
    honesty:
      'Weather-driven stress has hours of lead; a hard fault has none. The clock starts at the first trip — the system forecasts the cascade that fault starts.',
    headline: 'Cascade is supercritical (ρ = 1.12): without action a second wave triples the outage by T+09h.',
    city: cityMeta('grid'),
  },
  {
    id: 'quake',
    name: 'Earthquake',
    short: 'Earthquake + aftershocks',
    tagline: 'M7.3 beneath northern Tokyo Bay. No warning — the clock starts at detection.',
    description:
      'The mainshock cannot be predicted and we never claim it can — this is the Tokyo Metropolitan Government’s own scenario. What the model owns is everything after: aftershock hazard, structural damage, and the secondary cascade.',
    icon: 'activity',
    accent: '#FF453A',
    accentSoft: 'rgba(255,69,58,0.14)',
    leadBadge: 'NO PRECURSOR CLAIM',
    leadReal: 'Clock starts at mainshock detection',
    chainPreview: 'SEI → PWR / TRF / AIR → HOS',
    episodeId: 'E-0091-Q',
    simStart: -6,
    honesty:
      'For earthquakes we claim no precursors. The 72h window covers aftershock hazard (ETAS) and the secondary cascade — grid, roads, gas, hospitals.',
    headline: 'Aftershock hazard stays elevated for 72h; casualty surge and a gas-triggered plume are the binding risks.',
    city: cityMeta('quake'),
  },
  {
    id: 'chem',
    name: 'Chemical Leak',
    short: 'Chemical / gas release',
    tagline: 'Scrubber failure at a Govindpura chemical unit, Bhopal.',
    description:
      'A release during transfer operations on a still winter morning. The plume rides a northeast drift straight across the dense walled city — the corridor Bhopal has drilled for since 1984. Every minute of lead moves thousands out of the AEGL-2 footprint.',
    icon: 'flask-conical',
    accent: '#66D4CF',
    accentSoft: 'rgba(102,212,207,0.14)',
    leadBadge: 'CLOCK STARTS AT DETECTION',
    leadReal: 'Sensor + corroborated citizen report',
    chainPreview: 'AIR → TRF → EMS → HOS',
    episodeId: 'E-0458-C',
    simStart: -8,
    honesty:
      'No precursors for an accidental release. The clock starts at the first sensor report; the system forecasts the plume footprint and the downstream cascade.',
    headline: 'AEGL-2 corridor reaches 640k residents downwind inside 4h; shelter-in-place beats evacuation for the outer zones.',
    city: cityMeta('chem'),
  },
]

export const HAZARD_BY_ID: Record<HazardId, HazardMeta> = Object.fromEntries(
  HAZARDS.map((h) => [h.id, h]),
) as Record<HazardId, HazardMeta>

/** which layers matter most per hazard (for driver attribution ordering) */
export const HAZARD_LAYERS: Record<HazardId, LayerCode[]> = {
  flood: ['WX', 'HYD', 'TRF', 'EMS', 'HOS', 'PWR'],
  heat: ['WX', 'PWR', 'HOS', 'HLT', 'COM'],
  epidemic: ['HLT', 'HOS', 'EMS', 'COM'],
  grid: ['PWR', 'TRF', 'COM', 'HOS', 'HYD'],
  quake: ['SEI', 'PWR', 'TRF', 'AIR', 'HOS', 'EMS'],
  chem: ['AIR', 'TRF', 'EMS', 'HOS', 'COM'],
}

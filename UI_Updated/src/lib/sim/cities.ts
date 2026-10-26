// ─── six famous cities · one per calamity · real OSM boundaries ────────────────
import type { HazardId } from './types'

export interface CityZoneSeed {
  id: string
  name: string
  center: [number, number] // [lng, lat] — real district centroid
  population: number
  elevation: number // m
  lowLying: number // 0..1
  beds?: number
  icu?: number
  substation?: boolean
  plant?: boolean
}

/** scroll progress (0..1) → map camera keyframe (Bruno-Simon-style camera path) */
export interface CamKeyframe {
  p: number
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
}

export interface CityConfig {
  hazard: HazardId
  name: string
  nameLocal: string
  country: string
  /** headline of why this place is famous for this calamity */
  famousFor: string
  /** 2 paragraphs for the city-brief screen */
  brief: [string, string]
  stats: { label: string; value: string }[]
  tz: { offsetH: number; label: string }
  currency: string
  /** hex zone radius in km */
  hexR: number
  /** city anchor on the globe */
  globe: [number, number]
  /** default (forecast) camera */
  fit: { center: [number, number]; zoom: number; pitch: number; bearing: number }
  /** scroll-scrub camera path for the simulation chapter */
  camera: CamKeyframe[]
  seeds: CityZoneSeed[]
  /** local ingest source names (id → display) */
  sources: Record<string, string>
}

export const CITIES: Record<HazardId, CityConfig> = {
  // ── FLOOD · DHAKA ────────────────────────────────────────────────────────────
  flood: {
    hazard: 'flood',
    name: 'Dhaka',
    nameLocal: 'ঢাকা',
    country: 'Bangladesh',
    famousFor: 'A delta capital built on four rivers — in 2020, a monsoon stall put a third of Bangladesh underwater and the flood arrived in Dhaka’s streets.',
    brief: [
      'Dhaka sits at the confluence of the Buriganga, Turag, Balu and Sitalakshya rivers — a megacity of 23 million spread across one of the flattest deltas on Earth. When a monsoon stalls over the basin, upstream water has nowhere to go but through the city: 1998, 2004 and 2020 each wrote that lesson again.',
      'The binding constraint is rarely the rain itself. It is drainage that overloads in hours, embankments that protect until they overtop, and 4 million people in informal settlements on the lowest land — the river chars and the eastern floodplains that flood first and drain last.',
    ],
    stats: [
      { label: 'Metro population', value: '23.2M' },
      { label: 'City elevation', value: '4–13 m' },
      { label: 'Rivers through city', value: '4' },
      { label: 'Monsoon flood events', value: '1998 · 2004 · 2020' },
    ],
    tz: { offsetH: 6, label: 'BST' },
    currency: '৳',
    hexR: 1.5,
    globe: [90.4125, 23.8103],
    fit: { center: [90.399, 23.762], zoom: 11.1, pitch: 46, bearing: 8 },
    camera: [
      { p: 0.0, center: [90.318, 23.808], zoom: 10.6, pitch: 40, bearing: -22 },
      { p: 0.3, center: [90.368, 23.758], zoom: 11.9, pitch: 54, bearing: 6 },
      { p: 0.62, center: [90.398, 23.718], zoom: 12.3, pitch: 57, bearing: 38 },
      { p: 0.86, center: [90.43, 23.688], zoom: 12.0, pitch: 52, bearing: 62 },
      { p: 1.0, center: [90.399, 23.762], zoom: 10.8, pitch: 34, bearing: 12 },
    ],
    seeds: [
      { id: 'Z01', name: 'Old Dhaka · Chowk', center: [90.4, 23.7187], population: 310000, elevation: 4, lowLying: 0.88, beds: 2100, icu: 290 },
      { id: 'Z02', name: 'Lalbagh', center: [90.3866, 23.7245], population: 340000, elevation: 5, lowLying: 0.85 },
      { id: 'Z03', name: 'Kamrangirchar', center: [90.3825, 23.7073], population: 400000, elevation: 3, lowLying: 0.98 },
      { id: 'Z04', name: 'Keraniganj', center: [90.345, 23.68], population: 620000, elevation: 4, lowLying: 0.96 },
      { id: 'Z05', name: 'Dhanmondi', center: [90.3767, 23.7448], population: 160000, elevation: 7, lowLying: 0.66, beds: 850, icu: 120 },
      { id: 'Z06', name: 'Mohammadpur', center: [90.3618, 23.7658], population: 355000, elevation: 8, lowLying: 0.72 },
      { id: 'Z07', name: 'Ramna · Shahbagh', center: [90.3966, 23.7375], population: 120000, elevation: 9, lowLying: 0.58, beds: 1900, icu: 260 },
      { id: 'Z08', name: 'Motijheel', center: [90.4115, 23.7266], population: 190000, elevation: 6, lowLying: 0.78 },
      { id: 'Z09', name: 'Wari', center: [90.4078, 23.7341], population: 220000, elevation: 6, lowLying: 0.74 },
      { id: 'Z10', name: 'Tejgaon Industrial', center: [90.3922, 23.7668], population: 180000, elevation: 8, lowLying: 0.62, substation: true },
      { id: 'Z11', name: 'Karwan Bazar', center: [90.3909, 23.757], population: 210000, elevation: 8, lowLying: 0.68, substation: true },
      { id: 'Z12', name: 'Gulshan', center: [90.4113, 23.7925], population: 150000, elevation: 10, lowLying: 0.5, beds: 620, icu: 110 },
      { id: 'Z13', name: 'Banani', center: [90.4023, 23.7931], population: 90000, elevation: 10, lowLying: 0.48 },
      { id: 'Z14', name: 'Khilgaon', center: [90.4247, 23.754], population: 290000, elevation: 7, lowLying: 0.7 },
      { id: 'Z15', name: 'Jatrabari · Shyampur', center: [90.429, 23.7], population: 480000, elevation: 4, lowLying: 0.94 },
      { id: 'Z16', name: 'Demra', center: [90.4517, 23.7009], population: 260000, elevation: 4, lowLying: 0.95, plant: true },
      { id: 'Z17', name: 'Mirpur', center: [90.3543, 23.8049], population: 630000, elevation: 8, lowLying: 0.78, beds: 730, icu: 100 },
      { id: 'Z18', name: 'Uttara', center: [90.4014, 23.8757], population: 450000, elevation: 12, lowLying: 0.42 },
      { id: 'Z19', name: 'Bashundhara', center: [90.4354, 23.8231], population: 180000, elevation: 11, lowLying: 0.55 },
      { id: 'Z20', name: 'Savar · Hemayetpur', center: [90.255, 23.76], population: 380000, elevation: 13, lowLying: 0.7, substation: true },
    ],
    sources: {
      imd_radar: 'BMD radar + WRF nowcast',
      gauge_net: 'BWDB river & rain gauges (46)',
      scada_grid: 'DESCO / DPDC SCADA',
      er_108_dispatch: '999 emergency dispatch',
      hospital_his: 'Hospital HIS (16 hospitals)',
      traffic_api: 'DMP traffic telemetry',
      aq_stations: 'Air quality stations (11)',
    },
  },

  // ── EXTREME HEAT · PHOENIX ───────────────────────────────────────────────────
  heat: {
    hazard: 'heat',
    name: 'Phoenix',
    nameLocal: 'Phoenix',
    country: 'United States',
    famousFor: 'The hottest big city in America — in 2023 Phoenix ran 31 consecutive days at or above 110°F, and Maricopa County recorded 645 heat deaths.',
    brief: [
      'Phoenix is a subtropical desert city of 1.6 million that has engineered itself around heat for seventy years — and is now losing that fight. Summer nights that once cooled below 30°C now stay near 36°C, so the urban core never recovers: concrete, asphalt and gravel yards bank heat around the clock.',
      'The inequality is spatial and well-measured. Low-canopy neighborhoods like Maryvale run 5–7°F hotter than leafy Arcadia at 6 pm, exactly when the body needs relief. Peak wet-bulb heat coincides with peak AC load — so the blackout that strips cooling is the deadliest branch of the tree.',
    ],
    stats: [
      { label: 'City population', value: '1.65M' },
      { label: 'Days ≥ 110°F in 2023', value: '55' },
      { label: 'Maricopa heat deaths 2023', value: '645' },
      { label: 'Urban heat island delta', value: '+5–7°F' },
    ],
    tz: { offsetH: -7, label: 'MST' },
    currency: '$',
    hexR: 3.0,
    globe: [-112.074, 33.4484],
    fit: { center: [-112.072, 33.49], zoom: 10.7, pitch: 44, bearing: 12 },
    camera: [
      { p: 0.0, center: [-112.14, 33.44], zoom: 10.3, pitch: 36, bearing: -28 },
      { p: 0.32, center: [-112.132, 33.495], zoom: 12.1, pitch: 50, bearing: 14 },
      { p: 0.62, center: [-112.074, 33.464], zoom: 12.4, pitch: 52, bearing: 62 },
      { p: 0.84, center: [-112.02, 33.51], zoom: 11.9, pitch: 48, bearing: 104 },
      { p: 1.0, center: [-112.072, 33.49], zoom: 10.5, pitch: 34, bearing: 60 },
    ],
    seeds: [
      { id: 'Z01', name: 'Downtown · Copper Sq', center: [-112.0744, 33.4484], population: 90000, elevation: 331, lowLying: 0.3, beds: 310, icu: 55 },
      { id: 'Z02', name: 'Midtown', center: [-112.073, 33.483], population: 60000, elevation: 340, lowLying: 0.28, beds: 620, icu: 120 },
      { id: 'Z03', name: 'Uptown · Biltmore', center: [-112.0325, 33.509], population: 45000, elevation: 355, lowLying: 0.22, beds: 350, icu: 60 },
      { id: 'Z04', name: 'Arcadia', center: [-111.986, 33.502], population: 40000, elevation: 390, lowLying: 0.16 },
      { id: 'Z05', name: 'Camelback East', center: [-111.966, 33.508], population: 130000, elevation: 372, lowLying: 0.2, beds: 520, icu: 95 },
      { id: 'Z06', name: 'North Mountain', center: [-112.047, 33.541], population: 85000, elevation: 362, lowLying: 0.22, beds: 480, icu: 85 },
      { id: 'Z07', name: 'Sunnyslope', center: [-112.028, 33.556], population: 60000, elevation: 371, lowLying: 0.2 },
      { id: 'Z08', name: 'Paradise Valley', center: [-111.943, 33.531], population: 13000, elevation: 396, lowLying: 0.12 },
      { id: 'Z09', name: 'Desert Ridge · Gateway', center: [-111.973, 33.679], population: 45000, elevation: 460, lowLying: 0.18 },
      { id: 'Z10', name: 'Ahwatukee', center: [-112.024, 33.372], population: 85000, elevation: 345, lowLying: 0.24 },
      { id: 'Z11', name: 'South Mountain', center: [-112.097, 33.385], population: 90000, elevation: 335, lowLying: 0.3 },
      { id: 'Z12', name: 'Laveen', center: [-112.174, 33.425], population: 60000, elevation: 317, lowLying: 0.34 },
      { id: 'Z13', name: 'Maryvale', center: [-112.132, 33.495], population: 200000, elevation: 326, lowLying: 0.4, beds: 240, icu: 40 },
      { id: 'Z14', name: 'Alhambra', center: [-112.12, 33.516], population: 130000, elevation: 332, lowLying: 0.38 },
      { id: 'Z15', name: 'West Phoenix · Estrella', center: [-112.113, 33.45], population: 120000, elevation: 322, lowLying: 0.36, substation: true },
      { id: 'Z16', name: 'Sky Harbor Airport', center: [-112.008, 33.435], population: 5000, elevation: 335, lowLying: 0.26, substation: true, plant: true },
      { id: 'Z17', name: 'Deer Valley', center: [-112.118, 33.684], population: 60000, elevation: 396, lowLying: 0.2, substation: true },
      { id: 'Z18', name: 'Anthem · New River', center: [-112.117, 33.866], population: 25000, elevation: 545, lowLying: 0.14 },
      { id: 'Z19', name: 'Garfield · Roosevelt', center: [-112.062, 33.452], population: 25000, elevation: 330, lowLying: 0.3 },
      { id: 'Z20', name: 'Salt River Corridor', center: [-111.94, 33.425], population: 15000, elevation: 328, lowLying: 0.42 },
    ],
    sources: {
      imd_radar: 'NWS Phoenix radar + GFS',
      gauge_net: 'AZMET + ASOS stations (31)',
      scada_grid: 'APS / SRP SCADA feeders',
      er_108_dispatch: '911 CAD dispatch',
      hospital_his: 'Banner + HonorHealth ED feeds (12)',
      traffic_api: 'ADOT traffic telemetry',
      aq_stations: 'Maricopa AQD stations (14)',
    },
  },

  // ── EPIDEMIC · HONG KONG ─────────────────────────────────────────────────────
  epidemic: {
    hazard: 'epidemic',
    name: 'Hong Kong',
    nameLocal: '香港',
    country: 'China · SAR',
    famousFor: 'SARS 2003 rewrote epidemic surveillance here — 1,755 cases, 299 deaths, and one housing estate that changed how the world watches for outbreaks.',
    brief: [
      'Hong Kong packs 7.4 million people into one of the densest vertical habitats on Earth — 40-storey residential towers, subdivided flats, and a 15-minute cross-harbour commute shared by millions. In 2003 SARS arrived across the border and found the perfect amplifier: the Amoy Gardens estate, where 321 residents were infected in weeks.',
      'That history made Hong Kong a global benchmark for epidemic intelligence: syndromic ED feeds, wastewater catchment maps, and hospital occupancy dashboards that update by the hour. The system cannot forecast a pathogen — but it can forecast the surge, days before ICUs feel it.',
    ],
    stats: [
      { label: 'Population', value: '7.4M' },
      { label: 'Density (Kowloon)', value: '44,000/km²' },
      { label: 'SARS 2003 cases', value: '1,755 · 299 deaths' },
      { label: 'Public hospital beds', value: '~29,000' },
    ],
    tz: { offsetH: 8, label: 'HKT' },
    currency: 'HK$',
    hexR: 1.5,
    globe: [114.1694, 22.3193],
    fit: { center: [114.178, 22.316], zoom: 11.4, pitch: 48, bearing: 18 },
    camera: [
      { p: 0.0, center: [114.17, 22.319], zoom: 11.6, pitch: 52, bearing: -18 },
      { p: 0.3, center: [114.222, 22.311], zoom: 12.3, pitch: 50, bearing: 28 },
      { p: 0.58, center: [114.175, 22.292], zoom: 12.4, pitch: 48, bearing: 66 },
      { p: 0.8, center: [114.154, 22.283], zoom: 12.0, pitch: 46, bearing: 110 },
      { p: 1.0, center: [114.178, 22.316], zoom: 10.4, pitch: 30, bearing: 40 },
    ],
    seeds: [
      { id: 'Z01', name: 'Central · Sheung Wan', center: [114.1544, 22.287], population: 100000, elevation: 12, lowLying: 0.3 },
      { id: 'Z02', name: 'Wan Chai', center: [114.173, 22.276], population: 60000, elevation: 10, lowLying: 0.28, beds: 600, icu: 80 },
      { id: 'Z03', name: 'Causeway Bay', center: [114.19, 22.28], population: 130000, elevation: 9, lowLying: 0.26 },
      { id: 'Z04', name: 'North Point', center: [114.2, 22.296], population: 120000, elevation: 11, lowLying: 0.24 },
      { id: 'Z05', name: 'Quarry Bay · Taikoo', center: [114.215, 22.286], population: 150000, elevation: 14, lowLying: 0.22 },
      { id: 'Z06', name: 'Tsim Sha Tsui', center: [114.173, 22.297], population: 90000, elevation: 8, lowLying: 0.3 },
      { id: 'Z07', name: 'Yau Ma Tei', center: [114.171, 22.313], population: 130000, elevation: 9, lowLying: 0.26, beds: 1700, icu: 210 },
      { id: 'Z08', name: 'Mong Kok', center: [114.17, 22.321], population: 160000, elevation: 10, lowLying: 0.24 },
      { id: 'Z09', name: 'Sham Shui Po', center: [114.148, 22.328], population: 180000, elevation: 10, lowLying: 0.28 },
      { id: 'Z10', name: 'Kowloon City · To Kwa Wan', center: [114.188, 22.318], population: 110000, elevation: 12, lowLying: 0.22 },
      { id: 'Z11', name: 'Wong Tai Sin', center: [114.203, 22.336], population: 220000, elevation: 26, lowLying: 0.16 },
      { id: 'Z12', name: 'Kwun Tong', center: [114.222, 22.311], population: 260000, elevation: 20, lowLying: 0.18, beds: 1400, icu: 180 },
      { id: 'Z13', name: 'Kowloon Bay · Kai Tak', center: [114.21, 22.325], population: 60000, elevation: 8, lowLying: 0.3, substation: true },
      { id: 'Z14', name: 'Sha Tin', center: [114.187, 22.371], population: 300000, elevation: 22, lowLying: 0.2, beds: 1500, icu: 220 },
      { id: 'Z15', name: 'Tsuen Wan', center: [114.117, 22.371], population: 170000, elevation: 32, lowLying: 0.18, substation: true },
      { id: 'Z16', name: 'Kwai Chung · Terminals', center: [114.132, 22.356], population: 200000, elevation: 12, lowLying: 0.24, substation: true, plant: true },
      { id: 'Z17', name: 'Tsing Yi', center: [114.104, 22.345], population: 90000, elevation: 28, lowLying: 0.16 },
      { id: 'Z18', name: 'Tuen Mun', center: [113.977, 22.391], population: 160000, elevation: 18, lowLying: 0.2, beds: 1000, icu: 130 },
      { id: 'Z19', name: 'Yuen Long', center: [114.039, 22.445], population: 170000, elevation: 15, lowLying: 0.26 },
      { id: 'Z20', name: 'Tai Po', center: [114.165, 22.451], population: 100000, elevation: 24, lowLying: 0.18, beds: 700, icu: 90 },
      { id: 'Z21', name: 'Southern · Stanley', center: [114.213, 22.238], population: 90000, elevation: 40, lowLying: 0.14 },
      { id: 'Z22', name: 'Tseung Kwan O', center: [114.26, 22.31], population: 240000, elevation: 16, lowLying: 0.2 },
    ],
    sources: {
      imd_radar: 'HKO nowcast + met feed',
      ww_survey: 'Wastewater surveillance (21 catchments)',
      scada_grid: 'CLP / HKE SCADA',
      er_108_dispatch: '999 + Fire Services dispatch',
      hospital_his: 'HA Hospital Authority feeds (18)',
      traffic_api: 'Transport Department telemetry',
      aq_stations: 'EPD air stations (16)',
    },
  },

  // ── GRID · DELHI ─────────────────────────────────────────────────────────────
  grid: {
    hazard: 'grid',
    name: 'Delhi',
    nameLocal: 'दिल्ली',
    country: 'India · NCT',
    famousFor: 'July 2012 — the largest blackout in human history. Two cascading grid collapses over 30 hours left 620 million people without power.',
    brief: [
      'The National Capital Territory of Delhi draws 4–6 GW through a ring of 400 kV substations, fed by generating complexes up to 1,000 km away. On 30–31 July 2012, that machine failed twice in thirty hours — a relay trip in Agra cascaded through the Northern Grid, and 620 million people learned how thin the margin between peak load and collapse really is.',
      'Delhi’s fragile seam is the trans-Yamuna network: aging 220 kV feeders crossing the river to serve 4 million people on the eastern bank. In summer peak, a single fault at the wrong moment pushes load onto neighbouring feeders already running near their ratings — and the cascade feeds itself.',
    ],
    stats: [
      { label: 'NCT population', value: '20.2M' },
      { label: 'Peak demand (2024)', value: '8.65 GW' },
      { label: '2012 blackout', value: '620M affected' },
      { label: '400 kV ring substations', value: '7' },
    ],
    tz: { offsetH: 5.5, label: 'IST' },
    currency: '₹',
    hexR: 2.3,
    globe: [77.209, 28.6139],
    fit: { center: [77.185, 28.607], zoom: 10.2, pitch: 44, bearing: 10 },
    camera: [
      { p: 0.0, center: [77.216, 28.628], zoom: 11.6, pitch: 46, bearing: 0 },
      { p: 0.28, center: [77.21, 28.555], zoom: 12.0, pitch: 50, bearing: 40 },
      { p: 0.55, center: [77.292, 28.622], zoom: 12.3, pitch: 54, bearing: 96 },
      { p: 0.78, center: [77.16, 28.655], zoom: 12.0, pitch: 48, bearing: 150 },
      { p: 1.0, center: [77.185, 28.607], zoom: 10.0, pitch: 32, bearing: 60 },
    ],
    seeds: [
      { id: 'Z01', name: 'Connaught Place · ND', center: [77.216, 28.632], population: 250000, elevation: 216, lowLying: 0.4, beds: 350, icu: 60 },
      { id: 'Z02', name: 'Chandni Chowk', center: [77.228, 28.658], population: 300000, elevation: 214, lowLying: 0.5 },
      { id: 'Z03', name: 'Civil Lines', center: [77.223, 28.68], population: 150000, elevation: 220, lowLying: 0.36, beds: 650, icu: 90 },
      { id: 'Z04', name: 'Karol Bagh', center: [77.19, 28.652], population: 320000, elevation: 216, lowLying: 0.38, beds: 400, icu: 70 },
      { id: 'Z05', name: 'Paharganj', center: [77.216, 28.646], population: 160000, elevation: 215, lowLying: 0.44 },
      { id: 'Z06', name: 'Patel Nagar', center: [77.166, 28.654], population: 240000, elevation: 218, lowLying: 0.34 },
      { id: 'Z07', name: 'Rajouri · Punjabi Bagh', center: [77.121, 28.652], population: 350000, elevation: 220, lowLying: 0.3, substation: true },
      { id: 'Z08', name: 'Dwarka', center: [77.032, 28.607], population: 500000, elevation: 218, lowLying: 0.32, substation: true },
      { id: 'Z09', name: 'Najafgarh', center: [76.985, 28.57], population: 250000, elevation: 218, lowLying: 0.4 },
      { id: 'Z10', name: 'Vasant Kunj', center: [77.157, 28.521], population: 200000, elevation: 250, lowLying: 0.2 },
      { id: 'Z11', name: 'AIIMS · Safdarjung', center: [77.202, 28.564], population: 150000, elevation: 230, lowLying: 0.24, beds: 2900, icu: 420 },
      { id: 'Z12', name: 'Saket · Hauz Khas', center: [77.201, 28.542], population: 200000, elevation: 235, lowLying: 0.22, beds: 700, icu: 110 },
      { id: 'Z13', name: 'Lajpat Nagar', center: [77.236, 28.569], population: 260000, elevation: 226, lowLying: 0.3 },
      { id: 'Z14', name: 'Nehru Place · Kalkaji', center: [77.251, 28.55], population: 190000, elevation: 228, lowLying: 0.28, substation: true },
      { id: 'Z15', name: 'Okhla Industrial', center: [77.287, 28.543], population: 120000, elevation: 222, lowLying: 0.34, substation: true, plant: true },
      { id: 'Z16', name: 'Mayur Vihar', center: [77.289, 28.608], population: 320000, elevation: 212, lowLying: 0.78, substation: true },
      { id: 'Z17', name: 'Shahdara · Seelampur', center: [77.299, 28.673], population: 520000, elevation: 212, lowLying: 0.82, substation: true },
      { id: 'Z18', name: 'Geeta Colony · Preet Vihar', center: [77.287, 28.63], population: 300000, elevation: 214, lowLying: 0.76 },
      { id: 'Z19', name: 'Narela · Bawana', center: [77.058, 28.81], population: 200000, elevation: 224, lowLying: 0.3, substation: true, plant: true },
      { id: 'Z20', name: 'Mehrauli', center: [77.186, 28.518], population: 120000, elevation: 245, lowLying: 0.22 },
    ],
    sources: {
      imd_radar: 'IMD Delhi radar + nowcast',
      gauge_net: 'DDA drain & Yamuna gauges (38)',
      scada_grid: 'Delhi SLDC / DTTL SCADA',
      er_108_dispatch: '108 CATS ambulance dispatch',
      hospital_his: 'Hospital HIS (22 hospitals)',
      traffic_api: 'DIMTS traffic telemetry',
      aq_stations: 'CPCB / DPCC air stations (40)',
    },
  },

  // ── EARTHQUAKE · TOKYO ───────────────────────────────────────────────────────
  quake: {
    hazard: 'quake',
    name: 'Tokyo',
    nameLocal: '東京',
    country: 'Japan',
    famousFor: 'The most earthquake-prepared megacity on Earth. The government puts a 70% chance on a M7+ direct hit within 30 years — its own scenario projects ~9,700 deaths.',
    brief: [
      'Tokyo has been rehearsing for the next Great Kantō earthquake for a century. The 1923 quake killed more than 100,000; the rebuilt capital responded with the world’s strictest seismic codes, its densest sensor network, and a population that drills for the event every September 1st.',
      'The metropolis government’s own scenario — a M7.3 rupture beneath northern Tokyo Bay — projects 9,700 deaths and 30,000 destroyed buildings. The physics are spatial: the soft alluvial east (Kōtō, Sumida, Adachi) amplifies shaking and liquefies, while the wooden-house districts of Taitō and Arakawa carry the fire risk. The model owns everything after the first P-wave.',
    ],
    stats: [
      { label: '23 wards population', value: '9.7M' },
      { label: 'Tokyo Gov. scenario', value: 'M7.3 · direct hit' },
      { label: 'Projected deaths', value: '~9,700' },
      { label: 'Aftershock window', value: '72h+ (ETAS)' },
    ],
    tz: { offsetH: 9, label: 'JST' },
    currency: '¥',
    hexR: 1.7,
    globe: [139.6917, 35.6895],
    fit: { center: [139.74, 35.69], zoom: 11.1, pitch: 46, bearing: 14 },
    camera: [
      { p: 0.0, center: [139.83, 35.65], zoom: 10.2, pitch: 34, bearing: -14 },
      { p: 0.3, center: [139.702, 35.694], zoom: 12.4, pitch: 55, bearing: 28 },
      { p: 0.58, center: [139.826, 35.69], zoom: 12.7, pitch: 58, bearing: 78 },
      { p: 0.8, center: [139.775, 35.715], zoom: 12.3, pitch: 54, bearing: 118 },
      { p: 1.0, center: [139.74, 35.69], zoom: 10.4, pitch: 36, bearing: 55 },
    ],
    seeds: [
      { id: 'Z01', name: 'Chiyoda', center: [139.754, 35.694], population: 67000, elevation: 12, lowLying: 0.5, beds: 250, icu: 40 },
      { id: 'Z02', name: 'Chūō', center: [139.772, 35.672], population: 170000, elevation: 5, lowLying: 0.9 },
      { id: 'Z03', name: 'Minato', center: [139.751, 35.658], population: 260000, elevation: 10, lowLying: 0.56, beds: 1100, icu: 170 },
      { id: 'Z04', name: 'Shinjuku', center: [139.702, 35.694], population: 350000, elevation: 38, lowLying: 0.3, beds: 1900, icu: 230 },
      { id: 'Z05', name: 'Shibuya', center: [139.701, 35.664], population: 230000, elevation: 25, lowLying: 0.34, beds: 900, icu: 140 },
      { id: 'Z06', name: 'Meguro', center: [139.698, 35.641], population: 290000, elevation: 30, lowLying: 0.28 },
      { id: 'Z07', name: 'Shinagawa', center: [139.741, 35.613], population: 420000, elevation: 15, lowLying: 0.6, beds: 800, icu: 120 },
      { id: 'Z08', name: 'Ōta · Haneda', center: [139.724, 35.563], population: 740000, elevation: 5, lowLying: 0.84, substation: true },
      { id: 'Z09', name: 'Kōtō delta', center: [139.826, 35.673], population: 520000, elevation: 3, lowLying: 0.95, substation: true },
      { id: 'Z10', name: 'Sumida', center: [139.804, 35.711], population: 275000, elevation: 4, lowLying: 0.93 },
      { id: 'Z11', name: 'Taitō · Asakusa', center: [139.779, 35.713], population: 210000, elevation: 8, lowLying: 0.74 },
      { id: 'Z12', name: 'Arakawa', center: [139.784, 35.737], population: 210000, elevation: 6, lowLying: 0.88 },
      { id: 'Z13', name: 'Katsushika', center: [139.846, 35.758], population: 460000, elevation: 5, lowLying: 0.9 },
      { id: 'Z14', name: 'Adachi', center: [139.806, 35.778], population: 690000, elevation: 7, lowLying: 0.86, beds: 1000, icu: 150 },
      { id: 'Z15', name: 'Itabashi', center: [139.684, 35.756], population: 580000, elevation: 20, lowLying: 0.5 },
      { id: 'Z16', name: 'Nerima', center: [139.647, 35.736], population: 740000, elevation: 35, lowLying: 0.35 },
      { id: 'Z17', name: 'Setagaya', center: [139.648, 35.646], population: 940000, elevation: 40, lowLying: 0.3 },
      { id: 'Z18', name: 'Nakano', center: [139.665, 35.708], population: 340000, elevation: 35, lowLying: 0.32 },
      { id: 'Z19', name: 'Suginami', center: [139.635, 35.7], population: 590000, elevation: 45, lowLying: 0.26 },
      { id: 'Z20', name: 'Bunkyō', center: [139.76, 35.711], population: 230000, elevation: 25, lowLying: 0.4, beds: 2600, icu: 300 },
    ],
    sources: {
      imd_radar: 'JMA / NIED seismic feed',
      gauge_net: 'JMA strong-motion net (67)',
      scada_grid: 'TEPCO SCADA feeders',
      er_108_dispatch: '119 fire & EMS dispatch',
      hospital_his: 'DMAT hospital feeds (24)',
      traffic_api: 'METI road telemetry',
      aq_stations: 'Gas & air sensors (12)',
    },
  },

  // ── CHEMICAL LEAK · BHOPAL ───────────────────────────────────────────────────
  chem: {
    hazard: 'chem',
    name: 'Bhopal',
    nameLocal: 'भोपाल',
    country: 'India',
    famousFor: 'The city that wrote the world’s industrial-disaster laws. December 1984 changed every chemical safety case on Earth — Bhopal remembers, and prepares.',
    brief: [
      'Bhopal carries the heaviest name in industrial safety. The December 1984 methyl isocyanate release killed thousands and rewrote India’s environmental law, the US Emergency Planning and Community Right-to-Know Act, and factory siting rules worldwide. Today the city runs its own disaster management authority and drills for the scenario its history made canonical.',
      'The geography still concentrates risk: a chemical and heavy-engineering belt (Govindpura) sits directly upwind of the dense walled city in winter, when a stable northeast drift carries any release across 400,000 people within two hours. Every minute of modelling lead moves thousands out of the footprint.',
    ],
    stats: [
      { label: 'Metro population', value: '2.1M' },
      { label: 'Elevation (Malwa plateau)', value: '~500 m' },
      { label: 'Govindpura units', value: '250+ industrial' },
      { label: '1984 release', value: '~30 t MIC' },
    ],
    tz: { offsetH: 5.5, label: 'IST' },
    currency: '₹',
    hexR: 1.6,
    globe: [77.4126, 23.2599],
    fit: { center: [77.432, 23.245], zoom: 11.3, pitch: 46, bearing: 6 },
    camera: [
      { p: 0.0, center: [77.452, 23.266], zoom: 11.6, pitch: 42, bearing: -18 },
      { p: 0.3, center: [77.456, 23.274], zoom: 12.6, pitch: 55, bearing: 12 },
      { p: 0.6, center: [77.427, 23.262], zoom: 12.4, pitch: 52, bearing: 46 },
      { p: 0.82, center: [77.414, 23.258], zoom: 12.5, pitch: 50, bearing: 78 },
      { p: 1.0, center: [77.432, 23.245], zoom: 10.8, pitch: 34, bearing: 24 },
    ],
    seeds: [
      { id: 'Z01', name: 'Chowk · Old Bhopal', center: [77.414, 23.258], population: 180000, elevation: 500, lowLying: 0.42, beds: 1000, icu: 130 },
      { id: 'Z02', name: 'Idgah Hills', center: [77.421, 23.269], population: 90000, elevation: 528, lowLying: 0.2 },
      { id: 'Z03', name: 'MP Nagar', center: [77.436, 23.242], population: 140000, elevation: 505, lowLying: 0.34 },
      { id: 'Z04', name: 'Arera Colony', center: [77.45, 23.229], population: 100000, elevation: 512, lowLying: 0.3, beds: 700, icu: 90 },
      { id: 'Z05', name: 'Shahpura', center: [77.464, 23.213], population: 90000, elevation: 510, lowLying: 0.28 },
      { id: 'Z06', name: 'Kolar Road', center: [77.42, 23.2], population: 150000, elevation: 520, lowLying: 0.24 },
      { id: 'Z07', name: 'Habibganj · Bittan', center: [77.433, 23.204], population: 130000, elevation: 508, lowLying: 0.3 },
      { id: 'Z08', name: 'Bairagarh', center: [77.355, 23.288], population: 160000, elevation: 500, lowLying: 0.32 },
      { id: 'Z09', name: 'Karond · Budhwara', center: [77.427, 23.262], population: 150000, elevation: 505, lowLying: 0.38 },
      { id: 'Z10', name: 'Nehru Nagar', center: [77.444, 23.256], population: 90000, elevation: 502, lowLying: 0.36 },
      { id: 'Z11', name: 'Ayodhya Bypass', center: [77.478, 23.285], population: 70000, elevation: 515, lowLying: 0.26 },
      { id: 'Z12', name: 'Indrapuri · Bhanpur', center: [77.424, 23.243], population: 120000, elevation: 500, lowLying: 0.4 },
      { id: 'Z13', name: 'Piplani · Ratnagiri', center: [77.452, 23.238], population: 100000, elevation: 507, lowLying: 0.32 },
      { id: 'Z14', name: 'Saket Nagar', center: [77.46, 23.23], population: 80000, elevation: 511, lowLying: 0.3, beds: 950, icu: 140 },
      { id: 'Z15', name: 'Govindpura Industrial', center: [77.456, 23.274], population: 80000, elevation: 505, lowLying: 0.44, substation: true, plant: true },
      { id: 'Z16', name: 'Mangalwara', center: [77.41, 23.265], population: 100000, elevation: 498, lowLying: 0.44 },
      { id: 'Z17', name: 'Koh-e-Fiza', center: [77.401, 23.261], population: 90000, elevation: 495, lowLying: 0.46 },
      { id: 'Z18', name: 'Lalghati · North', center: [77.416, 23.281], population: 130000, elevation: 495, lowLying: 0.42 },
      { id: 'Z19', name: 'Danish Nagar', center: [77.444, 23.199], population: 70000, elevation: 515, lowLying: 0.26 },
      { id: 'Z20', name: 'Ashoka Garden', center: [77.435, 23.262], population: 120000, elevation: 502, lowLying: 0.38 },
    ],
    sources: {
      imd_radar: 'Plant + IMD met telemetry',
      gauge_net: 'Met & effluent gauges (18)',
      scada_grid: 'MPPKVVCL SCADA',
      er_108_dispatch: '108 ambulance dispatch',
      hospital_his: 'Hospital HIS (11 hospitals)',
      traffic_api: 'Traffic police feed',
      aq_stations: 'Gas sensors — AEGL grid (14)',
    },
  },
}

export const CITY_OF = CITIES

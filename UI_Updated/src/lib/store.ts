'use client'
// ——— session state • phase machine + scroll-driven playback + backend synchronization ———
import { create } from 'zustand'
import type { Episode, HazardId } from './sim/types'
import { generateEpisode } from './sim/generate'
import { HAZARD_BY_ID } from './sim/hazards'
import { CascadeAPI } from './api'

export type Phase = 'select' | 'brief' | 'sim' | 'pipeline' | 'forecast' | 'epilogue'
export type ForecastTab = 'overview' | 'cascade' | 'zones' | 'intervene' | 'trust'

const cache = new Map<HazardId, Episode>()

export function getEpisode(hazard: HazardId): Episode {
  let ep = cache.get(hazard)
  if (!ep) {
    ep = generateEpisode(hazard)
    cache.set(hazard, ep)
  }
  return ep
}

interface ConsoleState {
  phase: Phase
  hazard: HazardId | null
  episode: Episode | null
  /** playhead, fractional hours [simStart .. 72] */
  tHour: number
  playing: boolean
  /** sim-hours per real second (forecast phase only) */
  speed: number
  tab: ForecastTab
  selectedZone: string | null
  deployed: string[]
  chainId: string | null
  start: (h: HazardId) => void
  reset: () => void
  enterPhase: (p: Phase) => void
  setTHour: (t: number) => void
  /** sim scroll progress 0..1 → time + phase transitions */
  setSimProgress: (p: number) => void
  advance: (dtSec: number) => void
  play: () => void
  pause: () => void
  setSpeed: (s: number) => void
  setTab: (t: ForecastTab) => void
  selectZone: (z: string | null) => void
  toggleDeploy: (id: string) => void
  setChain: (id: string) => void
}

export const useConsole = create<ConsoleState>((set, get) => ({
  phase: 'select',
  hazard: null,
  episode: null,
  tHour: -36,
  playing: false,
  speed: 2,
  tab: 'overview',
  selectedZone: null,
  deployed: [],
  chainId: null,

  start: (h) => {
    const ep = getEpisode(h)
    set({
      hazard: h, episode: ep, phase: 'brief',
      tHour: ep.simStart, playing: false, speed: 2,
      tab: 'overview', selectedZone: null, deployed: [], chainId: ep.chains[0]?.id ?? null,
    })
    // Sync active scenario with real backend in background
    CascadeAPI.setScenario(h).catch(() => {})
  },
  reset: () => set({ phase: 'select', hazard: null, episode: null, playing: false, tHour: -36, deployed: [], selectedZone: null }),
  enterPhase: (p) => {
    if (get().phase !== p) set({ phase: p })
  },
  setTHour: (t) => {
    const ep = get().episode
    if (!ep) return
    set({ tHour: Math.max(ep.simStart, Math.min(ep.horizon, t)) })
  },
  setSimProgress: (p) => {
    const st = get()
    const ep = st.episode
    if (!ep) return
    const q = Math.max(0, Math.min(1, p))
    const t = ep.simStart + q * -ep.simStart
    if (st.phase === 'brief' && q > 0.015) set({ phase: 'sim', tHour: t })
    else if (st.phase === 'sim') {
      if (q >= 0.995) set({ phase: 'pipeline', tHour: 0, playing: false })
      else set({ tHour: t })
    }
  },
  advance: (dtSec) => {
    const { playing, tHour, speed, episode, phase } = get()
    if (!playing || !episode || phase !== 'forecast') return
    const next = tHour + speed * dtSec
    if (next >= episode.horizon) set({ tHour: episode.horizon, playing: false })
    else set({ tHour: next })
  },
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  setSpeed: (s) => set({ speed: s }),
  setTab: (t) => set({ tab: t }),
  selectZone: (z) => set({ selectedZone: z }),
  toggleDeploy: (id) =>
    set((s) => {
      const next = s.deployed.includes(id) ? s.deployed.filter((x) => x !== id) : [...s.deployed, id]
      // Sync interventions with real backend in background
      CascadeAPI.intervene(next).catch(() => {})
      return { deployed: next }
    }),
  setChain: (id) => set({ chainId: id }),
}))

/** subscribe to tHour outside React (map/effects 60fps path) */
export function onHour(fn: (t: number) => void) {
  return useConsole.subscribe((s) => fn(s.tHour))
}

export function hazardMeta(id: HazardId | null) {
  return id ? HAZARD_BY_ID[id] : null
}

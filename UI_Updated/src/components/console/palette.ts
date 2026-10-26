// ─── shared palette · layer colors + risk helpers ────────────────────────────
import type { LayerCode } from '@/lib/sim/types'

export const LAYER_COLOR: Record<LayerCode, string> = {
  WX: '#64d2ff', HYD: '#4cc2ff', TRF: '#ffd60a', PWR: '#ffe45c',
  EMS: '#ff9f0a', HOS: '#ff6482', HLT: '#bf5af2', AIR: '#66d4cf',
  SEI: '#ff453a', COM: '#a0a0a8',
}

export const TONE_COLOR: Record<string, string> = {
  info: 'rgba(255,255,255,0.3)', warn: '#ffd60a', alert: '#ff9f0a', crit: '#ff453a',
}

export const SOURCE_COLOR: Record<string, string> = {
  sensor: '#64d2ff', feed: '#bf5af2', citizen: '#ffd60a', forecast: '#30d158', official: '#ff6482',
}

// ─── deterministic rng + shaping curves + formatting ─────────────────────────

/** mulberry32 — deterministic, fast, good enough for synthetic data */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** stable hash of a string → 32-bit int (for per-zone seeds) */
export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u

/** linear ramp 0→1 between t0 and t1 */
export const ramp = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0))
/** smooth (ease-in-out) ramp */
export const sramp = (t: number, t0: number, t1: number) => {
  const u = ramp(t, t0, t1)
  return u * u * (3 - 2 * u)
}
export const logistic = (x: number, k = 8) => 1 / (1 + Math.exp(-k * x))
/** gaussian bump centred at tPeak */
export const bump = (t: number, tPeak: number, width: number) =>
  Math.exp(-((t - tPeak) ** 2) / (2 * width * width))
/** Omori-like decay after t0 (p ≈ 1.1) */
export const omori = (t: number, t0: number, k = 1.1) => (t <= t0 ? 0 : 1 / Math.pow(t - t0 + 0.6, k))
/** piecewise-linear sample: points = [[t, v], ...] sorted by t */
export function pw(points: [number, number][], t: number): number {
  if (t <= points[0][0]) return points[0][1]
  const last = points[points.length - 1]
  if (t >= last[0]) return last[1]
  for (let i = 1; i < points.length; i++) {
    if (t <= points[i][0]) {
      const [t0, v0] = points[i - 1]
      const [t1, v1] = points[i]
      return lerp(v0, v1, (t - t0) / (t1 - t0))
    }
  }
  return last[1]
}

// ── formatting ───────────────────────────────────────────────────────────────

/** hour offset → "T−18:00" / "T+04:00" */
export function fmtT(t: number): string {
  const sign = t < 0 ? '−' : '+'
  const a = Math.abs(t)
  const h = Math.floor(a)
  const m = Math.round((a - h) * 60)
  const hh = m === 60 ? h + 1 : h
  const mm = m === 60 ? 0 : m
  return `T${sign}${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/** hour offset → local wall clock "09 NOV 14:00 BST" for a city timezone */
export function fmtClock(t: number, offsetH = 5.5, label = 'IST'): string {
  const base = Date.UTC(2025, 10, 9, 0, 0, 0) + offsetH * 3600_000
  const d = new Date(base + t * 3600_000)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const mon = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getUTCMonth()]
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${day} ${mon} ${hh}:${mm} ${label}`
}

export const fmtPop = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : `${n}`)

export const fmtPct = (p: number, digits = 0) => `${(p * 100).toFixed(digits)}%`

export const riskOf = (v: number): 0 | 1 | 2 | 3 => (v >= 2.55 ? 3 : v >= 1.6 ? 2 : v >= 0.72 ? 1 : 0)

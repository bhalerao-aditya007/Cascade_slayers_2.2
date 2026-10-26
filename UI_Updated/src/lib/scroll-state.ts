'use client'
// ─── scroll state singleton · 60fps path, zero React re-renders ───────────────
// Written by the Experience scroll engine; read by globe/map rAF loops.

export const scrollState = {
  /** select section: float card index 0..5 (damped value for the globe) */
  cardFloat: 0,
  /** raw card float target (set by scroll, read + damped by consumers) */
  cardTarget: 0,
  /** city-brief progress 0..1 */
  briefP: 0,
  /** simulation scroll progress 0..1 (drives time + camera path) */
  simP: 0,
  /** pointer parallax −1..1 */
  px: 0,
  py: 0,
}

export const damp = (cur: number, target: number, k = 0.09) => cur + (target - cur) * k

'use client'
// ─── shared lenis instance (set by Experience, used for programmatic scrolls) ──
import type Lenis from 'lenis'

export const lenisRef: { current: Lenis | null } = { current: null }

export function scrollToId(id: string, opts?: { offset?: number; duration?: number }) {
  const el = document.querySelector(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY + (opts?.offset ?? 0)
  scrollToY(y, opts?.duration ?? 1.6)
}

export function scrollToY(y: number, duration = 1.4) {
  if (lenisRef.current) {
    lenisRef.current.resize() // recompute limit (page height changes when the session mounts)
    lenisRef.current.scrollTo(y, { duration })
  } else {
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

export function scrollToTop(duration = 1.4) {
  if (lenisRef.current) lenisRef.current.scrollTo(0, { duration })
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}

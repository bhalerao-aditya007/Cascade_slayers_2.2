'use client'
// ─── per-frame 2D effects overlay · rain / plume / shockwaves / arcs ─────────
import { useEffect, useRef } from 'react'
import type { Map as MLMap } from 'maplibre-gl'
import { useConsole } from '@/lib/store'
import { neighborsFor } from '@/lib/sim/zones'
import { idxOf } from '@/lib/sim/generate'

export default function EffectsCanvas({ mapRef }: { mapRef: React.MutableRefObject<MLMap | null> }) {
  const cvRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0, h = 0, dpr = 1
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = cv.clientWidth; h = cv.clientHeight
      cv.width = w * dpr; cv.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(cv)

    // particle pools
    const rain: { x: number; y: number; v: number; len: number }[] = []
    const embers: { x: number; y: number; v: number; s: number; drift: number }[] = []
    const plumePuffs: { off: number; lat: number; s: number; v: number }[] = []
    const ripples: { x: number; y: number; r: number; a: number; hue: string }[] = []
    /** one-shot ring triggers keyed by event id → timestamp */
    const triggers: Record<string, number> = {}

    const project = (lng: number, lat: number) => {
      const map = mapRef.current
      if (!map) return null
      const p = map.project([lng, lat])
      return { x: p.x, y: p.y }
    }

    const shakeState = { amp: 0 }

    const draw = (tm: number) => {
      raf = requestAnimationFrame(draw)
      const map = mapRef.current
      const st = useConsole.getState()
      const ep = st.episode
      ctx.clearRect(0, 0, w, h)
      if (!map || !ep || st.phase === 'select' || st.phase === 'pipeline') return
      const t = st.tHour
      const fx = ep.fx

      // ── screen shake (quake mainshock crossing) ───────────────────────
      const container = cv.parentElement
      if (container && fx.kind === 'quake') {
        const near = Math.abs(t - 0) < 0.35
        if (near) shakeState.amp = Math.min(shakeState.amp + 2.2, 9)
      }
      if (shakeState.amp > 0.05 && container) {
        shakeState.amp *= 0.92
        const a = shakeState.amp
        container.style.transform = `translate(${(Math.random() - 0.5) * a}px, ${(Math.random() - 0.5) * a}px)`
        if (shakeState.amp <= 0.05) container.style.transform = ''
      }

      // ── FLOOD · rain streaks + water ripples ──────────────────────────
      if (fx.kind === 'flood') {
        const i = idxOf(ep, t)
        const rainRate = fx.rain[i] ?? 0
        const target = Math.round(rainRate * 4.6)
        while (rain.length < target) rain.push({ x: Math.random() * w, y: Math.random() * h, v: 10 + Math.random() * 8, len: 11 + Math.random() * 12 })
        if (rain.length > target) rain.length = target
        ctx.strokeStyle = 'rgba(160, 200, 255, 0.5)'
        ctx.lineWidth = 1.3
        ctx.beginPath()
        for (const d of rain) {
          d.y += d.v; d.x += d.v * 0.24
          if (d.y > h) { d.y = -12; d.x = Math.random() * w }
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x - d.len * 0.24, d.y - d.len)
        }
        ctx.stroke()
        // ripples on waterlogged zones
        if (Math.random() < 0.14) {
          for (const z of ep.zones) {
            const depth = z.series.indicator[i]
            if (depth > 22 && Math.random() < (depth / 90)) {
              const p = project(z.center[0], z.center[1])
              if (p) ripples.push({ x: p.x, y: p.y, r: 3, a: 0.5, hue: '90,170,255' })
            }
          }
        }
      }

      // ── HEAT · rising embers + warm vignette ──────────────────────────
      if (fx.kind === 'heat') {
        const i = idxOf(ep, t)
        const inten = fx.intensity[i] ?? 0
        const target = Math.round(inten * 90)
        while (embers.length < target) embers.push({ x: Math.random() * w, y: Math.random() * h, v: 0.25 + Math.random() * 0.7, s: 0.8 + Math.random() * 1.6, drift: Math.random() * 2 * Math.PI })
        if (embers.length > target) embers.length = target
        for (const e of embers) {
          e.y -= e.v; e.drift += 0.02
          e.x += Math.sin(e.drift) * 0.35
          if (e.y < -4) { e.y = h + 4; e.x = Math.random() * w }
          ctx.fillStyle = `rgba(255,170,90,${0.12 + 0.3 * inten})`
          ctx.beginPath(); ctx.arc(e.x, e.y, e.s, 0, Math.PI * 2); ctx.fill()
        }
        const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
        g.addColorStop(0, 'rgba(255,120,40,0)')
        g.addColorStop(1, `rgba(255,110,30,${0.05 + inten * 0.13})`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      // ── EPIDEMIC · pulsing cluster dots + transmission arcs ───────────
      if (fx.kind === 'epidemic') {
        const i = idxOf(ep, t)
        for (const z of ep.zones) {
          const v = z.series.indicator[i]
          if (v < 1.15) continue
          const p = project(z.center[0], z.center[1])
          if (!p) continue
          const inten = Math.min((v - 1) / 2.2, 1)
          const pulse = 0.5 + 0.5 * Math.sin(tm * 0.004 * (1 + inten * 1.6) + z.center[0] * 40)
          const r = 3 + inten * 9 + pulse * 3
          ctx.fillStyle = `rgba(191,90,242,${0.10 + inten * 0.22})`
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = `rgba(191,90,242,${0.32 * pulse})`
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.arc(p.x, p.y, r + 4 + pulse * 5, 0, Math.PI * 2); ctx.stroke()
        }
        // arcs along adjacency
        ctx.lineWidth = 1
        const nbrs = neighborsFor(ep.hazard)
        for (const z of ep.zones) {
          const vi = z.series.indicator[i]
          if (vi < 1.7) continue
          for (const nid of nbrs[z.id] ?? []) {
            const n = ep.zones.find((q) => q.id === nid)
            if (!n) continue
            const vn = n.series.indicator[i]
            if (vn < 1.35) continue
            const a = project(z.center[0], z.center[1])
            const b = project(n.center[0], n.center[1])
            if (!a || !b) continue
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 26
            const flow = (tm * 0.00035 + z.center[1] * 20) % 1
            const qx = (1 - flow) ** 2 * a.x + 2 * (1 - flow) * flow * mx + flow ** 2 * b.x
            const qy = (1 - flow) ** 2 * a.y + 2 * (1 - flow) * flow * my + flow ** 2 * b.y
            ctx.strokeStyle = 'rgba(191,90,242,0.10)'
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke()
            ctx.fillStyle = 'rgba(216,160,255,0.75)'
            ctx.beginPath(); ctx.arc(qx, qy, 1.7, 0, Math.PI * 2); ctx.fill()
          }
        }
      }

      // ── GRID · trip flashes from origin + outage flicker ──────────────
      if (fx.kind === 'grid') {
        const i = idxOf(ep, t)
        const origin = ep.zones.find((q) => q.id === fx.origin)
        if (origin) {
        for (const trip of fx.trips) {
          const age = t - trip.t
          if (age < 0 || age > 1.4) continue
          const a = project(origin.center[0], origin.center[1])
          const zt = ep.zones.find((q) => q.id === trip.zone)
          if (!zt) continue
          const b = project(zt.center[0], zt.center[1])
          if (!a || !b) continue
          const u = Math.min(age / 1.4, 1)
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 34
          const qx = (1 - u) ** 2 * a.x + 2 * (1 - u) * u * mx + u ** 2 * b.x
          const qy = (1 - u) ** 2 * a.y + 2 * (1 - u) * u * my + u ** 2 * b.y
          ctx.strokeStyle = `rgba(255,214,10,${0.7 * (1 - u)})`
          ctx.lineWidth = 1.6
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke()
          ctx.fillStyle = `rgba(255,240,160,${1 - u})`
          ctx.beginPath(); ctx.arc(qx, qy, 2.6, 0, Math.PI * 2); ctx.fill()
        }
        // flicker on dark zones
        for (const z of ep.zones) {
          const sev = z.series.layers.PWR[i]
          if (sev < 1.8) continue
          const p = project(z.center[0], z.center[1])
          if (!p) continue
          const fl = Math.random() < 0.06
          if (fl) {
            ctx.fillStyle = 'rgba(255,214,10,0.5)'
            ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill()
          }
        }
        // origin substation pulse
        const op = project(origin.center[0], origin.center[1])
        if (op && t >= -4) {
          const pulse = 0.5 + 0.5 * Math.sin(tm * 0.005)
          ctx.strokeStyle = `rgba(255,214,10,${0.25 + pulse * 0.3})`
          ctx.lineWidth = 1.4
          ctx.beginPath(); ctx.arc(op.x, op.y, 7 + pulse * 4, 0, Math.PI * 2); ctx.stroke()
        }
        }
      }

      // ── QUAKE · shockwave rings + epicenter + aftershocks ─────────────
      if (fx.kind === 'quake') {
        const drawRing = (lng: number, lat: number, birth: number, strength: number, label?: string) => {
          const ageSec = (tm - birth) / 1000
          if (ageSec < 0 || ageSec > 2.4) return
          const p = project(lng, lat)
          if (!p) return
          const prog = ageSec / 2.4
          for (let k = 0; k < 3; k++) {
            const pp = Math.max(0, prog - k * 0.13)
            if (pp <= 0) continue
            const r = pp * (60 + strength * 34)
            const a = (1 - pp) * 0.55 * (1 - k * 0.28)
            ctx.strokeStyle = `rgba(255,89,80,${a})`
            ctx.lineWidth = 2 - k * 0.5
            ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke()
          }
          if (label && prog < 1.1) {
            ctx.font = '600 10px var(--font-geist-mono), monospace'
            ctx.fillStyle = `rgba(255,159,150,${1 - prog})`
            ctx.fillText(label, p.x + 12, p.y - 10)
          }
        }
        // re-trigger mainshock when playhead crosses 0 (or sits near it)
        if (t >= 0 && t < 0.6 && !triggers['main']) triggers['main'] = tm
        if (t < -0.2 || t > 1.2) delete triggers['main']
        const mainBirth = triggers['main']
        if (mainBirth) drawRing(fx.epicenter[0], fx.epicenter[1], mainBirth, 3, `M${fx.mainMag.toFixed(1)} · MAINSHOCK`)
        for (const aft of fx.aftershocks) {
          if (t < aft.t || t > aft.t + 0.5) continue
          if (!triggers[`a${aft.t}`] && t >= aft.t) triggers[`a${aft.t}`] = tm
          const b = triggers[`a${aft.t}`]
          if (b) drawRing(fx.epicenter[0] + 0.03, fx.epicenter[1] - 0.02, b, (aft.mag / 6.2) * 1.6, `M${aft.mag.toFixed(1)}`)
          if (t > aft.t + 0.45) delete triggers[`a${aft.t}`]
        }
        // epicenter crosshair
        if (t >= 0) {
          const p = project(fx.epicenter[0], fx.epicenter[1])
          if (p) {
            ctx.strokeStyle = 'rgba(255,69,58,0.85)'
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.moveTo(p.x - 10, p.y); ctx.lineTo(p.x + 10, p.y)
            ctx.moveTo(p.x, p.y - 10); ctx.lineTo(p.x, p.y + 10)
            ctx.stroke()
            ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.stroke()
          }
        }
      }

      // ── CHEM · drifting plume cone + particles ────────────────────────
      if (fx.kind === 'chem') {
        const since = t - fx.releaseT
        if (since > -0.1) {
          const p = project(fx.source[0], fx.source[1])
          if (p) {
            // plume cone in screen space: length grows with time & wind, alpha decays
            const br = (fx.windBearing * Math.PI) / 180
            const dLng = 1 / (111.32 * Math.cos((fx.source[1] * Math.PI) / 180))
            const dLat = 1 / 110.57
            const lenKm = Math.min(1.4 + since * 2.1, 13.5)
            const widKm = Math.min(0.7 + since * 0.42, 4.2)
            // convert km to px via two projections
            const tipLng = fx.source[0] + Math.sin(br) * lenKm * dLng
            const tipLat = fx.source[1] + Math.cos(br) * lenKm * dLat
            const sideKm = widKm / 2
            const lLng = fx.source[0] + Math.sin(br - Math.PI / 2) * sideKm * dLng + Math.sin(br) * lenKm * 0.55 * dLng
            const lLat = fx.source[1] + Math.cos(br - Math.PI / 2) * sideKm * dLat + Math.cos(br) * lenKm * 0.55 * dLat
            const rLng = fx.source[0] + Math.sin(br + Math.PI / 2) * sideKm * dLng + Math.sin(br) * lenKm * 0.55 * dLng
            const rLat = fx.source[1] + Math.cos(br + Math.PI / 2) * sideKm * dLat + Math.cos(br) * lenKm * 0.55 * dLat
            const tip = project(tipLng, tipLat)
            const lp = project(lLng, lLat)
            const rp = project(rLng, rLat)
            if (tip && lp && rp) {
              const decay = Math.exp(-Math.max(0, since - 6) / 14)
              const g = ctx.createLinearGradient(p.x, p.y, tip.x, tip.y)
              g.addColorStop(0, `rgba(190,255,170,${0.34 * decay})`)
              g.addColorStop(0.55, `rgba(150,230,150,${0.2 * decay})`)
              g.addColorStop(1, `rgba(120,200,140,0.02)`)
              ctx.fillStyle = g
              ctx.beginPath()
              ctx.moveTo(p.x, p.y)
              ctx.quadraticCurveTo((p.x + tip.x) / 2 + (lp.x - p.x) * 1.6, (p.y + tip.y) / 2 + (lp.y - p.y) * 1.6, tip.x, tip.y)
              ctx.quadraticCurveTo((p.x + tip.x) / 2 + (rp.x - p.x) * 1.6, (p.y + tip.y) / 2 + (rp.y - p.y) * 1.6, p.x, p.y)
              ctx.fill()
              // source marker
              const pulse = 0.5 + 0.5 * Math.sin(tm * 0.006)
              ctx.strokeStyle = `rgba(190,255,170,${0.5 + pulse * 0.4})`
              ctx.lineWidth = 1.4
              ctx.beginPath(); ctx.arc(p.x, p.y, 6 + pulse * 3, 0, Math.PI * 2); ctx.stroke()
              ctx.fillStyle = 'rgba(200,255,190,0.9)'
              ctx.font = '600 10px var(--font-geist-mono), monospace'
              ctx.fillText('Cl₂ RELEASE', p.x + 12, p.y - 8)
              // drifting puffs along axis
              if (plumePuffs.length < 46) plumePuffs.push({ off: Math.random(), lat: Math.random() * 2 - 1, s: 1 + Math.random() * 2.2, v: 0.0016 + Math.random() * 0.002 })
              for (const pf of plumePuffs) {
                pf.off += pf.v
                if (pf.off > 1) { pf.off = 0; pf.lat = Math.random() * 2 - 1 }
                const cx = p.x + (tip.x - p.x) * pf.off + (rp.x - lp.x) * 0.5 * pf.lat * (0.25 + pf.off * 0.75)
                const cy = p.y + (tip.y - p.y) * pf.off + (rp.y - lp.y) * 0.5 * pf.lat * (0.25 + pf.off * 0.75)
                ctx.fillStyle = `rgba(190,255,180,${(0.3 - pf.off * 0.26) * decay})`
                ctx.beginPath(); ctx.arc(cx, cy, pf.s, 0, Math.PI * 2); ctx.fill()
              }
            }
          }
        }
      }

      // ── shared ripples (flood) ─────────────────────────────────────────
      for (let k = ripples.length - 1; k >= 0; k--) {
        const rp = ripples[k]
        rp.r += 0.55; rp.a -= 0.012
        if (rp.a <= 0) { ripples.splice(k, 1); continue }
        ctx.strokeStyle = `rgba(${rp.hue},${rp.a})`
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2); ctx.stroke()
      }
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [mapRef])

  return <canvas ref={cvRef} className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden />
}

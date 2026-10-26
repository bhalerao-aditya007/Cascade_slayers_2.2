'use client'
// ─── persistent city map layer · real OSM boundary + scroll-driven 3D camera ──
// One fixed MapLibre layer for the whole session. Scroll scrubs the camera along
// a per-city keyframe path (Bruno-Simon-style scroll → camera choreography).
import { useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MLMap } from 'maplibre-gl'
import EffectsCanvas from './EffectsCanvas'
import { useConsole, hazardMeta } from '@/lib/store'
import { HAZARD_BY_ID } from '@/lib/sim/hazards'
import { CITIES } from '@/lib/sim/cities'
import { boundaryFor, cameraAt, zonesFor } from '@/lib/sim/zones'
import { scrollState, damp } from '@/lib/scroll-state'

const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const FALLBACK_STYLE = {
  version: 8 as const,
  glyphs: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/fonts/{fontstack}/{range}.pbf',
  sources: {},
  layers: [{ id: 'bg', type: 'background' as const, paint: { 'background-color': '#07080b' } }],
}

export default function MapView() {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const hazard = useConsole((s) => s.hazard)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hazard) return
    let dead = false
    let map: MLMap | null = null
    setReady(false)

    const city = CITIES[hazard]
    const zones = zonesFor(hazard)
    const boundary = boundaryFor(hazard)

    const zonesGeo = {
      type: 'FeatureCollection' as const,
      features: zones.map((z, i) => ({
        type: 'Feature' as const,
        id: i,
        properties: { zid: z.id, name: z.name },
        geometry: { type: 'Polygon' as const, coordinates: [[...z.hex, z.hex[0]]] },
      })),
    }
    const centersGeo = {
      type: 'FeatureCollection' as const,
      features: zones.map((z, i) => ({
        type: 'Feature' as const,
        id: i,
        properties: { zid: z.id, name: z.name },
        geometry: { type: 'Point' as const, coordinates: z.center },
      })),
    }
    const boundaryLabelGeo = {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        properties: { name: city.name.toUpperCase(), sub: city.nameLocal },
        geometry: { type: 'Point' as const, coordinates: city.globe },
      }],
    }

    const boot = async () => {
      const ml = await import('maplibre-gl')
      if (dead || !mapDivRef.current) return

      let style: unknown = FALLBACK_STYLE
      try {
        const ctrl = new AbortController()
        const to = setTimeout(() => ctrl.abort(), 4500)
        const res = await fetch(CARTO_DARK, { signal: ctrl.signal })
        clearTimeout(to)
        if (res.ok) style = await res.json()
      } catch {
        /* offline → fallback dark canvas */
      }

      const cam0 = city.camera[0]
      const m = new ml.Map({
        container: mapDivRef.current,
        style: style as never,
        center: [cam0.center[0] - 0.06, cam0.center[1]],
        zoom: cam0.zoom - 1.15,
        pitch: Math.max(0, cam0.pitch - 18),
        bearing: cam0.bearing - 14,
        attributionControl: { compact: true },
        maxPitch: 68,
      })
      map = m
      mapRef.current = m

      m.on('error', () => {
        // tile/glyph failures are non-fatal in offline demos
      })

      m.on('load', () => {
        if (dead) return
        m.addSource('boundary', { type: 'geojson', data: boundary as never })
        m.addSource('zones', { type: 'geojson', data: zonesGeo as never })
        m.addSource('centers', { type: 'geojson', data: centersGeo as never })
        m.addSource('blabel', { type: 'geojson', data: boundaryLabelGeo as never })

        // real administrative boundary — glow outline + whisper fill
        const accent = HAZARD_BY_ID[hazard].accent
        m.addLayer({
          id: 'boundary-fill',
          type: 'fill',
          source: 'boundary',
          paint: {
            'fill-color': accent,
            'fill-opacity': 0.035,
          },
        })
        m.addLayer({
          id: 'boundary-glow',
          type: 'line',
          source: 'boundary',
          paint: {
            'line-color': accent,
            'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2.6, 13, 5],
            'line-blur': ['interpolate', ['linear'], ['zoom'], 9, 2.4, 13, 4.5],
            'line-opacity': 0.5,
          },
        })
        m.addLayer({
          id: 'boundary-line',
          type: 'line',
          source: 'boundary',
          paint: {
            'line-color': accent,
            'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.9, 13, 1.6],
            'line-opacity': 0.95,
          },
        })

        // hex risk lattice
        m.addLayer({
          id: 'zone-fill',
          type: 'fill',
          source: 'zones',
          paint: {
            'fill-color': [
              'interpolate', ['linear'], ['feature-state', 'risk'],
              0, '#151b24',
              0.72, '#7a631b',
              1.6, '#a05f14',
              2.55, '#cc3529',
              3, '#ff453a',
            ],
            'fill-opacity': [
              'interpolate', ['linear'], ['feature-state', 'fc'],
              0, 0.82,
              1, 0.6,
            ],
          },
        })
        m.addLayer({
          id: 'zone-line',
          type: 'line',
          source: 'zones',
          paint: {
            'line-color': 'rgba(255,255,255,0.16)',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 13, 1.4],
          },
        })
        m.addLayer({
          id: 'zone-hi',
          type: 'line',
          source: 'zones',
          paint: {
            'line-color': '#ffffff',
            'line-width': ['case', ['==', ['feature-state', 'sel'], 1], 2.4, 0],
          },
        })
        m.addLayer({
          id: 'boundary-label',
          type: 'symbol',
          source: 'blabel',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 9, 13, 12, 19],
            'text-letter-spacing': 0.38,
          },
          paint: {
            'text-color': 'rgba(255,255,255,0.30)',
            'text-halo-color': 'rgba(5,5,6,0.6)',
            'text-halo-width': 1.2,
          },
        })
        m.addLayer({
          id: 'zone-label',
          type: 'symbol',
          source: 'centers',
          minzoom: 10.6,
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 10, 9, 13.5, 11.5],
            'text-letter-spacing': 0.06,
            'text-max-width': 7,
          },
          paint: {
            'text-color': 'rgba(255,255,255,0.62)',
            'text-halo-color': 'rgba(5,5,6,0.85)',
            'text-halo-width': 1.4,
          },
        })

        m.on('click', 'zone-fill', (e) => {
          const f = e.features?.[0]
          if (f?.properties?.zid) useConsole.getState().selectZone(f.properties.zid as string)
        })
        m.on('mouseenter', 'zone-fill', () => { m.getCanvas().style.cursor = 'pointer' })
        m.on('mouseleave', 'zone-fill', () => { m.getCanvas().style.cursor = '' })

        // cinematic entrance: fly to the first camera keyframe
        m.flyTo({
          center: cam0.center, zoom: cam0.zoom, pitch: cam0.pitch, bearing: cam0.bearing,
          duration: 2800, essential: true,
          easing: (u: number) => 1 - Math.pow(1 - u, 3),
        })
        setReady(true)
      })

      // ── scroll-driven camera path (the Bruno-Simon bit) ────────────────
      let pointerDown = false
      const el = m.getCanvas()
      el.addEventListener('pointerdown', () => { pointerDown = true })
      window.addEventListener('pointerup', () => { pointerDown = false })

      // damped camera state (springy feel)
      let dP = 0
      let dCenter: [number, number] = [cam0.center[0], cam0.center[1]]
      let dZoom = cam0.zoom
      let dPitch = cam0.pitch
      let dBearing = cam0.bearing
      let ambientBearing = cam0.bearing

      const frame = () => {
        if (dead) return
        requestAnimationFrame(frame)
        const st = useConsole.getState()
        if (!st.episode) return
        const ph = st.phase
        if (pointerDown) return

        if (ph === 'brief' || ph === 'sim') {
          // scrub along the keyframe path with damping
          dP = damp(dP, scrollState.simP, 0.085)
          const cam = cameraAt(hazard, dP)
          dCenter = [
            damp(dCenter[0], cam.center[0], 0.12),
            damp(dCenter[1], cam.center[1], 0.12),
          ]
          dZoom = damp(dZoom, cam.zoom, 0.1)
          dPitch = damp(dPitch, cam.pitch, 0.1)
          dBearing = damp(dBearing, cam.bearing, 0.1)
          if (ph === 'brief') dBearing += 0.012 // slow reveal drift
          m.jumpTo({ center: dCenter, zoom: dZoom, pitch: dPitch, bearing: dBearing })
        } else if (ph === 'pipeline') {
          // handled by one-shot easeTo below
        } else {
          // forecast + epilogue: gentle ambient rotation
          ambientBearing = m.getBearing() + 0.01
          m.setBearing(ambientBearing)
        }
      }
      requestAnimationFrame(frame)

      // one-shot camera beats on phase change
      let prev = useConsole.getState().phase
      const unsub = useConsole.subscribe((s) => {
        if (s.phase === prev) return
        const was = prev
        prev = s.phase
        if (s.phase === 'pipeline') {
          m.easeTo({ pitch: 30, zoom: m.getZoom() - 0.7, bearing: m.getBearing() - 12, duration: 1800 })
        } else if (s.phase === 'forecast' && was === 'pipeline') {
          const fit = CITIES[hazard].fit
          m.flyTo({ center: fit.center, zoom: fit.zoom, pitch: fit.pitch, bearing: m.getBearing() + 24, duration: 2600, essential: true })
        }
      })
      ;(m as unknown as { _unsubStore?: () => void })._unsubStore = unsub
    }

    void boot()
    return () => {
      dead = true
      const u = (map as unknown as { _unsubStore?: () => void })?._unsubStore
      u?.()
      mapRef.current = null
      map?.remove()
    }
  }, [hazard])

  // per-frame zone state sync (risk interpolated between hours)
  useEffect(() => {
    const apply = () => {
      const map = mapRef.current
      const st = useConsole.getState()
      if (!map || !st.episode || st.phase === 'select') return
      const ep = st.episode
      const t = st.tHour
      const i = Math.max(0, Math.min(ep.city.risk.length - 2, Math.floor(t) - ep.simStart))
      const frac = Math.max(0, Math.min(1, t - Math.floor(t)))
      for (let k = 0; k < ep.zones.length; k++) {
        const z = ep.zones[k]
        const r0 = z.series.risk[i]
        const r1 = z.series.risk[i + 1] ?? r0
        const risk = r0 + (r1 - r0) * frac
        map.setFeatureState({ source: 'zones', id: k }, {
          risk,
          fc: t > 0.02 ? 1 : 0,
          sel: st.selectedZone === z.id ? 1 : 0,
        })
      }
    }
    const unsub = useConsole.subscribe(apply)
    apply()
    return unsub
  }, [])

  if (!hazard) return null

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#07080b]">
      <div ref={mapDivRef} className="h-full w-full" />
      <EffectsCanvas mapRef={mapRef} />
      {!ready && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050506]/80">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border border-white/20 border-t-white/70" />
            <span className="eyebrow">Loading {CITIES[hazard].name} digital twin…</span>
          </div>
        </div>
      )}
      <ForecastBadge />
      <div className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(5,5,6,0.5))]" aria-hidden />
    </div>
  )
}

function ForecastBadge() {
  const phase = useConsole((s) => s.phase)
  const t = useConsole((s) => Math.floor(s.tHour))
  const hazard = useConsole((s) => s.hazard)
  if (phase !== 'forecast' || !hazard) return null
  const meta = hazardMeta(hazard)
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-md">
      <span className="h-1.5 w-1.5 rounded-full bg-[#64d2ff] pulse-soft" />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
        Model forecast · H+{String(Math.max(0, t)).padStart(2, '0')}
      </span>
      <span className="font-mono text-[10px] text-white/30">{meta?.episodeId}</span>
    </div>
  )
}

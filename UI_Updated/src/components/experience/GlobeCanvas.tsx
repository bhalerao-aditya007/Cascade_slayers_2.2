'use client'
// ─── three.js globe · scroll-rotating earth with the six famous-city hotspots ─
// Codrops RotatingOnScrollAnimations pattern: scroll drives the damped yaw/pitch.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { HAZARDS } from '@/lib/sim/hazards'
import { scrollState } from '@/lib/scroll-state'

export default function GlobeCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const W = () => wrap.clientWidth
    const H = () => wrap.clientHeight
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(W(), H())
    wrap.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.1, 50)
    camera.position.set(0, 0, 6.2)

    const globe = new THREE.Group()
    scene.add(globe)

    // dot-matrix sphere (fibonacci)
    const N = 2600
    const pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const th = i * Math.PI * (3 - Math.sqrt(5))
      pos[i * 3] = Math.cos(th) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(th) * r
    }
    const dotGeo = new THREE.BufferGeometry()
    dotGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const dots = new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: 0x39424f, size: 0.0135, sizeAttenuation: true, transparent: true, opacity: 0.85 }))
    globe.add(dots)

    // graticule hairlines
    const gPoints: number[] = []
    const R = 1.001
    for (let m = 0; m < 12; m++) {
      const lng = (m / 12) * Math.PI * 2
      for (let s = 0; s < 64; s++) {
        const a1 = (s / 64) * Math.PI - Math.PI / 2
        const a2 = ((s + 1) / 64) * Math.PI - Math.PI / 2
        gPoints.push(
          R * Math.cos(a1) * Math.sin(lng), R * Math.sin(a1), R * Math.cos(a1) * Math.cos(lng),
          R * Math.cos(a2) * Math.sin(lng), R * Math.sin(a2), R * Math.cos(a2) * Math.cos(lng),
        )
      }
    }
    for (let p = -3; p <= 3; p++) {
      const lat = (p / 4.2) * (Math.PI / 2)
      const r = Math.cos(lat)
      for (let s = 0; s < 72; s++) {
        const a1 = (s / 72) * Math.PI * 2
        const a2 = ((s + 1) / 72) * Math.PI * 2
        gPoints.push(
          R * r * Math.sin(a1), R * Math.sin(lat), R * r * Math.cos(a1),
          R * r * Math.sin(a2), R * Math.sin(lat), R * r * Math.cos(a2),
        )
      }
    }
    const gGeo = new THREE.BufferGeometry()
    gGeo.setAttribute('position', new THREE.Float32BufferAttribute(gPoints, 3))
    const graticule = new THREE.LineSegments(gGeo, new THREE.LineBasicMaterial({ color: 0x8fa3bd, transparent: true, opacity: 0.08 }))
    globe.add(graticule)

    // faint far starfield
    const SN = 220
    const sPos = new Float32Array(SN * 3)
    for (let i = 0; i < SN; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(14 + Math.random() * 10)
      sPos[i * 3] = v.x; sPos[i * 3 + 1] = v.y; sPos[i * 3 + 2] = v.z
    }
    const sGeo = new THREE.BufferGeometry()
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
    scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0x6b7684, size: 0.02, transparent: true, opacity: 0.5 })))

    // hotspots: pin line + dot + pulse ring
    const latLngToXyz = (lng: number, lat: number, r = 1.0): [number, number, number] => {
      const φ = (lat * Math.PI) / 180
      const λ = (lng * Math.PI) / 180
      return [r * Math.cos(φ) * Math.sin(λ), r * Math.sin(φ), r * Math.cos(φ) * Math.cos(λ)]
    }
    interface Spot { group: THREE.Group; ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; dot: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>; idx: number }
    const spots: Spot[] = []
    HAZARDS.forEach((h, idx) => {
      const [lng, lat] = h.city.coords
      const [x, y, z] = latLngToXyz(lng, lat, 1.005)
      const g = new THREE.Group()
      const accent = new THREE.Color(h.accent)
      // pin
      const pinGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, z), new THREE.Vector3(x * 1.075, y * 1.075, z * 1.075)])
      g.add(new THREE.Line(pinGeo, new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.65 })))
      // dot
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), new THREE.MeshBasicMaterial({ color: accent, transparent: true }))
      dot.position.set(x * 1.075, y * 1.075, z * 1.075)
      g.add(dot)
      // pulse ring (facing outward)
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.03, 0.037, 32),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
      )
      ring.position.set(x * 1.008, y * 1.008, z * 1.008)
      ring.lookAt(new THREE.Vector3(x * 2, y * 2, z * 2))
      g.add(ring)
      globe.add(g)
      spots.push({ group: g, ring, dot, idx })
    })

    // ambient drift + damped rotation to active city
    let ry = -HAZARDS[0].city.coords[0] * (Math.PI / 180) + 0.9
    let rx = 0.28
    let px = 0, py = 0
    const onMove = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth - 0.5) * 2
      py = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove)

    const wrapLng = (d: number) => {
      let x = d
      while (x > Math.PI) x -= Math.PI * 2
      while (x < -Math.PI) x += Math.PI * 2
      return x
    }

    const ro = new ResizeObserver(() => {
      renderer.setSize(W(), H())
      camera.aspect = W() / H()
      camera.updateProjectionMatrix()
    })
    ro.observe(wrap)

    let raf = 0
    let lastIdx = 0
    const tick = (tm: number) => {
      raf = requestAnimationFrame(tick)
      // interpolate target lat/lng across card float
      const f = Math.max(0, Math.min(HAZARDS.length - 1, scrollState.cardFloat))
      const iA = Math.floor(f)
      const iB = Math.min(HAZARDS.length - 1, iA + 1)
      const u = f - iA
      const A = HAZARDS[iA].city.coords
      const B = HAZARDS[iB].city.coords
      const tLng = A[0] + wrapLng(B[0] - A[0]) * u
      const tLat = A[1] + (B[1] - A[1]) * u
      const tRy = (-tLng * Math.PI) / 180 + 0.9
      const tRx = ((tLat * Math.PI) / 180) * 0.55 + 0.18
      const k = reduced ? 1 : 0.055
      ry += wrapLng(tRy - ry) * k
      rx += (tRx - rx) * k
      globe.rotation.y = ry + (reduced ? 0 : tm * 0.0000075) + px * 0.045
      globe.rotation.x = rx + py * 0.03
      if (Math.round(f) !== lastIdx) {
        lastIdx = Math.round(f)
        setActiveIdx(lastIdx)
      }
      // pulse rings
      for (const s of spots) {
        const active = s.idx === lastIdx
        const u2 = (tm * 0.0011 + s.idx * 0.37) % 1
        const sc = active ? 0.9 + u2 * 2.6 : 0.9 + u2 * 1.15
        s.ring.scale.setScalar(sc)
        s.ring.material.opacity = (active ? 0.85 : 0.28) * (1 - u2)
        s.dot.material.opacity = active ? 1 : 0.55
      }
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      renderer.dispose()
      dotGeo.dispose()
      gGeo.dispose()
      sGeo.dispose()
      wrap.removeChild(renderer.domElement)
    }
  }, [])

  const active = HAZARDS[activeIdx]
  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden>
      <div className="pointer-events-none absolute bottom-[16%] left-1/2 -translate-x-1/2 text-center md:bottom-[14%]">
        <div className="font-mono text-[10px] uppercase tracking-[0.42em]" style={{ color: active.accent }}>
          {active.city.name} · {active.city.country}
        </div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/25">
          {active.city.coords[1].toFixed(2)}° {active.city.coords[1] >= 0 ? 'N' : 'S'} · {Math.abs(active.city.coords[0]).toFixed(2)}° {active.city.coords[0] >= 0 ? 'E' : 'W'}
        </div>
      </div>
    </div>
  )
}

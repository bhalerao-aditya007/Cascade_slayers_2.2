// ─── real OSM boundary GeoJSON → animated SVG paths (mercator-shaped) ─────────
import type { BoundaryFC } from './sim/zones'

/** mercator y for aspect-true rendering (matches what viewers see on web maps) */
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))

export interface BoundarySvg {
  paths: string[]
  viewBox: string
}

export function boundaryToSvg(fc: BoundaryFC, pad = 0.06): BoundarySvg {
  const geom = fc.features[0].geometry
  const polys: number[][][] =
    geom.type === 'Polygon' ? (geom.coordinates as number[][][]) : (geom.coordinates as number[][][][]).map((p) => p[0])
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity
  const xformed = polys.map((ring) =>
    ring.map(([lng, lat]) => {
      const x = lng
      const y = mercY(lat)
      if (x < w) w = x
      if (x > e) e = x
      if (y < s) s = y
      if (y > n) n = y
      return [x, y] as [number, number]
    }),
  )
  const dw = e - w || 0.01
  const dh = n - s || 0.01
  const pw = dw * pad
  const ph = dh * pad
  const W = 1000
  const H = (W * (dh + ph * 2)) / (dw + pw * 2)
  const sx = W / (dw + pw * 2)
  const sy = H / (dh + ph * 2)
  const paths = xformed.map((ring) => {
    let d = ''
    ring.forEach(([x, y], i) => {
      const px = (x - w + pw) * sx
      const py = H - (y - s + ph) * sy
      d += `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`
    })
    return d + 'Z'
  })
  return { paths, viewBox: `0 0 ${W.toFixed(0)} ${H.toFixed(0)}` }
}

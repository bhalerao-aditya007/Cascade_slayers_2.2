'use client'
// ─── phase 2a · city brief · famous-place narrative + real boundary draw-on ───
import { useRef } from 'react'
import { ArrowDown, Globe2, Landmark } from 'lucide-react'
import { useConsole, hazardMeta } from '@/lib/store'
import { HAZARDS } from '@/lib/sim/hazards'
import { CITIES } from '@/lib/sim/cities'
import { boundaryFor } from '@/lib/sim/zones'
import { boundaryToSvg } from '@/lib/boundary-svg'
import { scrollState } from '@/lib/scroll-state'

export default function CityBrief() {
  const hazard = useConsole((s) => s.hazard)!
  const ep = useConsole((s) => s.episode)
  const briefRef = useRef<HTMLDivElement>(null)
  const meta = hazardMeta(hazard)!
  const city = CITIES[hazard]
  const idx = HAZARDS.findIndex((h) => h.id === hazard) + 1
  const svg = boundaryToSvg(boundaryFor(hazard))

  return (
    <section
      id="brief"
      ref={briefRef}
      aria-label={`${city.name} briefing`}
      className="relative"
      style={{ height: '190vh' }}
    >      <div className="sticky top-0 flex h-dvh items-center justify-center px-4 py-16">
        <div className="glass-panel pointer-events-auto w-[min(1060px,96vw)] overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#08090c]/88 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
          <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }} />

          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            {/* copy */}
            <div className="p-7 sm:p-10">
              <div className="flex items-center gap-2.5">
                <Globe2 size={13} style={{ color: meta.accent }} />
                <p className="eyebrow text-white/45">City brief · {String(idx).padStart(2, '0')} of 06</p>
              </div>

              <h2 className="mt-4 text-[clamp(2.4rem,6vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.02em]">
                {city.name}
              </h2>
              <p className="mt-2 text-[15px] text-white/40">
                {city.nameLocal} · {city.country} · {city.tz.label} (UTC{city.tz.offsetH >= 0 ? '+' : ''}{city.tz.offsetH})
              </p>

              <p className="mt-6 border-l-2 pl-4 text-[14.5px] font-medium leading-relaxed text-white/85" style={{ borderColor: meta.accent }}>
                {city.famousFor}
              </p>

              <div className="mt-5 space-y-3.5">
                {city.brief.map((p, i) => (
                  <p key={i} className="text-[12.5px] leading-relaxed text-white/50">{p}</p>
                ))}
              </div>

              <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {city.stats.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
                    <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/35">{s.label}</p>
                    <p className="mt-1.5 text-[13.5px] font-semibold leading-tight text-white/90">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex items-center gap-2 text-white/35">
                <ArrowDown size={13} className="animate-bounce" />
                <span className="font-mono text-[9.5px] uppercase tracking-[0.26em]">
                  Keep scrolling — {meta.name.toLowerCase()} replay begins below
                </span>
              </div>
            </div>

            {/* real boundary */}
            <div className="relative flex flex-col border-t border-white/[0.07] bg-black/25 p-7 sm:p-10 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-2.5">
                <Landmark size={13} className="text-white/45" />
                <p className="eyebrow text-white/45">Actual administrative boundary</p>
              </div>
              <div className="mt-4 flex-1">
                <svg
                  viewBox={svg.viewBox}
                  className="h-full max-h-[300px] w-full"
                  role="img"
                  aria-label={`Outline of ${city.name}`}
                >
                  <defs>
                    <linearGradient id="bFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={meta.accent} stopOpacity={0.16} />
                      <stop offset="100%" stopColor={meta.accent} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  {svg.paths.map((d, i) => (
                    <g key={i}>
                      <path className="boundary-draw-fill" d={d} fill="url(#bFill)" style={{ animationDelay: `${0.15 + i * 0.08}s` }} />
                      <path
                        className="boundary-draw"
                        d={d}
                        fill="none"
                        stroke={meta.accent}
                        strokeWidth={2.4}
                        strokeLinejoin="round"
                        pathLength={1}
                        style={{ animationDelay: `${i * 0.09}s` }}
                      />
                    </g>
                  ))}
                </svg>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                  {ep ? `${ep.zones.length} modelled districts` : ''} · OSM relation data
                </p>
                <p className="text-[10.5px] leading-relaxed text-white/30">
                  The simulation lattice, boundary geometry and every layer below run on the real
                  geography of {city.name} — not a stylised sketch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** brief scroll progress → scrollState (called by the session scroll engine) */
export function updateBriefProgress(el: HTMLElement | null) {
  if (!el) return
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight
  const total = r.height - vh
  const p = Math.max(0, Math.min(1, -r.top / Math.max(1, total)))
  scrollState.briefP = p
}

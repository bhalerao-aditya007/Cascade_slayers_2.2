'use client'
// ─── phase 2b · simulation · scroll-scrubbed pinned map replay ────────────────
// Scroll = time. The Bruno-Simon bit: one persistent scene, scroll drives the
// camera path and the clock from T−36h (or T−8h) to the T+0 forecast issue.
import { useMemo } from 'react'
import { MousePointer2, Radio } from 'lucide-react'
import { useConsole, hazardMeta } from '@/lib/store'
import { countsByLevel } from '@/lib/sim/generate'
import { RISK_COLORS, RISK_LABELS } from '@/lib/sim/types'
import { fmtT, fmtClock } from '@/lib/sim/core'
import { CITIES } from '@/lib/sim/cities'
import SimPanel from '@/components/console/SimPanel'

const CHAPTERS: Record<string, { t: number; label: string }[]> = {
  flood: [
    { t: -36, label: 'BASIN SATURATES' }, { t: -24, label: 'PEAK RAIN BAND' },
    { t: -12, label: 'CITY UNDER WATER' }, { t: -4, label: 'CASCADE LOCKED IN' }, { t: 0, label: 'FORECAST ISSUES' },
  ],
  heat: [
    { t: -36, label: 'DOME SETTLES' }, { t: -24, label: 'NIGHTS STOP COOLING' },
    { t: -12, label: 'LOAD CLIMBS' }, { t: -4, label: 'PEAK EXPOSURE' }, { t: 0, label: 'FORECAST ISSUES' },
  ],
  epidemic: [
    { t: -36, label: 'SIGNAL SEEDS' }, { t: -24, label: 'CLUSTER IGNITES' },
    { t: -12, label: 'HOSPITALS FEEL IT' }, { t: -4, label: 'SURGE LOCKED IN' }, { t: 0, label: 'FORECAST ISSUES' },
  ],
  grid: [
    { t: -6, label: 'FAULT' }, { t: -4, label: 'CASCADE' },
    { t: -2, label: 'TRANS-YAMUNA DARK' }, { t: -0.5, label: 'SUPERCRITICAL' }, { t: 0, label: 'FORECAST ISSUES' },
  ],
  quake: [
    { t: -6, label: 'BACKGROUND' }, { t: -3, label: 'FORESHOCK' },
    { t: -0.4, label: 'RUPTURE' }, { t: 0, label: 'MAINSHOCK · T+0' },
  ],
  chem: [
    { t: -8, label: 'TRANSFER BEGINS' }, { t: -3, label: 'SCRUBBER DRIFT' },
    { t: -0.5, label: 'DETECTION' }, { t: 0, label: 'RELEASE · T+0' },
  ],
}

export default function SimStage() {
  const hazard = useConsole((s) => s.hazard)!
  const ep = useConsole((s) => s.episode)!
  const tHour = useConsole((s) => s.tHour)
  const meta = hazardMeta(hazard)!
  const city = CITIES[hazard]
  const tz = city.tz
  const chapters = CHAPTERS[hazard] ?? []
  const hour = Math.floor(tHour)

  const { caption, next, counts } = useMemo(() => {
    const marked = ep.events.filter((e) => e.mark)
    const passed = marked.filter((e) => e.t <= tHour + 0.001)
    const upcoming = marked.find((e) => e.t > tHour + 0.001)
    return {
      caption: passed[passed.length - 1] ?? null,
      next: upcoming ?? null,
      counts: countsByLevel(ep, hour),
    }
  }, [ep, tHour, hour])

  const progress = -tHour <= 0 ? 1 : (tHour - ep.simStart) / -ep.simStart

  return (
    <section
      id="sim"
      aria-label={`${meta.name} simulation replay`}
      className="relative"
      style={{ height: '560vh' }}
    >
      <div className="sticky top-0 h-dvh overflow-hidden">
        {/* HUD layer */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {/* top-left status */}
          <div className="absolute left-4 top-[64px] flex flex-col items-start gap-2 sm:left-6">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-white pulse-soft" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                synthetic episode · scroll to scrub
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {counts.map(({ level, n }) =>
                n > 0 ? (
                  <span
                    key={level}
                    className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9.5px] backdrop-blur-md"
                    style={{ borderColor: `${RISK_COLORS[level]}40`, backgroundColor: 'rgba(5,5,6,0.5)', color: RISK_COLORS[level] }}
                  >
                    {n} {RISK_LABELS[level]}
                  </span>
                ) : null,
              )}
            </div>
          </div>

          {/* chapter rail */}
          <div className="absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col gap-0 md:flex sm:left-6">
            <div className="relative flex flex-col gap-7 pl-1">
              <div className="absolute left-[3.5px] top-1 bottom-1 w-px bg-white/10" />
              <div
                className="absolute left-[3.5px] top-1 w-px bg-white/60 transition-all duration-300"
                style={{ height: `${progress * 100}%` }}
              />
              {chapters.map((c) => {
                const done = tHour >= c.t
                const isNow = Math.abs(tHour - c.t) < 2.5
                return (
                  <div key={c.t} className="relative flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full border transition-all ${done ? 'border-white bg-white' : 'border-white/30 bg-transparent'}`}
                      style={isNow ? { boxShadow: `0 0 10px ${meta.accent}`, backgroundColor: meta.accent, borderColor: meta.accent } : undefined}
                    />
                    <span className={`font-mono text-[8.5px] uppercase tracking-[0.2em] transition-colors ${isNow ? 'text-white/90' : done ? 'text-white/45' : 'text-white/25'}`}>
                      {fmtT(c.t)} · {c.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* caption stack (bottom-left) */}
          <div className="absolute bottom-24 left-4 max-w-[min(560px,86vw)] sm:bottom-20 sm:left-6">
            {caption && (
              <div key={`${caption.t}-${caption.message.slice(0, 8)}`} className="caption-in">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/55 backdrop-blur-md">
                    <Radio size={9} /> {caption.source}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: meta.accent }}>
                    {fmtT(caption.t)}
                  </span>
                </div>
                <p className="mt-2 text-[clamp(15px,2.4vw,21px)] font-semibold leading-snug text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  {caption.message}
                </p>
                {next && (
                  <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/30">
                    next · {fmtT(next.t)} — {next.message.slice(0, 58)}…
                  </p>
                )}
              </div>
            )}
          </div>

          {/* right rail (xl) */}
          <div className="pointer-events-auto absolute bottom-0 right-0 top-[56px] hidden w-[336px] xl:block">
            <div className="h-full pt-14 pb-2 pr-2">
              <SimPanel />
            </div>
          </div>

          {/* scroll cue */}
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 text-white/35 xl:hidden">
            <MousePointer2 size={11} />
            <span className="font-mono text-[8.5px] uppercase tracking-[0.26em]">scroll to scrub time</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function SimClockOverlay() {
  const tHour = useConsole((s) => s.tHour)
  const hazard = useConsole((s) => s.hazard)!
  const tz = CITIES[hazard].tz
  return (
    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
      {fmtClock(tHour, tz.offsetH, tz.label)}
    </span>
  )
}

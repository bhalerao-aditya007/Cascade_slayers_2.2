'use client'
// ─── phase 3 · 72h forecast console · pinned over the same city map ───────────
import { useConsole } from '@/lib/store'
import { countsByLevel, cityLevelAt } from '@/lib/sim/generate'
import { RISK_COLORS, RISK_LABELS } from '@/lib/sim/types'
import ForecastPanel from '@/components/console/forecast/ForecastPanel'
import Timeline from '@/components/console/Timeline'

export default function ForecastStage() {
  const phase = useConsole((s) => s.phase)
  const hazard = useConsole((s) => s.hazard)
  const ep = useConsole((s) => s.episode)
  const hour = useConsole((s) => Math.floor(s.tHour))

  if (!hazard || !ep) return null
  const visible = phase === 'pipeline' || phase === 'forecast' || phase === 'epilogue'
  const counts = countsByLevel(ep, hour)
  const cityLvl = cityLevelAt(ep, hour)

  return (
    <section id="forecast-stage" aria-label="72 hour forecast" className="relative" style={{ height: '150dvh' }}>
      <div
        className={`sticky top-0 flex h-dvh flex-col overflow-hidden pt-[54px] transition-opacity duration-700 ${
          visible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* map shows through on the left — rail + transport float above it */}
        <div className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">
          {/* left: open map + overlay chips */}
          <div className="relative min-h-0 flex-1">
            <div className="pointer-events-none absolute bottom-3 left-4 z-10 hidden flex-col gap-1 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 backdrop-blur-md sm:flex">
              <p className="eyebrow mb-0.5">Risk state</p>
              {RISK_LABELS.map((l, i) => (
                <span key={l} className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55">
                  <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: RISK_COLORS[i] }} /> {l}
                </span>
              ))}
              <span className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55">
                <span className="h-2 w-2 rotate-45 rounded-[2px] bg-[#ff9f0a]" /> chain stage
              </span>
            </div>
            <div className="pointer-events-none absolute left-4 top-4 z-10 hidden flex-wrap items-center gap-1.5 lg:flex">
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
              {cityLvl >= 2 && (
                <span className="rounded-full border border-white/10 bg-black/50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/55 backdrop-blur-md">
                  city level · {RISK_LABELS[cityLvl]}
                </span>
              )}
            </div>
          </div>

          {/* right rail: forecast tabs */}
          <aside
            className={`stagger-in flex min-h-0 shrink-0 flex-col border-t border-white/[0.07] bg-[#08080b]/95 backdrop-blur-xl lg:h-auto lg:w-[400px] lg:border-l lg:border-t-0 xl:w-[444px] ${visible ? '' : 'invisible'}`}
            aria-label="Model output panels"
          >
            <ForecastPanel />
          </aside>
        </div>

        {/* transport */}
        <div className={`shrink-0 ${visible ? '' : 'invisible'}`}>
          <Timeline />
        </div>
      </div>
    </section>
  )
}

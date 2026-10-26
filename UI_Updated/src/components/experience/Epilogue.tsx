'use client'
// ─── epilogue · episode summary + honesty + run another city ──────────────────
import { ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react'
import { useConsole, hazardMeta } from '@/lib/store'
import { CITIES } from '@/lib/sim/cities'
import { scrollToTop, scrollToId } from '@/lib/lenis-ref'

export default function Epilogue() {
  const hazard = useConsole((s) => s.hazard)
  const ep = useConsole((s) => s.episode)
  const reset = useConsole((s) => s.reset)
  if (!hazard || !ep) return null
  const meta = hazardMeta(hazard)!
  const city = CITIES[hazard]

  const metrics = [
    { label: 'calibration · ECE', value: ep.metrics.ece.toFixed(3) },
    { label: '80% coverage', value: `${(ep.metrics.coverage80 * 100).toFixed(0)}%` },
    { label: 'lead time', value: ep.metrics.leadTimeH === 0 ? 'at detection' : `${ep.metrics.leadTimeH}h` },
    { label: 'edge F1', value: ep.metrics.edgeF1.toFixed(2) },
  ]

  return (
    <section
      id="epilogue"
      aria-label="Episode summary"
      className="relative z-20 min-h-dvh bg-[#050507] px-4 py-20"
    >
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow text-white/40">Episode {ep.episodeId} · complete</p>
        <h2 className="mt-4 text-[clamp(1.6rem,4.4vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-white/92">
          {ep.city.headline}
        </h2>
        <p className="mt-3 text-[13px] text-white/45">
          {meta.name} · {city.name}, {city.country} · 72h horizon · {ep.zones.length} districts
        </p>

        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-4">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/35">{m.label}</p>
              <p className="tnum mt-1.5 font-mono text-[19px] font-semibold text-white/90">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#30d158]" />
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">Model honesty note</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/60">{ep.honesty}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={() => { reset(); scrollToTop(1.8) }}
            className="group flex h-12 items-center gap-2.5 rounded-full px-6 text-[14px] font-semibold text-[#08080b] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            style={{ backgroundColor: meta.accent }}
          >
            <RotateCcw size={15} />
            Run another city
          </button>
          <button
            onClick={() => scrollToId('#forecast-stage', { duration: 1.2 })}
            className="flex h-12 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 text-[13px] font-medium text-white/75 transition hover:bg-white/[0.09] hover:text-white"
          >
            Review the 72h forecast
            <ArrowRight size={14} />
          </button>
        </div>

        <footer className="mt-16 border-t border-white/[0.07] pt-6">
          <div className="flex flex-col gap-2 text-[10.5px] leading-relaxed text-white/28 sm:flex-row sm:items-end sm:justify-between">
            <p>
              72H WARNING · synthetic demonstration episode. All district series, feeds and
              forecasts are model-generated for demo purposes.
            </p>
            <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em]">
              Boundaries & map data © OpenStreetMap contributors · © CARTO
            </p>
          </div>
        </footer>
      </div>
    </section>
  )
}

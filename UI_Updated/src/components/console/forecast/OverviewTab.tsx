'use client'
// ─── OVERVIEW tab · headline, t-critical, stats, 72h storyline ───────────────
import { motion } from 'framer-motion'
import { Timer, Users, AlertTriangle, Building2, ArrowRight } from 'lucide-react'
import { useConsole } from '@/lib/store'
import { countsByLevel, idxOf } from '@/lib/sim/generate'
import { RISK_COLORS, RISK_LABELS } from '@/lib/sim/types'
import { fmtT, fmtPop } from '@/lib/sim/core'
import { StatTile, RiskBadge, SectionTitle, PBar } from './shared'

export default function OverviewTab() {
  const ep = useConsole((s) => s.episode)!
  const hour = useConsole((s) => Math.floor(s.tHour))
  const { setTHour } = useConsole.getState()
  const idx = idxOf(ep, hour)
  const counts = countsByLevel(ep, hour)
  const cityV = ep.city.risk[idx]
  const cityLevel = (cityV >= 2.55 ? 3 : cityV >= 1.6 ? 2 : cityV >= 0.72 ? 1 : 0) as 0 | 1 | 2 | 3
  const tc = ep.city.tCritical
  const p72 = ep.city.baseline[72]
  const steps = [...ep.narrative].sort((a, b) => a.t - b.t)

  return (
    <div className="space-y-6 p-4">
      {/* headline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Forecast headline</p>
          <RiskBadge level={cityLevel} pulse={cityLevel === 3} />
        </div>
        <p className="mt-2.5 text-[15px] font-semibold leading-snug tracking-tight">{ep.city.headline}</p>
        <p className="mt-2 text-[11.5px] leading-relaxed text-white/45">
          Issued T+00 · as-of store verified · {ep.zones.length} zones · 10 layers · H+{ep.horizon}
        </p>
      </motion.div>

      {/* t-critical */}
      {tc && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
          <div className="flex items-center gap-2">
            <Timer size={13} className="text-[#ff9f0a]" />
            <p className="eyebrow">Most probable critical event</p>
          </div>
          <div className="mt-2.5 flex items-end justify-between">
            <div>
              <div className="tnum font-mono text-[34px] font-semibold leading-none tracking-tight text-[#ff9f0a]">
                ≈ {fmtT(tc.median)}
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-white/40 tnum">
                P10 {fmtT(tc.p10)} · P90 {fmtT(tc.p90)}
              </p>
            </div>
            <p className="max-w-[52%] text-right text-[11.5px] leading-snug text-white/55">{tc.label}</p>
          </div>
        </div>
      )}

      {/* stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatTile
          label="P(cascade ≤ 72h)"
          value={`${Math.round(p72 * 100)}%`}
          sub={ep.chains[0]?.name}
          tone={p72 > 0.6 ? '#ff453a' : p72 > 0.35 ? '#ff9f0a' : '#30d158'}
        />
        <StatTile
          label="Cascade reproduction ρ"
          value={ep.city.rho.toFixed(2)}
          sub={ep.city.rho >= 1 ? 'Supercritical — self-sustaining' : 'Subcritical — burns out'}
          tone={ep.city.rho >= 1 ? '#ff453a' : '#30d158'}
        />
        <StatTile label="Exposure" value={ep.city.exposedNote.split(' ')[0]} sub={ep.city.exposedNote} />
        <StatTile label="Critical assets" value={`${ep.city.assetsAtRisk.length}`} sub={ep.city.assetsAtRisk.slice(0, 2).join(' · ')} />
      </div>

      {/* zones by state */}
      <div>
        <SectionTitle>Zones by state · at {fmtT(hour)}</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {counts.map(({ level, n }) => (
            <div key={level} className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 py-2.5 text-center">
              <p className="tnum font-mono text-[19px] font-semibold leading-none" style={{ color: RISK_COLORS[level] }}>{n}</p>
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/35">{RISK_LABELS[level]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* storyline */}
      <div>
        <SectionTitle right={<span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">step by step</span>}>
          The 72 hours ahead
        </SectionTitle>
        <div className="relative space-y-2.5 pl-1">
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-white/[0.08]" aria-hidden />
          {steps.map((s, i) => {
            const passed = hour >= s.t
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setTHour(s.t)}
                className="group relative flex w-full gap-3.5 rounded-lg py-1.5 pl-0 pr-2 text-left transition hover:bg-white/[0.03]"
              >
                <span
                  className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#0a0a0d] transition-colors ${passed ? 'bg-[#ff9f0a]' : 'bg-white/25'}`}
                />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`tnum font-mono text-[10.5px] ${passed ? 'text-[#ff9f0a]' : 'text-white/40'}`}>{fmtT(s.t)}</span>
                    <span className="text-[12.5px] font-semibold leading-tight tracking-tight group-hover:text-white">{s.title}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/45">{s.detail}</p>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* horizon quick jumps */}
      <div>
        <SectionTitle>Jump to horizon</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {[6, 12, 24, 48, 72].map((h) => (
            <button
              key={h}
              onClick={() => setTHour(h)}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/65 transition hover:border-white/25 hover:bg-white/[0.09] hover:text-white"
            >
              H+{h} <ArrowRight size={10} />
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="eyebrow flex items-center gap-1.5"><AlertTriangle size={10} /> Honesty note</p>
          </div>
          <p className="text-[11px] leading-relaxed text-white/50">{ep.honesty}</p>
        </div>
        <div className="mt-2.5 flex items-center gap-4 px-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/28">
          <span className="flex items-center gap-1"><Users size={10} /> {fmtPop(ep.zones.reduce((a, z) => a + z.population, 0))} residents</span>
          <span className="flex items-center gap-1"><Building2 size={10} /> {ep.zones.reduce((a, z) => a + z.beds, 0)} beds mapped</span>
        </div>
      </div>
    </div>
  )
}

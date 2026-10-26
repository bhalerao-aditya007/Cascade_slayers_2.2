'use client'
// ─── ZONES tab · sortable risk table + zone drill-down ───────────────────────
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpDown, MapPin, ChevronDown, Stethoscope } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'
import { useConsole } from '@/lib/store'
import { idxOf, zoneDrivers } from '@/lib/sim/generate'
import { LAYER_META } from '@/lib/sim/types'
import { fmtPop } from '@/lib/sim/core'
import { neighborsFor } from '@/lib/sim/zones'
import { LayerChip, SectionTitle, PBar, StateDot } from './shared'
import { LAYER_COLOR } from '../palette'

type SortKey = 'pFinal' | 'tcrit' | 'pop' | 'risk'

export default function ZonesTab() {
  const ep = useConsole((s) => s.episode)!
  const selected = useConsole((s) => s.selectedZone)
  const hour = useConsole((s) => Math.floor(s.tHour))
  const { selectZone } = useConsole.getState()
  const [sort, setSort] = useState<SortKey>('pFinal')
  const idx = idxOf(ep, hour)

  const rows = useMemo(() => {
    const list = ep.zones.map((z) => ({
      z,
      riskNow: z.series.risk[idx],
      pFinal: z.series.pFinal,
      tcrit: z.series.tcrit,
      drivers: zoneDrivers(ep, z.id, hour, 2),
    }))
    list.sort((a, b) => {
      if (sort === 'pFinal') return b.pFinal - a.pFinal
      if (sort === 'pop') return b.z.population - a.z.population
      if (sort === 'risk') return b.riskNow - a.riskNow
      return (b.tcrit?.median ?? 99) - (a.tcrit?.median ?? 99)
    })
    return list
  }, [ep, idx, hour, sort])

  const sel = rows.find((r) => r.z.id === selected)

  return (
    <div className="p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="eyebrow">Zone risk register · H+72</p>
        <div className="flex items-center gap-1">
          <ArrowUpDown size={10} className="text-white/30" />
          {(['pFinal', 'tcrit', 'risk', 'pop'] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] transition ${sort === k ? 'bg-white/[0.12] text-white' : 'text-white/35 hover:text-white/70'}`}
            >
              {k === 'pFinal' ? 'p≤72h' : k === 'tcrit' ? 't-crit' : k === 'risk' ? 'now' : 'pop'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.07]">
        <div className="grid grid-cols-[26px_1fr_84px_88px_54px] gap-2 border-b border-white/[0.07] bg-white/[0.03] px-3 py-2 font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/35">
          <span />
          <span>Zone</span>
          <span>P(crit ≤72h)</span>
          <span>T-critical</span>
          <span className="text-right">Pop</span>
        </div>
        <div className="datascroll max-h-[280px] overflow-y-auto">
          {rows.map(({ z, riskNow, pFinal, tcrit, drivers }) => {
            const lvl = (riskNow >= 2.55 ? 3 : riskNow >= 1.6 ? 2 : riskNow >= 0.72 ? 1 : 0) as 0 | 1 | 2 | 3
            const active = selected === z.id
            return (
              <button
                key={z.id}
                onClick={() => selectZone(active ? null : z.id)}
                className={`grid w-full grid-cols-[26px_1fr_84px_88px_54px] items-center gap-2 border-b border-white/[0.04] px-3 py-2 text-left transition ${active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'}`}
              >
                <StateDot level={lvl} />
                <span className="min-w-0">
                  <span className="block truncate text-[11.5px] font-medium leading-tight">{z.name}</span>
                  <span className="font-mono text-[9px] text-white/30">{z.id}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="tnum font-mono text-[11px] font-semibold" style={{ color: pFinal > 0.6 ? '#ff453a' : pFinal > 0.3 ? '#ff9f0a' : '#30d158' }}>
                    {Math.round(pFinal * 100)}%
                  </span>
                  <span className="w-8"><PBar p={pFinal} color={pFinal > 0.6 ? '#ff453a' : pFinal > 0.3 ? '#ff9f0a' : '#30d158'} h={3} /></span>
                </span>
                <span className="tnum font-mono text-[10px] text-white/65">
                  {tcrit ? <>T+{tcrit.median}h<span className="text-white/30"> ±{tcrit.p90 - tcrit.median}</span></> : <span className="text-white/25">beyond</span>}
                </span>
                <span className="tnum text-right font-mono text-[10px] text-white/45">{fmtPop(z.population)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* drill-down */}
      <AnimatePresence mode="wait">
        {sel && (
          <motion.div
            key={sel.z.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mt-4 rounded-xl border border-white/[0.1] bg-white/[0.035] p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
                  <MapPin size={13} className="text-white/50" /> {sel.z.name}
                </p>
                <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/35">
                  {sel.z.id} · pop {fmtPop(sel.z.population)} · elev {sel.z.elevation} m
                  {sel.z.beds > 0 ? ` · ${sel.z.beds} beds` : ''}
                </p>
              </div>
              <button onClick={() => selectZone(null)} className="rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white">
                <ChevronDown size={15} />
              </button>
            </div>

            {/* drivers */}
            <SectionTitle>Why this zone · driver attribution</SectionTitle>
            <div className="space-y-2">
              {zoneDrivers(ep, sel.z.id, hour, 4).map(({ layer, v }) => (
                <div key={layer} className="flex items-center gap-2.5">
                  <span className="w-[132px] shrink-0 truncate text-[11px] text-white/60">{LAYER_META[layer].name}</span>
                  <div className="flex-1"><PBar p={v / 3} color={LAYER_COLOR[layer]} h={6} /></div>
                  <span className="tnum w-9 text-right font-mono text-[10px] text-white/50">+{(v / 3).toFixed(2)}</span>
                </div>
              ))}
              <p className="pt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/28">
                tree-shap grouped by layer · Δ since last tick
              </p>
            </div>

            {/* indicator chart */}
            <SectionTitle>{ep.city.indicator.label} · this zone</SectionTitle>
            <div className="h-[148px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={(() => {
                    const pts: { t: number; v: number; lo: number; hi: number }[] = []
                    for (let t = Math.max(ep.simStart, -12); t <= 72; t += 2) {
                      const i = idxOf(ep, t)
                      const v = sel.z.series.indicator[i]
                      pts.push({ t, v, lo: v * 0.9, hi: v * 1.1 })
                    }
                    return pts
                  })()}
                  margin={{ top: 4, right: 4, bottom: 0, left: -18 }}
                >
                  <defs>
                    <linearGradient id="zoneBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64d2ff" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#64d2ff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="t" tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)} interval={2} />
                  <YAxis width={42} tickFormatter={(v) => (v >= 100 ? v.toFixed(0) : v.toFixed(1))} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(13,13,16,0.94)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11, fontFamily: 'var(--font-geist-mono)' }}
                    labelFormatter={(v) => `T${Number(v) > 0 ? '+' : ''}${v}h`}
                  />
                  <ReferenceLine x={0} stroke="rgba(255,255,255,0.28)" strokeDasharray="3 3" />
                  <Area dataKey="lo" stroke="none" fill="url(#zoneBand)" />
                  <Area dataKey="hi" stroke="none" fill="url(#zoneBand)" fillOpacity={0.5} />
                  <Area dataKey="v" stroke="#64d2ff" strokeWidth={1.8} fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* parent attribution */}
            <SectionTitle>Upstream pressure · hawkes parents</SectionTitle>
            <div className="space-y-1.5">
              {(() => {
                const top = zoneDrivers(ep, sel.z.id, hour, 2)
                const nbs = (ep ? neighborsFor(ep.hazard) : {})[sel.z.id] ?? []
                const hotNb = ep.zones
                  .filter((z) => nbs.includes(z.id))
                  .sort((a, b) => b.series.indicator[idx] - a.series.indicator[idx])[0]
                return top.map(({ layer, v }) => (
                  <div key={layer} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <LayerChip layer={layer} />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-white/55">
                      {LAYER_META[layer].name} events in {hotNb ? hotNb.id : 'upstream'} · lag 2–8h
                    </span>
                    <span className="tnum font-mono text-[10.5px] text-white/70">w {(0.28 + v * 0.09).toFixed(2)}</span>
                  </div>
                ))
              })()}
              <p className="flex items-center gap-1.5 pt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/28">
                <Stethoscope size={10} /> exact parent attribution · share of λ from each source type
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

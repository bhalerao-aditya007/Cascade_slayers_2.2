'use client'
// ─── simulate-phase side rail · ingest feed + layer matrix + indicator ───────
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Activity, Database } from 'lucide-react'
import { useConsole } from '@/lib/store'
import { idxOf } from '@/lib/sim/generate'
import { LAYER_CODES, LAYER_META, RISK_COLORS } from '@/lib/sim/types'
import { fmtT } from '@/lib/sim/core'
import { SOURCE_COLOR } from './palette'

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 120, h = 34
  const min = Math.min(...data), max = Math.max(...data)
  const rng = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / rng) * (h - 8)}`).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w} cy={h - 3 - ((data[data.length - 1] - min) / rng) * (h - 8)} r={2.4} fill={color} />
    </svg>
  )
}

function SeverityMeter({ v, color }: { v: number; color: string }) {
  return (
    <div className="flex gap-[3px]">
      {[0, 1, 2, 3].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i))
        return (
          <div key={i} className="h-3.5 w-5 overflow-hidden rounded-[3px] bg-white/[0.07]">
            <div className="h-full" style={{ width: `${fill * 100}%`, backgroundColor: color, opacity: 0.35 + fill * 0.65 }} />
          </div>
        )
      })}
    </div>
  )
}

export default function SimPanel() {
  const ep = useConsole((s) => s.episode)!
  const hour = useConsole((s) => Math.floor(s.tHour))
  const phase = useConsole((s) => s.phase)
  const idx = idxOf(ep, hour)

  const feed = useMemo(() => {
    return ep.events.filter((e) => e.t <= hour + 0.001).slice().reverse()
  }, [ep, hour])

  const layerCity = useMemo(() => {
    return LAYER_CODES.map((l) => {
      let mx = 0
      for (const z of ep.zones) mx = Math.max(mx, z.series.layers[l][idx])
      return { layer: l, v: mx }
    }).filter((x) => x.v > 0.05)
  }, [ep, idx])

  const ind = ep.city.indicator
  const indNow = ind.series[idx]
  const spark = ind.series.slice(Math.max(0, idx - 23), idx + 1)

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3">
      {/* ingest feed */}
      <div className="glass flex min-h-0 flex-1 flex-col p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={12} className="text-[#30d158]" />
            <span className="eyebrow">Live data ingest</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#30d158] pulse-soft" />
          </div>
          <span className="font-mono text-[10px] text-white/35 tnum">{feed.length}/{ep.events.length} events</span>
        </div>
        <div className="datascroll -mr-1.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1.5">
          <AnimatePresence initial={false}>
            {feed.slice(0, 40).map((e) => (
              <motion.div
                key={`${e.t}-${e.source}-${e.message.slice(0, 12)}`}
                layout="position"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-lg border border-white/[0.05] bg-white/[0.025] px-2.5 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9.5px] text-white/40 tnum">{fmtT(e.t)}</span>
                  <span
                    className="rounded px-1.5 py-px font-mono text-[8.5px] uppercase tracking-[0.1em]"
                    style={{ color: SOURCE_COLOR[e.sourceType], backgroundColor: `${SOURCE_COLOR[e.sourceType]}18` }}
                  >
                    {e.source}
                  </span>
                  <span className="ml-auto font-mono text-[8.5px] text-white/25">{e.layer}</span>
                </div>
                <p className="mt-1 text-[11.5px] leading-snug text-white/78">{e.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {feed.length === 0 && (
            <p className="px-1 py-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
              awaiting first events…
            </p>
          )}
        </div>
      </div>

      {/* urban layers */}
      <div className="glass shrink-0 p-3.5">
        <div className="mb-2.5 flex items-center gap-2">
          <Activity size={12} className="text-white/50" />
          <span className="eyebrow">Urban layers · city max</span>
        </div>
        <div className="space-y-1.5">
          {layerCity.map(({ layer, v }) => {
            const color = RISK_COLORS[Math.min(3, Math.floor(v >= 2.55 ? 3 : v >= 1.6 ? 2 : v >= 0.72 ? 1 : 0))]
            return (
              <div key={layer} className="flex items-center gap-2.5">
                <span className="w-8 font-mono text-[10px] font-semibold tracking-wider" style={{ color }}>
                  {layer}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-white/55">{LAYER_META[layer].name}</span>
                <SeverityMeter v={v} color={color} />
              </div>
            )
          })}
          {layerCity.length === 0 && (
            <p className="py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-white/25">all layers nominal</p>
          )}
        </div>
      </div>

      {/* indicator */}
      <div className="glass shrink-0 p-3.5">
        <div className="mb-1 flex items-center gap-2">
          <Database size={12} className="text-white/50" />
          <span className="eyebrow">{ind.label}</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="tnum font-mono text-[30px] font-semibold leading-none tracking-tight">
              {ind.fmt === 'pct' ? `${indNow.toFixed(1)}%` : ind.fmt === 'temp' ? `${indNow.toFixed(1)}°` : indNow.toFixed(ind.fmt === 'int' ? 0 : 2)}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
              P10 {ind.p10[idx].toFixed(1)} · P90 {ind.p90[idx].toFixed(1)}
            </div>
          </div>
          <Spark data={spark} color="#64d2ff" />
        </div>
      </div>

      {phase === 'sim' && (
        <div className="shrink-0 px-1 pb-1">
          <p className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
            replaying synthetic episode · forecast issues at T+0
          </p>
        </div>
      )}
    </div>
  )
}

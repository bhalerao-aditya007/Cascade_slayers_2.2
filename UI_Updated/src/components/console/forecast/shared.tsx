'use client'
// ─── forecast shared primitives ──────────────────────────────────────────────
import { RISK_COLORS, RISK_LABELS, LAYER_META, type LayerCode, type RiskLevel } from '@/lib/sim/types'
import { fmtT } from '@/lib/sim/core'
import { LAYER_COLOR } from '../palette'

export function RiskBadge({ level, pulse }: { level: RiskLevel; pulse?: boolean }) {
  const c = RISK_COLORS[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${level === 3 && pulse ? 'pulse-ring' : ''}`}
      style={{ color: c, borderColor: `${c}55`, backgroundColor: `${c}14` }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${level >= 1 ? 'pulse-soft' : ''}`} style={{ backgroundColor: c }} />
      {RISK_LABELS[level]}
    </span>
  )
}

export function StateDot({ level, size = 8 }: { level: RiskLevel; size?: number }) {
  return <span className="inline-block rounded-full" style={{ width: size, height: size, backgroundColor: RISK_COLORS[level] }} />
}

export function StatTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5">
      <p className="eyebrow">{label}</p>
      <p className="tnum mt-1.5 font-mono text-[22px] font-semibold leading-none tracking-tight" style={tone ? { color: tone } : undefined}>
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[10.5px] leading-snug text-white/40">{sub}</p>}
    </div>
  )
}

export function LayerChip({ layer }: { layer: LayerCode }) {
  const c = LAYER_COLOR[layer]
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-px font-mono text-[9px] font-semibold tracking-[0.1em]"
      style={{ color: c, backgroundColor: `${c}16`, border: `1px solid ${c}33` }}
    >
      {layer}
    </span>
  )
}

export function Eta({ median, p10, p90, realized, realizedAt }: { median: number; p10: number; p90: number; realized?: boolean; realizedAt?: number }) {
  if (realized) {
    return (
      <span className="tnum font-mono text-[11px] text-[#30d158]">
        ✓ occurred {fmtT(realizedAt ?? median)}
      </span>
    )
  }
  return (
    <span className="tnum font-mono text-[11px] text-white/80">
      {fmtT(median)}
      <span className="ml-1.5 text-[9.5px] text-white/35">[{fmtT(p10)} – {fmtT(p90)}]</span>
    </span>
  )
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between first:mt-0">
      <p className="eyebrow">{children}</p>
      {right}
    </div>
  )
}

export function PBar({ p, color = '#64d2ff', h = 4 }: { p: number; color?: string; h?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-white/[0.08]" style={{ height: h }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, p * 100)}%`, backgroundColor: color }} />
    </div>
  )
}

export const layerName = (l: LayerCode) => LAYER_META[l].name

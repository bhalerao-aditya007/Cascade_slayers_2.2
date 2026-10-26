'use client'
// ─── INTERVENE tab · ranked actions + live counterfactual curves ──────────────
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlarmClock, BadgeIndianRupee, Zap, TriangleAlert, Boxes } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'
import { useConsole } from '@/lib/store'
import { combinedPlan } from '@/lib/sim/generate'
import { SectionTitle, PBar } from './shared'

const CONF_COLOR: Record<string, string> = { HIGH: '#30d158', MED: '#ffd60a', LOW: '#ff9f0a' }

export default function InterveneTab() {
  const ep = useConsole((s) => s.episode)!
  const deployed = useConsole((s) => s.deployed)
  const { toggleDeploy } = useConsole.getState()

  const plan = useMemo(() => combinedPlan(ep, deployed), [ep, deployed])
  const base72 = ep.city.baseline[72]
  const plan72 = plan ? plan.p[plan.p.length - 1] : base72
  const delta = base72 - plan72

  const chartData = useMemo(() => {
    const n = ep.city.baseline.length
    return Array.from({ length: n }, (_, i) => ({
      t: i,
      base: +ep.city.baseline[i].toFixed(3),
      plan: +(plan ? plan.p[Math.min(plan.p.length - 1, Math.round((i / 72) * (plan.p.length - 1)))] : ep.city.baseline[i]).toFixed(3),
    }))
  }, [ep, plan])

  const used = ep.interventions.filter((iv) => deployed.includes(iv.id))

  return (
    <div className="space-y-5 p-4">
      {/* summary */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Counterfactual · P(city cascade ≤ 72h)</p>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="tnum font-mono text-[30px] font-semibold leading-none tracking-tight text-[#ff453a]">
                {Math.round(base72 * 100)}%
              </span>
              {deployed.length > 0 && (
                <>
                  <span className="font-mono text-[18px] text-white/30">→</span>
                  <motion.span
                    key={plan72}
                    initial={{ scale: 1.15, color: '#ffffff' }}
                    animate={{ scale: 1, color: '#30d158' }}
                    className="tnum font-mono text-[30px] font-semibold leading-none tracking-tight"
                  >
                    {Math.round(plan72 * 100)}%
                  </motion.span>
                  <span className="rounded-full bg-[#30d158]/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#30d158]">
                    −{Math.round(delta * 100)} pts
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">{deployed.length} deployed</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
              residual {Math.round(plan72 * 100)}%
            </p>
          </div>
        </div>

        {/* chart */}
        <div className="mt-3 h-[168px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 6, right: 2, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="cfBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff453a" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#ff453a" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="t" tickFormatter={(v) => `+${v}`} interval={5} />
              <YAxis width={40} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
              <Tooltip
                contentStyle={{ background: 'rgba(13,13,16,0.94)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11, fontFamily: 'var(--font-geist-mono)' }}
                labelFormatter={(v) => `T+${v}h`}
                formatter={(v: number | string, name) => [`${Math.round(Number(v) * 100)}%`, name === 'base' ? 'baseline' : 'with plan']}
              />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.28)" strokeDasharray="3 3" />
              <Area dataKey="base" stroke="#ff453a" strokeWidth={1.8} fill="url(#cfBase)" />
              <Area dataKey="plan" stroke="#30d158" strokeWidth={2} fill="none" isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/28">
          common random numbers · paired monte-carlo · effects are catalog assumptions with sensitivity bands
        </p>
      </div>

      {/* ranked interventions */}
      <div>
        <SectionTitle right={<span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">ranked by ΔP</span>}>
          Intervention catalog
        </SectionTitle>
        <div className="space-y-2.5">
          {[...ep.interventions].sort((a, b) => b.deltaP - a.deltaP).map((iv, i) => {
            const on = deployed.includes(iv.id)
            return (
              <motion.div
                key={iv.id}
                layout
                className={`rounded-xl border p-3.5 transition-colors ${on ? 'border-[#30d158]/40 bg-[#30d158]/[0.05]' : 'border-white/[0.07] bg-white/[0.025]'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-white/30">#{i + 1}</span>
                      <p className="text-[12.5px] font-semibold leading-tight tracking-tight">{iv.name}</p>
                      {on && (
                        <span className="rounded-full bg-[#30d158]/15 px-1.5 py-px font-mono text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[#30d158]">
                          deployed
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/45">{iv.detail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum font-mono text-[19px] font-semibold leading-none text-[#30d158]">−{Math.round(iv.deltaP * 100)}<span className="text-[11px]">pts</span></p>
                    <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-white/30">ΔP(crit ≤72h)</p>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-2.5">
                  <div>
                    <p className="flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-white/30"><AlarmClock size={9} /> act by</p>
                    <p className="tnum mt-0.5 font-mono text-[11px] font-semibold text-[#ff9f0a]">T+{iv.deadlineH}h</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-white/30"><BadgeIndianRupee size={9} /> cost</p>
                    <p className="mt-0.5 font-mono text-[11px] text-white/70">{iv.cost}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-white/30"><Zap size={9} /> confidence</p>
                    <p className="mt-0.5 font-mono text-[11px] font-semibold" style={{ color: CONF_COLOR[iv.confidence] }}>{iv.confidence}</p>
                  </div>
                </div>

                {iv.sideEffects.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                    {iv.sideEffects.map((se, k) => (
                      <span key={k} className="flex items-center gap-1 text-[10px] text-[#ff9f0a]/80">
                        <TriangleAlert size={9} /> {se}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
                    lead {iv.deployLeadH}h · {iv.resources}
                  </span>
                  <button
                    onClick={() => toggleDeploy(iv.id)}
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
                      on
                        ? 'bg-white/[0.1] text-white/70 hover:bg-white/[0.16]'
                        : 'bg-white text-black hover:bg-white/85'
                    }`}
                  >
                    {on ? 'Withdraw' : 'Deploy'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* allocation */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
        <p className="mb-2 flex items-center gap-2 eyebrow"><Boxes size={11} /> MILP allocation · resource limits</p>
        <div className="space-y-2">
          {used.length > 0 ? (
            used.map((iv) => (
              <div key={iv.id}>
                <div className="flex items-center justify-between font-mono text-[10px] text-white/50">
                  <span className="truncate">{iv.resources}</span>
                  <span className="shrink-0 text-white/35">committed</span>
                </div>
                <div className="mt-1"><PBar p={0.7 + iv.deltaP} color="#30d158" h={3} /></div>
              </div>
            ))
          ) : (
            <p className="py-1 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-white/25">
              no resources committed — deploy actions to allocate
            </p>
          )}
        </div>
        <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/28">
          objective: Σ w·ΔP − side-effect penalties · unallocated risk reported
        </p>
      </div>
    </div>
  )
}

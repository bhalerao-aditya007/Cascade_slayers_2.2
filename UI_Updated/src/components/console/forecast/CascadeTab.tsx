'use client'
// ─── CASCADE tab · chains, stage ETAs, gantt, loops, ρ ───────────────────────
import { motion } from 'framer-motion'
import { GitBranch, Repeat, TrendingUp, ArrowRight, Check } from 'lucide-react'
import { useConsole } from '@/lib/store'
import { fmtT } from '@/lib/sim/core'
import { LayerChip, SectionTitle, Eta, PBar } from './shared'

export default function CascadeTab() {
  const ep = useConsole((s) => s.episode)!
  const chainId = useConsole((s) => s.chainId)
  const { setChain } = useConsole.getState()
  const chain = ep.chains.find((c) => c.id === chainId) ?? ep.chains[0]

  return (
    <div className="space-y-6 p-4">
      {/* chain picker */}
      <div>
        <SectionTitle right={<span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">top-{ep.chains.length} by frequency</span>}>
          Predicted failure chains · Monte-Carlo ×500
        </SectionTitle>
        <div className="space-y-2">
          {ep.chains.map((c) => {
            const active = c.id === chain?.id
            return (
              <button
                key={c.id}
                onClick={() => setChain(c.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-white/25 bg-white/[0.06]' : 'border-white/[0.07] bg-white/[0.025] hover:border-white/15'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-semibold tracking-tight">{c.name}</span>
                  <span className="tnum shrink-0 font-mono text-[13px] font-semibold text-[#ff9f0a]">
                    {Math.round(c.probability * 100)}%
                  </span>
                </div>
                <div className="mt-2"><PBar p={c.probability} color="#ff9f0a" /></div>
              </button>
            )
          })}
        </div>
      </div>

      {/* chain flow */}
      {chain && (
        <div>
          <SectionTitle>Stage timing · {chain.name}</SectionTitle>
          <div className="datascroll -mx-1 overflow-x-auto px-1 pb-1">
            <div className="flex min-w-max items-stretch gap-1">
              {chain.stages.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`w-[178px] rounded-xl border p-3 ${s.realized ? 'border-[#30d158]/30 bg-[#30d158]/[0.06]' : 'border-white/[0.08] bg-white/[0.03]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <LayerChip layer={s.layer} />
                      {s.realized ? (
                        <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#30d158]"><Check size={10} /> seen</span>
                      ) : (
                        <span className="tnum font-mono text-[9.5px] text-white/40">p={Math.round(s.pGate * 100)}%</span>
                      )}
                    </div>
                    <p className="mt-2 min-h-[32px] text-[11.5px] font-medium leading-snug">{s.label}</p>
                    <div className="mt-2 border-t border-white/[0.07] pt-2">
                      <Eta median={s.etaMedian} p10={s.etaP10} p90={s.etaP90} realized={s.realized} realizedAt={s.realizedAt} />
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <div className="relative h-1 flex-1 rounded-full bg-white/[0.07]">
                          {/* position p10..p90 on the chain's own time span */}
                          {(() => {
                            const lo = Math.min(...chain.stages.map((x) => x.etaP10), 0)
                            const hi = Math.max(...chain.stages.map((x) => x.etaP90))
                            const u = (v: number) => ((v - lo) / (hi - lo)) * 100
                            return (
                              <>
                                <div
                                  className="absolute top-0 h-1 rounded-full bg-white/25"
                                  style={{ left: `${Math.max(0, u(s.etaP10))}%`, width: `${Math.max(2, u(s.etaP90) - u(s.etaP10))}%` }}
                                />
                                <div
                                  className="absolute top-[-2px] h-[5px] w-[5px] rounded-full bg-white"
                                  style={{ left: `${Math.max(0, u(s.etaMedian))}%` }}
                                />
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  {i < chain.stages.length - 1 && (
                    <ArrowRight size={13} className="shrink-0 text-white/25" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* gantt */}
      {chain && (
        <div>
          <SectionTitle>Stage window · hours from now</SectionTitle>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
            <div className="relative space-y-2.5">
              {/* axis */}
              <div className="relative h-4">
                {[0, 12, 24, 36, 48, 60, 72].map((h) => (
                  <span key={h} className="absolute -translate-x-1/2 font-mono text-[8.5px] text-white/30 tnum" style={{ left: `${(h / 78) * 100 + 4}%` }}>
                    +{h}
                  </span>
                ))}
              </div>
              {chain.stages.map((s, i) => {
                const u = (v: number) => ((Math.max(-6, v) + 6) / 78) * 100
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-9 shrink-0"><LayerChip layer={s.layer} /></span>
                    <div className="relative h-5 flex-1 rounded bg-white/[0.03]">
                      <div
                        className={`absolute top-1/2 h-[7px] -translate-y-1/2 rounded-full ${s.realized ? 'bg-[#30d158]/40' : 'bg-[#ff9f0a]/35'}`}
                        style={{ left: `${u(s.etaP10)}%`, width: `${Math.max(1.5, u(s.etaP90) - u(s.etaP10))}%` }}
                      />
                      <div
                        className={`absolute top-1/2 h-[11px] w-[3px] -translate-y-1/2 rounded-full ${s.realized ? 'bg-[#30d158]' : 'bg-[#ff9f0a]'}`}
                        style={{ left: `${u(s.etaMedian)}%` }}
                      />
                      <div className="absolute inset-y-0 w-px bg-white/20" style={{ left: `${u(0)}%` }} title="NOW" />
                    </div>
                    <span className="w-[52px] shrink-0 text-right font-mono text-[9.5px] text-white/40 tnum">{fmtT(s.etaMedian)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* rho + loops */}
      <div>
        <SectionTitle>Cascade dynamics</SectionTitle>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-[12.5px] font-semibold"><TrendingUp size={13} className="text-white/55" /> Branching ratio ρ</p>
            <span className={`tnum font-mono text-[20px] font-semibold ${ep.city.rho >= 1 ? 'text-[#ff453a]' : 'text-[#30d158]'}`}>
              {ep.city.rho.toFixed(2)}
            </span>
          </div>
          <div className="mt-2.5"><PBar p={Math.min(ep.city.rho / 1.4, 1)} color={ep.city.rho >= 1 ? '#ff453a' : '#30d158'} h={5} /></div>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-white/50">{ep.city.rhoNote}</p>
        </div>
        <div className="mt-2.5 space-y-2">
          {ep.loops.map((l, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <Repeat size={13} className="mt-0.5 shrink-0 text-[#bf5af2]" />
              <p className="text-[11.5px] leading-relaxed text-white/60">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-1 pb-1">
        <GitBranch size={11} className="text-white/30" />
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/28">
          edge weights: online hawkes · lags 2/8/24h · evidence cards in graph view
        </p>
      </div>
    </div>
  )
}

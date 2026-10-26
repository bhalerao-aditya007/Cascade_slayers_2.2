'use client'
// ─── pipeline curtain · L0→L6 inference transition ───────────────────────────
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Cpu } from 'lucide-react'
import { useConsole } from '@/lib/store'

export default function PipelineCurtain() {
  const ep = useConsole((s) => s.episode)!
  const { enterPhase, play } = useConsole.getState()
  const [step, setStep] = useState(0)
  const done = step >= ep.pipeline.length

  useEffect(() => {
    const iv = setInterval(() => setStep((s) => s + 1), 430)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (!done) return
    const to = setTimeout(() => {
      enterPhase('forecast')
      play()
    }, 720)
    return () => clearTimeout(to)
  }, [done, enterPhase, play])

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={() => { enterPhase('forecast'); play() }}
      className="absolute inset-0 z-40 flex cursor-default items-center justify-center bg-[#050506]/72 backdrop-blur-2xl"
      aria-label="Model inference running — click to skip"
    >
      <div className="w-[min(560px,92vw)]">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu size={14} className="text-[#64d2ff]" />
            <span className="eyebrow">72h forecast generation</span>
          </div>
          <span className="font-mono text-[10px] text-white/35">{ep.episodeId} · as-of T+00</span>
        </div>

        {/* progress hairline */}
        <div className="mb-6 h-[3px] overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#64d2ff] to-[#bf5af2]"
            animate={{ width: `${(Math.min(step, ep.pipeline.length) / ep.pipeline.length) * 100}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
          />
        </div>

        <div className="space-y-1">
          {ep.pipeline.map((p, i) => {
            const state = i < step ? 'done' : i === step ? 'run' : 'wait'
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: state === 'wait' ? 0.32 : 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5"
              >
                <span className={`w-7 font-mono text-[11px] font-semibold ${state === 'done' ? 'text-[#30d158]' : 'text-white/40'}`}>{p.id}</span>
                <span className="w-24 font-mono text-[11px] uppercase tracking-[0.12em] text-white/85">{p.name}</span>
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-white/50">{p.detail}</span>
                {state === 'done' ? (
                  <span className="flex items-center gap-2 font-mono text-[10px] text-white/35 tnum">
                    {p.ms}ms <Check size={12} className="text-[#30d158]" />
                  </span>
                ) : state === 'run' ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/20 border-t-[#64d2ff]" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-white/10" />
                )}
              </motion.div>
            )
          })}
        </div>

        <motion.p
          animate={{ opacity: done ? 1 : 0.4 }}
          className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-white/45"
        >
          {done ? 'forecast ready — chronos-2 · lightgbm · online hawkes' : 'running deterministic replay…'}
        </motion.p>
      </div>
    </motion.button>
  )
}

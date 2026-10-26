'use client'
// ─── transport bar · scrubber + event markers + playback controls ────────────
import { useRef, useState } from 'react'
import { Play, Pause, SkipBack, FastForward, ChevronRight } from 'lucide-react'
import { useConsole, hazardMeta } from '@/lib/store'
import { fmtT, fmtClock } from '@/lib/sim/core'
import { CITIES } from '@/lib/sim/cities'
import { TONE_COLOR, LAYER_COLOR } from './palette'

const SPEEDS = [
  { label: '1×', v: 1 },
  { label: '2×', v: 2 },
  { label: '4×', v: 4 },
  { label: '8×', v: 8 },
]

export default function Timeline() {
  const ep = useConsole((s) => s.episode)
  const tHour = useConsole((s) => s.tHour)
  const playing = useConsole((s) => s.playing)
  const speed = useConsole((s) => s.speed)
  const phase = useConsole((s) => s.phase)
  const chainId = useConsole((s) => s.chainId)
  const hazard = useConsole((s) => s.hazard)
  const tz = hazard ? CITIES[hazard].tz : { offsetH: 5.5, label: 'IST' }
  const { play, pause, setSpeed, setTHour } = useConsole.getState()
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  if (!ep) return null
  const span = 72 - ep.simStart
  const pct = (t: number) => ((t - ep.simStart) / span) * 100
  const nowPct = pct(0)
  const headPct = pct(tHour)

  const seekFromEvent = (clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const u = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
    setTHour(ep.simStart + u * span)
  }

  const chain = ep.chains.find((c) => c.id === chainId) ?? ep.chains[0]
  const stageMarks = phase === 'forecast' && chain
    ? chain.stages.filter((s) => s.etaMedian > 0 && !s.realized)
    : []
  const eventMarks = phase === 'sim' ? ep.events.filter((e) => e.mark) : []

  return (
    <div className="border-t border-white/[0.07] bg-[#08080b]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-full items-center gap-4 px-4 py-3 lg:px-5">
        {/* transport */}
        <div className="flex items-center gap-1.5">
          <button
            aria-label="Back to start"
            onClick={() => { setTHour(ep.simStart); pause() }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.08] hover:text-white"
          >
            <SkipBack size={15} />
          </button>
          <button
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => (playing ? pause() : play())}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-white transition hover:bg-white/[0.14]"
          >
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
        </div>

        {/* clock */}
        <div className="w-[168px] shrink-0">
          <div className="tnum font-mono text-[19px] font-semibold leading-none tracking-tight">
            {fmtT(tHour)}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
            {fmtClock(tHour, tz.offsetH, tz.label)} · {phase === 'sim' ? 'replay' : 'forecast'}
          </div>
        </div>

        {/* track */}
        <div className="min-w-0 flex-1">
          <div
            ref={trackRef}
            role="slider"
            aria-label="Timeline"
            aria-valuenow={Math.round(tHour)}
            aria-valuemin={ep.simStart}
            aria-valuemax={72}
            tabIndex={0}
            className="group relative h-12 cursor-pointer touch-none select-none"
            onPointerDown={(e) => {
              setDragging(true)
              pause()
              seekFromEvent(e.clientX)
              ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
            }}
            onPointerMove={(e) => dragging && seekFromEvent(e.clientX)}
            onPointerUp={() => setDragging(false)}
          >
            {/* base rail */}
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/[0.07]">
              {/* realized segment */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/[0.10] to-white/[0.22]"
                style={{ width: `${nowPct}%` }}
              />
              {/* forecast segment (hatched) */}
              <div
                className="absolute inset-y-0 right-0 rounded-full"
                style={{
                  left: `${nowPct}%`,
                  backgroundImage:
                    'repeating-linear-gradient(115deg, rgba(100,210,255,0.28) 0 5px, rgba(100,210,255,0.07) 5px 11px)',
                }}
              />
              {/* progress sheen */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/20 mix-blend-overlay"
                style={{ width: `${headPct}%` }}
              />
            </div>

            {/* NOW divider */}
            {phase === 'forecast' && (
              <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${nowPct}%` }}>
                <div className="h-7 w-px -translate-x-1/2 bg-white/45" />
                <div className="mt-0.5 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">
                  now
                </div>
              </div>
            )}

            {/* event markers (sim phase) */}
            {eventMarks.map((e, i) => (
              <div
                key={i}
                title={`${fmtT(e.t)} — ${e.message}`}
                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border transition-transform hover:scale-[1.6]"
                style={{ left: `${pct(e.t)}%`, backgroundColor: TONE_COLOR[e.tone], borderColor: 'rgba(5,5,6,0.8)' }}
              />
            ))}

            {/* chain stage markers (forecast phase) */}
            {stageMarks.map((s, i) => (
              <div
                key={i}
                title={`${fmtT(s.etaMedian)} — ${s.label} (p=${Math.round(s.pGate * 100)}%)`}
                className="absolute top-1/2 flex h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ left: `${pct(s.etaMedian)}%` }}
              >
                <div
                  className="h-2.5 w-2.5 rotate-45 rounded-[2px] border"
                  style={{ backgroundColor: `${LAYER_COLOR[s.layer]}cc`, borderColor: 'rgba(5,5,6,0.8)' }}
                />
              </div>
            ))}

            {/* playhead */}
            <div
              className="pointer-events-none absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${headPct}%` }}
            >
              <div className="playhead-glow h-4 w-4 rounded-full bg-white" />
            </div>

            {/* horizon ticks */}
            {Array.from({ length: 9 }, (_, i) => ep.simStart + (i * span) / 8).map((tick, i) => (
              <div
                key={i}
                className="absolute bottom-0 -translate-x-1/2 font-mono text-[8px] tracking-wide text-white/25"
                style={{ left: `${pct(tick)}%` }}
              >
                {Math.round(tick) > 0 ? `+${Math.round(tick)}` : Math.round(tick) === 0 ? '0' : Math.round(tick)}
              </div>
            ))}
          </div>
        </div>

        {/* speed + skip */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
            {SPEEDS.map((s) => (
              <button
                key={s.label}
                onClick={() => setSpeed(s.v)}
                className={`rounded-full px-2 py-1 font-mono text-[10px] transition ${
                  speed === s.v ? 'bg-white/[0.14] text-white' : 'text-white/40 hover:text-white/75'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {phase === 'sim' ? (
            <button
              onClick={() => { setTHour(-0.001); play() }}
              className="flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[11px] font-medium text-white/70 transition hover:bg-white/[0.09] hover:text-white"
            >
              Skip to T+0 <ChevronRight size={12} />
            </button>
          ) : (
            <button
              onClick={() => { setTHour(72); pause() }}
              className="flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[11px] font-medium text-white/70 transition hover:bg-white/[0.09] hover:text-white"
            >
              H+72 <FastForward size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

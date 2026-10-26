'use client'
// ─── session · one persistent scene, scroll-driven end to end ─────────────────
// brief → simulation (scroll = time) → inference curtain → 72h forecast → epilogue
import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useConsole } from '@/lib/store'
import { scrollState } from '@/lib/scroll-state'
import { scrollToId, lenisRef } from '@/lib/lenis-ref'
import MapView from '@/components/console/MapView'
import PipelineCurtain from '@/components/console/PipelineCurtain'
import SessionHud from './SessionHud'
import CityBrief, { updateBriefProgress } from './CityBrief'
import SimStage from './SimStage'
import ForecastStage from './ForecastStage'
import Epilogue from './Epilogue'

/** rAF → store.advance(dt) (forecast playback only) */
function PlaybackEngine() {
  useEffect(() => {
    let raf = 0
    let last: number | null = null
    const tick = (tm: number) => {
      raf = requestAnimationFrame(tick)
      if (last == null) { last = tm; return }
      const dt = Math.min((tm - last) / 1000, 0.12)
      last = tm
      useConsole.getState().advance(dt)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return null
}

export default function Session() {
  const hazard = useConsole((s) => s.hazard)
  const phase = useConsole((s) => s.phase)

  // ── the scroll engine: one rAF drives brief/sim/epilogue progress + phases ──
  useEffect(() => {
    if (!hazard) return
    // page height just grew (session sections mounted) — refresh the smooth-scroller limit
    const t = setTimeout(() => lenisRef.current?.resize(), 80)
    let raf = 0
    let pipelineScrolled = false
    const onScroll = () => {
      raf = requestAnimationFrame(onScroll)
      const vh = window.innerHeight
      const st = useConsole.getState()
      if (!st.episode) return

      const briefEl = document.getElementById('brief')
      const simEl = document.getElementById('sim')
      const fcEl = document.getElementById('forecast-stage')
      const epEl = document.getElementById('epilogue')

      // brief progress (parallax/fade is CSS; camera reveal handled by MapView)
      if (briefEl) updateBriefProgress(briefEl as HTMLElement)

      // simulation progress → time + camera
      if (simEl) {
        const r = simEl.getBoundingClientRect()
        const total = r.height - vh
        const p = Math.max(0, Math.min(1, -r.top / Math.max(1, total)))
        scrollState.simP = p
        if (st.phase === 'brief' || st.phase === 'sim' || st.phase === 'pipeline') {
          st.setSimProgress(p)
        }
        // scrolling back up out of the forecast returns to the scroll-scrubbed sim
        if (st.phase === 'forecast' && r.bottom > vh * 0.6 && r.top < 0) {
          st.enterPhase('sim')
          useConsole.setState({ playing: false })
        }
      }

      // epilogue reveal
      if (epEl && st.phase === 'forecast') {
        const r = epEl.getBoundingClientRect()
        if (r.top < vh * 0.45) st.enterPhase('epilogue')
      } else if (epEl && st.phase === 'epilogue') {
        const r = epEl.getBoundingClientRect()
        if (r.top > vh * 0.75) st.enterPhase('forecast')
      }

      // when the curtain finishes (phase → forecast), glide to the console
      if (st.phase === 'forecast' && !pipelineScrolled && fcEl) {
        pipelineScrolled = true
        const r = fcEl.getBoundingClientRect()
        if (r.top > vh * 0.25) scrollToId('#forecast-stage', { duration: 1.1 })
      }
      if (st.phase !== 'forecast' && st.phase !== 'epilogue') pipelineScrolled = false
    }
    raf = requestAnimationFrame(onScroll)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [hazard])

  if (!hazard) return null

  return (
    <div id="session" className="relative">
      {/* persistent city map — the one scene the whole session plays on */}
      <MapView />
      <SessionHud />
      <CityBrief />
      <SimStage />
      <ForecastStage />
      <Epilogue />
      <PlaybackEngine />
      <AnimatePresence>
        {phase === 'pipeline' && (
          <div key="curtain" className="fixed inset-0 z-[60]">
            <PipelineCurtain />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

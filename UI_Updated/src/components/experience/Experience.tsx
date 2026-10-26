'use client'
// ——— experience root — Lenis smooth scroll + select + session + API explorer composition ———
import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { Terminal } from 'lucide-react'
import { lenisRef } from '@/lib/lenis-ref'
import SelectStage from './SelectStage'
import Session from './Session'
import ApiPlayground from '../console/ApiPlayground'

export default function Experience() {
  const [apiOpen, setApiOpen] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      touchMultiplier: 1.6,
    })
    lenisRef.current = lenis
    let raf = 0
    const loop = (tm: number) => {
      raf = requestAnimationFrame(loop)
      lenis.raf(tm)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return (
    <main className="relative bg-[#050507]">
      <SelectStage />
      <Session />

      {/* Floating API & Model Inference Explorer */}
      <button
        onClick={() => setApiOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-[#0e0e14]/90 px-4 py-2 font-mono text-xs text-white shadow-2xl backdrop-blur-xl transition hover:border-[#ff9f0a] hover:bg-[#ff9f0a]/15 hover:text-[#ff9f0a]"
      >
        <Terminal size={14} className="text-[#ff9f0a]" />
        <span>API & ML Models</span>
      </button>

      <ApiPlayground open={apiOpen} onClose={() => setApiOpen(false)} />
    </main>
  )
}

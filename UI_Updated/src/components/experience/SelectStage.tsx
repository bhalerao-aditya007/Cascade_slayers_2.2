'use client'
// ─── phase 1 · calamity select · hero + 3D-stacked cards + scroll globe ───────
// Codrops 3DStackMotion: cards recede up in perspective as the next arrives;
// the Three.js globe rotates to each famous city as you scroll.
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, MapPin, ChevronDown, Waves, ThermometerSun, Biohazard, Zap, Activity, FlaskConical } from 'lucide-react'
import { HAZARDS } from '@/lib/sim/hazards'
import { useConsole } from '@/lib/store'
import { scrollState, damp } from '@/lib/scroll-state'
import { scrollToId, scrollToY } from '@/lib/lenis-ref'
import GlobeCanvas from './GlobeCanvas'

const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  waves: Waves, 'thermometer-sun': ThermometerSun, biohazard: Biohazard,
  zap: Zap, activity: Activity, 'flask-conical': FlaskConical,
}

export default function SelectStage() {
  const sectionRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const stageRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const activeIdxRef = useRef(0)
  const start = useConsole((s) => s.start)

  useEffect(() => {
    let raf = 0
    let cardFloat = -1.15
    const onScroll = () => {
      raf = requestAnimationFrame(onScroll)
      const vh = window.innerHeight
      const top = sectionRef.current?.getBoundingClientRect().top ?? 0
      const y = -top // scroll position within the section
      // hero fades across the first viewport
      const heroP = Math.max(0, Math.min(1, y / (vh * 0.9)))
      const hero = heroRef.current
      if (hero) {
        hero.style.opacity = String(1 - heroP)
        hero.style.transform = `translateY(${-heroP * 9}vh) scale(${1 - heroP * 0.06})`
        hero.style.pointerEvents = heroP > 0.5 ? 'none' : 'auto'
      }
      // card float across the following viewports (-1 = hero, 0..5 = cards)
      const target = Math.max(-1.15, Math.min(HAZARDS.length - 1, (y - vh) / vh))
      scrollState.cardTarget = target
      cardFloat = damp(cardFloat, target, 0.11)
      scrollState.cardFloat = Math.max(0, cardFloat)
      // card transforms
      for (let i = 0; i < HAZARDS.length; i++) {
        const el = cardRefs.current[i]
        if (!el) continue
        const d = cardFloat - i
        if (d <= -1.05) {
          el.style.transform = 'translate3d(0, 96vh, 0)'
          el.style.opacity = '0'
          el.style.pointerEvents = 'none'
          continue
        }
        if (d >= 3.2) {
          el.style.opacity = '0'
          el.style.pointerEvents = 'none'
          continue
        }
        if (d < 0) {
          // rising from below
          const u = 1 + d // 0..1
          el.style.transform = `translate3d(0, ${u * 94}vh, 0) rotateX(0deg) scale(1)`
          el.style.opacity = String(Math.max(0, Math.min(1, 1.25 + d * 5)))
          el.style.pointerEvents = d > -0.55 ? 'auto' : 'none'
        } else {
          // receding up the stack
          const dd = Math.min(d, 3)
          el.style.transform = `translate3d(0, ${-dd * 13.5}vh, ${-dd * 90}px) rotateX(${dd * 5.5}deg) scale(${1 - dd * 0.075})`
          el.style.opacity = String(Math.max(0, 1 - dd * 0.3))
          el.style.pointerEvents = d < 0.55 ? 'auto' : 'none'
        }
      }
      const idx = Math.max(0, Math.min(HAZARDS.length - 1, Math.round(target)))
      if (idx !== activeIdxRef.current) {
        activeIdxRef.current = idx
        setActiveIdx(idx)
      }
    }
    raf = requestAnimationFrame(onScroll)
    return () => cancelAnimationFrame(raf)
  }, [])

  const run = (id: (typeof HAZARDS)[number]['id']) => {
    start(id)
    // wait a tick for the session to mount, then glide to it
    setTimeout(() => scrollToId('#session', { duration: 2.0 }), 60)
  }

  return (
    <section ref={sectionRef} id="select" aria-label="Choose a calamity" style={{ height: `${100 + (HAZARDS.length - 1) * 100 + 40}vh` }}>
      <div ref={stageRef} className="sticky top-0 h-dvh overflow-hidden">
        {/* globe backdrop */}
        <div className="absolute inset-0 opacity-90">
          <GlobeCanvas />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,5,7,0.6)_100%)]" aria-hidden />

        {/* hero */}
        <div ref={heroRef} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,5,7,0.78)_0%,rgba(5,5,7,0.42)_40%,transparent_72%)]" aria-hidden />
          <div className="relative flex flex-col items-center">
          <p className="eyebrow mb-5 text-[10px] tracking-[0.5em] text-white/45">CRISIS FORECASTING SYSTEM</p>
          <h1 className="text-[clamp(3rem,9vw,7rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
            72H <span className="text-white/35">WARNING</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-white/55">
            Six calamities. Six cities famous for them. Choose one, watch it unfold on the real
            city map — then see what the model predicts for the next 72 hours, hour by hour.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {['6 CALAMITIES', '6 CITIES', 'REAL OSM BOUNDARIES', '72H HORIZON'].map((t) => (
              <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/50">
                {t}
              </span>
            ))}
          </div>
          </div>
          <div className="absolute bottom-8 flex flex-col items-center gap-2 text-white/35">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em]">scroll</span>
            <ChevronDown size={14} className="animate-bounce" />
          </div>
        </div>

        {/* stacked cards */}
        <div className="absolute inset-0" style={{ perspective: '1500px' }}>
          {HAZARDS.map((h, i) => {
            const Icon = ICONS[h.icon]
            return (
              <div
                key={h.id}
                ref={(el) => { cardRefs.current[i] = el }}
                className="card-3d absolute left-1/2 top-1/2 w-[min(680px,92vw)] -translate-x-1/2 -translate-y-1/2"
                style={{ zIndex: i, opacity: 0, pointerEvents: 'none' as never, willChange: 'transform, opacity' }}
              >
                <article className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b0c10]/92 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                  <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${h.accent}, transparent)` }} />
                  <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.3em] text-white/35">
                          Calamity {String(i + 1).padStart(2, '0')} / 06
                        </p>
                        <h2 className="mt-2 text-[clamp(1.7rem,4vw,2.6rem)] font-semibold leading-none tracking-tight">
                          {h.name}
                        </h2>
                        <p className="mt-1.5 text-[12.5px] text-white/40">{h.short}</p>
                      </div>
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                        style={{ borderColor: `${h.accent}44`, backgroundColor: h.accentSoft, color: h.accent }}
                      >
                        {Icon ? <Icon size={20} strokeWidth={1.8} /> : <span className="text-lg font-semibold">{h.name[0]}</span>}
                      </div>
                    </div>

                    <p className="mt-5 text-[15px] font-medium leading-snug text-white/85">{h.tagline}</p>

                    <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                      <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: h.accent }} />
                      <div>
                        <p className="text-[12.5px] font-semibold text-white/90">
                          {h.city.name} <span className="text-white/35">· {h.city.country}</span>
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-white/50">{h.city.famousFor}</p>
                      </div>
                    </div>

                    <div className="mt-4 hidden items-center justify-between gap-3 sm:flex">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                        {h.chainPreview}
                      </span>
                      <span className="rounded-full border px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.16em]"
                        style={{ borderColor: `${h.accent}40`, color: h.accent }}>
                        {h.leadBadge}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      <p className="hidden text-[11px] leading-snug text-white/35 md:block md:max-w-[280px]">
                        {h.description.slice(0, 96)}…
                      </p>
                      <button
                        onClick={() => run(h.id)}
                        className="group flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-[13px] font-semibold text-[#08080b] transition-transform hover:scale-[1.03] active:scale-[0.98]"
                        style={{ backgroundColor: h.accent }}
                      >
                        Run simulation
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            )
          })}
        </div>

        {/* progress rail */}
        <div className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex">
          {HAZARDS.map((h, i) => (
            <button
              key={h.id}
              onClick={() => {
                const sec = sectionRef.current
                if (sec) scrollToY(sec.offsetTop + window.innerHeight * (1 + i) + 4, 1.4)
              }}
              className="group flex items-center gap-2.5"
              aria-label={`Go to ${h.name}`}
            >
              <span className={`font-mono text-[9px] uppercase tracking-[0.18em] transition-all ${i === activeIdx ? 'text-white/85 opacity-100' : 'text-white/30 opacity-0 group-hover:opacity-100'}`}>
                {h.city.name}
              </span>
              <span
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === activeIdx ? 22 : 8, backgroundColor: i === activeIdx ? h.accent : 'rgba(255,255,255,0.22)' }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

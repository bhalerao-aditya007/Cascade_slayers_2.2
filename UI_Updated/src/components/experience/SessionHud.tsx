'use client'
// ——— session HUD — fixed brand bar with the three-phase tracker + live backend telemetry ———
import { useState, useEffect } from 'react'
import { ChevronLeft, Waves, ThermometerSun, Biohazard, Zap, Activity, FlaskConical, Timer, Server, Radio } from 'lucide-react'
import { useConsole, hazardMeta } from '@/lib/store'
import { cityLevelAt } from '@/lib/sim/generate'
import { CITIES } from '@/lib/sim/cities'
import { scrollToTop } from '@/lib/lenis-ref'
import { RiskBadge } from '@/components/console/forecast/shared'
import { CascadeAPI, type ApiHealth } from '@/lib/api'

const HAZ_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  waves: Waves, 'thermometer-sun': ThermometerSun, biohazard: Biohazard,
  zap: Zap, activity: Activity, 'flask-conical': FlaskConical,
}

const PHASES = [
  { id: '01', label: 'CALAMITY', match: ['select'] },
  { id: '02', label: 'SIMULATION', match: ['brief', 'sim', 'pipeline'] },
  { id: '03', label: 'FORECAST', match: ['forecast', 'epilogue'] },
]

export default function SessionHud() {
  const phase = useConsole((s) => s.phase)
  const hazard = useConsole((s) => s.hazard)
  const ep = useConsole((s) => s.episode)
  const hour = useConsole((s) => Math.floor(s.tHour))
  const reset = useConsole((s) => s.reset)

  const [backendHealth, setBackendHealth] = useState<ApiHealth | null>(null)
  const [backendOnline, setBackendOnline] = useState<boolean>(false)
  const [showApiModal, setShowApiModal] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const health = await CascadeAPI.checkHealth()
        if (mounted) {
          setBackendHealth(health)
          setBackendOnline(health.status === 'HEALTHY' || health.status === 'ONLINE')
        }
      } catch {
        if (mounted) {
          setBackendOnline(false)
        }
      }
    }
    check()
    const timer = setInterval(check, 10000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  if (!hazard || !ep || phase === 'select') return null
  const meta = hazardMeta(hazard)!
  const HazIcon = HAZ_ICONS[meta.icon]
  const cityLvl = cityLevelAt(ep, hour)
  const tc = ep.city.tCritical
  const apiBase = CascadeAPI.getApiBase()

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-[54px] items-center gap-3 border-b border-white/[0.07] bg-[#08080b]/90 px-3 backdrop-blur-xl lg:px-4">
        <button
          onClick={() => { reset(); scrollToTop(1.6) }}
          aria-label="Back to calamity picker"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.08] hover:text-white"
        >
          <ChevronLeft size={17} />
        </button>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border"
          style={{ borderColor: `${meta.accent}44`, backgroundColor: meta.accentSoft, color: meta.accent }}
        >
          <HazIcon size={15} strokeWidth={1.9} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-tight tracking-tight">
            {meta.name} <span className="hidden text-white/30 sm:inline">— {CITIES[hazard].name} digital twin</span>
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/32">
            {meta.episodeId} • {ep.zones.length} districts • 10 layers
          </p>
        </div>

        {/* phase tracker */}
        <nav className="mx-auto hidden items-center gap-1 md:flex" aria-label="Demo phases">
          {PHASES.map((p, i) => {
            const active = p.match.includes(phase)
            return (
              <div key={p.id} className="flex items-center gap-1">
                {i > 0 && <div className="mx-1.5 h-px w-6 bg-white/12" />}
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
                    active ? 'bg-white/[0.08]' : ''
                  }`}
                >
                  <span className={`font-mono text-[10px] ${active ? 'text-white' : 'text-white/30'}`}>{p.id}</span>
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.2em] ${active ? 'text-white/80' : 'text-white/25'}`}
                  >
                    {p.label}
                  </span>
                </div>
              </div>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {/* Live AI Engine Status Pill */}
          <button
            onClick={() => setShowApiModal(!showApiModal)}
            title={`Backend: ${apiBase} (${backendOnline ? 'Online' : 'Offline / Standalone Fallback'})`}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono transition ${
              backendOnline
                ? 'border-[#30d158]/35 bg-[#30d158]/10 text-[#30d158] hover:bg-[#30d158]/20'
                : 'border-white/10 bg-white/[0.03] text-white/45 hover:bg-white/[0.06]'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${backendOnline ? 'bg-[#30d158] animate-pulse' : 'bg-white/30'}`} />
            <span className="hidden sm:inline">
              {backendOnline ? 'AI ENGINE LIVE' : 'STANDALONE SIM'}
            </span>
          </button>

          {tc && (
            <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 sm:flex">
              <Timer size={11} className="text-[#ff9f0a]" />
              <span className="tnum font-mono text-[10px] text-white/65">
                t-crit ≈ T+{tc.median}h <span className="text-white/30">[{tc.p10}–{tc.p90}]</span>
              </span>
            </div>
          )}
          <RiskBadge level={cityLvl} pulse={cityLvl === 3} />
        </div>
      </header>

      {/* Backend Diagnostics Modal */}
      {showApiModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowApiModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0e0e13] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Server size={16} className="text-[#64d2ff]" />
                <h3 className="text-sm font-semibold text-white">Backend Inference Diagnostics</h3>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/5 py-1.5">
                <span className="text-white/40">API URL</span>
                <span className="text-white/80">{apiBase}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1.5">
                <span className="text-white/40">Inference State</span>
                <span className={backendOnline ? 'text-[#30d158]' : 'text-[#ff9f0a]'}>
                  {backendOnline ? 'ONLINE (Models Ready)' : 'OFFLINE (Local Simulator)'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1.5">
                <span className="text-white/40">Active Hazard</span>
                <span className="text-white/80">{meta.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1.5">
                <span className="text-white/40">Model Zoo</span>
                <span className="text-[#64d2ff]">LightGBM • Hawkes • ETAS</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1.5">
                <span className="text-white/40">Calibrator</span>
                <span className="text-white/80">NB04 Monotone Isotonic</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-white/40">Audit Chain</span>
                <span className="text-white/80">SHA-256 Ledger Active</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowApiModal(false)}
                className="rounded-lg bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

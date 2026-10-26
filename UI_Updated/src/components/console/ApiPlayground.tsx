'use client'
// ——— Interactive API & ML Model Playground for Judges ———
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Play, CheckCircle2, AlertCircle, Clock, Server, Copy, Check, ChevronRight, X } from 'lucide-react'
import { CascadeAPI } from '@/lib/api'

interface EndpointSpec {
  name: string
  method: 'GET' | 'POST'
  path: string
  desc: string
  modelTag: string
  run: () => Promise<any>
}

export default function ApiPlayground({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeEndpoint, setActiveEndpoint] = useState<string>('healthz')
  const [loading, setLoading] = useState<boolean>(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  const endpoints: Record<string, EndpointSpec> = {
    healthz: {
      name: 'System Health',
      method: 'GET',
      path: '/healthz',
      desc: 'Verify FastAPI engine state, active simulation scenario, replay clock, and ticker speed.',
      modelTag: 'FastAPI Engine',
      run: () => CascadeAPI.checkHealth(),
    },
    risk: {
      name: 'LightGBM Multi-Horizon Risk',
      method: 'GET',
      path: '/v1/risk',
      desc: 'Trained LightGBM boosters (NB04) predict monotone cumulative failure CDF [1h, 3h, 6h, 12h, 24h, 48h, 72h] calibrated with Isotonic Regression.',
      modelTag: 'NB04 LightGBM + Isotonic',
      run: () => CascadeAPI.getRisk(),
    },
    cascade: {
      name: 'Hawkes Cascade Process',
      method: 'GET',
      path: '/v1/cascade',
      desc: 'DiscreteHawkesGLM (NB02) computes cross-layer excitation intensity matrix and dynamic reproduction number rho.',
      modelTag: 'NB02 Hawkes (rho = 0.313)',
      run: () => CascadeAPI.getCascade('city'),
    },
    eval: {
      name: 'Empirical Evaluation Scoreboard',
      method: 'GET',
      path: '/v1/metrics/eval',
      desc: 'Strict rolling-origin out-of-sample metrics: AUROC (0.9401), Brier (0.0841), ECE (0.0174), Lead Time (27.0h), Transfer AUROC (0.9088).',
      modelTag: 'Evaluation Ledger',
      run: () => CascadeAPI.getEvaluationMetrics(),
    },
    intervene: {
      name: 'MILP Resource Allocation',
      method: 'POST',
      path: '/v1/intervene',
      desc: 'Multi-indicator counterfactual simulator evaluates intervention effectiveness and resource depletion.',
      modelTag: 'scipy MILP Allocator',
      run: () => CascadeAPI.intervene(['preposition_pumps', 'reroute_ems']),
    },
    recommend: {
      name: 'Optimal Action Recommendations',
      method: 'GET',
      path: '/v1/recommend',
      desc: 'Ranks intervention policies by 24h risk reduction subject to resource budget constraints.',
      modelTag: 'Optimization Engine',
      run: () => CascadeAPI.getRecommend(),
    },
    ledger: {
      name: 'Audit Ledger Verification',
      method: 'GET',
      path: '/v1/ledger/verify',
      desc: 'Verifies SHA-256 cryptographic hash-chain across all historical forecasts. Guarantees immutable provenance.',
      modelTag: 'SHA-256 Hash Chain',
      run: () => CascadeAPI.verifyLedger(),
    },
    canary: {
      name: 'Future Leakage Canary',
      method: 'GET',
      path: '/v1/canary',
      desc: 'Audits temporal isolation: injects future spikes and verifies past predictions are bit-identical.',
      modelTag: 'Temporal Integrity',
      run: () => CascadeAPI.runCanary(),
    },
    scenarios: {
      name: 'Scenario Catalog',
      method: 'GET',
      path: '/demo/scenarios',
      desc: 'Lists all 6 crisis scenarios with fault profiles and city digital twin specifications.',
      modelTag: 'Digital Twin Zoo',
      run: () => CascadeAPI.getScenarios(),
    },
  }

  const current = endpoints[activeEndpoint]

  const execute = async (key: string) => {
    setActiveEndpoint(key)
    setLoading(true)
    setError(null)
    setResponse(null)
    const t0 = performance.now()
    try {
      const res = await endpoints[key].run()
      setLatency(Math.round(performance.now() - t0))
      setResponse(res)
    } catch (err: any) {
      setLatency(Math.round(performance.now() - t0))
      setError(err?.message || 'Failed to connect to backend endpoint')
    } finally {
      setLoading(false)
    }
  }

  const copyResponse = () => {
    if (!response) return
    navigator.clipboard.writeText(JSON.stringify(response, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0a0a0f] shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3.5 bg-[#0e0e14]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff9f0a]/15 text-[#ff9f0a]">
                  <Terminal size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                    Live API & Model Inference Explorer
                    <span className="rounded-full bg-[#30d158]/15 px-2 py-0.5 text-[9px] font-mono text-[#30d158]">
                      JUDGING VERIFICATION
                    </span>
                  </h2>
                  <p className="font-mono text-[10px] text-white/40">
                    Host: {CascadeAPI.getApiBase()} • Direct calls to FastAPI & ML models
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[300px_1fr]">
              {/* Endpoint Selector Rail */}
              <div className="datascroll overflow-y-auto border-r border-white/10 bg-[#08080c] p-3 space-y-1.5">
                <p className="px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-white/30">
                  Target Endpoints ({Object.keys(endpoints).length})
                </p>
                {Object.entries(endpoints).map(([k, spec]) => {
                  const active = activeEndpoint === k
                  return (
                    <button
                      key={k}
                      onClick={() => execute(k)}
                      className={`w-full rounded-xl p-2.5 text-left transition ${
                        active
                          ? 'border border-white/20 bg-white/[0.08]'
                          : 'border border-transparent hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            spec.method === 'GET'
                              ? 'bg-[#64d2ff]/15 text-[#64d2ff]'
                              : 'bg-[#ff9f0a]/15 text-[#ff9f0a]'
                          }`}
                        >
                          {spec.method}
                        </span>
                        <span className="font-mono text-[9px] text-white/35 truncate max-w-[140px]">
                          {spec.path}
                        </span>
                      </div>
                      <p className="mt-1 text-[11.5px] font-medium text-white/85 truncate">{spec.name}</p>
                      <span className="mt-1 inline-block rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[8.5px] text-white/40">
                        {spec.modelTag}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Execution & Output Console */}
              <div className="flex min-h-0 flex-col overflow-hidden bg-[#0d0d12] p-4">
                {/* Endpoint Header Bar */}
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                          current.method === 'GET'
                            ? 'bg-[#64d2ff]/20 text-[#64d2ff]'
                            : 'bg-[#ff9f0a]/20 text-[#ff9f0a]'
                        }`}
                      >
                        {current.method}
                      </span>
                      <span className="font-mono text-xs font-semibold text-white">{current.path}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {latency !== null && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-white/45">
                          <Clock size={11} />
                          {latency}ms
                        </span>
                      )}
                      <button
                        onClick={() => execute(activeEndpoint)}
                        disabled={loading}
                        className="flex items-center gap-1.5 rounded-lg bg-[#ff9f0a] px-3.5 py-1.5 font-mono text-xs font-semibold text-black transition hover:bg-[#ffb340] disabled:opacity-50"
                      >
                        <Play size={12} fill="black" />
                        {loading ? 'Executing...' : 'Send Request'}
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-white/60 leading-relaxed">{current.desc}</p>
                </div>

                {/* Output Viewer */}
                <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#060609]">
                  <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3.5 py-2 bg-white/[0.02]">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 flex items-center gap-2">
                      Response Inspector
                      {response && (
                        <span className="text-[#30d158] flex items-center gap-1">
                          <CheckCircle2 size={11} /> 200 OK
                        </span>
                      )}
                      {error && (
                        <span className="text-[#ff453a] flex items-center gap-1">
                          <AlertCircle size={11} /> Error
                        </span>
                      )}
                    </span>

                    {response && (
                      <button
                        onClick={copyResponse}
                        className="flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white"
                      >
                        {copied ? <Check size={11} className="text-[#30d158]" /> : <Copy size={11} />}
                        {copied ? 'Copied' : 'Copy JSON'}
                      </button>
                    )}
                  </div>

                  <div className="datascroll min-h-0 flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed">
                    {loading && (
                      <div className="flex h-full items-center justify-center gap-2 text-white/40">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#ff9f0a]" />
                        Running inference against backend...
                      </div>
                    )}
                    {error && (
                      <div className="rounded-lg border border-[#ff453a]/30 bg-[#ff453a]/10 p-3 text-[#ff6a60]">
                        <p className="font-semibold">Backend Unreachable or Error:</p>
                        <p className="mt-1 text-[10.5px] opacity-80">{error}</p>
                        <p className="mt-2 text-[10px] text-white/40">
                          Tip: Ensure backend is running (`uvicorn api.main:app --port 8000`) or check Render status.
                        </p>
                      </div>
                    )}
                    {!loading && !error && response && (
                      <pre className="text-[#64d2ff] whitespace-pre-wrap break-all">
                        {JSON.stringify(response, null, 2)}
                      </pre>
                    )}
                    {!loading && !error && !response && (
                      <div className="flex h-full flex-col items-center justify-center text-center text-white/30">
                        <Terminal size={32} className="mb-2 opacity-40" />
                        <p>Click &quot;Send Request&quot; above to execute live model inference.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

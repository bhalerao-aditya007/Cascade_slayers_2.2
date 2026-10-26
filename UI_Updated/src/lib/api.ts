// ——— Cascade AI Backend API Client ———
// Connects UI_Updated to the real FastAPI backend on Render / Localhost

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    // 1. URL search param: ?api=https://...
    const urlParams = new URLSearchParams(window.location.search)
    const queryApi = urlParams.get('api')
    if (queryApi) {
      window.localStorage.setItem('CASCADE_API_URL', queryApi)
      return queryApi.replace(/\/+$/, '')
    }
    // 2. Local storage override
    const stored = window.localStorage.getItem('CASCADE_API_URL')
    if (stored) return stored.replace(/\/+$/, '')
  }

  // 3. Next.js public environment variable (configured on Vercel)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')
  }

  // 4. Default local development backend
  return 'http://localhost:8000'
}

export interface ApiHealth {
  status: string
  scenario: string
  city: string
  as_of: string
  paused: boolean
  speed: number
}

export interface LedgerVerifyResult {
  canary_passed: boolean
  last_block_hash: string
  total_blocks: number
  chain_valid: boolean
  verified_at: string
}

export interface CanaryResult {
  passed: boolean
  violations: number
  total_canaries_tested: number
  p_value_leakage: number
  verdict: string
}

export interface EvalScoreboard {
  system_name?: string
  metrics?: {
    overall_auroc_test_all?: number
    overall_auroc_24h?: number
    probabilistic_ece?: number
    murphy_brier_score?: number
    median_lead_time_hours_at_5pct_far?: number
    spectral_radius_hawkes?: number
    etas_branching_ratio?: number
    held_out_city_transfer_auroc?: number
    top_3_cascade_pathway_hit_rate?: number
    stage_ordering_kendall_tau?: number
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBase()
  const url = `${base}${endpoint}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`)
    }

    return (await res.json()) as T
  } finally {
    clearTimeout(timeoutId)
  }
}

export const CascadeAPI = {
  getApiBase,

  checkHealth: async (): Promise<ApiHealth> => {
    return apiRequest<ApiHealth>('/healthz')
  },

  getScenarios: async () => {
    return apiRequest<any[]>('/demo/scenarios')
  },

  setScenario: async (id: string, city: string = 'mumbai', fault_profile: string = 'F0') => {
    return apiRequest<{ status: string; scenario: string; city: string }>('/demo/scenario', {
      method: 'POST',
      body: JSON.stringify({ id, city, fault_profile }),
    })
  },

  getRisk: async (as_of?: string) => {
    const q = as_of ? `?as_of=${encodeURIComponent(as_of)}` : ''
    return apiRequest<any>(`/v1/risk${q}`)
  },

  getCascade: async (target: string = 'city') => {
    return apiRequest<any>(`/v1/cascade?zone=${encodeURIComponent(target)}`)
  },

  intervene: async (interventions: string[]) => {
    return apiRequest<any>('/v1/intervene', {
      method: 'POST',
      body: JSON.stringify({ interventions }),
    })
  },

  getRecommend: async () => {
    return apiRequest<any>('/v1/recommend')
  },

  verifyLedger: async (): Promise<LedgerVerifyResult> => {
    return apiRequest<LedgerVerifyResult>('/v1/ledger/verify')
  },

  runCanary: async (): Promise<CanaryResult> => {
    return apiRequest<CanaryResult>('/v1/canary')
  },

  getEvaluationMetrics: async (): Promise<EvalScoreboard> => {
    return apiRequest<EvalScoreboard>('/v1/metrics/eval')
  },

  getGraph: async () => {
    return apiRequest<any>('/v1/graph')
  },

  getEdgeEvidence: async (fromLayer: string, toLayer: string) => {
    return apiRequest<any>(`/v1/graph/edge/${fromLayer}/${toLayer}`)
  },

  getExplain: async (zone: string, layer: string) => {
    return apiRequest<any>(`/v1/explain?zone=${encodeURIComponent(zone)}&layer=${encodeURIComponent(layer)}`)
  },

  getSourcesReliability: async () => {
    return apiRequest<any>('/v1/sources/reliability')
  },
}

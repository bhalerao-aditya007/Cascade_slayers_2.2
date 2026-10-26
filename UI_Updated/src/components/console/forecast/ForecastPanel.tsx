'use client'
// ─── forecast panel · tab nav + content ──────────────────────────────────────
import { LayoutGrid, GitBranch, MapPin, SlidersHorizontal, ShieldCheck } from 'lucide-react'
import { useConsole, type ForecastTab } from '@/lib/store'
import OverviewTab from './OverviewTab'
import CascadeTab from './CascadeTab'
import ZonesTab from './ZonesTab'
import InterveneTab from './InterveneTab'
import TrustTab from './TrustTab'

const TABS: { id: ForecastTab; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'cascade', label: 'Cascade', icon: GitBranch },
  { id: 'zones', label: 'Zones', icon: MapPin },
  { id: 'intervene', label: 'Intervene', icon: SlidersHorizontal },
  { id: 'trust', label: 'Model & Data', icon: ShieldCheck },
]

export default function ForecastPanel() {
  const tab = useConsole((s) => s.tab)
  const setTab = useConsole((s) => s.setTab)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-0.5 border-b border-white/[0.07] px-2.5 py-2">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
                active ? 'bg-white/[0.1] text-white' : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80'
              }`}
            >
              <t.icon size={12.5} strokeWidth={active ? 2.1 : 1.8} />
              <span className="hidden min-[380px]:inline">{t.label}</span>
            </button>
          )
        })}
      </div>
      <div key={tab} className="datascroll min-h-0 flex-1 overflow-y-auto">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'cascade' && <CascadeTab />}
        {tab === 'zones' && <ZonesTab />}
        {tab === 'intervene' && <InterveneTab />}
        {tab === 'trust' && <TrustTab />}
      </div>
    </div>
  )
}

// ============================================================
//  SEREPRO — App.tsx · Router + Layout principal
// ============================================================
import { useState } from 'react'
import EmployesPage from './pages/employes/EmployesPage'
import ContratsPage from './pages/contrats/ContratsPage'
import { EcheancierPage, ArchivagePage } from './pages/echeancier/EcheancierArchivagePage'
import { AvanceSalairePage, MicroCreditPage } from './pages/avance/AvanceCreditPage'

type Route =
  | 'dashboard'
  | 'employes'
  | 'contrats'
  | 'echeancier'
  | 'archivage'
  | 'avance'
  | 'credit'
  | 'epargne'
  | 'assurance'
  | 'rapports'
  | 'support'

interface NavItem {
  id: Route
  label: string
  icon: string
  badge?: number
  section?: string
}

const NAV: NavItem[] = [
  { id: 'dashboard',  label: 'Tableau de bord', icon: '🏠' },
  { id: 'employes',   label: 'Employés',         icon: '👥', badge: 6 },
  { id: 'contrats',   label: 'Contrats & Paie',  icon: '📄' },
  { id: 'echeancier', label: 'Échéancier',        icon: '📅', badge: 3 },
  { id: 'archivage',  label: 'Archivage',         icon: '🗂️' },
  { id: 'avance',     label: 'Avance Salaire',    icon: '⚡',  section: 'Services Financiers' },
  { id: 'credit',     label: 'Micro-Crédit',      icon: '💳' },
  { id: 'epargne',    label: 'Épargne Auto',      icon: '🐖' },
  { id: 'assurance',  label: 'Assurance Groupe',  icon: '🛡️' },
  { id: 'rapports',   label: 'Rapports',           icon: '📊', section: 'Gestion' },
  { id: 'support',    label: 'Support',            icon: '💬' },
]

// ── Dashboard placeholder ────────────────────────────────────
function DashboardPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-black dark:text-white mb-2">Tableau de bord</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Vue globale SEREPRO · Avril 2026</p>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Employés actifs', val: '6',    icon: '👥', color: '#1D9E75' },
          { label: 'Masse salariale', val: '1.22M', icon: '💰', color: '#378ADD' },
          { label: 'Déclarations',    val: '5',    icon: '📋', color: '#EF9F27' },
          { label: 'Avances actives', val: '80K',  icon: '⚡', color: '#E24B4A' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-stroke dark:border-strokedark p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3"
              style={{ backgroundColor: `${k.color}20` }}>
              {k.icon}
            </div>
            <div className="text-2xl font-bold text-black dark:text-white">{k.val}</div>
            <div className="text-sm text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-stroke dark:border-strokedark p-5">
        <p className="text-sm text-gray-500">
          Navigue dans le menu pour accéder aux modules. Tous les modules sont fonctionnels et connectés.
        </p>
      </div>
    </div>
  )
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24">
      <div className="text-4xl mb-4">🚧</div>
      <h2 className="text-xl font-semibold text-black dark:text-white mb-2">{title}</h2>
      <p className="text-sm text-gray-500">Module en développement</p>
    </div>
  )
}

// ── Sidebar ──────────────────────────────────────────────────
function Sidebar({ active, onNavigate }: { active: Route; onNavigate: (r: Route) => void }) {
  let lastSection = ''

  return (
    <aside className="w-64 h-screen bg-white dark:bg-boxdark border-r border-stroke dark:border-strokedark flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-stroke dark:border-strokedark">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">S</div>
        <div>
          <div className="text-base font-bold text-black dark:text-white tracking-tight">SEREPRO</div>
          <div className="text-xs text-gray-500">Plateforme RH & Finance</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(item => {
          const showSection = item.section && item.section !== lastSection
          if (item.section) lastSection = item.section
          const isActive = active === item.id

          return (
            <div key={item.id}>
              {showSection && (
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 py-2 mt-4 mb-1">
                  {item.section}
                </div>
              )}
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4 hover:text-black dark:hover:text-white'
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span className="flex-1 text-sm">{item.label}</span>
                {item.badge && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-primary text-white' : 'bg-red-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-stroke dark:border-strokedark">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-meta-4 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
            AK
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-black dark:text-white truncate">Ange Kouassi</div>
            <div className="text-xs text-gray-500">Employeur · Pro Plan</div>
          </div>
          <span className="text-gray-400 text-lg">⋮</span>
        </div>
      </div>
    </aside>
  )
}

// ── App principal ────────────────────────────────────────────
export default function App() {
  const [route, setRoute] = useState<Route>('employes')

  const renderPage = () => {
    switch (route) {
      case 'dashboard':  return <DashboardPlaceholder />
      case 'employes':   return <EmployesPage />
      case 'contrats':   return <ContratsPage />
      case 'echeancier': return <EcheancierPage />
      case 'archivage':  return <ArchivagePage />
      case 'avance':     return <AvanceSalairePage />
      case 'credit':     return <MicroCreditPage />
      case 'epargne':    return <ComingSoon title="Épargne Auto" />
      case 'assurance':  return <ComingSoon title="Assurance Groupe" />
      case 'rapports':   return <ComingSoon title="Rapports" />
      case 'support':    return <ComingSoon title="Support" />
      default:           return <DashboardPlaceholder />
    }
  }

  return (
    <div className="flex bg-gray-50 dark:bg-boxdark-2 min-h-screen">
      <Sidebar active={route} onNavigate={setRoute} />
      <main className="ml-64 flex-1 min-h-screen overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  )
}

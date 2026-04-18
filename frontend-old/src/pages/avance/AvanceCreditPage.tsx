// ============================================================
//  SEREPRO — Module Avance Salaire (Variante B choisie)
//  Montants rapides prédéfinis + canal + CTA direct
// ============================================================
import { useState, useMemo } from 'react'
import {
  Employee, Advance, PaymentChannel, formatFCFA, getAvatarColor,
} from '../../types'
import { MOCK_EMPLOYEES, MOCK_ADVANCES } from '../../utils/mockData'
import {
  Avatar, Button, SectionHeader, AdvanceStatusBadge,
  ChannelBadge, SearchInput, Modal, Select, TabBar,
} from '../../components/ui'

const CHANNEL_OPTIONS = [
  { value: 'wave',         label: '🌊 Wave' },
  { value: 'orange_money', label: '🟠 Orange Money' },
  { value: 'mtn_money',    label: '🟡 MTN Money' },
  { value: 'virement',     label: '🏦 Virement' },
]

// ── Formulaire demande avance (vue employeur) ────────────────
function AdvanceRequestForm({ onClose }: { onClose: () => void }) {
  const [step, setStep]           = useState<'employee' | 'amount' | 'confirm'>('employee')
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [amount, setAmount]       = useState<number>(0)
  const [channel, setChannel]     = useState<PaymentChannel>('wave')
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const [search, setSearch]       = useState('')

  const maxAmount = selectedEmp ? Math.round(selectedEmp.netSalary * 0.4) : 0
  const quickAmounts = selectedEmp ? [
    Math.round(maxAmount * 0.25),
    Math.round(maxAmount * 0.5),
    Math.round(maxAmount * 0.75),
    maxAmount,
  ] : []

  const repayDate = new Date()
  repayDate.setMonth(repayDate.getMonth() + 1)
  repayDate.setDate(30)

  const filtered = MOCK_EMPLOYEES.filter(e =>
    `${e.firstName} ${e.lastName} ${e.role}`.toLowerCase().includes(search.toLowerCase())
    && e.status === 'actif'
  )

  const submit = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">⚡</div>
        <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Avance envoyée !</h3>
        <p className="text-sm text-gray-500 mb-1">
          {formatFCFA(amount)} → {selectedEmp?.firstName} {selectedEmp?.lastName}
        </p>
        <p className="text-sm text-gray-500 mb-1">
          Via {channel.replace('_', ' ')} · {selectedEmp?.phone}
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Remboursement automatique le {repayDate.toLocaleDateString('fr-FR')}
        </p>
        <Button variant="primary" onClick={onClose}>Fermer</Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Étape 1 : Choisir employé */}
      {step === 'employee' && (
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un employé..." />
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filtered.map((emp, i) => {
              const color   = getAvatarColor(i)
              const max     = Math.round(emp.netSalary * 0.4)
              const hasAdv  = (emp.activeAdvance ?? 0) > 0
              const isSelected = selectedEmp?.id === emp.id
              return (
                <div
                  key={emp.id}
                  onClick={() => !hasAdv && setSelectedEmp(emp)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    hasAdv
                      ? 'opacity-50 cursor-not-allowed border-stroke dark:border-strokedark'
                      : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-stroke dark:border-strokedark hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-meta-4'
                  }`}
                >
                  <Avatar initials={emp.initials} bg={color.bg} color={color.text} size="sm" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-black dark:text-white">
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {hasAdv ? 'Avance en cours' : `Dispo : ${formatFCFA(max)}`}
                    </div>
                  </div>
                  {isSelected && <span className="text-primary font-bold">✓</span>}
                  {hasAdv && <span className="text-xs text-amber-600">⚡ Active</span>}
                </div>
              )
            })}
          </div>
          <Button
            variant="primary"
            className="w-full"
            disabled={!selectedEmp}
            onClick={() => setStep('amount')}
          >
            Choisir le montant →
          </Button>
        </>
      )}

      {/* Étape 2 : Montant rapide */}
      {step === 'amount' && selectedEmp && (
        <>
          {/* Profil employé */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-meta-4">
            <Avatar
              initials={selectedEmp.initials}
              bg={getAvatarColor(0).bg}
              color={getAvatarColor(0).text}
              size="sm"
            />
            <div>
              <div className="text-sm font-semibold text-black dark:text-white">
                {selectedEmp.firstName} {selectedEmp.lastName}
              </div>
              <div className="text-xs text-gray-500">
                Net : {formatFCFA(selectedEmp.netSalary)} · Max : {formatFCFA(maxAmount)}
              </div>
            </div>
            <button onClick={() => setStep('employee')} className="ml-auto text-xs text-gray-400 hover:text-gray-600">
              Changer
            </button>
          </div>

          {/* Montants rapides */}
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Montant à avancer
            </div>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((qa, i) => {
                const labels = ['25%', '50%', '75%', '100%']
                return (
                  <button
                    key={qa}
                    onClick={() => setAmount(qa)}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                      amount === qa
                        ? 'border-primary bg-primary/10 dark:bg-primary/20'
                        : 'border-stroke dark:border-strokedark hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-meta-4'
                    }`}
                  >
                    <div className={`text-sm font-bold ${amount === qa ? 'text-primary' : 'text-black dark:text-white'}`}>
                      {(qa / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-gray-500">{labels[i]}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Canal */}
          <Select
            label="Canal de décaissement"
            value={channel}
            onChange={e => setChannel(e.target.value as PaymentChannel)}
            options={CHANNEL_OPTIONS}
          />

          {/* Récap */}
          {amount > 0 && (
            <div className="rounded-xl border border-stroke dark:border-strokedark divide-y divide-stroke/50 dark:divide-strokedark/50">
              {[
                ['Montant',        formatFCFA(amount)],
                ['Canal',          channel.replace('_', ' ')],
                ['Téléphone',      selectedEmp.phone],
                ['Remboursement',  `${repayDate.toLocaleDateString('fr-FR')} (paie suivante)`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-2.5">
                  <span className="text-xs text-gray-500">{k}</span>
                  <span className="text-xs font-medium text-black dark:text-white capitalize">{v}</span>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="primary"
            className="w-full py-3 text-base"
            disabled={!amount}
            onClick={() => setStep('confirm')}
          >
            {amount > 0 ? `Envoyer ${formatFCFA(amount)} →` : 'Choisir un montant'}
          </Button>
        </>
      )}

      {/* Étape 3 : Confirmation */}
      {step === 'confirm' && selectedEmp && (
        <div className="space-y-4">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">⚡</div>
            <h3 className="text-lg font-semibold text-black dark:text-white">Confirmer l'avance</h3>
          </div>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
            Le montant de {formatFCFA(amount)} sera décaissé via {channel.replace('_', ' ')} et
            déduit automatiquement du salaire du {repayDate.toLocaleDateString('fr-FR')}.
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('amount')}>Retour</Button>
            <Button variant="primary" className="flex-1" loading={loading} onClick={submit}>
              ✓ Confirmer et envoyer
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale Avance Salaire ───────────────────────────
export function AvanceSalairePage() {
  const [advances]    = useState<Advance[]>(MOCK_ADVANCES)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('actives')

  const actives    = advances.filter(a => a.status === 'approuve' || a.status === 'en_attente')
  const historique = advances.filter(a => a.status === 'rembourse' || a.status === 'refuse')

  const totalActif = actives.reduce((s, a) => s + a.amount, 0)

  return (
    <div className="p-6">
      <SectionHeader
        title="Avance Salaire"
        subtitle="Acomptes instantanés · Remboursement automatique"
        action={
          <Button variant="primary" onClick={() => setShowForm(true)}>
            ⚡ Nouvelle avance
          </Button>
        }
      />

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{actives.length}</div>
          <div className="text-xs text-blue-600/80 dark:text-blue-400 mt-0.5">Avances actives</div>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark p-4">
          <div className="text-2xl font-bold text-black dark:text-white">{formatFCFA(totalActif).replace(' FCFA', '')}</div>
          <div className="text-xs text-gray-500 mt-0.5">FCFA en cours</div>
        </div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{historique.length}</div>
          <div className="text-xs text-emerald-600/80 mt-0.5">Remboursées</div>
        </div>
      </div>

      <TabBar
        tabs={[
          { id: 'actives', label: 'En cours', count: actives.length },
          { id: 'historique', label: 'Historique', count: historique.length },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-5 space-y-3">
        {(activeTab === 'actives' ? actives : historique).map((adv, i) => {
          const emp   = adv.employee!
          const color = getAvatarColor(i)
          const pct   = Math.round((adv.amount / adv.maxAmount) * 100)
          return (
            <div key={adv.id} className="rounded-xl border border-stroke dark:border-strokedark p-4 hover:bg-gray-50/50 dark:hover:bg-meta-4/30 transition-colors">
              <div className="flex items-start gap-3">
                <Avatar initials={emp.initials} bg={color.bg} color={color.text} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div>
                      <span className="text-sm font-semibold text-black dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">{emp.role}</span>
                    </div>
                    <AdvanceStatusBadge status={adv.status} />
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-lg font-bold text-black dark:text-white">{formatFCFA(adv.amount)}</span>
                    <ChannelBadge channel={adv.channel} />
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-meta-4 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{pct}% du max ({formatFCFA(adv.maxAmount)})</span>
                    <span>Remb. le {new Date(adv.repaymentDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
              {adv.status === 'en_attente' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-stroke dark:border-strokedark">
                  <Button variant="primary" size="sm" className="flex-1">✓ Approuver</Button>
                  <Button variant="danger" size="sm">✕ Refuser</Button>
                </div>
              )}
            </div>
          )
        })}
        {(activeTab === 'actives' ? actives : historique).length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">⚡</div>
            <p className="text-sm text-gray-500">Aucune avance {activeTab === 'actives' ? 'en cours' : 'dans l\'historique'}</p>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nouvelle avance salaire">
        <AdvanceRequestForm onClose={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}

// ============================================================
//  SEREPRO — Module Micro-Crédit (Variante A choisie)
//  Score visible + simulation en temps réel
// ============================================================
import { Loan, Employee as EmpType } from '../../types'
import { MOCK_LOANS, MOCK_EMPLOYEES as ALL_EMPS } from '../../utils/mockData'

function CreditScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const r         = size * 0.38
  const circ      = 2 * Math.PI * r
  const pct       = score / 1000
  const offset    = circ * (1 - pct)
  const color     = score >= 750 ? '#059669' : score >= 600 ? '#d97706' : '#dc2626'
  const label     = score >= 750 ? 'Excellent' : score >= 600 ? 'Bon' : score >= 400 ? 'Moyen' : 'Insuffisant'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={size * 0.08} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={size * 0.08}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xl font-bold text-black dark:text-white leading-none">{score}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

function LoanSimulator({ employee, onSubmit }: {
  employee: EmpType
  onSubmit: (amount: number, duration: number) => void
}) {
  const [amount, setAmount]     = useState(150000)
  const [duration, setDuration] = useState(12)
  const rate                    = 0.10  // 10% annuel
  const monthlyRate             = rate / 12
  const monthly                 = amount > 0
    ? Math.round(amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -duration)))
    : 0
  const totalCost               = monthly * duration
  const maxEligible             = Math.round(employee.netSalary * 2)

  return (
    <div className="space-y-5">
      {/* Score + éligibilité */}
      <div className="flex items-center gap-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
        <CreditScoreRing score={employee.creditScore ?? 0} size={96} />
        <div>
          <div className="text-sm font-semibold text-black dark:text-white mb-1">Score de crédit</div>
          <div className="text-2xl font-bold text-emerald-600">{employee.creditScore}/1000</div>
          <div className="text-xs text-gray-500 mt-1">Éligible jusqu'à</div>
          <div className="text-lg font-bold text-black dark:text-white">{formatFCFA(maxEligible)}</div>
        </div>
      </div>

      {/* Critères score */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Détail du score</div>
        {[
          { label: 'Ancienneté', pct: 85, color: '#059669' },
          { label: 'Régularité paie', pct: 72, color: '#0ea5e9' },
          { label: 'Remboursements', pct: 90, color: '#8b5cf6' },
          { label: 'Profil employeur', pct: 95, color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} className="flex items-center gap-3">
            <div className="text-xs text-gray-500 w-36">{c.label}</div>
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-meta-4 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${c.pct}%`, backgroundColor: c.color }}
              />
            </div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 text-right">{c.pct}%</div>
          </div>
        ))}
      </div>

      <div className="border-t border-stroke dark:border-strokedark pt-4 space-y-4">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Simuler un crédit</div>

        {/* Montant */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Montant</span>
            <span className="font-semibold text-black dark:text-white">{formatFCFA(amount)}</span>
          </div>
          <input
            type="range"
            min={50000} max={maxEligible} step={10000}
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>50 000</span>
            <span>{formatFCFA(maxEligible)}</span>
          </div>
        </div>

        {/* Durée */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Durée</span>
            <span className="font-semibold text-black dark:text-white">{duration} mois</span>
          </div>
          <div className="flex gap-2">
            {[6, 12, 18, 24].map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  duration === d
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>

        {/* Récap simulation */}
        <div className="rounded-xl bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark p-4 space-y-2">
          {[
            ['Mensualité', formatFCFA(monthly), 'text-black dark:text-white font-semibold text-base'],
            ['Coût total',  formatFCFA(totalCost), ''],
            ['Intérêts',   formatFCFA(totalCost - amount), 'text-red-500'],
            ['Taux annuel', '10%', ''],
          ].map(([k, v, cls]) => (
            <div key={k} className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">{k}</span>
              <span className={`text-sm ${cls || 'text-black dark:text-white'}`}>{v}</span>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          className="w-full py-3"
          onClick={() => onSubmit(amount, duration)}
        >
          Soumettre la demande de crédit
        </Button>
      </div>
    </div>
  )
}

export function MicroCreditPage() {
  const [loans]          = useState<Loan[]>(MOCK_LOANS)
  const [selectedEmpId, setSelectedEmpId]  = useState<string>(ALL_EMPS[0].id)
  const [showSimulator, setShowSimulator]  = useState(false)
  const [submitted, setSubmitted]          = useState(false)

  const selectedEmp = ALL_EMPS.find(e => e.id === selectedEmpId)!

  const handleSubmit = async (amount: number, duration: number) => {
    await new Promise(r => setTimeout(r, 1500))
    setSubmitted(true)
    setTimeout(() => { setShowSimulator(false); setSubmitted(false) }, 3000)
  }

  return (
    <div className="p-6">
      <SectionHeader
        title="Micro-Crédit"
        subtitle="Score adossé à la paie · Partenaires MFI"
        action={
          <Button variant="primary" onClick={() => setShowSimulator(true)}>
            + Demande de crédit
          </Button>
        }
      />

      {/* Sélecteur employé pour consulter le score */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Score par employé
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ALL_EMPS.filter(e => e.creditScore).map((emp, i) => {
            const color   = getAvatarColor(i)
            const score   = emp.creditScore ?? 0
            const scoreColor = score >= 750 ? 'text-emerald-600' : score >= 600 ? 'text-amber-600' : 'text-red-500'
            const isSelected = selectedEmpId === emp.id
            return (
              <div
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-stroke dark:border-strokedark hover:border-primary/30 hover:bg-gray-50 dark:hover:bg-meta-4'
                }`}
              >
                <Avatar initials={emp.initials} bg={color.bg} color={color.text} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-black dark:text-white truncate">
                    {emp.firstName} {emp.lastName}
                  </div>
                  <div className={`text-sm font-bold ${scoreColor}`}>{score}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Score détaillé employé sélectionné */}
      <div className="rounded-2xl border border-stroke dark:border-strokedark p-6 mb-6">
        <div className="flex items-center gap-6">
          <CreditScoreRing score={selectedEmp.creditScore ?? 0} size={120} />
          <div className="flex-1">
            <div className="text-lg font-semibold text-black dark:text-white mb-0.5">
              {selectedEmp.firstName} {selectedEmp.lastName}
            </div>
            <div className="text-sm text-gray-500 mb-3">{selectedEmp.role}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-3">
                <div className="text-xs text-gray-500">Éligible jusqu'à</div>
                <div className="text-sm font-bold text-black dark:text-white">
                  {formatFCFA(Math.round((selectedEmp.netSalary ?? 0) * 2))}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-3">
                <div className="text-xs text-gray-500">Ancienneté</div>
                <div className="text-sm font-bold text-black dark:text-white">
                  {Math.round((Date.now() - new Date(selectedEmp.contractStart).getTime()) / (86400000 * 365))} ans
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crédits en cours */}
      {loans.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Crédits en cours
          </div>
          {loans.map(loan => {
            const emp   = loan.employee!
            const color = getAvatarColor(0)
            const paid  = Math.round((1 - loan.amount / (loan.monthlyPayment * loan.duration)) * 100)
            return (
              <div key={loan.id} className="rounded-xl border border-stroke dark:border-strokedark p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar initials={emp.initials} bg={color.bg} color={color.text} size="sm" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-black dark:text-white">
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{formatFCFA(loan.amount)} · {loan.duration} mois</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    En cours
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Mensualité : {formatFCFA(loan.monthlyPayment)}</span>
                  <span>Taux : {(loan.interestRate * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-meta-4 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(5, paid)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal simulateur */}
      <Modal
        open={showSimulator}
        onClose={() => { setShowSimulator(false); setSubmitted(false) }}
        title="Demande de micro-crédit"
      >
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">Dossier soumis !</h3>
            <p className="text-sm text-gray-500">Traitement sous 48h par le partenaire MFI</p>
          </div>
        ) : (
          <div>
            <Select
              label="Employé concerné"
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value)}
              options={ALL_EMPS.filter(e => e.creditScore).map(e => ({
                value: e.id,
                label: `${e.firstName} ${e.lastName} — Score ${e.creditScore}`,
              }))}
            />
            <div className="mt-4">
              <LoanSimulator employee={selectedEmp} onSubmit={handleSubmit} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

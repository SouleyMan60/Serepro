// ============================================================
//  SEREPRO — Module Contrats & Paie (Variante A choisie)
//  Wizard 4 étapes : Employé → Contrat → Paie → PDF
// ============================================================
import { useState, useMemo } from 'react'
import {
  Employee, Payslip, ContractType, formatFCFA, computePayslip, getAvatarColor,
} from '../../types'
import { MOCK_EMPLOYEES, MOCK_PAYSLIPS } from '../../utils/mockData'
import {
  Avatar, StatusBadge, ContractBadge, Button, Card,
  SectionHeader, Input, Select, SearchInput, TabBar, Modal,
} from '../../components/ui'

// ── Étapes wizard ────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Employé',  icon: '👤' },
  { id: 2, label: 'Contrat',  icon: '📄' },
  { id: 3, label: 'Paie',     icon: '💰' },
  { id: 4, label: 'Générer',  icon: '✅' },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          <div className={`flex items-center gap-2 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all shrink-0 ${
              current > step.id
                ? 'bg-emerald-500 text-white'
                : current === step.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-meta-4 text-gray-400'
            }`}>
              {current > step.id ? '✓' : step.id}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${
              current >= step.id ? 'text-black dark:text-white' : 'text-gray-400'
            }`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 rounded ${
                current > step.id ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-meta-4'
              }`} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Étape 1 : Choisir l'employé ──────────────────────────────
function Step1Employee({ value, onChange, onNext }: {
  value: Employee | null
  onChange: (e: Employee) => void
  onNext: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = MOCK_EMPLOYEES.filter(e =>
    `${e.firstName} ${e.lastName} ${e.role}`.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un employé..." />
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filtered.map((emp, i) => {
          const color = getAvatarColor(i)
          const isSelected = value?.id === emp.id
          return (
            <div
              key={emp.id}
              onClick={() => onChange(emp)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-stroke dark:border-strokedark hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-meta-4'
              }`}
            >
              <Avatar initials={emp.initials} bg={color.bg} color={color.text} size="sm" />
              <div className="flex-1">
                <div className="text-sm font-medium text-black dark:text-white">
                  {emp.firstName} {emp.lastName}
                </div>
                <div className="text-xs text-gray-500">{emp.role} · {formatFCFA(emp.grossSalary)}</div>
              </div>
              <StatusBadge status={emp.status} />
              {isSelected && <span className="text-primary text-lg">✓</span>}
            </div>
          )
        })}
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={onNext} disabled={!value}>
          Suivant — Contrat →
        </Button>
      </div>
    </div>
  )
}

// ── Étape 2 : Paramètres contrat ─────────────────────────────
function Step2Contract({ employee, form, setForm, onNext, onBack }: {
  employee: Employee
  form: ContractFormData
  setForm: (f: ContractFormData) => void
  onNext: () => void
  onBack: () => void
}) {
  const set = (k: keyof ContractFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value })

  return (
    <div className="space-y-4">
      {/* Récap employé */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark">
        <Avatar initials={employee.initials} bg={getAvatarColor(0).bg} color={getAvatarColor(0).text} size="sm" />
        <div>
          <div className="text-sm font-medium text-black dark:text-white">{employee.firstName} {employee.lastName}</div>
          <div className="text-xs text-gray-500">{employee.role}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type de contrat *"
          value={form.contractType}
          onChange={set('contractType')}
          options={[
            { value: 'CDI', label: 'CDI — Durée indéterminée' },
            { value: 'CDD', label: 'CDD — Durée déterminée' },
            { value: 'Stage', label: 'Stage / Apprentissage' },
            { value: 'Freelance', label: 'Prestation / Freelance' },
          ]}
        />
        <Input label="Poste *" value={form.position} onChange={set('position')} placeholder="Ex: Comptable senior" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Département" value={form.department} onChange={set('department')} placeholder="Finance" />
        <Input label="Période d'essai (jours)" type="number" value={form.trialPeriod} onChange={set('trialPeriod')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date de début *" type="date" value={form.startDate} onChange={set('startDate')} />
        {form.contractType !== 'CDI' && (
          <Input label="Date de fin *" type="date" value={form.endDate} onChange={set('endDate')} />
        )}
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>← Retour</Button>
        <Button variant="primary" onClick={onNext}>Suivant — Paie →</Button>
      </div>
    </div>
  )
}

// ── Étape 3 : Paramètres salaire ─────────────────────────────
function Step3Salary({ employee, form, setForm, onNext, onBack }: {
  employee: Employee
  form: ContractFormData
  setForm: (f: ContractFormData) => void
  onNext: () => void
  onBack: () => void
}) {
  const gross = Number(form.grossSalary) || 0
  const computed = useMemo(() => computePayslip(gross), [gross])
  const set = (k: keyof ContractFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value })

  return (
    <div className="space-y-4">
      <Input
        label="Salaire brut mensuel (FCFA) *"
        type="number"
        value={form.grossSalary}
        onChange={set('grossSalary')}
        placeholder="150000"
      />
      <Select
        label="Canal de paiement"
        value={form.paymentChannel}
        onChange={set('paymentChannel')}
        options={[
          { value: 'wave', label: '🌊 Wave' },
          { value: 'orange_money', label: '🟠 Orange Money' },
          { value: 'mtn_money', label: '🟡 MTN Money' },
          { value: 'virement', label: '🏦 Virement bancaire' },
        ]}
      />

      {/* Simulation bulletin */}
      {gross > 0 && (
        <div className="rounded-xl border border-stroke dark:border-strokedark overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-meta-4 text-sm font-semibold text-black dark:text-white">
            Simulation bulletin mensuel
          </div>
          <div className="divide-y divide-stroke/50 dark:divide-strokedark/50">
            {[
              ['Salaire brut', formatFCFA(computed.grossSalary), ''],
              ['CNPS salarié (6.3%)', `− ${formatFCFA(computed.cnpsEmployee)}`, 'text-red-500'],
              ['ITS', `− ${formatFCFA(computed.its)}`, 'text-red-500'],
              ['CMU', `− ${formatFCFA(computed.cmu)}`, 'text-red-500'],
            ].map(([label, val, cls]) => (
              <div key={label} className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                <span className={`text-sm font-medium ${cls || 'text-black dark:text-white'}`}>{val}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20">
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Salaire net</span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">{formatFCFA(computed.netSalary)}</span>
            </div>
          </div>
          <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-400">
            CNPS employeur (charge patronale) : {formatFCFA(computed.cnpsEmployer)}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>← Retour</Button>
        <Button variant="primary" onClick={onNext} disabled={!gross}>Générer →</Button>
      </div>
    </div>
  )
}

// ── Étape 4 : Génération PDF ──────────────────────────────────
function Step4Generate({ employee, form, onDone }: {
  employee: Employee
  form: ContractFormData
  onDone: () => void
}) {
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)

  const generate = async () => {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 2000))
    setGenerating(false)
    setDone(true)
  }

  const gross = Number(form.grossSalary) || 0
  const computed = computePayslip(gross)

  return (
    <div className="space-y-4">
      {/* Récap complet */}
      <div className="rounded-xl border border-stroke dark:border-strokedark divide-y divide-stroke/50 dark:divide-strokedark/50">
        {[
          ['Employé', `${employee.firstName} ${employee.lastName}`],
          ['Poste', form.position],
          ['Type contrat', form.contractType],
          ['Début', new Date(form.startDate).toLocaleDateString('fr-FR')],
          ['Salaire brut', formatFCFA(gross)],
          ['Salaire net', formatFCFA(computed.netSalary)],
          ['Canal paiement', form.paymentChannel.replace('_', ' ')],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between px-4 py-2.5">
            <span className="text-sm text-gray-500 dark:text-gray-400">{k}</span>
            <span className="text-sm font-medium text-black dark:text-white capitalize">{v}</span>
          </div>
        ))}
      </div>

      {done ? (
        <div className="text-center py-6">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="text-lg font-semibold text-black dark:text-white mb-1">Contrat généré !</h3>
          <p className="text-sm text-gray-500 mb-4">PDF disponible dans Archivage</p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary">⬇ Télécharger PDF</Button>
            <Button variant="primary" onClick={onDone}>Terminer</Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between pt-2">
          <div />
          <Button variant="primary" loading={generating} onClick={generate}>
            {generating ? 'Génération...' : '📄 Générer le contrat PDF'}
          </Button>
        </div>
      )}
    </div>
  )
}

interface ContractFormData {
  contractType: ContractType
  position: string
  department: string
  startDate: string
  endDate: string
  trialPeriod: string
  grossSalary: number
  paymentChannel: string
}

// ── Wizard principal ──────────────────────────────────────────
function ContractWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [form, setForm] = useState<ContractFormData>({
    contractType: 'CDI', position: '', department: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '', trialPeriod: '90', grossSalary: 0, paymentChannel: 'wave',
  })

  return (
    <div>
      <StepIndicator current={step} />
      {step === 1 && (
        <Step1Employee
          value={selectedEmp}
          onChange={setSelectedEmp}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && selectedEmp && (
        <Step2Contract
          employee={selectedEmp}
          form={form}
          setForm={setForm}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && selectedEmp && (
        <Step3Salary
          employee={selectedEmp}
          form={form}
          setForm={setForm}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && selectedEmp && (
        <Step4Generate
          employee={selectedEmp}
          form={form}
          onDone={onClose}
        />
      )}
    </div>
  )
}

// ── Liste bulletins du mois ───────────────────────────────────
function PayslipsList() {
  const [month, setMonth] = useState(4)
  const [year] = useState(2026)
  const [generating, setGenerating] = useState<string | null>(null)
  const [payslips, setPayslips] = useState(MOCK_PAYSLIPS)

  const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

  const totalBrut = payslips.reduce((s, p) => s + p.grossSalary, 0)
  const totalNet  = payslips.reduce((s, p) => s + p.netSalary, 0)
  const generated = payslips.filter(p => p.status === 'genere').length

  const generateAll = async () => {
    for (const p of payslips.filter(pp => pp.status !== 'genere')) {
      setGenerating(p.id)
      await new Promise(r => setTimeout(r, 600))
      setPayslips(ps => ps.map(x => x.id === p.id ? { ...x, status: 'genere', generatedAt: new Date().toISOString() } : x))
    }
    setGenerating(null)
  }

  const generateOne = async (id: string) => {
    setGenerating(id)
    await new Promise(r => setTimeout(r, 1200))
    setPayslips(ps => ps.map(p => p.id === id ? { ...p, status: 'genere', generatedAt: new Date().toISOString() } : p))
    setGenerating(null)
  }

  return (
    <div className="space-y-5">
      {/* Sélecteur mois */}
      <div className="flex items-center gap-2 flex-wrap">
        {MONTHS.map((m, i) => (
          <button
            key={i}
            onClick={() => setMonth(i + 1)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              month === i + 1
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* KPIs paie */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-4">
          <div className="text-xs text-gray-500 mb-1">Masse brute</div>
          <div className="text-lg font-bold text-black dark:text-white">{formatFCFA(totalBrut)}</div>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-4">
          <div className="text-xs text-gray-500 mb-1">Masse nette</div>
          <div className="text-lg font-bold text-emerald-600">{formatFCFA(totalNet)}</div>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-4">
          <div className="text-xs text-gray-500 mb-1">Bulletins générés</div>
          <div className="text-lg font-bold text-black dark:text-white">{generated} / {payslips.length}</div>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="rounded-xl border border-stroke dark:border-strokedark p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-black dark:text-white">
            Bulletins {MONTHS[month - 1]} {year}
          </span>
          <Button
            variant="primary"
            size="sm"
            loading={generating !== null}
            onClick={generateAll}
            disabled={generated === payslips.length}
          >
            ⚡ Générer tous
          </Button>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-meta-4 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((generated / payslips.length) * 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500">{generated} générés · {payslips.length - generated} restants</div>
      </div>

      {/* Liste bulletins */}
      <div className="rounded-xl border border-stroke dark:border-strokedark overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-meta-4">
            <tr>
              {['Employé', 'Brut', 'Net à payer', 'Déductions', 'Statut', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payslips.map((p, i) => {
              const emp = p.employee!
              const color = getAvatarColor(i)
              const totalDeduct = p.cnpsEmployee + p.its + p.cmu
              const isGen = generating === p.id
              return (
                <tr key={p.id} className="border-b border-stroke/40 dark:border-strokedark/40 hover:bg-gray-50/50 dark:hover:bg-meta-4/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initials={emp.initials} bg={color.bg} color={color.text} size="sm" />
                      <span className="text-sm font-medium text-black dark:text-white">{emp.firstName} {emp.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-black dark:text-white">{formatFCFA(p.grossSalary)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{formatFCFA(p.netPayable)}</td>
                  <td className="px-4 py-3 text-sm text-red-500">− {formatFCFA(totalDeduct)}</td>
                  <td className="px-4 py-3">
                    {p.status === 'genere' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                        ✓ Généré
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200">
                        En attente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.status !== 'genere' ? (
                        <Button variant="secondary" size="sm" loading={isGen} onClick={() => generateOne(p.id)}>
                          {isGen ? '...' : 'Générer'}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm">⬇</Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Page principale Contrats & Paie ──────────────────────────
export default function ContratsPage() {
  const [activeTab, setActiveTab] = useState('bulletins')
  const [showWizard, setShowWizard] = useState(false)

  return (
    <div className="p-6">
      <SectionHeader
        title="Contrats & Paie"
        subtitle="Gestion des contrats OHADA et bulletins de paie"
        action={
          <Button variant="primary" onClick={() => setShowWizard(true)}>
            + Nouveau contrat
          </Button>
        }
      />

      <TabBar
        tabs={[
          { id: 'bulletins', label: 'Bulletins du mois' },
          { id: 'contrats', label: 'Contrats', count: 6 },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-6">
        {activeTab === 'bulletins' && <PayslipsList />}
        {activeTab === 'contrats' && (
          <div className="space-y-3">
            {MOCK_EMPLOYEES.map((emp, i) => {
              const color = getAvatarColor(i)
              return (
                <div key={emp.id} className="flex items-center gap-4 p-4 rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50/50 dark:hover:bg-meta-4/30">
                  <Avatar initials={emp.initials} bg={color.bg} color={color.text} size="sm" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-black dark:text-white">{emp.firstName} {emp.lastName}</div>
                    <div className="text-xs text-gray-500">
                      Depuis {new Date(emp.contractStart).toLocaleDateString('fr-FR')}
                      {emp.contractEnd && ` → ${new Date(emp.contractEnd).toLocaleDateString('fr-FR')}`}
                    </div>
                  </div>
                  <ContractBadge type={emp.contractType} />
                  <div className="text-sm font-medium text-black dark:text-white">{formatFCFA(emp.grossSalary)}</div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">⬇ PDF</Button>
                    <Button variant="secondary" size="sm">Voir</Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showWizard} onClose={() => setShowWizard(false)} title="Nouveau contrat">
        <ContractWizard onClose={() => setShowWizard(false)} />
      </Modal>
    </div>
  )
}

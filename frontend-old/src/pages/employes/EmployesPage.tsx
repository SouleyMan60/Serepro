// ============================================================
//  SEREPRO — Module Employés (Variante A choisie)
//  Liste enrichie + fiche latérale + recherche + filtres
// ============================================================
import { useState, useMemo } from 'react'
import { Employee, EmployeeStatus, formatFCFA, getAvatarColor } from '../../types'
import { MOCK_EMPLOYEES } from '../../utils/mockData'
import {
  Avatar, StatusBadge, ContractBadge, ChannelBadge,
  SearchInput, Button, Card, Modal, Input, Select, KpiCard, ProgressBar,
} from '../../components/ui'

// ── Fiche détail employé ─────────────────────────────────────
function EmployeeDetail({ emp, onClose, onEdit }: {
  emp: Employee
  onClose: () => void
  onEdit: (e: Employee) => void
}) {
  const color = getAvatarColor(0)
  const tabs = ['Profil', 'Paie', 'Services', 'Documents']
  const [tab, setTab] = useState('Profil')

  return (
    <div className="h-full flex flex-col">
      {/* Header fiche */}
      <div className="flex items-start justify-between p-5 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center gap-4">
          <Avatar initials={emp.initials} bg={color.bg} color={color.text} size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">
              {emp.firstName} {emp.lastName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{emp.role} · {emp.department}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={emp.status} />
              <ContractBadge type={emp.contractType} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => onEdit(emp)}>Modifier</Button>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-stroke dark:border-strokedark">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Contenu tabs */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {tab === 'Profil' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Téléphone', emp.phone],
                ['Email', emp.email ?? '—'],
                ['Début contrat', new Date(emp.contractStart).toLocaleDateString('fr-FR')],
                ['Fin contrat', emp.contractEnd ? new Date(emp.contractEnd).toLocaleDateString('fr-FR') : 'Indéterminé'],
                ['Canal paiement', emp.paymentChannel.replace('_', ' ')],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
                  <div className="text-sm font-medium text-black dark:text-white capitalize">{val}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'Paie' && (
          <div className="space-y-3">
            {[
              ['Salaire brut', formatFCFA(emp.grossSalary), 'text-black dark:text-white'],
              ['CNPS salarié (6.3%)', `- ${formatFCFA(Math.round(emp.grossSalary * 0.063))}`, 'text-red-500'],
              ['ITS', `- ${formatFCFA(Math.round(emp.grossSalary * 0.15 * 0.16))}`, 'text-red-500'],
              ['CMU', '- 1 000 FCFA', 'text-red-500'],
              ['Salaire net', formatFCFA(emp.netSalary), 'text-emerald-600 font-semibold'],
            ].map(([label, val, cls]) => (
              <div key={label} className="flex justify-between py-2 border-b border-stroke/50 dark:border-strokedark/50 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                <span className={`text-sm ${cls}`}>{val}</span>
              </div>
            ))}
            <Button variant="secondary" size="sm" className="w-full mt-2">
              📄 Générer bulletin
            </Button>
          </div>
        )}

        {tab === 'Services' && (
          <div className="space-y-3">
            {/* Avance */}
            <div className="rounded-xl border border-stroke dark:border-strokedark p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-black dark:text-white">⚡ Avance salaire</span>
                <span className="text-xs text-gray-500">Max : {formatFCFA(Math.round(emp.netSalary * 0.4))}</span>
              </div>
              {emp.activeAdvance ? (
                <>
                  <ProgressBar value={emp.activeAdvance} max={Math.round(emp.netSalary * 0.4)} color="#378ADD" />
                  <div className="text-xs text-gray-500 mt-1">{formatFCFA(emp.activeAdvance)} en cours</div>
                </>
              ) : (
                <div className="text-xs text-gray-400">Aucune avance active</div>
              )}
            </div>

            {/* Épargne */}
            <div className="rounded-xl border border-stroke dark:border-strokedark p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-black dark:text-white">🐖 Épargne auto</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {emp.savingsBalance ? formatFCFA(emp.savingsBalance) : '—'}
                </span>
              </div>
              <div className="text-xs text-gray-400">Prélèvement : 5 000 FCFA/mois</div>
            </div>

            {/* Score */}
            <div className="rounded-xl border border-stroke dark:border-strokedark p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-black dark:text-white">🎯 Score crédit</span>
                <span className={`text-lg font-bold ${(emp.creditScore ?? 0) >= 700 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {emp.creditScore ?? '—'}
                </span>
              </div>
              {emp.creditScore && (
                <ProgressBar value={emp.creditScore} max={1000} color={emp.creditScore >= 700 ? '#059669' : '#d97706'} />
              )}
            </div>

            {/* Assurance */}
            <div className="rounded-xl border border-stroke dark:border-strokedark p-4 flex justify-between items-center">
              <span className="text-sm font-medium text-black dark:text-white">🛡️ Assurance groupe</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${emp.hasInsurance ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {emp.hasInsurance ? 'Couverte' : 'Non souscrit'}
              </span>
            </div>
          </div>
        )}

        {tab === 'Documents' && (
          <div className="space-y-2">
            {['Contrat CDI', 'Bulletin mars 2026', 'CNI recto'].map(doc => (
              <div key={doc} className="flex items-center gap-3 p-3 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm">📄</div>
                <span className="flex-1 text-sm text-black dark:text-white">{doc}</span>
                <button className="text-xs text-primary hover:underline">↓</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="p-4 border-t border-stroke dark:border-strokedark flex gap-2">
        <Button variant="primary" size="sm" className="flex-1">⚡ Avance</Button>
        <Button variant="secondary" size="sm" className="flex-1">📄 Bulletin</Button>
        <Button variant="ghost" size="sm">✉️</Button>
      </div>
    </div>
  )
}

// ── Modal Ajout/Édition Employé ──────────────────────────────
function EmployeeForm({ employee, onClose, onSave }: {
  employee?: Employee | null
  onClose: () => void
  onSave: (data: Partial<Employee>) => void
}) {
  const [form, setForm] = useState({
    firstName:      employee?.firstName      ?? '',
    lastName:       employee?.lastName       ?? '',
    role:           employee?.role           ?? '',
    department:     employee?.department     ?? '',
    grossSalary:    employee?.grossSalary    ?? 150000,
    contractType:   employee?.contractType   ?? 'CDI',
    contractStart:  employee?.contractStart  ?? new Date().toISOString().split('T')[0],
    contractEnd:    employee?.contractEnd    ?? '',
    phone:          employee?.phone          ?? '',
    email:          employee?.email          ?? '',
    paymentChannel: employee?.paymentChannel ?? 'wave',
    status:         employee?.status         ?? 'actif',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Prénom *" value={form.firstName} onChange={set('firstName')} placeholder="Fatou" />
        <Input label="Nom *" value={form.lastName} onChange={set('lastName')} placeholder="Koné" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Poste *" value={form.role} onChange={set('role')} placeholder="Comptable" />
        <Input label="Département" value={form.department} onChange={set('department')} placeholder="Finance" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type contrat *"
          value={form.contractType}
          onChange={set('contractType')}
          options={[
            { value: 'CDI', label: 'CDI' },
            { value: 'CDD', label: 'CDD' },
            { value: 'Stage', label: 'Stage' },
            { value: 'Freelance', label: 'Freelance' },
          ]}
        />
        <Input label="Salaire brut (FCFA) *" type="number" value={form.grossSalary} onChange={set('grossSalary')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date début *" type="date" value={form.contractStart} onChange={set('contractStart')} />
        {form.contractType === 'CDD' && (
          <Input label="Date fin" type="date" value={form.contractEnd} onChange={set('contractEnd')} />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Téléphone *" value={form.phone} onChange={set('phone')} placeholder="+225 07 00 00 00" />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="email@example.ci" />
      </div>
      <Select
        label="Canal de paiement *"
        value={form.paymentChannel}
        onChange={set('paymentChannel')}
        options={[
          { value: 'wave', label: '🌊 Wave' },
          { value: 'orange_money', label: '🟠 Orange Money' },
          { value: 'mtn_money', label: '🟡 MTN Money' },
          { value: 'virement', label: '🏦 Virement bancaire' },
        ]}
      />

      {/* Préview calcul net */}
      {form.grossSalary > 0 && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
          <div className="text-xs text-emerald-700 dark:text-emerald-400 mb-1">Estimation salaire net</div>
          <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
            ≈ {formatFCFA(Math.round(Number(form.grossSalary) * 0.903 - 1000))}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-500">Après CNPS 6.3% + ITS + CMU</div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
        <Button variant="primary" onClick={() => onSave(form)} className="flex-1">
          {employee ? 'Enregistrer' : '+ Ajouter l\'employé'}
        </Button>
      </div>
    </div>
  )
}

// ── Page principale Employés ─────────────────────────────────
export default function EmployesPage() {
  const [employees, setEmployees]         = useState<Employee[]>(MOCK_EMPLOYEES)
  const [search, setSearch]               = useState('')
  const [filterStatus, setFilterStatus]   = useState<EmployeeStatus | 'tous'>('tous')
  const [selectedEmp, setSelectedEmp]     = useState<Employee | null>(null)
  const [editingEmp, setEditingEmp]       = useState<Employee | null | undefined>(undefined)
  const [showForm, setShowForm]           = useState(false)

  // Filtres
  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = `${e.firstName} ${e.lastName} ${e.role} ${e.department}`
        .toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'tous' || e.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [employees, search, filterStatus])

  const handleSave = (data: Partial<Employee>) => {
    if (editingEmp) {
      setEmployees(es => es.map(e => e.id === editingEmp.id ? { ...e, ...data } : e))
    } else {
      const newEmp: Employee = {
        ...data as Employee,
        id: `emp-${Date.now()}`,
        initials: (data.firstName?.[0] ?? '') + (data.lastName?.[0] ?? ''),
        avatarColor: '#185FA5',
        netSalary: Math.round((data.grossSalary ?? 0) * 0.903 - 1000),
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
      }
      setEmployees(es => [newEmp, ...es])
    }
    setShowForm(false)
    setEditingEmp(undefined)
  }

  // KPIs
  const actifs     = employees.filter(e => e.status === 'actif').length
  const masseSal   = employees.reduce((s, e) => s + e.grossSalary, 0)
  const avancesAct = employees.filter(e => (e.activeAdvance ?? 0) > 0).length
  const avanceMont = employees.reduce((s, e) => s + (e.activeAdvance ?? 0), 0)

  return (
    <div className="flex h-full gap-0">
      {/* ── Panneau liste ── */}
      <div className={`flex flex-col transition-all duration-300 ${selectedEmp ? 'w-[55%]' : 'w-full'}`}>
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">Employés</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {employees.length} employés · {actifs} actifs
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => { setEditingEmp(null); setShowForm(true) }}
            >
              + Ajouter
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            <KpiCard label="Actifs" value={actifs} icon="👥" color="#1D9E75" />
            <KpiCard label="Masse salariale" value={`${(masseSal / 1000000).toFixed(1)}M`} icon="💰" color="#378ADD" sub="FCFA brut" />
            <KpiCard label="Avances en cours" value={avancesAct} icon="⚡" color="#EF9F27" />
            <KpiCard label="Montant avances" value={`${(avanceMont / 1000).toFixed(0)}K`} icon="💳" color="#E24B4A" sub="FCFA" />
          </div>

          {/* Filtres */}
          <div className="flex gap-3">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par nom, poste..." />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as EmployeeStatus | 'tous')}
              className="px-3 py-2.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm text-black dark:text-white focus:outline-none focus:border-primary"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="periode_essai">Période essai</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
        </div>

        {/* Table employés */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50 dark:bg-meta-4 z-10">
              <tr>
                {['Employé', 'Poste', 'Salaire net', 'Services', 'Statut', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => {
                const color = getAvatarColor(i)
                const isSelected = selectedEmp?.id === emp.id
                return (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmp(isSelected ? null : emp)}
                    className={`border-b border-stroke/40 dark:border-strokedark/40 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/5 dark:bg-primary/10'
                        : 'hover:bg-gray-50 dark:hover:bg-meta-4/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={emp.initials} bg={color.bg} color={color.text} size="sm" />
                        <div>
                          <div className="text-sm font-medium text-black dark:text-white">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{emp.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-black dark:text-white">{emp.role}</div>
                      <div className="text-xs text-gray-500">{emp.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-black dark:text-white">
                        {formatFCFA(emp.netSalary)}
                      </div>
                      <ContractBadge type={emp.contractType} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {emp.activeAdvance && emp.activeAdvance > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">⚡ Avance</span>
                        )}
                        {emp.savingsBalance && emp.savingsBalance > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700">🐖 Épargne</span>
                        )}
                        {emp.hasInsurance && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">🛡️</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingEmp(emp); setShowForm(true) }}
                        className="text-xs text-gray-400 hover:text-primary px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-meta-4"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="text-3xl mb-2">🔍</div>
                    <div className="text-sm text-gray-500">Aucun résultat pour « {search} »</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Panneau détail (fiche latérale) ── */}
      {selectedEmp && (
        <div className="w-[45%] border-l border-stroke dark:border-strokedark flex flex-col overflow-hidden">
          <EmployeeDetail
            emp={selectedEmp}
            onClose={() => setSelectedEmp(null)}
            onEdit={emp => { setEditingEmp(emp); setShowForm(true) }}
          />
        </div>
      )}

      {/* ── Modal ajout/édition ── */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingEmp(undefined) }}
        title={editingEmp ? `Modifier — ${editingEmp.firstName} ${editingEmp.lastName}` : 'Ajouter un employé'}
      >
        <EmployeeForm
          employee={editingEmp}
          onClose={() => { setShowForm(false); setEditingEmp(undefined) }}
          onSave={handleSave}
        />
      </Modal>
    </div>
  )
}

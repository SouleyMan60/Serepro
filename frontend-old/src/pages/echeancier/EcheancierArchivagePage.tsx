// ============================================================
//  SEREPRO — Module Échéancier (Variante A : timeline verticale)
// ============================================================
import { useState, useMemo } from 'react'
import { Deadline, DeadlineUrgency, formatFCFA, getAvatarColor } from '../../types'
import { MOCK_DEADLINES } from '../../utils/mockData'
import { Button, SectionHeader, Avatar } from '../../components/ui'

const URGENCY_CONFIG: Record<DeadlineUrgency, {
  border: string; bg: string; dot: string; badge: string; badgeText: string
}> = {
  urgent:  {
    border: 'border-l-red-500',
    bg: 'bg-red-50/50 dark:bg-red-900/10',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    badgeText: 'URGENT',
  },
  bientot: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/50 dark:bg-amber-900/10',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeText: 'Cette semaine',
  },
  ok:      {
    border: 'border-l-emerald-500',
    bg: '',
    dot: 'bg-emerald-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
    badgeText: 'À venir',
  },
}

function daysUntil(dateStr: string): number {
  const now  = new Date(); now.setHours(0, 0, 0, 0)
  const due  = new Date(dateStr)
  return Math.round((due.getTime() - now.getTime()) / 86400000)
}

function DeadlineItem({ dl, onComplete }: { dl: Deadline; onComplete: (id: string) => void }) {
  const cfg   = URGENCY_CONFIG[dl.urgency]
  const days  = daysUntil(dl.dueDate)
  const dueDate = new Date(dl.dueDate)
  const dayNum  = dueDate.getDate()
  const month   = dueDate.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()

  const TYPE_ICONS: Record<string, string> = {
    cnps: '🏛️', its: '🏦', contrat: '📄', cmu: '💊', autre: '📋',
  }

  return (
    <div className={`flex gap-4 p-4 rounded-xl border border-l-4 border-stroke dark:border-strokedark ${cfg.border} ${cfg.bg} ${dl.completed ? 'opacity-50' : ''} transition-all`}>
      {/* Date bloc */}
      <div className="text-center shrink-0 w-12">
        <div className={`text-2xl font-bold leading-none ${dl.urgency === 'urgent' ? 'text-red-600' : dl.urgency === 'bientot' ? 'text-amber-600' : 'text-black dark:text-white'}`}>
          {dayNum}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{month}</div>
      </div>

      {/* Point */}
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${cfg.dot}`} />
        <div className="w-0.5 flex-1 bg-stroke dark:bg-strokedark mt-1" />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base">{TYPE_ICONS[dl.type]}</span>
              <h4 className="text-sm font-semibold text-black dark:text-white">{dl.title}</h4>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{dl.description}</p>
            {dl.amount && (
              <div className="mt-1 text-xs font-medium text-black dark:text-white">
                Montant : {formatFCFA(dl.amount)}
              </div>
            )}
            {dl.employee && (
              <div className="flex items-center gap-1.5 mt-1">
                <Avatar
                  initials={dl.employee.initials}
                  bg={getAvatarColor(0).bg}
                  color={getAvatarColor(0).text}
                  size="sm"
                />
                <span className="text-xs text-gray-500">{dl.employee.firstName} {dl.employee.lastName}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
              {cfg.badgeText}
            </span>
            <span className="text-xs text-gray-400">
              {days === 0 ? "Aujourd'hui" : days < 0 ? `${Math.abs(days)}j dépassé` : `${days}j restants`}
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {!dl.completed && (
            <Button variant="primary" size="sm" onClick={() => onComplete(dl.id)}>
              ✓ Marquer réglé
            </Button>
          )}
          {dl.type === 'cnps' && (
            <Button variant="secondary" size="sm">Préparer paiement</Button>
          )}
          {dl.type === 'contrat' && (
            <Button variant="secondary" size="sm">Voir contrat</Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function EcheancierPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>(MOCK_DEADLINES)
  const [filter, setFilter] = useState<DeadlineUrgency | 'tous'>('tous')

  const filtered = useMemo(() =>
    deadlines.filter(d => !d.completed && (filter === 'tous' || d.urgency === filter)),
    [deadlines, filter]
  )
  const completed = deadlines.filter(d => d.completed)

  const handleComplete = (id: string) => {
    setDeadlines(ds => ds.map(d => d.id === id ? { ...d, completed: true } : d))
  }

  const urgent  = deadlines.filter(d => !d.completed && d.urgency === 'urgent').length
  const bientot = deadlines.filter(d => !d.completed && d.urgency === 'bientot').length
  const ok      = deadlines.filter(d => !d.completed && d.urgency === 'ok').length

  return (
    <div className="p-6">
      <SectionHeader
        title="Échéancier"
        subtitle="Obligations CNPS, ITS, CMU, renouvellements"
        action={<Button variant="secondary" size="sm">+ Ajouter échéance</Button>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-2xl font-bold text-red-600">{urgent}</div>
          <div className="text-xs text-red-600/80 mt-0.5">Urgents</div>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="text-2xl font-bold text-amber-600">{bientot}</div>
          <div className="text-xs text-amber-600/80 mt-0.5">Cette semaine</div>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <div className="text-2xl font-bold text-emerald-600">{ok}</div>
          <div className="text-xs text-emerald-600/80 mt-0.5">À venir</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5">
        {[
          { v: 'tous', l: 'Toutes' },
          { v: 'urgent', l: '🔴 Urgent' },
          { v: 'bientot', l: '🟡 Cette semaine' },
          { v: 'ok', l: '🟢 À venir' },
        ].map(f => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v as DeadlineUrgency | 'tous')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.v
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-gray-500">Aucune échéance dans cette catégorie</p>
          </div>
        ) : (
          filtered.map(dl => (
            <DeadlineItem key={dl.id} dl={dl} onComplete={handleComplete} />
          ))
        )}
      </div>

      {/* Réglées */}
      {completed.length > 0 && (
        <div className="mt-8">
          <div className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-3">
            Réglées ({completed.length})
          </div>
          <div className="space-y-2">
            {completed.map(dl => (
              <div key={dl.id} className="flex items-center gap-3 p-3 rounded-xl border border-stroke dark:border-strokedark opacity-50">
                <span className="text-sm text-emerald-600">✓</span>
                <span className="text-sm line-through text-gray-500">{dl.title}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(dl.dueDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
//  SEREPRO — Module Archivage (Variante B : arborescence dossiers)
// ============================================================
import { Document, DocType } from '../../types'
import { MOCK_DOCUMENTS, MOCK_EMPLOYEES as EMPS } from '../../utils/mockData'
import { SearchInput } from '../../components/ui'

const DOC_ICONS: Record<DocType, string> = {
  contrat:     '📄',
  bulletin:    '🧾',
  kyc:         '🪪',
  attestation: '📋',
  avance:      '⚡',
}

const DOC_LABELS: Record<DocType, string> = {
  contrat:     'Contrat',
  bulletin:    'Bulletin',
  kyc:         'KYC / Pièce',
  attestation: 'Attestation',
  avance:      'Justificatif avance',
}

function formatBytes(bytes: number): string {
  if (bytes < 1000)    return `${bytes} B`
  if (bytes < 1000000) return `${(bytes / 1000).toFixed(0)} KB`
  return `${(bytes / 1000000).toFixed(1)} MB`
}

export function ArchivagePage() {
  const [documents]        = useState<Document[]>(MOCK_DOCUMENTS)
  const [selectedEmpId, setSelectedEmpId] = useState<string>(EMPS[0].id)
  const [search, setSearch]               = useState('')
  const [filterType, setFilterType]       = useState<DocType | 'tous'>('tous')
  const [uploading, setUploading]         = useState(false)

  const selectedEmp = EMPS.find(e => e.id === selectedEmpId)!
  const empDocs = documents.filter(d => {
    const matchEmp  = d.employeeId === selectedEmpId
    const matchSrch = d.name.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'tous' || d.type === filterType
    return matchEmp && matchSrch && matchType
  })

  // Grouper par type
  const grouped = empDocs.reduce<Partial<Record<DocType, Document[]>>>((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = []
    acc[doc.type]!.push(doc)
    return acc
  }, {})

  const handleUpload = async () => {
    setUploading(true)
    await new Promise(r => setTimeout(r, 1500))
    setUploading(false)
  }

  return (
    <div className="p-6">
      <SectionHeader
        title="Archivage"
        subtitle="Documents par dossier employé · Stockage MinIO"
        action={
          <Button variant="primary" loading={uploading} onClick={handleUpload}>
            ⬆ Ajouter document
          </Button>
        }
      />

      <div className="flex gap-5 h-[calc(100vh-200px)]">

        {/* ── Sidebar dossiers ── */}
        <div className="w-56 shrink-0 flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
            Dossiers
          </div>
          {EMPS.map((emp, i) => {
            const color   = getAvatarColor(i)
            const count   = documents.filter(d => d.employeeId === emp.id).length
            const isActive = selectedEmpId === emp.id
            return (
              <button
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left w-full transition-all ${
                  isActive
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                    : 'hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Avatar initials={emp.initials} bg={color.bg} color={color.text} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${isActive ? 'text-primary' : ''}`}>
                    {emp.firstName} {emp.lastName}
                  </div>
                  <div className="text-xs text-gray-500">{count} doc{count > 1 ? 's' : ''}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Contenu dossier ── */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-stroke dark:border-strokedark">
          {/* Header dossier */}
          <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/50">
            <div className="flex items-center gap-3">
              <Avatar
                initials={selectedEmp.initials}
                bg={getAvatarColor(0).bg}
                color={getAvatarColor(0).text}
                size="md"
              />
              <div>
                <div className="text-sm font-semibold text-black dark:text-white">
                  {selectedEmp.firstName} {selectedEmp.lastName}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedEmp.role} · {empDocs.length} document{empDocs.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as DocType | 'tous')}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:outline-none"
              >
                <option value="tous">Tous les types</option>
                {Object.entries(DOC_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-stroke dark:border-strokedark">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher dans le dossier..." />
          </div>

          {/* Documents groupés */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm text-gray-500">Aucun document</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={handleUpload}>
                  Ajouter le premier document
                </Button>
              </div>
            ) : (
              Object.entries(grouped).map(([type, docs]) => (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{DOC_ICONS[type as DocType]}</span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {DOC_LABELS[type as DocType]}
                    </span>
                    <div className="flex-1 h-px bg-stroke dark:bg-strokedark ml-1" />
                  </div>
                  <div className="space-y-1.5">
                    {docs!.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/50 group transition-colors cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm shrink-0">
                          {DOC_ICONS[doc.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-black dark:text-white truncate">{doc.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatBytes(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-meta-4 text-gray-500 text-sm">👁</button>
                          <button className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-meta-4 text-gray-500 text-sm">⬇</button>
                          <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 text-sm">🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer stats */}
          <div className="px-4 py-3 border-t border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/30 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {empDocs.reduce((s, d) => s + d.fileSize, 0) > 0
                ? `Taille totale : ${formatBytes(empDocs.reduce((s, d) => s + d.fileSize, 0))}`
                : 'Dossier vide'
              }
            </span>
            <Button variant="ghost" size="sm">⬇ Tout télécharger</Button>
          </div>
        </div>

      </div>
    </div>
  )
}

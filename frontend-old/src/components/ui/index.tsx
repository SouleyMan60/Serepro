// ============================================================
//  SEREPRO — Composants UI réutilisables (TailAdmin style)
// ============================================================
import React from 'react'
import { EmployeeStatus, ContractType, PaymentChannel, AdvanceStatus } from '../../types'

// ── Avatar ──────────────────────────────────────────────────
interface AvatarProps {
  initials: string
  bg: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ initials, bg, color, size = 'md', className = '' }: AvatarProps) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold shrink-0 ${className}`}
      style={{ backgroundColor: bg, color }}
    >
      {initials}
    </div>
  )
}

// ── Status Badge ─────────────────────────────────────────────
const STATUS_CONFIG: Record<EmployeeStatus, { label: string; cls: string }> = {
  actif:          { label: 'Actif',           cls: 'bg-green-50 text-green-700 border-green-200' },
  inactif:        { label: 'Inactif',         cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  periode_essai:  { label: 'Période essai',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  suspendu:       { label: 'Suspendu',        cls: 'bg-red-50 text-red-700 border-red-200' },
}

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  const { label, cls } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}

// ── Contract Badge ───────────────────────────────────────────
const CONTRACT_CONFIG: Record<ContractType, { cls: string }> = {
  CDI:       { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CDD:       { cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  Stage:     { cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  Freelance: { cls: 'bg-sky-50 text-sky-700 border-sky-200' },
}

export function ContractBadge({ type }: { type: ContractType }) {
  const { cls } = CONTRACT_CONFIG[type]
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {type}
    </span>
  )
}

// ── Payment Channel Badge ────────────────────────────────────
const CHANNEL_ICONS: Record<PaymentChannel, string> = {
  wave:         '🌊',
  orange_money: '🟠',
  mtn_money:    '🟡',
  virement:     '🏦',
}
const CHANNEL_LABELS: Record<PaymentChannel, string> = {
  wave:         'Wave',
  orange_money: 'Orange Money',
  mtn_money:    'MTN Money',
  virement:     'Virement',
}

export function ChannelBadge({ channel }: { channel: PaymentChannel }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-50 border border-gray-200 text-gray-700">
      <span className="text-sm">{CHANNEL_ICONS[channel]}</span>
      {CHANNEL_LABELS[channel]}
    </span>
  )
}

// ── Card ─────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark ${onClick ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

// ── Section Header ───────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── Input ────────────────────────────────────────────────────
export function Input({ label, error, ...props }: {
  label?: string
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-boxdark text-black dark:text-white placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          error
            ? 'border-red-400 focus:border-red-400'
            : 'border-stroke dark:border-strokedark focus:border-primary'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Select ───────────────────────────────────────────────────
export function Select({ label, options, error, ...props }: {
  label?: string
  options: { value: string; label: string }[]
  error?: string
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white dark:bg-boxdark text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          error ? 'border-red-400' : 'border-stroke dark:border-strokedark focus:border-primary'
        }`}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary:   'bg-primary text-white hover:bg-primary/90 border-transparent',
  secondary: 'bg-white dark:bg-boxdark text-black dark:text-white border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4',
  ghost:     'bg-transparent text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-meta-4',
  danger:    'bg-red-500 text-white hover:bg-red-600 border-transparent',
}

export function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, ...props }: {
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  className?: string
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg border transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${BTN_VARIANTS[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ── Search Input ─────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Rechercher...' }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}

// ── Empty State ──────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-black dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ── Progress Bar ─────────────────────────────────────────────
export function ProgressBar({ value, max, color = '#22d3ee' }: {
  value: number
  max: number
  color?: string
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="w-full h-1.5 bg-gray-100 dark:bg-meta-4 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────
export function KpiCard({ label, value, sub, icon, color }: {
  label: string
  value: string | number
  sub?: string
  icon?: string
  color?: string
}) {
  return (
    <div className="bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark p-5">
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: color ? `${color}20` : '#f3f4f6' }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-black dark:text-white">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

// ── Advance Status Badge ─────────────────────────────────────
const ADVANCE_STATUS: Record<AdvanceStatus, { label: string; cls: string }> = {
  en_attente: { label: 'En attente', cls: 'bg-amber-50 text-amber-700' },
  approuve:   { label: 'Approuvé',   cls: 'bg-green-50 text-green-700' },
  refuse:     { label: 'Refusé',     cls: 'bg-red-50 text-red-700' },
  rembourse:  { label: 'Remboursé',  cls: 'bg-gray-50 text-gray-600' },
}

export function AdvanceStatusBadge({ status }: { status: AdvanceStatus }) {
  const { label, cls } = ADVANCE_STATUS[status]
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>
}

// ── Modal wrapper ─────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-boxdark rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-stroke dark:border-strokedark">
          <h3 className="text-lg font-semibold text-black dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-500"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Tab Bar ──────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }: {
  tabs: { id: string; label: string; count?: number }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-meta-4 rounded-xl w-fit">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            active === t.id
              ? 'bg-white dark:bg-boxdark text-black dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              active === t.id ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-meta-4 text-gray-600 dark:text-gray-400'
            }`}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

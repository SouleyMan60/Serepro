// ============================================================
//  SEREPRO — Utilitaires métier
// ============================================================

// ── Calcul paie Côte d'Ivoire ────────────────────────────────
export const CNPS_EMPLOYEE_RATE = 0.063
export const CNPS_EMPLOYER_RATE = 0.168
export const CMU_FIXED          = 1000   // FCFA/mois

/**
 * Barème ITS (Impôt sur Traitement et Salaires) CI 2026
 * Base imposable = brut × 85% (abattement 15%)
 */
export function computeITS(grossSalary: number): number {
  const base = grossSalary * 0.85
  if (base <= 75_000)   return 0
  if (base <= 240_000)  return Math.round((base - 75_000) * 0.16)
  if (base <= 800_000)  return Math.round(26_400 + (base - 240_000) * 0.24)
  return Math.round(160_800 + (base - 800_000) * 0.32)
}

export interface PayslipComputed {
  grossSalary:     number
  cnpsEmployee:    number
  cnpsEmployer:    number
  its:             number
  cmu:             number
  netSalary:       number
  advanceDeducted: number
  savingsDeducted: number
  netPayable:      number
}

export function computePayslip(
  grossSalary:     number,
  advanceDeducted = 0,
  savingsDeducted = 0,
): PayslipComputed {
  const cnpsEmployee = Math.round(grossSalary * CNPS_EMPLOYEE_RATE)
  const cnpsEmployer = Math.round(grossSalary * CNPS_EMPLOYER_RATE)
  const its          = computeITS(grossSalary)
  const cmu          = CMU_FIXED
  const netSalary    = grossSalary - cnpsEmployee - its - cmu
  const netPayable   = Math.max(0, netSalary - advanceDeducted - savingsDeducted)

  return { grossSalary, cnpsEmployee, cnpsEmployer, its, cmu, netSalary, advanceDeducted, savingsDeducted, netPayable }
}

export function maxAdvanceAmount(netSalary: number, pct = 0.40): number {
  return Math.floor(netSalary * pct)
}

// ── Calcul score crédit interne ───────────────────────────────
export interface CreditScoreInput {
  contractStartDate: Date
  contractType:      string
  grossSalary:       number
  payslipCount:      number       // nombre de bulletins générés
  advanceHistory:    number       // nombre d'avances passées
  lateRepayments:    number       // remboursements en retard
  savingsBalance:    number
  tenureMonths?:     number       // ancienneté en mois (calculé si absent)
}

export function computeCreditScore(input: CreditScoreInput): number {
  let score = 0

  // Ancienneté (max 300 pts)
  const tenure = input.tenureMonths
    ?? Math.floor((Date.now() - input.contractStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const tenureScore = Math.min(300, tenure * 10)
  score += tenureScore

  // Type contrat (max 200 pts)
  const contractScore: Record<string, number> = {
    CDI: 200, CDD: 100, STAGE: 50, FREELANCE: 80,
  }
  score += contractScore[input.contractType] ?? 50

  // Régularité bulletins (max 200 pts)
  const regularityScore = Math.min(200, input.payslipCount * 20)
  score += regularityScore

  // Historique remboursements (max 200 pts)
  if (input.advanceHistory > 0) {
    const repayRate = Math.max(0, (input.advanceHistory - input.lateRepayments) / input.advanceHistory)
    score += Math.round(repayRate * 200)
  } else {
    score += 120 // pas d'historique = score neutre
  }

  // Épargne (max 100 pts)
  if (input.savingsBalance > 0) {
    score += Math.min(100, Math.floor(input.savingsBalance / 5_000))
  }

  return Math.min(1000, Math.max(0, score))
}

export function getCreditEligibility(score: number, netSalary: number): {
  isEligible: boolean
  maxAmount:  number
  label:      string
} {
  if (score >= 800) return { isEligible: true,  maxAmount: netSalary * 4, label: 'Excellent' }
  if (score >= 700) return { isEligible: true,  maxAmount: netSalary * 3, label: 'Très bon' }
  if (score >= 600) return { isEligible: true,  maxAmount: netSalary * 2, label: 'Bon' }
  if (score >= 450) return { isEligible: true,  maxAmount: netSalary,     label: 'Moyen' }
  return               { isEligible: false, maxAmount: 0,            label: 'Insuffisant' }
}

// ── Urgence échéance ─────────────────────────────────────────
export function computeUrgency(dueDate: Date): 'URGENT' | 'BIENTOT' | 'OK' {
  const days = Math.ceil((dueDate.getTime() - Date.now()) / 86400000)
  if (days <= 3)  return 'URGENT'
  if (days <= 10) return 'BIENTOT'
  return 'OK'
}

// ── Formatage FCFA ────────────────────────────────────────────
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-CI', {
    style:               'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA'
}

// ── Mois/Année helpers ────────────────────────────────────────
export function currentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export function monthLabel(month: number, year: number): string {
  return new Date(year, month - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

// ── Pagination ────────────────────────────────────────────────
export function parsePagination(query: Record<string, any>) {
  const page  = Math.max(1, parseInt(query.page ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20')))
  return { page, limit, skip: (page - 1) * limit }
}

export function paginationMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) }
}

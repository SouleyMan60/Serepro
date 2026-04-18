// ============================================================
//  SEREPRO — Types TypeScript partagés
// ============================================================

export type EmployeeStatus = 'actif' | 'inactif' | 'periode_essai' | 'suspendu'
export type ContractType   = 'CDI' | 'CDD' | 'Stage' | 'Freelance'
export type PaymentChannel = 'wave' | 'orange_money' | 'mtn_money' | 'virement'
export type AdvanceStatus  = 'en_attente' | 'approuve' | 'refuse' | 'rembourse'
export type LoanStatus     = 'eligible' | 'en_cours' | 'approuve' | 'refuse' | 'rembourse'
export type DeadlineUrgency = 'urgent' | 'bientot' | 'ok'
export type DocType        = 'contrat' | 'bulletin' | 'kyc' | 'attestation' | 'avance'

export interface Employee {
  id: string
  firstName: string
  lastName: string
  initials: string
  avatarColor: string
  role: string
  department?: string
  grossSalary: number
  netSalary: number
  contractType: ContractType
  contractStart: string
  contractEnd?: string
  status: EmployeeStatus
  phone: string
  email?: string
  paymentChannel: PaymentChannel
  creditScore?: number
  activeAdvance?: number
  savingsBalance?: number
  hasInsurance?: boolean
  tenantId: string
  createdAt: string
}

export interface Payslip {
  id: string
  employeeId: string
  employee?: Employee
  month: number
  year: number
  grossSalary: number
  cnpsEmployee: number   // 6.3%
  cnpsEmployer: number   // 16.8%
  its: number            // Impôt sur Traitement et Salaires
  cmu: number            // Couverture Maladie Universelle
  netSalary: number
  advanceDeducted: number
  savingsDeducted: number
  netPayable: number
  generatedAt?: string
  pdfUrl?: string
  status: 'brouillon' | 'genere' | 'envoye'
}

export interface Contract {
  id: string
  employeeId: string
  employee?: Employee
  type: ContractType
  startDate: string
  endDate?: string
  grossSalary: number
  position: string
  department: string
  trialPeriod?: number   // jours
  pdfUrl?: string
  signedAt?: string
  status: 'brouillon' | 'genere' | 'signe'
  createdAt: string
}

export interface Deadline {
  id: string
  title: string
  description: string
  dueDate: string
  urgency: DeadlineUrgency
  type: 'cnps' | 'its' | 'contrat' | 'cmu' | 'autre'
  amount?: number
  employeeId?: string
  employee?: Employee
  completed: boolean
}

export interface Document {
  id: string
  employeeId: string
  employee?: Employee
  name: string
  type: DocType
  fileUrl: string
  fileSize: number       // bytes
  mimeType: string
  uploadedAt: string
  month?: number
  year?: number
}

export interface Advance {
  id: string
  employeeId: string
  employee?: Employee
  amount: number
  maxAmount: number      // 40% net
  channel: PaymentChannel
  status: AdvanceStatus
  requestedAt: string
  approvedAt?: string
  repaidAt?: string
  repaymentDate: string
  note?: string
}

export interface Loan {
  id: string
  employeeId: string
  employee?: Employee
  amount: number
  duration: number       // mois
  monthlyPayment: number
  interestRate: number
  status: LoanStatus
  creditScore: number
  maxEligible: number
  requestedAt?: string
  approvedAt?: string
  disbursedAt?: string
  documents: string[]
}

export interface Tenant {
  id: string
  name: string
  rccm?: string
  plan: 'starter' | 'pro' | 'enterprise'
  employeeCount: number
  createdAt: string
}

export interface User {
  id: string
  email: string
  displayName: string
  role: 'employer' | 'employee' | 'admin'
  tenantId: string
  employeeId?: string
  photoURL?: string
  createdAt: string
}

// UI helpers
export interface SelectOption {
  value: string
  label: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  meta?: PaginationMeta
  message?: string
}

// Calcul paie CI
export const CNPS_EMPLOYEE_RATE = 0.063
export const CNPS_EMPLOYER_RATE = 0.168
export const CMU_AMOUNT         = 1000   // FCFA fixe/mois

export function computeITS(gross: number): number {
  // Barème ITS simplifié Côte d'Ivoire 2026
  const taxable = gross * 0.85  // abattement 15%
  if (taxable <= 75000)  return 0
  if (taxable <= 240000) return (taxable - 75000) * 0.16
  if (taxable <= 800000) return 26400 + (taxable - 240000) * 0.24
  return 160800 + (taxable - 800000) * 0.32
}

export function computePayslip(grossSalary: number, advanceDeducted = 0, savingsDeducted = 0): Omit<Payslip, 'id'|'employeeId'|'month'|'year'|'status'> {
  const cnpsEmployee = Math.round(grossSalary * CNPS_EMPLOYEE_RATE)
  const cnpsEmployer = Math.round(grossSalary * CNPS_EMPLOYER_RATE)
  const its          = Math.round(computeITS(grossSalary))
  const cmu          = CMU_AMOUNT
  const netSalary    = grossSalary - cnpsEmployee - its - cmu
  const netPayable   = netSalary - advanceDeducted - savingsDeducted

  return { grossSalary, cnpsEmployee, cnpsEmployer, its, cmu, netSalary, advanceDeducted, savingsDeducted, netPayable }
}

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' FCFA'
}

export function getInitials(firstName: string, lastName: string): string {
  return (firstName[0] + lastName[0]).toUpperCase()
}

export const AVATAR_COLORS = [
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#EEEDFE', text: '#534AB7' },
  { bg: '#EAF3DE', text: '#3B6D11' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#FBEAF0', text: '#993556' },
]

export function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

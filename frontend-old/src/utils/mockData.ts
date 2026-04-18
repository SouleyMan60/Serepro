// ============================================================
//  SEREPRO — Données de démo (remplacées par API en prod)
// ============================================================
import { Employee, Payslip, Contract, Deadline, Document, Advance, Loan, computePayslip } from '../types'

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1', firstName: 'Fatou', lastName: 'Koné', initials: 'FK',
    avatarColor: '#185FA5', role: 'Comptable', department: 'Finance',
    grossSalary: 180000, netSalary: 162540, contractType: 'CDI',
    contractStart: '2024-01-15', status: 'actif', phone: '+225 07 01 23 45',
    email: 'f.kone@example.ci', paymentChannel: 'wave',
    creditScore: 742, activeAdvance: 50000, savingsBalance: 45000, hasInsurance: true,
    tenantId: 'tenant-1', createdAt: '2024-01-15',
  },
  {
    id: 'emp-2', firstName: 'Moussa', lastName: 'Traoré', initials: 'MT',
    avatarColor: '#534AB7', role: 'Commercial', department: 'Ventes',
    grossSalary: 220000, netSalary: 198220, contractType: 'CDI',
    contractStart: '2023-06-01', status: 'actif', phone: '+225 05 98 76 54',
    email: 'm.traore@example.ci', paymentChannel: 'orange_money',
    creditScore: 680, activeAdvance: 0, savingsBalance: 0, hasInsurance: false,
    tenantId: 'tenant-1', createdAt: '2023-06-01',
  },
  {
    id: 'emp-3', firstName: 'Awa', lastName: 'Diabaté', initials: 'AD',
    avatarColor: '#3B6D11', role: 'Responsable RH', department: 'RH',
    grossSalary: 165000, netSalary: 148320, contractType: 'CDI',
    contractStart: '2023-03-01', status: 'actif', phone: '+225 01 77 88 99',
    paymentChannel: 'wave', creditScore: 810, activeAdvance: 0,
    savingsBalance: 120000, hasInsurance: true,
    tenantId: 'tenant-1', createdAt: '2023-03-01',
  },
  {
    id: 'emp-4', firstName: 'Brice', lastName: 'Coulibaly', initials: 'BC',
    avatarColor: '#854F0B', role: 'Développeur', department: 'Tech',
    grossSalary: 310000, netSalary: 279840, contractType: 'CDI',
    contractStart: '2022-09-01', status: 'actif', phone: '+225 07 55 66 77',
    paymentChannel: 'mtn_money', creditScore: 920, activeAdvance: 0,
    savingsBalance: 250000, hasInsurance: true,
    tenantId: 'tenant-1', createdAt: '2022-09-01',
  },
  {
    id: 'emp-5', firstName: 'Seydou', lastName: 'Yao', initials: 'SY',
    avatarColor: '#0F6E56', role: 'Logisticien', department: 'Opérations',
    grossSalary: 145000, netSalary: 130050, contractType: 'CDD',
    contractStart: '2025-11-01', contractEnd: '2026-05-01' as string | undefined, status: 'periode_essai',
    phone: '+225 05 44 33 22', paymentChannel: 'wave',
    creditScore: 490, activeAdvance: 0, savingsBalance: 0,
    tenantId: 'tenant-1', createdAt: '2025-11-01',
  },
  {
    id: 'emp-6', firstName: 'Marie', lastName: 'Gbagbo', initials: 'MG',
    avatarColor: '#993556', role: 'Assistante Direction', department: 'Direction',
    grossSalary: 195000, netSalary: 175760, contractType: 'CDI',
    contractStart: '2024-04-01', status: 'actif', phone: '+225 07 22 33 44',
    paymentChannel: 'orange_money', creditScore: 760,
    activeAdvance: 30000, savingsBalance: 80000, hasInsurance: true,
    tenantId: 'tenant-1', createdAt: '2024-04-01',
  },
]

export const MOCK_PAYSLIPS: Payslip[] = MOCK_EMPLOYEES.map((emp, i) => {
  const computed = computePayslip(emp.grossSalary, emp.activeAdvance ?? 0, 5000)
  return {
    id: `pay-${i+1}`, employeeId: emp.id, employee: emp,
    month: 4, year: 2026,
    ...computed,
    generatedAt: i < 2 ? '2026-04-30' : undefined,
    status: i < 2 ? 'genere' : 'brouillon',
  }
})

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'ctr-1', employeeId: 'emp-1', employee: MOCK_EMPLOYEES[0],
    type: 'CDI', startDate: '2024-01-15', grossSalary: 180000,
    position: 'Comptable', department: 'Finance',
    trialPeriod: 90, status: 'signe', createdAt: '2024-01-15',
  },
  {
    id: 'ctr-5', employeeId: 'emp-5', employee: MOCK_EMPLOYEES[4],
    type: 'CDD', startDate: '2025-11-01', endDate: '2026-05-01',
    grossSalary: 145000, position: 'Logisticien', department: 'Opérations',
    status: 'signe', createdAt: '2025-11-01',
  },
]

export const MOCK_DEADLINES: Deadline[] = [
  {
    id: 'dl-1', title: 'Cotisation CNPS', description: '6 employés · cotisations mensuelles',
    dueDate: '2026-04-15', urgency: 'urgent', type: 'cnps', amount: 340000, completed: false,
  },
  {
    id: 'dl-2', title: 'Impôt sur salaire (ITS)', description: 'DGI · Déclaration mensuelle',
    dueDate: '2026-04-20', urgency: 'bientot', type: 'its', completed: false,
  },
  {
    id: 'dl-3', title: 'Renouvellement contrat', description: 'Seydou Yao · CDD 6 mois',
    dueDate: '2026-05-01', urgency: 'ok', type: 'contrat', employeeId: 'emp-5',
    employee: MOCK_EMPLOYEES[4], completed: false,
  },
  {
    id: 'dl-4', title: 'Cotisation CNPS Mai', description: 'Automatique',
    dueDate: '2026-05-15', urgency: 'ok', type: 'cnps', amount: 340000, completed: false,
  },
  {
    id: 'dl-5', title: 'CMU — Contribution mensuelle', description: 'Couverture Maladie Universelle',
    dueDate: '2026-04-30', urgency: 'bientot', type: 'cmu', amount: 6000, completed: false,
  },
]

export const MOCK_DOCUMENTS: Document[] = [
  { id: 'doc-1', employeeId: 'emp-1', employee: MOCK_EMPLOYEES[0], name: 'Contrat CDI', type: 'contrat', fileUrl: '#', fileSize: 127000, mimeType: 'application/pdf', uploadedAt: '2024-01-15' },
  { id: 'doc-2', employeeId: 'emp-1', employee: MOCK_EMPLOYEES[0], name: 'Bulletin mars 2026', type: 'bulletin', fileUrl: '#', fileSize: 84000, mimeType: 'application/pdf', uploadedAt: '2026-03-31', month: 3, year: 2026 },
  { id: 'doc-3', employeeId: 'emp-1', employee: MOCK_EMPLOYEES[0], name: 'CNI recto', type: 'kyc', fileUrl: '#', fileSize: 890000, mimeType: 'image/jpeg', uploadedAt: '2024-01-15' },
  { id: 'doc-4', employeeId: 'emp-2', employee: MOCK_EMPLOYEES[1], name: 'Contrat CDI', type: 'contrat', fileUrl: '#', fileSize: 130000, mimeType: 'application/pdf', uploadedAt: '2023-06-01' },
  { id: 'doc-5', employeeId: 'emp-2', employee: MOCK_EMPLOYEES[1], name: 'Bulletin mars 2026', type: 'bulletin', fileUrl: '#', fileSize: 88000, mimeType: 'application/pdf', uploadedAt: '2026-03-31', month: 3, year: 2026 },
  { id: 'doc-6', employeeId: 'emp-3', employee: MOCK_EMPLOYEES[2], name: 'Contrat CDI', type: 'contrat', fileUrl: '#', fileSize: 128000, mimeType: 'application/pdf', uploadedAt: '2023-03-01' },
  { id: 'doc-7', employeeId: 'emp-3', employee: MOCK_EMPLOYEES[2], name: 'Bulletin mars 2026', type: 'bulletin', fileUrl: '#', fileSize: 85000, mimeType: 'application/pdf', uploadedAt: '2026-03-31', month: 3, year: 2026 },
  { id: 'doc-8', employeeId: 'emp-4', employee: MOCK_EMPLOYEES[3], name: 'Contrat CDI', type: 'contrat', fileUrl: '#', fileSize: 125000, mimeType: 'application/pdf', uploadedAt: '2022-09-01' },
]

export const MOCK_ADVANCES: Advance[] = [
  {
    id: 'adv-1', employeeId: 'emp-1', employee: MOCK_EMPLOYEES[0],
    amount: 50000, maxAmount: 72000, channel: 'wave',
    status: 'approuve', requestedAt: '2026-04-10', approvedAt: '2026-04-10',
    repaymentDate: '2026-04-30',
  },
  {
    id: 'adv-2', employeeId: 'emp-6', employee: MOCK_EMPLOYEES[5],
    amount: 30000, maxAmount: 70300, channel: 'orange_money',
    status: 'en_attente', requestedAt: '2026-04-14',
    repaymentDate: '2026-04-30',
  },
]

export const MOCK_LOANS: Loan[] = [
  {
    id: 'loan-1', employeeId: 'emp-1', employee: MOCK_EMPLOYEES[0],
    amount: 150000, duration: 12, monthlyPayment: 13750, interestRate: 0.10,
    status: 'en_cours', creditScore: 742, maxEligible: 300000,
    requestedAt: '2026-04-01', documents: [],
  },
]

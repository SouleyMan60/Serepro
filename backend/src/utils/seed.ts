// ============================================================
//  SEREPRO — Seed base de données (données de démo)
//  Usage : npm run db:seed
// ============================================================
import prisma from '../config/prisma'
import { computePayslip, computeCreditScore } from './payroll'
import { logger } from '../config/logger'

async function seed() {
  logger.info('Seed démarré...')

  // ── Tenant demo ──────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where:  { id: 'tenant-demo-001' },
    create: {
      id:      'tenant-demo-001',
      name:    'Entreprise Demo CI',
      rccm:    'CI-ABJ-2023-B-12345',
      address: 'Plateau, Abidjan, Côte d\'Ivoire',
      phone:   '+225 27 20 00 00',
      email:   'demo@example.ci',
      plan:    'PRO',
    },
    update: {},
  })
  logger.info(`Tenant créé : ${tenant.name}`)

  // ── Employés de démo ─────────────────────────────────────
  const employeesData = [
    {
      firstName: 'Fatou',      lastName: 'Koné',      phone: '+225 07 01 23 45',
      position: 'Comptable',   department: 'Finance',  grossSalary: 180_000,
      contractType: 'CDI' as const, startDate: new Date('2024-01-15'),
      paymentChannel: 'WAVE' as const, email: 'f.kone@demo.ci',
    },
    {
      firstName: 'Moussa',     lastName: 'Traoré',    phone: '+225 05 98 76 54',
      position: 'Commercial',  department: 'Ventes',   grossSalary: 220_000,
      contractType: 'CDI' as const, startDate: new Date('2023-06-01'),
      paymentChannel: 'ORANGE_MONEY' as const, email: 'm.traore@demo.ci',
    },
    {
      firstName: 'Awa',        lastName: 'Diabaté',   phone: '+225 01 77 88 99',
      position: 'Responsable RH', department: 'RH',   grossSalary: 165_000,
      contractType: 'CDI' as const, startDate: new Date('2023-03-01'),
      paymentChannel: 'WAVE' as const,
    },
    {
      firstName: 'Brice',      lastName: 'Coulibaly', phone: '+225 07 55 66 77',
      position: 'Développeur', department: 'Tech',    grossSalary: 310_000,
      contractType: 'CDI' as const, startDate: new Date('2022-09-01'),
      paymentChannel: 'MTN_MONEY' as const, email: 'b.coulibaly@demo.ci',
    },
    {
      firstName: 'Seydou',     lastName: 'Yao',       phone: '+225 05 44 33 22',
      position: 'Logisticien', department: 'Ops',     grossSalary: 145_000,
      contractType: 'CDD' as const,
      startDate: new Date('2025-11-01'), endDate: new Date('2026-05-01'),
      paymentChannel: 'WAVE' as const, status: 'TRIAL' as const,
    },
    {
      firstName: 'Marie',      lastName: 'Gbagbo',    phone: '+225 07 22 33 44',
      position: 'Assistante Direction', department: 'Direction', grossSalary: 195_000,
      contractType: 'CDI' as const, startDate: new Date('2024-04-01'),
      paymentChannel: 'ORANGE_MONEY' as const,
    },
  ]

  const employees = []
  for (const empData of employeesData) {
    const payslipCount = Math.floor(
      (Date.now() - empData.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    const score = computeCreditScore({
      contractStartDate: empData.startDate,
      contractType:      empData.contractType,
      grossSalary:       empData.grossSalary,
      payslipCount,
      advanceHistory:    0,
      lateRepayments:    0,
      savingsBalance:    0,
    })

    const emp = await prisma.employee.create({
      data: { ...empData, tenantId: tenant.id, creditScore: score },
    })
    employees.push(emp)
    logger.info(`Employé créé : ${emp.firstName} ${emp.lastName} — Score : ${score}`)
  }

  // ── Bulletins de paie (3 derniers mois) ──────────────────
  const now = new Date()
  for (let i = 1; i <= 3; i++) {
    const month = now.getMonth() - i + 1 || 12
    const year  = month < 1 ? now.getFullYear() - 1 : now.getFullYear()

    for (const emp of employees) {
      if (emp.status === 'TRIAL' && i > 1) continue
      const computed = computePayslip(emp.grossSalary)
      await prisma.payslip.upsert({
        where:  { tenantId_employeeId_month_year: { tenantId: tenant.id, employeeId: emp.id, month, year } },
        create: {
          tenantId:   tenant.id,
          employeeId: emp.id,
          month, year,
          ...computed,
          status: 'GENERATED',
        },
        update: {},
      })
    }
  }
  logger.info('Bulletins de paie créés')

  // ── Échéances ─────────────────────────────────────────────
  const deadlines = [
    {
      title: 'Cotisation CNPS Avril 2026', description: '6 employés',
      type: 'CNPS' as const, dueDate: new Date('2026-04-15'), urgency: 'URGENT' as const, amount: 340_000,
    },
    {
      title: 'Impôt sur Traitement et Salaires', description: 'DGI · Déclaration mensuelle',
      type: 'ITS' as const,  dueDate: new Date('2026-04-20'), urgency: 'BIENTOT' as const,
    },
    {
      title: 'Renouvellement contrat — Seydou Yao',
      type: 'CONTRACT_RENEWAL' as const, dueDate: new Date('2026-05-01'), urgency: 'OK' as const,
      employeeId: employees[4].id,
    },
    {
      title: 'CMU Avril 2026', description: 'Couverture Maladie Universelle',
      type: 'CMU' as const,  dueDate: new Date('2026-04-30'), urgency: 'BIENTOT' as const, amount: 6_000,
    },
  ]

  for (const dl of deadlines) {
    await prisma.deadline.create({ data: { tenantId: tenant.id, ...dl } })
  }
  logger.info('Échéances créées')

  // ── Avance active ─────────────────────────────────────────
  const computed0 = computePayslip(employees[0].grossSalary)
  await prisma.advance.create({
    data: {
      tenantId:      tenant.id,
      employeeId:    employees[0].id,
      amount:        50_000,
      maxAmount:     Math.floor(computed0.netSalary * 0.4),
      channel:       'WAVE',
      status:        'APPROVED',
      approvedAt:    new Date(),
      repaymentDate: new Date(now.getFullYear(), now.getMonth() + 1, 30),
    },
  })
  logger.info('Avance démo créée')

  // ── Épargne ───────────────────────────────────────────────
  for (const emp of employees.slice(0, 3)) {
    await prisma.saving.upsert({
      where:  { tenantId_employeeId: { tenantId: tenant.id, employeeId: emp.id } },
      create: {
        tenantId:      tenant.id,
        employeeId:    emp.id,
        monthlyAmount: 5_000,
        balance:       emp.grossSalary > 200_000 ? 120_000 : 45_000,
        isActive:      true,
        goal:          'Fonds d\'urgence',
      },
      update: {},
    })
  }
  logger.info('Épargnes créées')

  logger.info('✅ Seed terminé avec succès')
  await prisma.$disconnect()
}

seed().catch(e => {
  logger.error('Seed échoué', { error: e.message })
  process.exit(1)
})

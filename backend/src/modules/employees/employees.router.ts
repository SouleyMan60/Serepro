// ============================================================
//  SEREPRO — Module Employees
//  Routes + Service + Validation Zod
// ============================================================
import { Router, Request, Response, NextFunction } from 'express'
import { z }      from 'zod'
import prisma     from '../../config/prisma'
import { cache }  from '../../config/services'
import { authMiddleware, requireEmployer, respond, AppError } from '../../middleware'
import { computeCreditScore, parsePagination, paginationMeta } from '../../utils/payroll'
import { logger } from '../../config/logger'

// ── Schémas de validation ────────────────────────────────────
const CreateEmployeeSchema = z.object({
  firstName:      z.string().min(2).max(60),
  lastName:       z.string().min(2).max(60),
  phone:          z.string().min(8).max(20),
  email:          z.string().email().optional(),
  dateOfBirth:    z.string().datetime().optional(),
  gender:         z.enum(['MALE', 'FEMALE']).optional(),
  address:        z.string().max(200).optional(),
  contractType:   z.enum(['CDI', 'CDD', 'STAGE', 'FREELANCE']),
  position:       z.string().min(2).max(100),
  department:     z.string().max(80).optional(),
  grossSalary:    z.number().int().min(50_000).max(5_000_000),
  startDate:      z.string().datetime(),
  endDate:        z.string().datetime().optional(),
  trialPeriodDays:z.number().int().min(0).max(180).optional(),
  paymentChannel: z.enum(['WAVE', 'ORANGE_MONEY', 'MTN_MONEY', 'BANK_TRANSFER']).default('WAVE'),
  paymentNumber:  z.string().max(30).optional(),
  cnpsNumber:     z.string().max(30).optional(),
})

const UpdateEmployeeSchema = CreateEmployeeSchema.partial()

const FilterSchema = z.object({
  search:    z.string().optional(),
  status:    z.enum(['ACTIVE', 'TRIAL', 'SUSPENDED', 'INACTIVE']).optional(),
  page:      z.string().optional(),
  limit:     z.string().optional(),
})

// ── Service Employees ─────────────────────────────────────────
export const EmployeeService = {

  async list(tenantId: string, filters: z.infer<typeof FilterSchema>) {
    const { page, limit, skip } = parsePagination(filters)
    const where: any = { tenantId }

    if (filters.status) where.status = filters.status
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName:  { contains: filters.search, mode: 'insensitive' } },
        { position:  { contains: filters.search, mode: 'insensitive' } },
        { phone:     { contains: filters.search } },
      ]
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          advances: {
            where:   { status: 'APPROVED' },
            select:  { amount: true },
          },
          savings:  { select: { balance: true } },
        },
      }),
      prisma.employee.count({ where }),
    ])

    return { data: employees, meta: paginationMeta(total, page, limit) }
  },

  async findById(tenantId: string, id: string) {
    const cached = await cache.get<any>(cache.key.employee(tenantId, id))
    if (cached) return cached

    const emp = await prisma.employee.findFirst({
      where:   { id, tenantId },
      include: {
        advances: { orderBy: { requestedAt: 'desc' }, take: 5 },
        loans:    { orderBy: { createdAt: 'desc' },   take: 3 },
        savings:  true,
        documents:{ orderBy: { uploadedAt: 'desc' } },
      },
    })

    if (!emp) throw new AppError('Employé introuvable', 404)
    await cache.set(cache.key.employee(tenantId, id), emp, 120)
    return emp
  },

  async create(tenantId: string, data: z.infer<typeof CreateEmployeeSchema>) {
    const netSalary = this.estimateNet(data.grossSalary)
    const emp = await prisma.employee.create({
      data: {
        ...data,
        tenantId,
        startDate:   new Date(data.startDate),
        endDate:     data.endDate   ? new Date(data.endDate)   : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        creditScore: 300,  // score initial
      },
    })

    // Invalider cache liste
    await cache.delPattern(`emp:${tenantId}:*`)
    logger.info('Employee created', { tenantId, empId: emp.id })
    return emp
  },

  async update(tenantId: string, id: string, data: z.infer<typeof UpdateEmployeeSchema>) {
    await this.findById(tenantId, id) // vérifie l'appartenance

    const updateData: any = { ...data }
    if (data.startDate)   updateData.startDate   = new Date(data.startDate)
    if (data.endDate)     updateData.endDate      = new Date(data.endDate)
    if (data.dateOfBirth) updateData.dateOfBirth  = new Date(data.dateOfBirth)

    const emp = await prisma.employee.update({
      where: { id },
      data:  updateData,
    })

    await cache.del(cache.key.employee(tenantId, id))
    await cache.delPattern(`emp:${tenantId}:*`)
    return emp
  },

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id)
    await prisma.employee.update({
      where: { id },
      data:  { status: 'INACTIVE' },
    })
    await cache.del(cache.key.employee(tenantId, id))
    await cache.delPattern(`emp:${tenantId}:*`)
  },

  async refreshCreditScore(tenantId: string, id: string): Promise<number> {
    const emp = await prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        payslips: { select: { id: true } },
        advances: {
          select: { status: true },
          where:  { status: { in: ['REPAID', 'APPROVED'] } },
        },
        savings:  { select: { balance: true } },
      },
    })
    if (!emp) throw new AppError('Employé introuvable', 404)

    const lateCount  = emp.advances.filter(a => a.status === 'REFUSED').length
    const score      = computeCreditScore({
      contractStartDate: emp.startDate,
      contractType:      emp.contractType,
      grossSalary:       emp.grossSalary,
      payslipCount:      emp.payslips.length,
      advanceHistory:    emp.advances.length,
      lateRepayments:    lateCount,
      savingsBalance:    (emp.savings as any)?.balance ?? 0,
    })

    await prisma.employee.update({ where: { id }, data: { creditScore: score } })
    await cache.del(cache.key.employee(tenantId, id))
    await cache.del(cache.key.score(id))
    return score
  },

  estimateNet(grossSalary: number): number {
    // CNPS 6.3% + ITS simplifié + CMU
    const cnps = Math.round(grossSalary * 0.063)
    const its  = Math.round(grossSalary * 0.85 * 0.10)
    return grossSalary - cnps - its - 1000
  },
}

// ── Router ────────────────────────────────────────────────────
const router = Router()

// GET /api/v1/employees
router.get('/', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const filters = FilterSchema.parse(req.query)
    const result  = await EmployeeService.list(req.tenantId!, filters)
    respond.ok(res, result.data, result.meta)
  } catch (e) { next(e) }
})

// GET /api/v1/employees/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    // Un employé peut voir sa propre fiche
    if (req.user!.role === 'EMPLOYEE' && req.user!.employeeId !== req.params.id) {
      return respond.forbidden(res)
    }
    const emp = await EmployeeService.findById(req.tenantId!, req.params.id)
    respond.ok(res, emp)
  } catch (e) { next(e) }
})

// POST /api/v1/employees
router.post('/', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const data = CreateEmployeeSchema.parse(req.body)
    const emp  = await EmployeeService.create(req.tenantId!, data)
    respond.created(res, emp)
  } catch (e) { next(e) }
})

// PATCH /api/v1/employees/:id
router.patch('/:id', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const data = UpdateEmployeeSchema.parse(req.body)
    const emp  = await EmployeeService.update(req.tenantId!, req.params.id, data)
    respond.ok(res, emp)
  } catch (e) { next(e) }
})

// DELETE /api/v1/employees/:id (soft delete)
router.delete('/:id', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    await EmployeeService.delete(req.tenantId!, req.params.id)
    respond.noContent(res)
  } catch (e) { next(e) }
})

// POST /api/v1/employees/:id/refresh-score
router.post('/:id/refresh-score', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const score = await EmployeeService.refreshCreditScore(req.tenantId!, req.params.id)
    respond.ok(res, { creditScore: score })
  } catch (e) { next(e) }
})

export default router

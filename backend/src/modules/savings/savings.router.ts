import { Router } from 'express'
import { z }      from 'zod'
import prisma     from '../../config/prisma'
import { logger } from '../../config/logger'
import { authMiddleware, requireEmployer, respond, AppError } from '../../middleware'

const router = Router()

const CreateSavingSchema = z.object({
  employeeId:    z.string().uuid(),
  monthlyAmount: z.number().int().min(1_000),
  goal:          z.string().max(200).optional(),
  goalAmount:    z.number().int().min(0).optional(),
})

// GET /api/v1/savings
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const where: any = { tenantId: req.tenantId! }
    if (req.user!.role === 'EMPLOYEE') where.employeeId = req.user!.employeeId

    const savings = await prisma.saving.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { firstName: true, lastName: true, position: true } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    })
    respond.ok(res, savings)
  } catch (e) { next(e) }
})

// POST /api/v1/savings
router.post('/', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const data = CreateSavingSchema.parse(req.body)

    const emp = await prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId: req.tenantId!, status: 'ACTIVE' },
    })
    if (!emp) throw new AppError('Employé introuvable ou inactif', 404)

    // Un seul plan actif par employé par tenant
    const existing = await prisma.saving.findFirst({
      where: { employeeId: data.employeeId, tenantId: req.tenantId! },
    })
    if (existing) throw new AppError('Un plan d\'épargne existe déjà pour cet employé', 409)

    const saving = await prisma.saving.create({
      data: {
        tenantId:      req.tenantId!,
        employeeId:    data.employeeId,
        monthlyAmount: data.monthlyAmount,
        goal:          data.goal,
        goalAmount:    data.goalAmount,
        isActive:      true,
      },
      include: {
        employee: { select: { firstName: true, lastName: true, position: true } },
      },
    })

    logger.info('Saving created', { tenantId: req.tenantId, savingId: saving.id })
    respond.created(res, saving)
  } catch (e) { next(e) }
})

// PATCH /api/v1/savings/:id/toggle — activer / désactiver
router.patch('/:id/toggle', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const saving = await prisma.saving.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    })
    if (!saving) throw new AppError('Plan d\'épargne introuvable', 404)

    const updated = await prisma.saving.update({
      where: { id: req.params.id },
      data:  { isActive: !saving.isActive },
    })
    respond.ok(res, updated)
  } catch (e) { next(e) }
})

// POST /api/v1/savings/:id/deposit — ajouter un versement manuel
router.post('/:id/deposit', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const { amount, note } = req.body
    if (!amount || amount <= 0) throw new AppError('Montant invalide', 400)

    const saving = await prisma.saving.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId!, isActive: true },
    })
    if (!saving) throw new AppError('Plan d\'épargne introuvable ou inactif', 404)

    const [tx] = await prisma.$transaction([
      prisma.savingTransaction.create({
        data: { savingId: saving.id, amount, type: 'DEPOSIT', note },
      }),
      prisma.saving.update({
        where: { id: saving.id },
        data:  { balance: { increment: amount } },
      }),
    ])

    respond.created(res, tx)
  } catch (e) { next(e) }
})

export default router

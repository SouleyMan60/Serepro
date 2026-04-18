// ============================================================
//  SEREPRO — Module Documents (upload MinIO)
// ============================================================
import { Router, Request }  from 'express'
import multer               from 'multer'
import { z }                from 'zod'
import prisma               from '../../config/prisma'
import { storage }          from '../../config/services'
import { env }              from '../../config/env'
import { authMiddleware, requireEmployer, respond, AppError } from '../../middleware'
import { AdvanceService }   from '../advances/advances.router'
import { logger }           from '../../config/logger'

// ── Multer (upload en mémoire) ────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: env.limits.maxFileSizeMB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Type de fichier non autorisé'))
    }
  },
})

// ── Router Documents ─────────────────────────────────────────
export const documentsRouter = Router()

// GET /api/v1/documents?employeeId=...&type=...
documentsRouter.get('/', authMiddleware, async (req, res, next) => {
  try {
    const where: any = { tenantId: req.tenantId! }
    if (req.user!.role === 'EMPLOYEE') where.employeeId = req.user!.employeeId
    else if (req.query.employeeId)     where.employeeId = req.query.employeeId
    if (req.query.type)                where.type       = req.query.type

    const docs = await prisma.document.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      include: { employee: { select: { firstName: true, lastName: true } } },
    })
    respond.ok(res, docs)
  } catch (e) { next(e) }
})

// POST /api/v1/documents/upload
documentsRouter.post('/upload', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return respond.badRequest(res, 'Fichier manquant')

    const { employeeId, type = 'OTHER', name, month, year } = req.body

    if (!employeeId) return respond.badRequest(res, 'employeeId requis')

    // Vérifier appartenance tenant
    const emp = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId: req.tenantId! },
    })
    if (!emp) return respond.notFound(res, 'Employé introuvable')

    // Construire clé MinIO
    const ext = req.file.originalname.split('.').pop() ?? 'bin'
    const key = type === 'KYC'
      ? storage.buildKey.kyc(req.tenantId!, employeeId, ext)
      : type === 'CONTRACT'
        ? storage.buildKey.contract(req.tenantId!, employeeId)
        : `${req.tenantId!}/uploads/${employeeId}/${Date.now()}.${ext}`

    // Upload MinIO
    await storage.upload({
      key,
      buffer:   req.file.buffer,
      mimeType: req.file.mimetype,
      tenantId: req.tenantId!,
      metadata: { type, employeeId },
    })

    // Enregistrer en base
    const doc = await prisma.document.create({
      data: {
        tenantId:   req.tenantId!,
        employeeId,
        name:       name ?? req.file.originalname,
        type:       type as any,
        storageKey: key,
        fileSize:   req.file.size,
        mimeType:   req.file.mimetype,
        month:      month ? parseInt(month) : undefined,
        year:       year  ? parseInt(year)  : undefined,
      },
    })

    logger.info('Document uploaded', { tenantId: req.tenantId, docId: doc.id, type })
    respond.created(res, doc)
  } catch (e) { next(e) }
})

// GET /api/v1/documents/:id/download — URL signée
documentsRouter.get('/:id/download', authMiddleware, async (req, res, next) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    })
    if (!doc) return respond.notFound(res)
    const url = await storage.signedUrl(doc.storageKey, 3600)
    respond.ok(res, { url, expiresIn: 3600 })
  } catch (e) { next(e) }
})

// DELETE /api/v1/documents/:id
documentsRouter.delete('/:id', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    })
    if (!doc) return respond.notFound(res)
    await storage.delete(doc.storageKey)
    await prisma.document.delete({ where: { id: doc.id } })
    respond.noContent(res)
  } catch (e) { next(e) }
})

// ============================================================
//  SEREPRO — Module Deadlines (échéancier)
// ============================================================
export const deadlinesRouter = Router()

const DeadlineSchema = z.object({
  title:       z.string().min(2).max(100),
  description: z.string().max(300).optional(),
  type:        z.enum(['CNPS', 'ITS', 'CMU', 'CONTRACT_RENEWAL', 'OTHER']),
  dueDate:     z.string().datetime(),
  amount:      z.number().int().optional(),
  employeeId:  z.string().uuid().optional(),
})

deadlinesRouter.get('/', authMiddleware, async (req, res, next) => {
  try {
    const where: any = { tenantId: req.tenantId! }
    if (req.query.completed !== undefined) where.completed = req.query.completed === 'true'
    if (req.query.urgency)                 where.urgency   = req.query.urgency

    const deadlines = await prisma.deadline.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    })
    respond.ok(res, deadlines)
  } catch (e) { next(e) }
})

deadlinesRouter.post('/', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const data = DeadlineSchema.parse(req.body)
    const dueDate = new Date(data.dueDate)
    const days = Math.ceil((dueDate.getTime() - Date.now()) / 86400000)
    const urgency = days <= 3 ? 'URGENT' : days <= 10 ? 'BIENTOT' : 'OK'

    const dl = await prisma.deadline.create({
      data: { ...data, tenantId: req.tenantId!, dueDate, urgency: urgency as any },
    })
    respond.created(res, dl)
  } catch (e) { next(e) }
})

deadlinesRouter.patch('/:id/complete', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const dl = await prisma.deadline.updateMany({
      where: { id: req.params.id, tenantId: req.tenantId! },
      data:  { completed: true, completedAt: new Date() },
    })
    if (!dl.count) return respond.notFound(res)
    respond.ok(res, { completed: true })
  } catch (e) { next(e) }
})

// ============================================================
//  SEREPRO — Module Loans (micro-crédit)
// ============================================================
export const loansRouter = Router()

const LoanRequestSchema = z.object({
  employeeId: z.string().uuid(),
  amount:     z.number().int().min(50_000).max(2_000_000),
  duration:   z.number().int().min(6).max(24),
})

loansRouter.get('/', authMiddleware, async (req, res, next) => {
  try {
    const where: any = { tenantId: req.tenantId! }
    if (req.user!.role === 'EMPLOYEE') where.employeeId = req.user!.employeeId
    const loans = await prisma.loan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { employee: { select: { firstName: true, lastName: true, creditScore: true } } },
    })
    respond.ok(res, loans)
  } catch (e) { next(e) }
})

// Calculer simulation crédit
loansRouter.post('/simulate', authMiddleware, async (req, res, next) => {
  try {
    const { employeeId, amount, duration } = LoanRequestSchema.parse(req.body)
    const emp = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId: req.tenantId! },
    })
    if (!emp) return respond.notFound(res, 'Employé introuvable')

    const interestRate  = 0.10
    const monthlyRate   = interestRate / 12
    const monthlyPayment = Math.round(
      amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -duration))
    )
    const totalCost     = monthlyPayment * duration
    const maxEligible   = Math.round(Math.round((emp.grossSalary * 0.85) * 2))

    respond.ok(res, {
      amount, duration, monthlyPayment,
      interestRate, totalCost,
      totalInterest: totalCost - amount,
      maxEligible,
      creditScore: emp.creditScore ?? 0,
      isEligible:  (emp.creditScore ?? 0) >= 450 && amount <= maxEligible,
    })
  } catch (e) { next(e) }
})

loansRouter.post('/request', authMiddleware, async (req, res, next) => {
  try {
    const body = req.user!.role === 'EMPLOYEE'
      ? { ...req.body, employeeId: req.user!.employeeId }
      : req.body
    const { employeeId, amount, duration } = LoanRequestSchema.parse(body)

    const emp = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId: req.tenantId! },
    })
    if (!emp) return respond.notFound(res, 'Employé introuvable')

    const score       = emp.creditScore ?? 0
    const maxEligible = Math.round(Math.round((emp.grossSalary * 0.85) * 2))

    if (score < 450)         return respond.badRequest(res, 'Score insuffisant pour un crédit')
    if (amount > maxEligible) return respond.badRequest(res, `Montant maximum : ${maxEligible} FCFA`)

    const monthlyRate    = 0.10 / 12
    const monthlyPayment = Math.round(amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -duration)))

    const loan = await prisma.loan.create({
      data: {
        tenantId: req.tenantId!,
        employeeId,
        amount, duration, monthlyPayment,
        interestRate: 0.10,
        creditScore:  score,
        maxEligible,
        status:       'PENDING',
        requestedAt:  new Date(),
      },
    })

    logger.info('Loan requested', { tenantId: req.tenantId, loanId: loan.id, amount })
    respond.created(res, loan)
  } catch (e) { next(e) }
})

// ============================================================
//  SEREPRO — Webhooks CinetPay
// ============================================================
export const webhooksRouter = Router()

webhooksRouter.post('/cinetpay', async (req, res, next) => {
  try {
    logger.info('Webhook CinetPay reçu', { body: req.body })
    const result = await AdvanceService.handleWebhook(req.body)
    res.json({ received: true, ...result })
  } catch (e) { next(e) }
})

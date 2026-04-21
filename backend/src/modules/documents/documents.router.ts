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

// POST /api/v1/documents/generate-contract
documentsRouter.post('/generate-contract', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const {
      employeeId,
      missions        = '',
      responsibilities = '',
      advantages      = '',
      trialPeriodDays = '',
      workLocation    = 'Abidjan',
      hasRulesAck     = false,
      nonCompete      = false,
    } = req.body
    if (!employeeId) throw new AppError('employeeId requis', 400)

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId: req.tenantId! },
      include: { tenant: true },
    })
    if (!employee) throw new AppError('Employé introuvable', 404)

    const today = new Date().toLocaleDateString('fr-FR')

    const puppeteer = require('puppeteer')
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      headless: true,
    })
    const page = await browser.newPage()

    const missionLines  = missions       ? missions.split('\n').map((l: string) => `<li>${l}</li>`).join('') : ''
    const responsiLines = responsibilities ? responsibilities.split('\n').map((l: string) => `<li>${l}</li>`).join('') : ''
    const advantLines   = advantages      ? advantages.split('\n').map((l: string) => `<li>${l}</li>`).join('') : ''

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #333; font-size: 13px; line-height: 1.6; }
  h1 { color: #F97316; text-align: center; margin: 0; font-size: 22px; }
  h3 { color: #F97316; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #F97316; padding-bottom: 4px; margin-top: 24px; }
  .header { text-align: center; margin-bottom: 32px; }
  .subtitle { font-size: 15px; font-weight: bold; margin-top: 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
  .label { font-weight: bold; color: #555; }
  ul { margin: 6px 0 0 16px; padding: 0; }
  li { margin-bottom: 3px; }
  .clause-box { background: #fef9f5; border-left: 3px solid #F97316; padding: 10px 14px; margin-top: 8px; font-size: 12px; }
  .footer { margin-top: 60px; display: flex; justify-content: space-between; }
  .signature { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px; font-size: 12px; }
  .legal { font-size: 11px; color: #888; margin-top: 8px; }
</style></head><body>

<div class="header">
  <h1>SEREPRO</h1>
  <div class="subtitle">CONTRAT DE TRAVAIL — ${employee.contractType}</div>
</div>

<h3>Parties au contrat</h3>
<div class="grid">
  <p><span class="label">Employeur :</span> ${employee.tenant.name}</p>
  <p><span class="label">Employé :</span> ${employee.firstName} ${employee.lastName}</p>
  <p><span class="label">Poste :</span> ${employee.position}</p>
  <p><span class="label">Département :</span> ${employee.department ?? 'N/A'}</p>
  <p><span class="label">Type de contrat :</span> ${employee.contractType}</p>
  <p><span class="label">Date de début :</span> ${new Date(employee.startDate).toLocaleDateString('fr-FR')}</p>
  <p><span class="label">Salaire brut mensuel :</span> ${employee.grossSalary.toLocaleString('fr-FR')} FCFA</p>
  <p><span class="label">Canal de paiement :</span> ${employee.paymentChannel}</p>
  <p><span class="label">Lieu de travail :</span> ${workLocation}</p>
  ${trialPeriodDays ? `<p><span class="label">Période d'essai :</span> ${trialPeriodDays} jours</p>` : ''}
</div>

${missionLines ? `
<h3>Missions et Responsabilités</h3>
${missions ? `<p><span class="label">Missions principales :</span></p><ul>${missionLines}</ul>` : ''}
${responsiLines ? `<p><span class="label">Responsabilités :</span></p><ul>${responsiLines}</ul>` : ''}
` : ''}

${advantLines ? `
<h3>Avantages et Conditions</h3>
<ul>${advantLines}</ul>
` : ''}

${nonCompete ? `
<h3>Clauses Particulières</h3>
<div class="clause-box">
  <strong>Clause de non-concurrence</strong><br>
  Le salarié s'engage, pendant la durée du contrat et pendant une période de 12 mois suivant sa rupture,
  quelle qu'en soit la cause, à ne pas exercer d'activité concurrente directe ou indirecte,
  en tant que salarié ou indépendant, dans le même secteur d'activité.
</div>
` : ''}

${hasRulesAck ? `
<h3>Règlement Intérieur</h3>
<div class="clause-box">
  Le salarié déclare avoir pris connaissance du règlement intérieur de l'entreprise
  et s'engage à le respecter dans son intégralité.
</div>
` : ''}

<h3>Dispositions générales</h3>
<p>Le présent contrat est régi par les dispositions du Code du Travail de la République de Côte d'Ivoire
et de la Convention Collective applicable.</p>

<div class="footer">
  <div class="signature">
    <p><strong>L'Employeur</strong></p>
    <p>${employee.tenant.name}</p>
    <p style="margin-top:30px; font-size:11px; color:#aaa;">Signature &amp; cachet</p>
  </div>
  <div class="signature" style="text-align:center;">
    <p style="font-size:11px; color:#555;">Fait à ${workLocation}, le ${today}</p>
  </div>
  <div class="signature">
    <p><strong>L'Employé</strong></p>
    <p>${employee.firstName} ${employee.lastName}</p>
    <p style="margin-top:30px; font-size:11px; color:#aaa;">Signature précédée de<br>"Lu et approuvé"</p>
  </div>
</div>

<p class="legal">Document généré par SEREPRO — ${today}</p>
</body></html>`

    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } })
    await browser.close()

    const key = storage.buildKey.contract(req.tenantId!, employeeId)
    await storage.upload({
      key,
      buffer:   Buffer.from(pdfBuffer),
      mimeType: 'application/pdf',
      tenantId: req.tenantId!,
      metadata: { type: 'CONTRACT', employeeId },
    })

    await prisma.document.create({
      data: {
        tenantId:   req.tenantId!,
        employeeId,
        type:       'CONTRACT',
        name:       `Contrat_${employee.firstName}_${employee.lastName}.pdf`,
        storageKey: key,
        fileSize:   pdfBuffer.length,
        mimeType:   'application/pdf',
      },
    })

    const signedUrl = `${process.env.STORAGE_PUBLIC_URL}/${process.env.STORAGE_BUCKET}/${key}`
    respond.ok(res, { url: signedUrl })
  } catch (e) { next(e) }
})

// GET /api/v1/documents/:id/download — URL signée
documentsRouter.get('/:id/download', authMiddleware, async (req, res, next) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    })
    if (!doc) return respond.notFound(res)
    const url = `${process.env.STORAGE_PUBLIC_URL}/${process.env.STORAGE_BUCKET}/${doc.storageKey}`
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

// ============================================================
//  SEREPRO — Module Advances + CinetPay
// ============================================================
import { Router }   from 'express'
import { z }        from 'zod'
import axios        from 'axios'
import { v4 as uuid } from 'uuid'
import prisma       from '../../config/prisma'
import { cache }    from '../../config/services'
import { env }      from '../../config/env'
import { logger }   from '../../config/logger'
import { authMiddleware, requireEmployer, respond, AppError } from '../../middleware'
import { computePayslip, maxAdvanceAmount } from '../../utils/payroll'

// ── CinetPay Service ──────────────────────────────────────────
export const CinetPayService = {

  async initPayment(opts: {
    amount:       number
    currency?:    string
    description:  string
    transactionId:string
    customerName: string
    customerPhone:string
    notifyUrl?:   string
    returnUrl?:   string
    channels?:    string   // 'MOBILE_MONEY' | 'CREDIT_CARD' | 'ALL'
  }) {
    const payload = {
      apikey:         env.cinetpay.apiKey,
      site_id:        env.cinetpay.siteId,
      transaction_id: opts.transactionId,
      amount:         opts.amount,
      currency:       opts.currency ?? 'XOF',
      description:    opts.description,
      notify_url:     opts.notifyUrl ?? env.cinetpay.notifyUrl,
      return_url:     opts.returnUrl ?? `${env.app.url}/payment/success`,
      channels:       opts.channels ?? 'MOBILE_MONEY',
      customer_name:  opts.customerName,
      customer_phone: opts.customerPhone,
      customer_email: '',
      customer_city:  'Abidjan',
      customer_country: 'CI',
    }

    const res = await axios.post(
      `${env.cinetpay.baseUrl}/payment`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    )

    if (res.data.code !== '201') {
      throw new AppError(`CinetPay erreur : ${res.data.message}`, 400)
    }

    return {
      paymentUrl:    res.data.data.payment_url as string,
      transactionId: opts.transactionId,
    }
  },

  async checkStatus(transactionId: string) {
    const res = await axios.post(
      `${env.cinetpay.baseUrl}/payment/check`,
      {
        apikey:         env.cinetpay.apiKey,
        site_id:        env.cinetpay.siteId,
        transaction_id: transactionId,
      }
    )
    return res.data
  },

  verifyWebhookSignature(body: any, signature: string): boolean {
    // TODO: implémenter HMAC selon doc CinetPay
    return true
  },
}

// ── Schémas Zod ───────────────────────────────────────────────
const RequestAdvanceSchema = z.object({
  employeeId: z.string().uuid(),
  amount:     z.number().int().min(5_000),
  channel:    z.enum(['WAVE', 'ORANGE_MONEY', 'MTN_MONEY', 'BANK_TRANSFER']),
  note:       z.string().max(200).optional(),
})

// ── Service Advances ──────────────────────────────────────────
export const AdvanceService = {

  async list(tenantId: string, query: any) {
    const where: any = { tenantId }
    if (query.status)     where.status     = query.status
    if (query.employeeId) where.employeeId = query.employeeId

    return prisma.advance.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        employee: {
          select: { firstName: true, lastName: true, position: true, phone: true },
        },
      },
    })
  },

  async request(tenantId: string, requestedBy: string, data: z.infer<typeof RequestAdvanceSchema>) {
    // Vérifier l'employé appartient au tenant
    const emp = await prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId, status: 'ACTIVE' },
    })
    if (!emp) throw new AppError('Employé introuvable ou inactif', 404)

    // Calculer net et max avance
    const computed  = computePayslip(emp.grossSalary)
    const maxAmount = maxAdvanceAmount(computed.netSalary)

    if (data.amount > maxAmount) {
      throw new AppError(`Montant maximum : ${maxAmount} FCFA (40% du net)`, 400)
    }

    // Vérifier pas d'avance active
    const existing = await prisma.advance.findFirst({
      where: { employeeId: data.employeeId, status: { in: ['PENDING', 'APPROVED'] } },
    })
    if (existing) {
      throw new AppError('Une avance est déjà en cours pour cet employé', 409)
    }

    // Calculer date de remboursement (fin du mois suivant)
    const repaymentDate = new Date()
    repaymentDate.setMonth(repaymentDate.getMonth() + 1)
    repaymentDate.setDate(30)

    const advance = await prisma.advance.create({
      data: {
        tenantId,
        employeeId:    data.employeeId,
        amount:        data.amount,
        maxAmount,
        channel:       data.channel,
        status:        'PENDING',
        repaymentDate,
        note:          data.note,
      },
      include: {
        employee: { select: { firstName: true, lastName: true, phone: true } },
      },
    })

    await cache.delPattern(`emp:${tenantId}:*`)
    logger.info('Advance requested', { tenantId, advanceId: advance.id, amount: data.amount })
    return advance
  },

  async approve(tenantId: string, advanceId: string, approvedBy: string) {
    const advance = await prisma.advance.findFirst({
      where: { id: advanceId, tenantId, status: 'PENDING' },
      include: { employee: true },
    })
    if (!advance) throw new AppError('Avance introuvable ou déjà traitée', 404)

    // Initier paiement CinetPay
    const txId = `ADV-${advanceId.slice(0, 8)}-${Date.now()}`
    let paymentUrl = ''

    try {
      const payment = await CinetPayService.initPayment({
        amount:        advance.amount,
        description:   `Avance salaire — ${advance.employee.firstName} ${advance.employee.lastName}`,
        transactionId: txId,
        customerName:  `${advance.employee.firstName} ${advance.employee.lastName}`,
        customerPhone: advance.employee.phone,
        channels:      advance.channel === 'WAVE' ? 'MOBILE_MONEY' : 'MOBILE_MONEY',
      })
      paymentUrl = payment.paymentUrl
    } catch (e: any) {
      logger.warn('CinetPay init failed (mode dev)', { error: e.message })
      // En dev : on simule l'approbation sans CinetPay
    }

    const updated = await prisma.advance.update({
      where: { id: advanceId },
      data:  { status: 'APPROVED', approvedAt: new Date(), approvedBy, externalRef: txId },
    })

    logger.info('Advance approved', { tenantId, advanceId, txId })
    return { advance: updated, paymentUrl }
  },

  async refuse(tenantId: string, advanceId: string, reason: string) {
    const advance = await prisma.advance.findFirst({
      where: { id: advanceId, tenantId, status: 'PENDING' },
    })
    if (!advance) throw new AppError('Avance introuvable ou déjà traitée', 404)

    return prisma.advance.update({
      where: { id: advanceId },
      data:  { status: 'REFUSED', refusedAt: new Date(), refusedReason: reason },
    })
  },

  async handleWebhook(body: any) {
    const { transaction_id, status, payment_method } = body

    if (status !== 'ACCEPTED') return { handled: false }

    const advance = await prisma.advance.findFirst({
      where: { externalRef: transaction_id },
    })
    if (!advance) return { handled: false }

    await prisma.advance.update({
      where: { id: advance.id },
      data:  { status: 'APPROVED' },
    })

    logger.info('Advance payment confirmed via webhook', { transaction_id })
    return { handled: true }
  },
}

// ── Router ────────────────────────────────────────────────────
const router = Router()

// GET /api/v1/advances
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const query = { ...req.query }
    if (req.user!.role === 'EMPLOYEE') query.employeeId = req.user!.employeeId
    const advances = await AdvanceService.list(req.tenantId!, query)
    respond.ok(res, advances)
  } catch (e) { next(e) }
})

// POST /api/v1/advances/request
router.post('/request', authMiddleware, async (req, res, next) => {
  try {
    // Un employé peut demander pour lui-même
    const body = req.user!.role === 'EMPLOYEE'
      ? { ...req.body, employeeId: req.user!.employeeId }
      : req.body
    const data    = RequestAdvanceSchema.parse(body)
    const advance = await AdvanceService.request(req.tenantId!, req.user!.id, data)
    respond.created(res, advance)
  } catch (e) { next(e) }
})

// POST /api/v1/advances/:id/approve
router.post('/:id/approve', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const result = await AdvanceService.approve(req.tenantId!, req.params.id, req.user!.id)
    respond.ok(res, result)
  } catch (e) { next(e) }
})

// POST /api/v1/advances/:id/refuse
router.post('/:id/refuse', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const { reason = 'Refus employeur' } = req.body
    const advance = await AdvanceService.refuse(req.tenantId!, req.params.id, reason)
    respond.ok(res, advance)
  } catch (e) { next(e) }
})

export default router

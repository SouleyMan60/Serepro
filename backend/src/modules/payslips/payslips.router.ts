// ============================================================
//  SEREPRO — Module Payslips (bulletins de paie)
// ============================================================
import { Router }   from 'express'
import { z }        from 'zod'
import puppeteer    from 'puppeteer'
import prisma       from '../../config/prisma'
import { cache, storage } from '../../config/services'
import { authMiddleware, requireEmployer, respond, AppError } from '../../middleware'
import { computePayslip, parsePagination, paginationMeta, monthLabel, currentMonthYear } from '../../utils/payroll'
import { logger }   from '../../config/logger'

// ── Template HTML bulletin ────────────────────────────────────
function buildPayslipHtml(data: {
  employee:    { firstName: string; lastName: string; position: string; cnpsNumber?: string | null; contractType: string }
  tenant:      { name: string; rccm?: string | null; address?: string | null }
  payslip:     { grossSalary: number; cnpsEmployee: number; cnpsEmployer: number; its: number; cmu: number; netSalary: number; advanceDeducted: number; savingsDeducted: number; netPayable: number }
  month:       number
  year:        number
}): string {
  const ml = monthLabel(data.month, data.year)
  const fmt = (n: number) => new Intl.NumberFormat('fr-CI').format(n) + ' FCFA'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #222; padding: 20mm; }
  h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
  .sub { text-align: center; color: #666; margin-bottom: 20px; font-size: 11px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .section { border: 1px solid #ddd; border-radius: 6px; padding: 12px; }
  .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555; margin-bottom: 8px; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f0f0; }
  .row:last-child { border: none; }
  .row .lbl { color: #555; }
  .row .val { font-weight: 500; }
  .row .neg { color: #dc2626; }
  .net-row { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 14px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  .net-row .lbl { font-size: 13px; font-weight: bold; }
  .net-row .val { font-size: 20px; font-weight: bold; color: #16a34a; }
  .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
</style>
</head>
<body>
  <h1>${data.tenant.name}</h1>
  <div class="sub">${data.tenant.rccm ? 'RCCM : ' + data.tenant.rccm + ' · ' : ''}${data.tenant.address ?? ''}</div>

  <div style="text-align:center;font-size:15px;font-weight:bold;margin-bottom:4px">
    BULLETIN DE PAIE — ${ml.toUpperCase()}
  </div>
  <div style="text-align:center;margin-bottom:20px">
    <span class="badge">${data.employee.contractType}</span>
  </div>

  <div class="grid2">
    <div class="section">
      <div class="section-title">Employé</div>
      <div class="row"><span class="lbl">Nom complet</span><span class="val">${data.employee.firstName} ${data.employee.lastName}</span></div>
      <div class="row"><span class="lbl">Poste</span><span class="val">${data.employee.position}</span></div>
      ${data.employee.cnpsNumber ? `<div class="row"><span class="lbl">N° CNPS</span><span class="val">${data.employee.cnpsNumber}</span></div>` : ''}
    </div>
    <div class="section">
      <div class="section-title">Période</div>
      <div class="row"><span class="lbl">Mois</span><span class="val">${ml}</span></div>
      <div class="row"><span class="lbl">Employeur</span><span class="val">${data.tenant.name}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Détail de la rémunération</div>
    <div class="row"><span class="lbl">Salaire brut</span><span class="val">${fmt(data.payslip.grossSalary)}</span></div>
    <div class="row"><span class="lbl">CNPS salarié (6.3%)</span><span class="val neg">− ${fmt(data.payslip.cnpsEmployee)}</span></div>
    <div class="row"><span class="lbl">Impôt sur Traitement et Salaires</span><span class="val neg">− ${fmt(data.payslip.its)}</span></div>
    <div class="row"><span class="lbl">CMU (Couverture Maladie Universelle)</span><span class="val neg">− ${fmt(data.payslip.cmu)}</span></div>
    <div class="row"><span class="lbl">Salaire net</span><span class="val">${fmt(data.payslip.netSalary)}</span></div>
    ${data.payslip.advanceDeducted > 0 ? `<div class="row"><span class="lbl">Déduction avance</span><span class="val neg">− ${fmt(data.payslip.advanceDeducted)}</span></div>` : ''}
    ${data.payslip.savingsDeducted > 0 ? `<div class="row"><span class="lbl">Épargne automatique</span><span class="val neg">− ${fmt(data.payslip.savingsDeducted)}</span></div>` : ''}
  </div>

  <div class="net-row">
    <span class="lbl">NET À PAYER</span>
    <span class="val">${fmt(data.payslip.netPayable)}</span>
  </div>

  <div style="margin-top:16px;font-size:10px;color:#555;border:1px solid #ddd;border-radius:6px;padding:10px">
    Charges patronales (non déduites du salaire) :<br>
    CNPS employeur (16.8%) : ${fmt(data.payslip.cnpsEmployer)}
  </div>

  <div class="footer">
    Document généré par SEREPRO · serepro.net · ${new Date().toLocaleDateString('fr-FR')}
  </div>
</body>
</html>`
}

// ── Service Payslips ──────────────────────────────────────────
export const PayslipService = {

  async list(tenantId: string, query: any) {
    const { page, limit, skip } = parsePagination(query)
    const month = query.month ? parseInt(query.month) : undefined
    const year  = query.year  ? parseInt(query.year)  : undefined
    const where: any = { tenantId }
    if (month)            where.month      = month
    if (year)             where.year       = year
    if (query.employeeId) where.employeeId = query.employeeId
    if (query.status)     where.status     = query.status

    const [payslips, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        skip, take: limit,
        orderBy:  { createdAt: 'desc' },
        include:  { employee: { select: { firstName: true, lastName: true, position: true } } },
      }),
      prisma.payslip.count({ where }),
    ])
    return { data: payslips, meta: paginationMeta(total, page, limit) }
  },

  async generateOne(tenantId: string, employeeId: string, month: number, year: number) {
    // Récupérer employé
    const emp = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    })
    if (!emp) throw new AppError('Employé introuvable', 404)

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) throw new AppError('Tenant introuvable', 404)

    // Calculer les déductions
    const activeAdvance = await prisma.advance.findFirst({
      where:   { employeeId, status: 'APPROVED' },
      orderBy: { requestedAt: 'desc' },
    })
    const saving = await prisma.saving.findUnique({
      where: { tenantId_employeeId: { tenantId, employeeId } },
    })

    const advanceDeducted = activeAdvance?.amount ?? 0
    const savingsDeducted = saving?.isActive ? saving.monthlyAmount : 0

    const computed = computePayslip(emp.grossSalary, advanceDeducted, savingsDeducted)

    // Créer ou mettre à jour le bulletin
    const payslip = await prisma.payslip.upsert({
      where:  { tenantId_employeeId_month_year: { tenantId, employeeId, month, year } },
      create: { tenantId, employeeId, month, year, ...computed, status: 'DRAFT' },
      update: { ...computed, status: 'DRAFT' },
    })

    // Générer PDF
    const pdfBuffer = await this.generatePdf({
      employee: emp,
      tenant,
      payslip:  computed,
      month, year,
    })

    // Upload MinIO
    const key = storage.buildKey.payslip(tenantId, employeeId, month, year)
    await storage.upload({ key, buffer: pdfBuffer, mimeType: 'application/pdf', tenantId })

    // Mettre à jour bulletin avec lien PDF
    const updated = await prisma.payslip.update({
      where: { id: payslip.id },
      data:  { pdfUrl: key, pdfSize: pdfBuffer.length, status: 'GENERATED' },
    })

    // Marquer l'avance comme remboursée si déduite
    if (activeAdvance) {
      await prisma.advance.update({
        where: { id: activeAdvance.id },
        data:  { status: 'REPAID', repaidAt: new Date() },
      })
    }

    // Créditer l'épargne
    if (saving?.isActive && savingsDeducted > 0) {
      await prisma.saving.update({
        where: { id: saving.id },
        data:  { balance: { increment: savingsDeducted } },
      })
      await prisma.savingTransaction.create({
        data: { savingId: saving.id, amount: savingsDeducted, type: 'CREDIT', note: `Prélèvement ${monthLabel(month, year)}` },
      })
    }

    // Invalider cache
    await cache.del(cache.key.payslips(tenantId, month, year))
    await cache.del(cache.key.employee(tenantId, employeeId))

    logger.info('Payslip generated', { tenantId, employeeId, month, year })
    return updated
  },

  async generateAll(tenantId: string, month: number, year: number) {
    const employees = await prisma.employee.findMany({
      where: { tenantId, status: 'ACTIVE' },
    })

    const results = await Promise.allSettled(
      employees.map(emp => this.generateOne(tenantId, emp.id, month, year))
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed    = results.filter(r => r.status === 'rejected').length

    logger.info('Payroll batch complete', { tenantId, month, year, succeeded, failed })
    return { succeeded, failed, total: employees.length }
  },

  async generatePdf(data: any): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(buildPayslipHtml(data), { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } })
    await browser.close()
    return Buffer.from(pdf)
  },

  async getSignedUrl(tenantId: string, payslipId: string): Promise<string> {
    const payslip = await prisma.payslip.findFirst({
      where: { id: payslipId, tenantId },
    })
    if (!payslip?.pdfUrl) throw new AppError('PDF non disponible', 404)
    return storage.signedUrl(payslip.pdfUrl, 3600)
  },
}

// ── Router ────────────────────────────────────────────────────
const router = Router()

// GET /api/v1/payslips
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    // Les employés ne voient que leurs propres bulletins
    const query = { ...req.query }
    if (req.user!.role === 'EMPLOYEE') query.employeeId = req.user!.employeeId
    const result = await PayslipService.list(req.tenantId!, query)
    respond.ok(res, result.data, result.meta)
  } catch (e) { next(e) }
})

// POST /api/v1/payslips/generate — générer un bulletin
router.post('/generate', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const { employeeId, month, year } = req.body
    if (!employeeId || !month || !year) {
      return respond.badRequest(res, 'employeeId, month, year requis')
    }
    const payslip = await PayslipService.generateOne(req.tenantId!, employeeId, month, year)
    respond.created(res, payslip)
  } catch (e) { next(e) }
})

// POST /api/v1/payslips/generate-all — générer tous les bulletins du mois
router.post('/generate-all', authMiddleware, requireEmployer, async (req, res, next) => {
  try {
    const { month, year } = req.body
    const m = month ?? new Date().getMonth() + 1
    const y = year  ?? new Date().getFullYear()
    const result = await PayslipService.generateAll(req.tenantId!, m, y)
    respond.ok(res, result)
  } catch (e) { next(e) }
})

// GET /api/v1/payslips/:id/download — URL signée PDF
router.get('/:id/download', authMiddleware, async (req, res, next) => {
  try {
    const url = await PayslipService.getSignedUrl(req.tenantId!, req.params.id)
    respond.ok(res, { url })
  } catch (e) { next(e) }
})

export default router

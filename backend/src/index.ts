// ============================================================
//  SEREPRO — Serveur Express principal
//  Point d'entrée : src/index.ts
// ============================================================
import 'dotenv/config'
import express          from 'express'
import helmet           from 'helmet'
import cors             from 'cors'
import compression      from 'compression'
import morgan           from 'morgan'
import cron             from 'node-cron'

import { env }          from './config/env'
import { logger }       from './config/logger'
import prisma           from './config/prisma'
import { redis }        from './config/services'
import { errorHandler, apiLimiter, authLimiter, authMiddleware, softAuthMiddleware, respond, AppError } from './middleware'

// ── Routers modules ───────────────────────────────────────────
import employeesRouter  from './modules/employees/employees.router'
import payslipsRouter   from './modules/payslips/payslips.router'
import advancesRouter   from './modules/advances/advances.router'
import savingsRouter    from './modules/savings/savings.router'
import {
  documentsRouter,
  deadlinesRouter,
  loansRouter,
  webhooksRouter,
}                       from './modules/documents/documents.router'

// ── App Express ───────────────────────────────────────────────
const app = express()
app.set('trust proxy', 1)

// ── Middlewares globaux ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || env.app.allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS : origine non autorisée : ${origin}`))
  },
  credentials:     true,
  methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:  ['Authorization', 'Content-Type', 'X-Tenant-ID'],
}))

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging HTTP
app.use(morgan(env.isDev ? 'dev' : 'combined', {
  stream: { write: msg => logger.http(msg.trim()) },
  skip: (req) => req.path === '/health',
}))

// ── Rate limiting ────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter)
app.use('/api/',        apiLimiter)

// ── Health check ─────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    await redis.ping()
    res.json({
      status:    'ok',
      version:   '0.1.0',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        redis:    'ok',
      },
    })
  } catch (e: any) {
    res.status(503).json({ status: 'error', error: e.message })
  }
})

// ── Routes API ────────────────────────────────────────────────
const API = '/api/v1'

// Auth (Firebase — géré côté middleware, pas de route dédiée)
// POST /api/v1/auth/register — créer un User en base après Firebase signup
app.post(`${API}/auth/register`, authLimiter, async (req, res, next) => {
  try {
    const { firebaseUid, email, displayName, tenantName, role = 'EMPLOYER' } = req.body
    if (!firebaseUid || !email) {
      return res.status(400).json({ error: 'firebaseUid et email requis' })
    }

    // Créer ou récupérer le tenant
    let tenant = await prisma.tenant.findFirst({ where: { email } })
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: tenantName ?? email.split('@')[0], email },
      })
    }

    const user = await prisma.user.upsert({
      where:  { firebaseUid },
      create: { firebaseUid, email, displayName, role: role as any, tenantId: tenant.id },
      update: { displayName },
    })

    res.status(201).json({ data: { user, tenant } })
  } catch (e) { next(e) }
})

// GET /api/v1/auth/me — profil utilisateur connecté + tenant
app.get(`${API}/auth/me`, softAuthMiddleware, async (req, res, next) => {
  try {
    if (!req.user) return res.status(404).json({ error: 'Utilisateur introuvable' })
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { tenant: true },
    })
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
    return res.json({ data: user })
  } catch (err) { next(err) }
})

// PATCH /api/v1/users/profile — mise à jour displayName + tenant phone/bio
app.patch(`${API}/users/profile`, authMiddleware, async (req, res, next) => {
  try {
    const { displayName, phone, pays, ville, codePostal, nif, notificationPrefs } = req.body
    const userId   = req.user!.id
    const tenantId = req.user!.tenantId

    // Build address string from separate fields if provided
    const addressParts = [ville, pays, codePostal].filter(Boolean)
    const address = addressParts.length > 0 ? addressParts.join(', ') : undefined

    const [user] = await Promise.all([
      prisma.user.update({
        where: { id: userId },
        data: {
          ...(displayName       ? { displayName }       : {}),
        },
      }),
      prisma.tenant.update({
        where: { id: tenantId },
        data: {
          ...(phone   ? { phone }   : {}),
          ...(nif     ? { nif }     : {}),
          ...(address ? { address } : {}),
        },
      }),
    ])

    return res.json({ data: { user } })
  } catch (err) { next(err) }
})

// GET /api/v1/billing/plans — plans disponibles (statique)
app.get(`${API}/billing/plans`, (_req, res) => {
  res.json({
    plans: [
      {
        id: 'STARTER', name: 'Starter', price: 0, priceYear: 0,
        maxEmployees: 5, maxHRUsers: 1, maxContracts: 2,
        features: { advances: false, microCredit: false, savings: false, insurance: false, employeeSpace: false, smsNotif: false, storage: '1GB' },
      },
      {
        id: 'PRO', name: 'Pro', price: 15000, priceYear: 150000,
        maxEmployees: 25, maxHRUsers: 3, maxContracts: 20,
        features: { advances: true, microCredit: true, savings: true, insurance: false, employeeSpace: true, smsNotif: true, storage: '10GB' },
      },
      {
        id: 'BUSINESS', name: 'Business', price: 35000, priceYear: 350000,
        maxEmployees: 100, maxHRUsers: 10, maxContracts: -1,
        features: { advances: true, microCredit: true, savings: true, insurance: true, employeeSpace: true, smsNotif: true, storage: '50GB', api: true, multiSite: true },
      },
      {
        id: 'ENTERPRISE', name: 'Enterprise', price: -1, priceYear: -1,
        maxEmployees: -1, maxHRUsers: -1, maxContracts: -1,
        features: { advances: true, microCredit: true, savings: true, insurance: true, employeeSpace: true, smsNotif: true, storage: 'unlimited', api: true, multiSite: true },
      },
    ],
  })
})

// POST /api/v1/billing/subscribe — initier un paiement Paystack
app.post(`${API}/billing/subscribe`, authMiddleware, async (req, res, next) => {
  try {
    const { planId, billing } = req.body
    const tenant = await prisma.tenant.findUnique({ where: { id: req.user!.tenantId } })
    if (!tenant) throw new AppError('Tenant introuvable', 404)

    const PRICES: Record<string, Record<string, number>> = {
      PRO:      { monthly: 15000, yearly: 150000 },
      BUSINESS: { monthly: 35000, yearly: 350000 },
    }
    const amount = PRICES[planId]?.[billing]
    if (!amount) throw new AppError('Plan invalide', 400)

    const reference = `SEREPRO-${Date.now()}-${req.user!.tenantId.slice(0, 8)}`

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: tenant.email,
        amount: amount * 100,
        currency: 'XOF',
        reference,
        callback_url: `${process.env.APP_URL}/billing?status=success&ref=${reference}`,
        metadata: {
          tenantId: req.user!.tenantId,
          planId,
          billing,
          tenantName: tenant.name,
          custom_fields: [
            { display_name: 'Plan',       variable_name: 'plan',    value: planId },
            { display_name: 'Entreprise', variable_name: 'company', value: tenant.name },
          ],
        },
      }),
    })
    const data = await response.json() as any
    if (!data.status) throw new AppError(data.message || 'Erreur Paystack', 400)
    respond.ok(res, { paymentUrl: data.data.authorization_url, reference })
  } catch (e) { next(e) }
})

// POST /api/v1/billing/verify — vérifier un paiement Paystack
app.post(`${API}/billing/verify`, authMiddleware, async (req, res, next) => {
  try {
    const { reference } = req.body
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })
    const data = await response.json() as any
    if (!data.status || data.data.status !== 'success') throw new AppError('Paiement non vérifié', 400)

    const meta = data.data.metadata
    if (meta?.tenantId && meta?.planId) {
      await prisma.tenant.update({
        where: { id: meta.tenantId },
        data: { plan: meta.planId as any },
      })
    }
    respond.ok(res, { plan: meta?.planId })
  } catch (e) { next(e) }
})

// POST /api/v1/billing/webhook — webhook Paystack (signature HMAC-SHA512)
app.post(`${API}/billing/webhook`, async (req, res, next) => {
  try {
    const crypto = await import('crypto')
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(JSON.stringify(req.body)).digest('hex')
    if (hash !== req.headers['x-paystack-signature']) return res.sendStatus(400)

    if (req.body.event === 'charge.success') {
      const meta = req.body.data.metadata
      if (meta?.tenantId && meta?.planId) {
        await prisma.tenant.update({
          where: { id: meta.tenantId },
          data: { plan: meta.planId as any },
        })
      }
    }
    res.sendStatus(200)
  } catch (e) { next(e) }
})

// Modules
app.use(`${API}/employees`,  employeesRouter)
app.use(`${API}/payslips`,   payslipsRouter)
app.use(`${API}/advances`,   advancesRouter)
app.use(`${API}/documents`,  documentsRouter)
app.use(`${API}/deadlines`,  deadlinesRouter)
app.use(`${API}/loans`,      loansRouter)
app.use(`${API}/savings`,    savingsRouter)
app.use('/webhooks',         webhooksRouter)

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' })
})

// Error handler global
app.use(errorHandler)

// ── CRON Jobs ─────────────────────────────────────────────────

// Recalcul urgences échéances — toutes les heures
cron.schedule('0 * * * *', async () => {
  logger.info('CRON: Recalcul urgences échéances')
  try {
    const deadlines = await prisma.deadline.findMany({
      where: { completed: false },
    })
    for (const dl of deadlines) {
      const days    = Math.ceil((dl.dueDate.getTime() - Date.now()) / 86400000)
      const urgency = days <= 3 ? 'URGENT' : days <= 10 ? 'BIENTOT' : 'OK'
      if (urgency !== dl.urgency) {
        await prisma.deadline.update({ where: { id: dl.id }, data: { urgency: urgency as any } })
      }
    }
    logger.info('CRON: Urgences mises à jour')
  } catch (e: any) {
    logger.error('CRON error deadlines', { error: e.message })
  }
})

// Génération automatique échéances CNPS — 1er de chaque mois
cron.schedule('0 8 1 * *', async () => {
  logger.info('CRON: Génération échéances CNPS')
  try {
    const tenants = await prisma.tenant.findMany({ where: { isActive: true } })
    const now     = new Date()
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 15)

    for (const tenant of tenants) {
      const exists = await prisma.deadline.findFirst({
        where: {
          tenantId: tenant.id,
          type: 'CNPS',
          dueDate: { gte: new Date(dueDate.getFullYear(), dueDate.getMonth(), 1) },
        },
      })
      if (!exists) {
        await prisma.deadline.create({
          data: {
            tenantId:    tenant.id,
            title:       `Cotisation CNPS — ${dueDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
            description: 'Cotisations sociales mensuelles',
            type:        'CNPS',
            dueDate,
            urgency:     'OK',
          },
        })
      }
    }
    logger.info('CRON: Échéances CNPS créées')
  } catch (e: any) {
    logger.error('CRON error CNPS', { error: e.message })
  }
})

// Recalcul scores crédit — chaque dimanche à 3h
cron.schedule('0 3 * * 0', async () => {
  logger.info('CRON: Recalcul scores crédit')
  try {
    const { EmployeeService } = await import('./modules/employees/employees.router')
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, tenantId: true },
    })
    for (const emp of employees) {
      try {
        await EmployeeService.refreshCreditScore(emp.tenantId, emp.id)
      } catch {}
    }
    logger.info(`CRON: ${employees.length} scores recalculés`)
  } catch (e: any) {
    logger.error('CRON error scores', { error: e.message })
  }
})

// ── Démarrage ─────────────────────────────────────────────────
async function bootstrap() {
  try {
    await prisma.$connect()
    logger.info('PostgreSQL connecté')

    app.listen(env.PORT, () => {
      logger.info(`SEREPRO API démarré`, {
        port:    env.PORT,
        env:     env.NODE_ENV,
        api:     `http://localhost:${env.PORT}/api/v1`,
        health:  `http://localhost:${env.PORT}/health`,
      })
    })
  } catch (e: any) {
    logger.error('Erreur démarrage', { error: e.message })
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM reçu — arrêt gracieux')
  await prisma.$disconnect()
  await redis.quit()
  process.exit(0)
})

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', { reason })
})

bootstrap()

export default app

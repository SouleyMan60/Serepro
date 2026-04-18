import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import * as admin from 'firebase-admin'
import { env } from '../config/env'
import { logger } from '../config/logger'
import prisma from '../config/prisma'
import { cache } from '../config/services'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        firebaseUid: string
        email: string
        role: string
        tenantId: string
        employeeId?: string
      }
      tenantId?: string
    }
  }
}

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebase.projectId,
      privateKey: env.firebase.privateKey,
      clientEmail: env.firebase.clientEmail,
    }),
  })
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' })
    }

    const token = header.split(' ')[1]
    const cacheKey = `user:${token}`
    let user = await cache.get<any>(cacheKey)

    if (!user) {
      const decoded = await admin.auth().verifyIdToken(token)
      const dbUser = await prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
        select: { id: true, firebaseUid: true, email: true, role: true, tenantId: true, employeeId: true, isActive: true },
      })

      if (!dbUser || !dbUser.isActive) {
        return res.status(403).json({ error: 'Compte inactif ou introuvable' })
      }

      user = {
        id: dbUser.id,
        firebaseUid: dbUser.firebaseUid,
        email: dbUser.email,
        role: dbUser.role,
        tenantId: dbUser.tenantId,
        employeeId: dbUser.employeeId ?? undefined,
      }
      await cache.set(cacheKey, user, 300)
    }

    req.user = user
    req.tenantId = user.tenantId
    next()
  } catch (err: any) {
    logger.warn('Auth failed', { error: err.message })
    return res.status(401).json({ error: 'Token invalide' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' })
    }
    next()
  }
}

export const requireEmployer = requireRole('EMPLOYER', 'ADMIN')
export const requireAdmin = requireRole('ADMIN')

export function tenantGuard(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.tenantId) {
    return res.status(403).json({ error: 'Tenant non identifié' })
  }
  req.tenantId = req.user.tenantId
  next()
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Trop de requêtes' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Trop de fichiers uploadés' },
})

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Données invalides',
      fields: err.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
    })
  }
  if (err.code === 'P2002') return res.status(409).json({ error: 'Cette entrée existe déjà' })
  if (err.code === 'P2025') return res.status(404).json({ error: 'Ressource introuvable' })

  logger.error('Unhandled error', { message: err.message, path: req.path })

  const statusCode = err.statusCode ?? err.status ?? 500
  res.status(statusCode).json({
    error: env.isDev ? err.message : 'Une erreur est survenue',
  })
}

export const respond = {
  ok: <T>(res: Response, data: T, meta?: object) =>
    res.json({ data, ...(meta ? { meta } : {}) }),
  created: <T>(res: Response, data: T) => res.status(201).json({ data }),
  noContent: (res: Response) => res.status(204).send(),
  notFound: (res: Response, msg = 'Ressource introuvable') => res.status(404).json({ error: msg }),
  badRequest: (res: Response, msg: string) => res.status(400).json({ error: msg }),
  forbidden: (res: Response, msg = 'Accès interdit') => res.status(403).json({ error: msg }),
}

export class AppError extends Error {
  constructor(public message: string, public statusCode = 400) {
    super(message)
    this.name = 'AppError'
  }
}

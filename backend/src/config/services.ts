// ============================================================
//  SEREPRO — Redis client (cache + sessions)
// ============================================================
import Redis  from 'ioredis'
import { env } from './env'
import { logger } from './logger'

export const redis = new Redis(env.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: times => Math.min(times * 200, 5000),
})

redis.on('connect', () => logger.info('Redis connecté'))
redis.on('error',   e  => logger.error('Redis erreur', { error: e.message }))

// ── Helpers Redis ────────────────────────────────────────────
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key)
    if (!raw) return null
    try { return JSON.parse(raw) as T } catch { return null }
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  },

  async del(key: string): Promise<void> {
    await redis.del(key)
  },

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length) await redis.del(...keys)
  },

  key: {
    tenant:   (id: string) => `tenant:${id}`,
    employee: (tenantId: string, empId?: string) =>
      empId ? `emp:${tenantId}:${empId}` : `emp:${tenantId}:*`,
    payslips: (tenantId: string, m: number, y: number) => `payslips:${tenantId}:${m}:${y}`,
    score:    (empId: string) => `score:${empId}`,
    advance:  (tenantId: string) => `advances:${tenantId}`,
  },
}

// ============================================================
//  SEREPRO — Storage client (MinIO → Cloudflare R2 en prod)
//  Compatible S3 API — zero code change au swap
// ============================================================
import {
  S3Client, PutObjectCommand, GetObjectCommand,
  DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuid }   from 'uuid'

const s3 = new S3Client({
  endpoint:        env.storage.endpoint,
  region:          env.storage.region,
  credentials: {
    accessKeyId:     env.storage.key,
    secretAccessKey: env.storage.secret,
  },
  forcePathStyle:  env.storage.forcePathStyle,
})

export const storage = {
  // ── Upload buffer ──────────────────────────────────────────
  async upload(opts: {
    key:         string
    buffer:      Buffer
    mimeType:    string
    tenantId:    string
    metadata?:   Record<string, string>
  }): Promise<{ key: string; size: number; url: string }> {
    const key = opts.key
    await s3.send(new PutObjectCommand({
      Bucket:      env.storage.bucket,
      Key:         key,
      Body:        opts.buffer,
      ContentType: opts.mimeType,
      Metadata:    { tenantId: opts.tenantId, ...opts.metadata },
    }))
    const url = `${env.storage.publicUrl}/${env.storage.bucket}/${key}`
    return { key, size: opts.buffer.length, url }
  },

  // ── URL signée (accès temporaire) ─────────────────────────
  async signedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(s3, new GetObjectCommand({
      Bucket: env.storage.bucket,
      Key:    key,
    }), { expiresIn })
  },

  // ── Supprimer ──────────────────────────────────────────────
  async delete(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: env.storage.bucket, Key: key }))
  },

  // ── Vérifier existence ─────────────────────────────────────
  async exists(key: string): Promise<boolean> {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: env.storage.bucket, Key: key }))
      return true
    } catch { return false }
  },

  // ── Lister dossier ────────────────────────────────────────
  async list(prefix: string): Promise<string[]> {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: env.storage.bucket,
      Prefix: prefix,
    }))
    return (res.Contents ?? []).map(o => o.Key!).filter(Boolean)
  },

  // ── Générer clé de stockage ────────────────────────────────
  buildKey: {
    contract:  (tenantId: string, empId: string) =>
      `${tenantId}/contracts/${empId}/${uuid()}.pdf`,
    payslip:   (tenantId: string, empId: string, m: number, y: number) =>
      `${tenantId}/payslips/${empId}/${y}-${String(m).padStart(2,'0')}.pdf`,
    kyc:       (tenantId: string, empId: string, ext: string) =>
      `${tenantId}/kyc/${empId}/${uuid()}.${ext}`,
    advance:   (tenantId: string, advId: string) =>
      `${tenantId}/advances/${advId}/recu.pdf`,
    export:    (tenantId: string, name: string) =>
      `${tenantId}/exports/${name}-${Date.now()}.pdf`,
  },
}

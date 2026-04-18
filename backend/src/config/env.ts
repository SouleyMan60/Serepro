// ============================================================
//  SEREPRO — Configuration centralisée
// ============================================================
import dotenv from 'dotenv'
import path   from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// ── Validation env ───────────────────────────────────────────
function required(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Variable d'environnement manquante : ${key}`)
  return val
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

export const env = {
  NODE_ENV:    optional('NODE_ENV', 'development'),
  PORT:        parseInt(optional('PORT', '3001')),
  isProd:      optional('NODE_ENV') === 'production',
  isDev:       optional('NODE_ENV') !== 'production',

  app: {
    name:           'SEREPRO',
    url:            optional('APP_URL', 'http://localhost:5173'),
    apiUrl:         optional('API_URL', 'http://localhost:3001'),
    allowedOrigins: optional('ALLOWED_ORIGINS', 'http://localhost:5173').split(','),
  },

  db: {
    url: required('DATABASE_URL'),
  },

  redis: {
    url: optional('REDIS_URL', 'redis://localhost:6379'),
  },

  jwt: {
    secret:        required('JWT_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    expiresIn:     optional('JWT_EXPIRES_IN', '15m'),
    refreshExpiry: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  firebase: {
    projectId:   required('FIREBASE_PROJECT_ID'),
    privateKey:  required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    clientEmail: required('FIREBASE_CLIENT_EMAIL'),
  },

  storage: {
    endpoint:      required('STORAGE_ENDPOINT'),
    publicUrl:     optional('STORAGE_PUBLIC_URL', ''),
    region:        optional('STORAGE_REGION', 'us-east-1'),
    key:           required('STORAGE_KEY'),
    secret:        required('STORAGE_SECRET'),
    bucket:        optional('STORAGE_BUCKET', 'serepro-docs'),
    forcePathStyle: optional('STORAGE_FORCE_PATH_STYLE', 'true') === 'true',
  },

  cinetpay: {
    apiKey:    optional('CINETPAY_APIKEY'),
    siteId:    optional('CINETPAY_SITE_ID'),
    secretKey: optional('CINETPAY_SECRET_KEY'),
    baseUrl:   optional('CINETPAY_BASE_URL', 'https://api-checkout.cinetpay.com/v2'),
    notifyUrl: optional('CINETPAY_NOTIFY_URL', ''),
  },

  twilio: {
    accountSid:    optional('TWILIO_ACCOUNT_SID'),
    authToken:     optional('TWILIO_AUTH_TOKEN'),
    whatsappFrom:  optional('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886'),
  },

  smtp: {
    host: optional('SMTP_HOST'),
    port: parseInt(optional('SMTP_PORT', '587')),
    user: optional('SMTP_USER'),
    pass: optional('SMTP_PASS'),
    from: optional('SMTP_FROM', 'SEREPRO <noreply@serepro.net>'),
  },

  mixpanel: {
    token: optional('MIXPANEL_TOKEN'),
  },

  encryption: {
    key: optional('ENCRYPTION_KEY'),
  },

  limits: {
    maxAdvancePct:  parseFloat(optional('MAX_ADVANCE_PERCENTAGE', '40')) / 100,
    maxFileSizeMB:  parseInt(optional('MAX_FILE_SIZE_MB', '10')),
  },
}

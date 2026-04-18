// ============================================================
//  SEREPRO — Logger Winston
// ============================================================
import winston from 'winston'
import { env }  from './env'

const fmt = winston.format

export const logger = winston.createLogger({
  level: env.isDev ? 'debug' : 'info',
  format: fmt.combine(
    fmt.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    fmt.errors({ stack: true }),
    env.isDev
      ? fmt.combine(fmt.colorize(), fmt.printf(({ timestamp, level, message, ...meta }) =>
          `${timestamp} [${level}] ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`
        ))
      : fmt.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

import pino from 'pino'
import { config } from './config.js'

const isDev = config.NODE_ENV === 'development'

export const logger = pino({
  level: config.LOG_LEVEL,
  base: { service: 'landing-kit-api' },
  redact: {
    paths: ['req.headers.authorization', 'req.headers["x-api-key"]', '*.password', '*.token'],
    censor: '[redacted]',
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss.l' },
      }
    : undefined,
})

import rateLimit from 'express-rate-limit'

/**
 * Límite "burst" para evitar ráfagas: 10 req/min por IP.
 */
export const perMinuteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', scope: 'per_minute' },
})

/**
 * Límite diario para evitar abuso sostenido: 50 req/día por IP.
 */
export const perDayLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', scope: 'per_day' },
})

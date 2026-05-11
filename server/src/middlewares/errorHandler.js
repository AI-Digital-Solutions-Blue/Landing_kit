import { ZodError } from 'zod'
import { logger } from '../logger.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'not_found' })
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'invalid_payload',
      details: err.issues.map((i) => ({ path: i.path, message: i.message })),
    })
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'payload_too_large' })
  }

  logger.error({ err }, 'unhandled error')
  res.status(500).json({ error: 'internal_error' })
}

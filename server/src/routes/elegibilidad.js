import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config.js'
import { logger } from '../logger.js'

const router = Router()

// Acepta NIF/NIE/CIF español de forma laxa; la validación fina la hace
// kd_contract_parser. Aquí sólo descartamos basura.
const NIF_REGEX = /^[A-Z0-9]{8,10}$/i

const bodySchema = z.object({
  nif: z
    .string()
    .trim()
    .min(8)
    .max(10)
    .regex(NIF_REGEX, 'NIF/NIE/CIF con formato inválido'),
  bono: z.string().trim().min(1).max(64),
  categoria: z.string().trim().regex(/^\d{2}$/, 'categoria debe ser dos dígitos'),
})

router.post('/', async (req, res, next) => {
  let payload
  try {
    payload = bodySchema.parse(req.body)
  } catch (err) {
    return next(err)
  }

  const upstreamUrl = `${config.KD_BASE_URL.replace(/\/+$/, '')}/elegibilidad`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.KD_TIMEOUT_MS)

  const startedAt = Date.now()
  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.KD_API_KEY,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        nif: payload.nif.toUpperCase(),
        bono: payload.bono,
        categoria: payload.categoria,
      }),
      signal: controller.signal,
    })

    const tookMs = Date.now() - startedAt
    const contentType = upstream.headers.get('content-type') ?? ''
    const data = contentType.includes('application/json')
      ? await upstream.json().catch(() => null)
      : null

    if (!upstream.ok) {
      logger.warn(
        { status: upstream.status, tookMs, nif: payload.nif },
        'upstream non-200',
      )
      return res.status(502).json({ error: 'upstream_error', status: upstream.status })
    }

    logger.info(
      { tookMs, nif: payload.nif, eligible: Boolean(data?.eligible) },
      'eligibility check ok',
    )

    return res.json({
      eligible: Boolean(data?.eligible),
      message: typeof data?.message === 'string' ? data.message : '',
      details: data?.details ?? null,
    })
  } catch (err) {
    const tookMs = Date.now() - startedAt
    if (err?.name === 'AbortError') {
      logger.warn({ tookMs, nif: payload.nif }, 'upstream timeout')
      return res.status(504).json({ error: 'upstream_timeout' })
    }
    logger.error({ err, tookMs }, 'upstream fetch failed')
    return res.status(502).json({ error: 'upstream_unreachable' })
  } finally {
    clearTimeout(timeoutId)
  }
})

export default router

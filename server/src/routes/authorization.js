import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config.js'
import { logger } from '../logger.js'

const router = Router()

const NIF_REGEX = /^[A-Z0-9]{8,10}$/i
const PHONE_REGEX = /^\+?\d{9,15}$/
const POSTAL_CODE_REGEX = /^\d{5}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const optionalTrimmed = z
  .string()
  .trim()
  .max(255)
  .optional()
  .transform((value) => (value === '' || value === undefined ? undefined : value))

const bodySchema = z.object({
  business_name: z.string().trim().min(1).max(255),
  tax_id: z.string().trim().min(8).max(10).regex(NIF_REGEX, 'tax_id con formato inválido'),
  applicant: z.enum(['PYME', 'Autonomo']),
  phone: z.string().trim().regex(PHONE_REGEX, 'phone con formato inválido'),
  email: z.string().trim().regex(EMAIL_REGEX, 'email con formato inválido').max(255),
  address: z.string().trim().min(3).max(255),
  postalCode: z.string().trim().regex(POSTAL_CODE_REGEX, 'postalCode debe ser 5 dígitos'),
  city: z.string().trim().min(2).max(120),
  province: z.string().trim().min(2).max(120),
  name: optionalTrimmed,
  firstSurname: optionalTrimmed,
  secondSurname: optionalTrimmed,
  grantorTaxId: optionalTrimmed,
  record: optionalTrimmed,
  notes: z.string().trim().max(2000).optional().transform((v) => (v === '' || v === undefined ? undefined : v)),
  employees: z.union([z.literal(1), z.literal(3), z.literal(10)]).optional(),
})

router.post('/', async (req, res, next) => {
  let payload
  try {
    payload = bodySchema.parse(req.body)
  } catch (err) {
    return next(err)
  }

  const xilonPayload = {
    business_name: payload.business_name,
    phone: payload.phone,
    email: payload.email,
    tax_id: payload.tax_id.toUpperCase(),
    applicant: payload.applicant,
    group: config.XILON_DEFAULT_GROUP,
    user: config.XILON_DEFAULT_USER,
    city: payload.city,
    address: payload.address,
    province: payload.province,
    postalCode: payload.postalCode,
  }

  if (payload.employees !== undefined) xilonPayload.employees = payload.employees
  if (payload.name) xilonPayload.name = payload.name
  if (payload.firstSurname) xilonPayload.firstSurname = payload.firstSurname
  if (payload.secondSurname) xilonPayload.secondSurname = payload.secondSurname
  if (payload.grantorTaxId) xilonPayload.grantorTaxId = payload.grantorTaxId.toUpperCase()
  if (payload.record) xilonPayload.record = payload.record
  if (payload.notes) xilonPayload.notes = payload.notes

  const upstreamUrl = `${config.XILON_API_URL.replace(/\/+$/, '')}/kd/authorization/`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.XILON_TIMEOUT_MS)

  const startedAt = Date.now()
  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${config.XILON_AUTH_TOKEN}`,
      },
      body: JSON.stringify(xilonPayload),
      signal: controller.signal,
    })

    const tookMs = Date.now() - startedAt
    const contentType = upstream.headers.get('content-type') ?? ''
    const data = contentType.includes('application/json')
      ? await upstream.json().catch(() => null)
      : await upstream.text().catch(() => null)

    if (!upstream.ok) {
      logger.warn(
        {
          status: upstream.status,
          tookMs,
          tax_id: payload.tax_id,
          upstream_body: typeof data === 'string' ? data.slice(0, 500) : data,
        },
        'xilon authorization non-2xx',
      )
      const code = upstream.status === 401 || upstream.status === 403 ? 'auth_error' : 'upstream_error'
      const message =
        upstream.status === 422
          ? 'Datos rechazados por el sistema. Revisa los campos e inténtalo de nuevo.'
          : 'No se ha podido enviar la solicitud. Inténtalo en unos minutos.'
      return res.status(502).json({
        ok: false,
        code,
        message,
        upstream_status: upstream.status,
      })
    }

    logger.info(
      { tookMs, tax_id: payload.tax_id, applicant: payload.applicant },
      'xilon authorization ok',
    )

    return res.json({
      ok: true,
      message: 'Solicitud enviada correctamente.',
      data: data ?? null,
    })
  } catch (err) {
    const tookMs = Date.now() - startedAt
    if (err?.name === 'AbortError') {
      logger.warn({ tookMs, tax_id: payload.tax_id }, 'xilon authorization timeout')
      return res.status(504).json({
        ok: false,
        code: 'upstream_timeout',
        message: 'La solicitud tardó demasiado. Inténtalo en unos minutos.',
      })
    }
    logger.error({ err, tookMs }, 'xilon authorization fetch failed')
    return res.status(502).json({
      ok: false,
      code: 'upstream_unreachable',
      message: 'Servicio temporalmente no disponible. Inténtalo en unos minutos.',
    })
  } finally {
    clearTimeout(timeoutId)
  }
})

export default router

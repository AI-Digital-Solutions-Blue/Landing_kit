import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config.js'
import { logger } from '../logger.js'
import { getQueue, initiateCall, listUsers } from '../services/voipstudio.js'

const router = Router()

const E164_REGEX = /^[1-9]\d{7,14}$/

const bodySchema = z.object({
  phone: z.string().trim().min(1, 'phone es obligatorio'),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : null)),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'consent debe ser true' }),
  }),
})

function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  return /^\d{9}$/.test(digits) ? `34${digits}` : digits
}

function shuffle(arr) {
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

router.post('/', async (req, res) => {
  let payload
  try {
    payload = bodySchema.parse(req.body ?? {})
  } catch (err) {
    if (err?.issues?.some((i) => i.path?.[0] === 'consent')) {
      return res.status(400).json({
        ok: false,
        code: 'consent_required',
        message: 'Debes aceptar el consentimiento.',
      })
    }
    return res.status(400).json({
      ok: false,
      code: 'invalid_payload',
      message: 'Datos del formulario inválidos.',
      details: err?.issues ?? null,
    })
  }

  const normalized = normalizePhone(payload.phone)
  if (!E164_REGEX.test(normalized)) {
    return res.status(400).json({
      ok: false,
      code: 'invalid_phone',
      message: 'El número de teléfono no es válido.',
    })
  }

  const queueId = config.VOIP_QUEUE_ID
  const fallbackAgent = config.VOIP_DEFAULT_AGENT_ID
  const maxAttempts = config.VOIP_QUEUE_MAX_ATTEMPTS
  const ip = req.ip

  let candidates
  try {
    if (queueId) {
      const [queue, users] = await Promise.all([getQueue(queueId), listUsers()])
      const memberIds = new Set((queue?.users ?? []).map(String))
      const eligible = users
        .filter(
          (u) =>
            memberIds.has(String(u.id)) &&
            u.active &&
            !u.dnd &&
            (u.nb_sip_locations ?? 0) > 0,
        )
        .map((u) => String(u.id))

      if (eligible.length === 0) {
        logger.warn(
          { ip, queue_id: queueId, queue_members: memberIds.size },
          'click-to-call: queue_empty',
        )
        return res.status(503).json({
          ok: false,
          code: 'agent_unavailable',
          message:
            'Nuestros agentes no están disponibles ahora mismo. Vuelve a intentarlo en unos minutos.',
        })
      }
      candidates = shuffle(eligible).slice(0, maxAttempts)
    } else if (fallbackAgent) {
      candidates = [String(fallbackAgent)]
    } else {
      logger.error({ ip }, 'click-to-call: config_error (no queue and no fallback agent)')
      return res.status(500).json({
        ok: false,
        code: 'config_error',
        message: 'Error de configuración del servicio.',
      })
    }
  } catch (err) {
    logger.error({ err: String(err?.message ?? err) }, 'click-to-call: queue_fetch_error')
    return res.status(502).json({
      ok: false,
      code: 'voip_error',
      message: 'Servicio temporalmente no disponible.',
    })
  }

  const attempts = []
  for (const agentId of candidates) {
    try {
      const { status, body } = await initiateCall({ to: normalized, from: agentId })
      attempts.push({ agent_id: agentId, status })

      if (status === 201) {
        const callId = body?.data?.id ?? null
        logger.info(
          {
            ip,
            phone: normalized,
            name: payload.name,
            queue_id: queueId ?? null,
            agent_id: agentId,
            attempts,
            call_id: callId,
          },
          'click-to-call: call_created',
        )
        return res.json({
          ok: true,
          code: 'ok',
          message: 'Te llamamos en unos segundos.',
          call_id: callId,
        })
      }

      if (status !== 412) {
        logger.warn(
          { ip, phone: normalized, queue_id: queueId ?? null, attempts, status, body },
          'click-to-call: voip_error',
        )
        return res.status(502).json({
          ok: false,
          code: 'voip_error',
          message: 'Servicio temporalmente no disponible.',
        })
      }
    } catch (err) {
      logger.error(
        { ip, phone: normalized, attempts, err: String(err?.message ?? err) },
        'click-to-call: exception',
      )
      return res.status(502).json({
        ok: false,
        code: 'voip_error',
        message: 'Servicio temporalmente no disponible.',
      })
    }
  }

  logger.warn(
    { ip, phone: normalized, queue_id: queueId ?? null, attempts },
    'click-to-call: agent_unavailable',
  )
  return res.status(503).json({
    ok: false,
    code: 'agent_unavailable',
    message:
      'Nuestros agentes no están disponibles ahora mismo. Vuelve a intentarlo en unos minutos.',
  })
})

export default router

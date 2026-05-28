import express from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initiateCall as defaultInitiateCall, getQueue as defaultGetQueue, listUsers as defaultListUsers } from './voipstudio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'calls.log');

// E.164 sin "+": entre 8 y 15 dígitos, no empieza por 0
const E164_REGEX = /^[1-9]\d{7,14}$/;

// Normaliza un teléfono a E.164 sin "+". Si son 9 dígitos limpios, asume España y prepende 34.
function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return /^\d{9}$/.test(digits) ? `34${digits}` : digits;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function appendLog(entry) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
}

const WEEKDAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
const MORNING_START_MIN = 9 * 60;
const MORNING_END_MIN = 16 * 60;
const AFTERNOON_END_MIN = 18 * 60;

function selectQueueForNow(date = new Date()) {
  const tz = process.env.BUSINESS_TIMEZONE || 'Europe/Madrid';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = get('weekday');
  const hour = Number.parseInt(get('hour'), 10) || 0;
  const minute = Number.parseInt(get('minute'), 10) || 0;
  const totalMin = hour * 60 + minute;
  const legacy = process.env.VOIP_QUEUE_ID || null;

  if (!WEEKDAYS.has(weekday)) {
    return { queueId: null, mode: 'closed_weekend', isOpen: false };
  }
  if (totalMin >= MORNING_START_MIN && totalMin < MORNING_END_MIN) {
    return { queueId: process.env.VOIP_QUEUE_ID_MORNING || legacy, mode: 'morning', isOpen: true };
  }
  if (totalMin >= MORNING_END_MIN && totalMin < AFTERNOON_END_MIN) {
    return { queueId: process.env.VOIP_QUEUE_ID_AFTERNOON || legacy, mode: 'afternoon', isOpen: true };
  }
  return { queueId: null, mode: 'closed_off_hours', isOpen: false };
}

export function createApp({ initiateCall = defaultInitiateCall, getQueue = defaultGetQueue, listUsers = defaultListUsers } = {}) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // Rate limit configurable por env. RATE_LIMIT_MAX=0 lo desactiva (útil en local).
  const rateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? 3);
  const middlewares = rateLimitMax > 0
    ? [rateLimit({
        windowMs: 10 * 60 * 1000,
        limit: rateLimitMax,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
          ok: false,
          code: 'rate_limited',
          message: 'Has hecho demasiados intentos. Vuelve a intentarlo en unos minutos.',
        },
      })]
    : [];

  app.post('/api/click-to-call', ...middlewares, async (req, res) => {
    const {
      phone,
      name,
      consent,
      scheduled_slot_iso: scheduledSlotIso = null,
      scheduled_slot_label: scheduledSlotLabel = null,
      scheduled_slot_time: scheduledSlotTime = null,
    } = req.body ?? {};
    const normalized = normalizePhone(phone);

    if (!consent) {
      return res.status(400).json({ ok: false, code: 'consent_required', message: 'Debes aceptar el consentimiento.' });
    }
    if (!E164_REGEX.test(normalized)) {
      return res.status(400).json({ ok: false, code: 'invalid_phone', message: 'El número de teléfono no es válido.' });
    }

    if (!process.env.VOIP_STUDIO_API_KEY) {
      appendLog({ event: 'config_error', reason: 'missing VOIP_STUDIO_API_KEY' });
      return res.status(500).json({ ok: false, code: 'config_error', message: 'Error de configuración del servicio.' });
    }

    const ip = req.ip;
    const routing = selectQueueForNow(new Date());
    appendLog({
      event: 'routing_selected',
      ip,
      mode: routing.mode,
      queue_id: routing.queueId,
      is_open: routing.isOpen,
      scheduled_slot_label: scheduledSlotLabel,
      scheduled_slot_time: scheduledSlotTime,
    });

    if (!routing.isOpen) {
      appendLog({
        event: 'scheduled_off_hours',
        ip,
        phone: normalized,
        name: name ?? null,
        mode: routing.mode,
        scheduled_slot_iso: scheduledSlotIso,
        scheduled_slot_label: scheduledSlotLabel,
        scheduled_slot_time: scheduledSlotTime,
      });
      return res.json({
        ok: true,
        code: 'scheduled',
        message: scheduledSlotLabel
          ? `Perfecto, te llamaremos el ${String(scheduledSlotLabel).toLowerCase()}.`
          : 'Hemos registrado tu solicitud. Te llamaremos en horario laboral.',
        scheduled_slot_iso: scheduledSlotIso,
        scheduled_slot_label: scheduledSlotLabel,
        scheduled_slot_time: scheduledSlotTime,
      });
    }

    const queueId = routing.queueId;
    const fallbackAgent = process.env.VOIP_DEFAULT_AGENT_ID || process.env.VOIP_USER_ID;
    const maxAttempts = Number(process.env.VOIP_QUEUE_MAX_ATTEMPTS ?? 3);

    let candidates;
    try {
      if (queueId) {
        const [queue, users] = await Promise.all([getQueue(queueId), listUsers()]);
        const memberIds = new Set((queue?.users ?? []).map(String));
        // Solo consideramos miembros activos, no en DnD, y con al menos un SIP location
        // configurado. nb_sip>0 NO garantiza online ahora mismo, pero descarta los
        // obvios "sin softphone".
        const eligible = users
          .filter((u) => memberIds.has(String(u.id))
            && u.active
            && !u.dnd
            && (u.nb_sip_locations ?? 0) > 0)
          .map((u) => String(u.id));
        if (eligible.length === 0) {
          appendLog({ event: 'queue_empty', ip, queue_id: queueId, queue_members: memberIds.size });
          return res.status(503).json({ ok: false, code: 'agent_unavailable', message: 'Nuestros agentes no están disponibles ahora mismo. Vuelve a intentarlo en unos minutos.' });
        }
        candidates = shuffle(eligible).slice(0, maxAttempts);
      } else if (fallbackAgent) {
        candidates = [String(fallbackAgent)];
      } else {
        appendLog({ event: 'config_error', reason: 'no queue and no fallback agent' });
        return res.status(500).json({ ok: false, code: 'config_error', message: 'Error de configuración del servicio.' });
      }
    } catch (err) {
      appendLog({ event: 'queue_fetch_error', error: String(err?.message ?? err) });
      return res.status(502).json({ ok: false, code: 'voip_error', message: 'Servicio temporalmente no disponible.' });
    }

    const attempts = [];
    for (const agentId of candidates) {
      try {
        const { status, body } = await initiateCall({ to: normalized, from: agentId });
        attempts.push({ agent_id: agentId, status });

        if (status === 201) {
          const callId = body?.data?.id ?? null;
          appendLog({
            event: 'call_created',
            ip,
            phone: normalized,
            name: name ?? null,
            queue_id: queueId ?? null,
            queue_mode: routing.mode,
            agent_id: agentId,
            attempts,
            call_id: callId,
            scheduled_slot_iso: scheduledSlotIso,
            scheduled_slot_label: scheduledSlotLabel,
            scheduled_slot_time: scheduledSlotTime,
          });
          return res.json({ ok: true, code: 'ok', message: 'Te llamamos en unos segundos.', call_id: callId });
        }
        // 412 = ese agente sin softphone activo → probamos el siguiente.
        // Cualquier otro status = error no recuperable, salimos del loop.
        if (status !== 412) {
          appendLog({ event: 'voip_error', ip, phone: normalized, queue_id: queueId ?? null, attempts, status, body });
          return res.status(502).json({ ok: false, code: 'voip_error', message: 'Servicio temporalmente no disponible.' });
        }
      } catch (err) {
        appendLog({ event: 'exception', ip, phone: normalized, attempts, error: String(err?.message ?? err) });
        return res.status(502).json({ ok: false, code: 'voip_error', message: 'Servicio temporalmente no disponible.' });
      }
    }

    // Todos los candidatos devolvieron 412 → nadie online ahora mismo.
    appendLog({ event: 'agent_unavailable', ip, phone: normalized, queue_id: queueId ?? null, attempts });
    return res.status(503).json({
      ok: false,
      code: 'agent_unavailable',
      message: 'Nuestros agentes no están disponibles ahora mismo. Vuelve a intentarlo en unos minutos.',
    });
  });

  return app;
}

const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntrypoint) {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`PoC click-to-call escuchando en http://localhost:${port}`);
  });
}

/** Webhook Make.com (scenario) para leads del formulario largo */
export const LEAD_WEBHOOK_URL = 'https://hook.eu2.make.com/os2z95prtq3bkq5u6k4idc7m92r3v30j'

/**
 * Base URL del backend propio (proxy hacia kd_contract_parser y VoIPstudio).
 * En dev se apunta al server local; en prod se sobreescribe con VITE_API_BASE.
 */
const API_BASE = (
  import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5001'
).replace(/\/+$/, '')

/** Endpoint backend para solicitudes de callback click-to-call (VoIPstudio) */
export const CALLBACK_REQUEST_URL = `${API_BASE}/click-to-call`

/** Endpoint backend para consulta de elegibilidad (kd_contract_parser) */
export const ELIGIBILIDAD_URL = `${API_BASE}/elegibilidad`

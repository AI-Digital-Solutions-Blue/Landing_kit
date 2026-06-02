import { useCallback, useState } from 'react'
import { ACTIVATION_SHEET_WEBHOOK_URL, AUTHORIZATION_URL } from '../config/leadWebhook'

const REQUEST_TIMEOUT_MS = 20000

const FALLBACK_BY_CODE = {
  upstream_timeout: 'La solicitud tardó demasiado. Inténtalo en unos minutos.',
  upstream_unreachable: 'Servicio temporalmente no disponible. Inténtalo en unos minutos.',
  upstream_error: 'No se ha podido enviar la solicitud. Inténtalo en unos minutos.',
  auth_error: 'Servicio no disponible temporalmente. Estamos solucionándolo.',
  validation_error: 'Revisa los datos del formulario.',
}

/**
 * Hook para enviar la activación del bono al backend Node,
 * que reenvía el POST a Xilon (/kd/authorization/).
 *
 * Estados:
 *   idle    -> aun sin enviar
 *   loading -> peticion en curso
 *   success -> respuesta ok del backend
 *   error   -> error de red, validacion, o upstream
 */
export function useXilonAuthorization() {
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [errorCode, setErrorCode] = useState('')

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage('')
    setErrorCode('')
  }, [])

  const submit = useCallback(async (payload) => {
    setStatus('loading')
    setErrorMessage('')
    setErrorCode('')

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    // Fire-and-forget: registrar la activación en el sheet vía Make antes del
    // POST al backend. No bloqueamos la activación si Make falla.
    try {
      fetch(ACTIVATION_SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // ignorar
    }

    try {
      const res = await fetch(AUTHORIZATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      const contentType = res.headers.get('content-type') || ''
      const body = contentType.includes('application/json')
        ? await res.json().catch(() => null)
        : null

      if (!res.ok || body?.ok === false) {
        const code = typeof body?.code === 'string' ? body.code : `http_${res.status}`
        const message =
          (typeof body?.message === 'string' && body.message) ||
          FALLBACK_BY_CODE[code] ||
          `El servidor respondió ${res.status}. Inténtalo de nuevo más tarde.`
        setStatus('error')
        setErrorCode(code)
        setErrorMessage(message)
        return null
      }

      setStatus('success')
      return body
    } catch (err) {
      const isAbort = err?.name === 'AbortError'
      setStatus('error')
      setErrorCode(isAbort ? 'timeout' : 'network_error')
      setErrorMessage(
        isAbort
          ? 'La solicitud tardó demasiado. Vuelve a intentarlo en unos segundos.'
          : 'No se ha podido conectar. Comprueba tu conexión e inténtalo de nuevo.',
      )
      return null
    } finally {
      window.clearTimeout(timeoutId)
    }
  }, [])

  return { status, errorMessage, errorCode, submit, reset }
}

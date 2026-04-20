import { useCallback, useState } from 'react'
import { LEAD_WEBHOOK_URL } from '../config/leadWebhook'

/**
 * Envío POST JSON al webhook. Éxito solo si la respuesta HTTP es exactamente 200.
 */
export function useLeadFormSubmit() {
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const submitForm = useCallback(async (form) => {
    if (!(form instanceof HTMLFormElement)) return
    setStatus('loading')
    setErrorMessage('')

    const data = Object.fromEntries(new FormData(form).entries())
    const payload = {
      ...data,
      source: 'landing-kit',
      submittedAt: new Date().toISOString(),
    }

    try {
      const res = await fetch(LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status !== 200) {
        throw new Error(`El servidor respondió ${res.status}. Inténtelo de nuevo más tarde.`)
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof TypeError && err.message.includes('fetch')
          ? 'No se ha podido enviar. Compruebe su conexión e inténtelo de nuevo.'
          : err instanceof Error
            ? err.message
            : 'Ha ocurrido un error. Inténtelo de nuevo.',
      )
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage('')
  }, [])

  return { status, errorMessage, submitForm, reset }
}

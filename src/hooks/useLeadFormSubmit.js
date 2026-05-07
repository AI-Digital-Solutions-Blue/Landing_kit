import { useCallback, useState } from 'react'
import { LEAD_WEBHOOK_URL } from '../config/leadWebhook'

const DAILY_SUBMIT_LIMIT = 3

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

function normalizePhone(value) {
  return String(value ?? '').replace(/\D/g, '')
}

async function getPublicIp() {
  if (typeof window === 'undefined') return ''
  try {
    const res = await withTimeout(fetch('https://api.ipify.org?format=json'), 1800)
    if (!res.ok) return ''
    const data = await res.json()
    return typeof data?.ip === 'string' ? data.ip : ''
  } catch {
    return ''
  }
}

function getClientMetadata(form) {
  if (typeof window === 'undefined') return {}
  const now = Date.now()
  const startedAtRaw = form?.dataset?.startedAt
  const startedAt = Number(startedAtRaw)
  const submitTimeMs = Number.isFinite(startedAt) && startedAt > 0 ? Math.max(0, now - startedAt) : null

  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    userAgent: navigator.userAgent || '',
    screen: `${window.screen.width}x${window.screen.height}`,
    pagePath: `${window.location.pathname}${window.location.hash || ''}`,
    submitTimeMs,
  }
}

function getLocalDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDailyLimitStorageKey() {
  if (typeof window === 'undefined') return ''
  return `lead-submit-count:${getLocalDateKey()}`
}

function getDailySubmitCount() {
  if (typeof window === 'undefined') return 0
  try {
    const key = getDailyLimitStorageKey()
    if (!key) return 0
    const raw = window.localStorage.getItem(key)
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  } catch {
    return 0
  }
}

function incrementDailySubmitCount() {
  if (typeof window === 'undefined') return
  try {
    const key = getDailyLimitStorageKey()
    if (!key) return
    const nextCount = getDailySubmitCount() + 1
    window.localStorage.setItem(key, String(nextCount))
  } catch {
    // Si localStorage no está disponible, no bloqueamos el envío.
  }
}

export function useLeadFormSubmit({ endpoint = LEAD_WEBHOOK_URL, mode = 'lead' } = {}) {
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const submitForm = useCallback(async (form) => {
    if (!(form instanceof HTMLFormElement)) return
    const dailySubmitCount = getDailySubmitCount()
    if (dailySubmitCount >= DAILY_SUBMIT_LIMIT) {
      setStatus('error')
      setErrorMessage('Has alcanzado el límite diario de envíos. Inténtalo de nuevo mañana.')
      return
    }

    setStatus('loading')
    setErrorMessage('')
    setSuccessMessage('')

    let payload = {}
    if (mode === 'callback') {
      const formData = new FormData(form)
      const name = String(formData.get('nombre') ?? '').trim()
      const phone = normalizePhone(formData.get('telefono'))
      if (!name || !phone) {
        setStatus('error')
        setErrorMessage('Faltan datos requeridos para enviar la solicitud.')
        return
      }
      payload = { name, phone }
    } else {
      const data = Object.fromEntries(new FormData(form).entries())
      const [publicIp, clientMeta] = await Promise.all([getPublicIp(), Promise.resolve(getClientMetadata(form))])
      payload = {
        ...data,
        source: 'landing-kit',
        submittedAt: new Date().toISOString(),
        ip_public: publicIp,
        meta: {
          ...clientMeta,
          ipPublic: publicIp,
        },
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      let backendMessage = ''
      if (mode === 'callback') {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const body = await res.json().catch(() => null)
          backendMessage = typeof body?.message === 'string' ? body.message.trim() : ''
        } else {
          const text = await res.text().catch(() => '')
          backendMessage = String(text || '').trim()
        }
      }

      if (res.status !== 200) {
        throw new Error(backendMessage || `El servidor respondió ${res.status}. Inténtelo de nuevo más tarde.`)
      }

      incrementDailySubmitCount()
      if (mode === 'callback' && backendMessage) {
        setSuccessMessage(backendMessage)
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
  }, [endpoint, mode])

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage('')
    setSuccessMessage('')
  }, [])

  return { status, errorMessage, successMessage, submitForm, reset }
}

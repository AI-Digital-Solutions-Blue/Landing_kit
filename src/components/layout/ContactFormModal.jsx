import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLeadFormSubmit } from '../../hooks/useLeadFormSubmit'
import { CALLBACK_REQUEST_URL } from '../../config/leadWebhook'
import { useContactModal } from '../../context/ContactModalContext'
import './ContactFormModal.css'

function isValidPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length >= 7
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatHHMM(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function isWeekday(date) {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function addDays(date, n) {
  const r = new Date(date)
  r.setDate(r.getDate() + n)
  return r
}

function startOfDay(date) {
  const r = new Date(date)
  r.setHours(0, 0, 0, 0)
  return r
}

function withTime(date, h, m) {
  const r = new Date(date)
  r.setHours(h, m, 0, 0)
  return r
}

function nextWorkingDay(date) {
  let r = startOfDay(date)
  do {
    r = addDays(r, 1)
  } while (!isWeekday(r))
  return r
}

function roundUpToNextHalfHour(date, leadMinutes = 30) {
  const r = new Date(date.getTime() + leadMinutes * 60 * 1000)
  r.setSeconds(0, 0)
  const m = r.getMinutes()
  if (m === 0 || m === 30) {
    return r
  }
  if (m < 30) {
    r.setMinutes(30)
  } else {
    r.setHours(r.getHours() + 1, 0)
  }
  return r
}

function capitalize(s) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const NEXT_DAY_SLOTS = [
  [9, 0],
  [11, 30],
  [16, 0],
]

function dayLabelFor(date, now) {
  if (isSameDay(date, now)) return 'Hoy'
  if (isSameDay(date, addDays(now, 1))) return 'Mañana'
  const weekday = date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
  return capitalize(weekday)
}

function computeCallSlots(now = new Date(), { skipToday = false } = {}) {
  const slots = []
  const todayLastSlot = withTime(now, 17, 30)
  const todayFirstSlot = withTime(now, 9, 0)

  if (!skipToday && isWeekday(now)) {
    let candidate = roundUpToNextHalfHour(now)
    if (candidate < todayFirstSlot) candidate = todayFirstSlot
    while (slots.length < 4 && candidate <= todayLastSlot) {
      slots.push({
        label: `Hoy ${formatHHMM(candidate)}`,
        datetime: candidate.toISOString(),
      })
      candidate = new Date(candidate.getTime() + 30 * 60 * 1000)
    }
  }

  if (slots.length < 4) {
    let cursor = nextWorkingDay(now)
    while (slots.length < 4) {
      for (const [h, m] of NEXT_DAY_SLOTS) {
        if (slots.length >= 4) break
        const d = withTime(cursor, h, m)
        slots.push({
          label: `${dayLabelFor(d, now)} ${formatHHMM(d)}`,
          datetime: d.toISOString(),
        })
      }
      cursor = nextWorkingDay(cursor)
    }
  }

  return slots.slice(0, 4)
}

function getForcedAgentMode() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const force = (params.get('force') || params.get('agent') || '').toLowerCase()
  if (['open', 'available', 'on', 'abierto'].includes(force)) return 'open'
  if (['closed', 'offline', 'off', 'cerrado'].includes(force)) return 'closed'
  return null
}

function getAgentStatus(now = new Date()) {
  const forced = getForcedAgentMode()
  if (forced === 'open') {
    return { isOpen: true, text: 'Disponible · te llamamos en breve', forced: true }
  }
  if (forced === 'closed') {
    return { isOpen: false, text: 'Cerrado · te llamamos mañana', forced: true }
  }
  if (!isWeekday(now)) {
    return { isOpen: false, text: 'Cerrado · te llamamos el lunes', forced: false }
  }
  const startMin = 9 * 60
  const endMin = 18 * 60
  const cur = now.getHours() * 60 + now.getMinutes()
  if (cur >= startMin && cur < endMin) {
    return { isOpen: true, text: 'Disponible · te llamamos en breve', forced: false }
  }
  return { isOpen: false, text: 'Cerrado · te llamamos mañana', forced: false }
}

export function ContactFormModal() {
  const { isOpen, closeModal } = useContactModal()
  const { status, successMessage, submitForm } = useLeadFormSubmit({
    endpoint: CALLBACK_REQUEST_URL,
    mode: 'callback',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [nombreValue, setNombreValue] = useState('')
  const [telefonoValue, setTelefonoValue] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [selectedSlotIso, setSelectedSlotIso] = useState(null)

  const isFormReady =
    consentChecked &&
    nombreValue.trim().length > 0 &&
    isValidPhone(telefonoValue)

  useEffect(() => {
    if (!isOpen) return undefined
    setNow(new Date())
    setConsentChecked(false)
    setNombreValue('')
    setTelefonoValue('')
    setFieldErrors({})
    setHasSubmittedOnce(false)
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [isOpen])

  const agentStatus = useMemo(() => getAgentStatus(now), [now])
  const showSlots = !agentStatus.isOpen
  const slots = useMemo(
    () =>
      showSlots
        ? computeCallSlots(now, { skipToday: agentStatus.forced && !agentStatus.isOpen })
        : [],
    [now, showSlots, agentStatus.forced, agentStatus.isOpen],
  )

  useEffect(() => {
    if (!showSlots) {
      if (selectedSlotIso !== null) setSelectedSlotIso(null)
      return
    }
    if (!selectedSlotIso && slots.length > 0) {
      setSelectedSlotIso(slots[0].datetime)
    }
    if (selectedSlotIso && !slots.some((s) => s.datetime === selectedSlotIso)) {
      setSelectedSlotIso(slots[0]?.datetime ?? null)
    }
  }, [slots, selectedSlotIso, showSlots])

  const selectedSlot = showSlots
    ? slots.find((s) => s.datetime === selectedSlotIso) ?? slots[0]
    : null

  const markFormStarted = (form) => {
    if (!form?.dataset?.startedAt) {
      form.dataset.startedAt = String(Date.now())
    }
  }

  const handleValidateOnEdit = (e) => {
    const form = e.currentTarget
    markFormStarted(form)
    if (!hasSubmittedOnce) return
    const nombre = String(form.elements.namedItem('nombre')?.value ?? '').trim()
    const telefono = String(form.elements.namedItem('telefono')?.value ?? '').trim()
    const consent = Boolean(form.elements.namedItem('consent')?.checked)
    const nextErrors = {}
    if (!nombre) nextErrors.nombre = 'Introduce tu nombre.'
    if (!telefono) nextErrors.telefono = 'Introduce tu número de teléfono.'
    else if (!isValidPhone(telefono)) nextErrors.telefono = 'Introduce un teléfono válido.'
    if (!consent) nextErrors.consent = 'Debes aceptar para que te llamemos.'
    setFieldErrors(nextErrors)
  }

  return createPortal(
    <div
      className={`contact-modal__panel${isOpen ? ' contact-modal__panel--open' : ''}`}
      role="complementary"
      aria-labelledby="contact-modal-title"
    >
      <header className="contact-modal__header">
        <div className="contact-modal__agent">
          <span className="contact-modal__avatar" aria-hidden="true">
            <img
              src="/FaviconSiweb.svg"
              alt=""
              width={22}
              height={22}
              loading="eager"
              decoding="async"
            />
          </span>
          <div className="contact-modal__agent-info">
            <p id="contact-modal-title" className="contact-modal__agent-name">
              Siweb
            </p>
            <p className="contact-modal__agent-status">
              <span
                className={`contact-modal__status-dot${agentStatus.isOpen ? ' contact-modal__status-dot--open' : ''}`}
                aria-hidden="true"
              />
              {agentStatus.text}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="contact-modal__close"
          onClick={closeModal}
          aria-label="Cerrar"
        >
          ×
        </button>
      </header>

      <div className="contact-modal__content">
        <form
          id="lead_kit_canarias_form"
          name="lead_kit_canarias_form"
          className="contact-modal__callback"
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            markFormStarted(form)
            const nombre = String(form.elements.namedItem('nombre')?.value ?? '').trim()
            const telefono = String(form.elements.namedItem('telefono')?.value ?? '').trim()
            const consent = Boolean(form.elements.namedItem('consent')?.checked)
            const errors = {}
            if (!nombre) errors.nombre = 'Introduce tu nombre.'
            if (!telefono) errors.telefono = 'Introduce tu número de teléfono.'
            else if (!isValidPhone(telefono)) errors.telefono = 'Introduce un teléfono válido.'
            if (!consent) errors.consent = 'Debes aceptar para que te llamemos.'

            setHasSubmittedOnce(true)
            setFieldErrors(errors)
            if (Object.keys(errors).length > 0) {
              if (errors.nombre) form.elements.namedItem('nombre')?.focus?.()
              else if (errors.telefono) form.elements.namedItem('telefono')?.focus?.()
              else if (errors.consent) form.elements.namedItem('consent')?.focus?.()
              return
            }
            submitForm(form)
          }}
          noValidate
          onInput={handleValidateOnEdit}
          onChange={handleValidateOnEdit}
        >
          {status === 'success' || status === 'error' ? (
            <p className="contact-modal__success" role="status" aria-live="polite">
              {status === 'success' && successMessage
                ? successMessage
                : selectedSlot
                  ? `Perfecto, te llamaremos el ${selectedSlot.label.toLowerCase()}.`
                  : 'Perfecto, hemos recibido tus datos y te llamamos en breve.'}
            </p>
          ) : (
            <>
              <p className="contact-modal__callback-title">
                {showSlots ? '¿CUÁNDO TE LLAMAMOS?' : 'NOSOTROS TE LLAMAMOS'}
              </p>

              {showSlots ? (
                <>
                  <div className="contact-modal__slots" role="radiogroup" aria-label="Elige un horario">
                    {slots.map((slot) => {
                      const isSelected = slot.datetime === selectedSlotIso
                      return (
                        <button
                          key={slot.datetime}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={`contact-modal__slot${isSelected ? ' contact-modal__slot--selected' : ''}`}
                          onClick={() => setSelectedSlotIso(slot.datetime)}
                        >
                          {slot.label}
                        </button>
                      )
                    })}
                  </div>

                  <input type="hidden" name="slot_iso" value={selectedSlot?.datetime ?? ''} />
                  <input type="hidden" name="slot_label" value={selectedSlot?.label ?? ''} />
                </>
              ) : null}

              <label className="contact-modal__sr-only" htmlFor="contact-modal-nombre">
                Tu nombre
              </label>
              <div className="contact-modal__field">
                <span className="contact-modal__field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
                    <path
                      d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-3.86 0-9 1.94-9 5.5V21h18v-1.5c0-3.56-5.14-5.5-9-5.5z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <input
                  id="contact-modal-nombre"
                  className="contact-modal__input"
                  type="text"
                  name="nombre"
                  placeholder="Tu nombre"
                  autoComplete="name"
                  value={nombreValue}
                  onChange={(ev) => setNombreValue(ev.target.value)}
                  disabled={status === 'loading'}
                />
              </div>

              <label className="contact-modal__sr-only" htmlFor="contact-modal-telefono">
                Tu número de teléfono
              </label>
              <div className="contact-modal__field">
                <span className="contact-modal__field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" focusable="false">
                    <path
                      d="M5.00659 6.93309C5.04956 5.7996 5.70084 4.77423 6.53785 3.93723C7.9308 2.54428 10.1532 2.73144 11.0376 4.31617L11.6866 5.4791C12.2723 6.52858 12.0372 7.90533 11.1147 8.8278M17.067 18.9934C18.2004 18.9505 19.2258 18.2992 20.0628 17.4622C21.4558 16.0692 21.2686 13.8468 19.6839 12.9624L18.5209 12.3134C17.4715 11.7277 16.0947 11.9628 15.1722 12.8853"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      opacity="0.6"
                      d="M5.00655 6.93311C4.93421 8.84124 5.41713 12.0817 8.6677 15.3323C11.9183 18.5829 15.1588 19.0658 17.0669 18.9935M15.1722 12.8853C15.1722 12.8853 14.0532 14.0042 12.0245 11.9755C9.99578 9.94676 11.1147 8.82782 11.1147 8.82782"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <input
                  id="contact-modal-telefono"
                  className={`contact-modal__input${fieldErrors.telefono ? ' contact-modal__input--invalid' : ''}`}
                  type="tel"
                  name="telefono"
                  placeholder="Tu teléfono"
                  autoComplete="tel"
                  inputMode="tel"
                  value={telefonoValue}
                  onChange={(ev) => setTelefonoValue(ev.target.value)}
                  aria-invalid={Boolean(fieldErrors.telefono)}
                  disabled={status === 'loading'}
                />
              </div>
              {fieldErrors.telefono ? <p className="contact-modal__field-error">{fieldErrors.telefono}</p> : null}

              <label
                className={`contact-modal__consent${
                  fieldErrors.consent ? ' contact-modal__consent--invalid' : ''
                }`}
                htmlFor="contact-modal-consent"
              >
                <input
                  id="contact-modal-consent"
                  className="contact-modal__consent-input"
                  type="checkbox"
                  name="consent"
                  checked={consentChecked}
                  onChange={(ev) => setConsentChecked(ev.target.checked)}
                  disabled={status === 'loading'}
                  aria-invalid={Boolean(fieldErrors.consent)}
                />
                <span className="contact-modal__consent-text">
                  Acepto recibir una llamada comercial y la{' '}
                  <a
                    href="/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    Política de Privacidad
                  </a>
                  {' '}y los{' '}
                  <a
                    href="/terminos"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    Términos y Condiciones
                  </a>
                  .
                </span>
              </label>
              {fieldErrors.consent ? (
                <p className="contact-modal__field-error">{fieldErrors.consent}</p>
              ) : null}

              <button
                className="contact-modal__submit"
                type="submit"
                disabled={status === 'loading' || !isFormReady}
              >
                <span className="contact-modal__submit-icon" aria-hidden="true">
                  {showSlots ? (
                    <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
                      <path
                        d="M7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM5 22h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2zm0-14h14v12H5V8z"
                        fill="currentColor"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" focusable="false">
                      <path
                        d="M5.00659 6.93309C5.04956 5.7996 5.70084 4.77423 6.53785 3.93723C7.9308 2.54428 10.1532 2.73144 11.0376 4.31617L11.6866 5.4791C12.2723 6.52858 12.0372 7.90533 11.1147 8.8278M17.067 18.9934C18.2004 18.9505 19.2258 18.2992 20.0628 17.4622C21.4558 16.0692 21.2686 13.8468 19.6839 12.9624L18.5209 12.3134C17.4715 11.7277 16.0947 11.9628 15.1722 12.8853"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <path
                        opacity="0.6"
                        d="M5.00655 6.93311C4.93421 8.84124 5.41713 12.0817 8.6677 15.3323C11.9183 18.5829 15.1588 19.0658 17.0669 18.9935M15.1722 12.8853C15.1722 12.8853 14.0532 14.0042 12.0245 11.9755C9.99578 9.94676 11.1147 8.82782 11.1147 8.82782"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="contact-modal__submit-text">
                  {status === 'loading'
                    ? 'Enviando…'
                    : showSlots
                      ? 'Programar llamada'
                      : 'Te llamamos'}
                </span>
              </button>
            </>
          )}
        </form>

        <p className="contact-modal__hours">Tus datos solo se usan para llamarte. Lun – Vie 09:00–18:00.</p>
      </div>
    </div>,
    document.body,
  )
}

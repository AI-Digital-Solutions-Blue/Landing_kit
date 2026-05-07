import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useContactModal } from '../../context/ContactModalContext'
import { useLeadFormSubmit } from '../../hooks/useLeadFormSubmit'
import { CALLBACK_REQUEST_URL } from '../../config/leadWebhook'
import './ContactFormModal.css'

function isValidPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length >= 7
}

export function ContactFormModal() {
  const { isOpen, closeModal } = useContactModal()
  const { status, errorMessage, successMessage, submitForm, reset } = useLeadFormSubmit({
    endpoint: CALLBACK_REQUEST_URL,
    mode: 'callback',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)
  const panelRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      reset()
      setFieldErrors({})
      setHasSubmittedOnce(false)
    }
  }, [isOpen, reset])

  useEffect(() => {
    if (!isOpen) return
    previouslyFocused.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const t = window.setTimeout(() => {
      const panel = panelRef.current
      if (panel) panel.scrollTop = 0
      const firstField = panel?.querySelector('input, select, button')
      firstField?.focus({ preventScroll: true })
    }, 0)

    return () => {
      window.clearTimeout(t)
      document.body.style.overflow = prevOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeModal])

  if (!isOpen) return null

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
    const nextErrors = {}
    if (!nombre) nextErrors.nombre = 'Introduce tu nombre.'
    if (!telefono) nextErrors.telefono = 'Introduce tu número de teléfono.'
    else if (!isValidPhone(telefono)) nextErrors.telefono = 'Introduce un teléfono válido.'
    setFieldErrors(nextErrors)
  }

  return createPortal(
    <div
      className="contact-modal__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal()
      }}
    >
      <div
        ref={panelRef}
        className="contact-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="contact-modal__header">
          <h2 id="contact-modal-title" className="contact-modal__title">
            ¿Cómo podemos
            <br />
            ayudarte?
          </h2>
          <button type="button" className="contact-modal__close" onClick={closeModal} aria-label="Cerrar ventana">
            ×
          </button>
        </header>

        <div className="contact-modal__content">
          <a className="contact-modal__option" href="tel:+34828151082">
            <div>
              <p className="contact-modal__option-title">Llámanos al 828 151 082</p>
              <p className="contact-modal__option-subtitle">Nuestro equipo te ayudará.</p>
            </div>
          </a>

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
              const errors = {}
              if (!nombre) errors.nombre = 'Introduce tu nombre.'
              if (!telefono) errors.telefono = 'Introduce tu número de teléfono.'
              else if (!isValidPhone(telefono)) errors.telefono = 'Introduce un teléfono válido.'

              setHasSubmittedOnce(true)
              setFieldErrors(errors)
              if (Object.keys(errors).length > 0) {
                if (errors.nombre) form.elements.namedItem('nombre')?.focus?.()
                else form.elements.namedItem('telefono')?.focus?.()
                return
              }
              submitForm(form)
            }}
            noValidate
            onInput={handleValidateOnEdit}
            onChange={handleValidateOnEdit}
          >
            <p className="contact-modal__callback-title">Nosotros te llamamos</p>
            {status === 'success' ? (
              <p className="contact-modal__success" role="status" aria-live="polite">
                {successMessage || 'Perfecto, hemos recibido tus datos y te llamamos en breve.'}
              </p>
            ) : (
              <>
                {status === 'error' && errorMessage ? (
                  <p className="contact-modal__error" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <label className="contact-modal__sr-only" htmlFor="contact-modal-nombre">
                  Tu nombre
                </label>
                <input
                  id="contact-modal-nombre"
                  className={`contact-modal__input${fieldErrors.nombre ? ' contact-modal__input--invalid' : ''}`}
                  type="text"
                  name="nombre"
                  placeholder="Tu nombre"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.nombre)}
                  disabled={status === 'loading'}
                />
                {fieldErrors.nombre ? <p className="contact-modal__field-error">{fieldErrors.nombre}</p> : null}

                <label className="contact-modal__sr-only" htmlFor="contact-modal-telefono">
                  Tu número de teléfono
                </label>
                <input
                  id="contact-modal-telefono"
                  className={`contact-modal__input${fieldErrors.telefono ? ' contact-modal__input--invalid' : ''}`}
                  type="tel"
                  name="telefono"
                  placeholder="Tu número de teléfono"
                  autoComplete="tel"
                  aria-invalid={Boolean(fieldErrors.telefono)}
                  disabled={status === 'loading'}
                />
                {fieldErrors.telefono ? <p className="contact-modal__field-error">{fieldErrors.telefono}</p> : null}

                <input type="hidden" name="empresa" value="No especificado (modal rápido)" />
                <input type="hidden" name="email" value="sin-email@siweb.es" />
                <input type="hidden" name="kit_concedido" value="no-se" />
                <input type="hidden" name="solucion" value="callback-rapido" />

                <button className="contact-modal__submit" type="submit" disabled={status === 'loading'}>
                  <span className="contact-modal__submit-text">
                    {status === 'loading' ? 'Enviando…' : 'Te llamamos'}
                  </span>
                </button>
              </>
            )}
          </form>

          <p className="contact-modal__hours">Lunes - Viernes de 09:00 a 18:00</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

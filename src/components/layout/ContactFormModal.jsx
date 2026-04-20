import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useContactModal } from '../../context/ContactModalContext'
import { useLeadFormSubmit } from '../../hooks/useLeadFormSubmit'
import { KitCtaFormBody } from './KitCtaFormBody'
import { KitCtaFormSuccess } from './KitCtaFormSuccess'
import './KitCtaFormSection.css'
import './ContactFormModal.css'

export function ContactFormModal() {
  const { isOpen, closeModal } = useContactModal()
  const { status, errorMessage, submitForm, reset } = useLeadFormSubmit()
  const panelRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      reset()
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
        aria-labelledby={status === 'success' ? 'kit-cta-modal-success' : 'kit-cta-modal-title'}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="contact-modal__close" onClick={closeModal} aria-label="Cerrar ventana">
          ×
        </button>
        <form
          className="kit-cta__form contact-modal__form"
          onSubmit={(e) => {
            e.preventDefault()
            submitForm(e.currentTarget)
          }}
          noValidate
        >
          {status === 'success' ? (
            <KitCtaFormSuccess variant="modal" />
          ) : (
            <>
              {status === 'error' && errorMessage ? (
                <p className="kit-cta__form-error" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <KitCtaFormBody variant="modal" isSubmitting={status === 'loading'} />
            </>
          )}
        </form>
      </div>
    </div>,
    document.body,
  )
}

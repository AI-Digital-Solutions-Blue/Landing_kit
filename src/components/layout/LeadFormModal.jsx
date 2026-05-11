import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useContactModal } from '../../context/ContactModalContext'
import { useLeadFormSubmit } from '../../hooks/useLeadFormSubmit'
import { KitCtaFormBody } from './KitCtaFormBody'
import { KitCtaFormSuccess } from './KitCtaFormSuccess'
import { focusFirstInvalidField, validateLeadForm } from './leadFormValidation'
import './KitCtaFormSection.css'
import './LeadFormModal.css'

export function LeadFormModal() {
  const { isLeadOpen, closeLeadModal } = useContactModal()
  const { status, errorMessage, submitForm, reset } = useLeadFormSubmit()
  const [fieldErrors, setFieldErrors] = useState({})
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)
  const panelRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!isLeadOpen) {
      reset()
      setFieldErrors({})
      setHasSubmittedOnce(false)
    }
  }, [isLeadOpen, reset])

  useEffect(() => {
    if (!isLeadOpen) return
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
  }, [isLeadOpen])

  useEffect(() => {
    if (!isLeadOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeLeadModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isLeadOpen, closeLeadModal])

  if (!isLeadOpen) return null

  const markFormStarted = (form) => {
    if (!form?.dataset?.startedAt) {
      form.dataset.startedAt = String(Date.now())
    }
  }

  const handleValidateOnEdit = (e) => {
    const form = e.currentTarget
    markFormStarted(form)
    if (!hasSubmittedOnce) return
    setFieldErrors(validateLeadForm(form))
  }

  return createPortal(
    <div
      className="lead-modal__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLeadModal()
      }}
    >
      <div
        ref={panelRef}
        className="lead-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={status === 'success' ? 'kit-cta-modal-success' : 'kit-cta-modal-title'}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="lead-modal__close" onClick={closeLeadModal} aria-label="Cerrar ventana">
          ×
        </button>
        <form
          id="lead_kit_canarias_form_modal"
          name="lead_kit_canarias_form_modal"
          className="kit-cta__form lead-modal__form"
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            markFormStarted(form)
            const errors = validateLeadForm(form)
            setHasSubmittedOnce(true)
            setFieldErrors(errors)
            if (Object.keys(errors).length > 0) {
              focusFirstInvalidField(form, errors)
              return
            }
            submitForm(form)
          }}
          noValidate
          onInput={handleValidateOnEdit}
          onChange={handleValidateOnEdit}
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
              <KitCtaFormBody
                variant="modal"
                isSubmitting={status === 'loading'}
                fieldErrors={fieldErrors}
              />
            </>
          )}
        </form>
      </div>
    </div>,
    document.body,
  )
}

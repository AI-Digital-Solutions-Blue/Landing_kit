import { useState } from 'react'
import './KitCtaFormSection.css'
import { useLeadFormSubmit } from '../../hooks/useLeadFormSubmit'
import { CtaOpenModalLink } from './CtaOpenModalLink'
import { KitCtaFormBody } from './KitCtaFormBody'
import { KitCtaFormSuccess } from './KitCtaFormSuccess'
import { focusFirstInvalidField, validateLeadForm } from './leadFormValidation'

export function KitCtaFormSection() {
  const { status, errorMessage, submitForm } = useLeadFormSubmit()
  const [fieldErrors, setFieldErrors] = useState({})
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const errors = validateLeadForm(form)
    setHasSubmittedOnce(true)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      focusFirstInvalidField(form, errors)
      return
    }
    submitForm(form)
  }

  const handleValidateOnEdit = (e) => {
    if (!hasSubmittedOnce) return
    const form = e.currentTarget
    setFieldErrors(validateLeadForm(form))
  }

  return (
    <section className="kit-cta" id="contacto" aria-labelledby="kit-cta-heading">
      <div className="kit-cta__inner">
        <div className="kit-cta__copy">
          <h2 id="kit-cta-heading" className="kit-cta__title kit-cta__grad-text">
            No dejes tu Kit Digital sin usar
          </h2>
          <p className="kit-cta__lead">
            Si ya tienes el <strong>bono concedido</strong>, este es el momento de activarlo con una solución que
            aporte <strong>valor real a tu negocio.</strong>
          </p>
          <div className="kit-cta__actions">
            <CtaOpenModalLink className="kit-cta__btn kit-cta__btn--primary">Quiero aprovechar mi bono</CtaOpenModalLink>
            <a className="kit-cta__btn kit-cta__btn--ghost" href="tel:+34828151082">
              Hablar con un asesor
            </a>
          </div>
        </div>

        <form
          className="kit-cta__form"
          onSubmit={handleSubmit}
          noValidate
          onInput={handleValidateOnEdit}
          onChange={handleValidateOnEdit}
        >
          {status === 'success' ? (
            <KitCtaFormSuccess variant="section" />
          ) : (
            <>
              {status === 'error' && errorMessage ? (
                <p className="kit-cta__form-error" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <KitCtaFormBody
                variant="section"
                isSubmitting={status === 'loading'}
                fieldErrors={fieldErrors}
              />
            </>
          )}
        </form>
      </div>
    </section>
  )
}

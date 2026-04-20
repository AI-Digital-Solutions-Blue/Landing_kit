import './KitCtaFormSection.css'
import { useLeadFormSubmit } from '../../hooks/useLeadFormSubmit'
import { CtaOpenModalLink } from './CtaOpenModalLink'
import { KitCtaFormBody } from './KitCtaFormBody'
import { KitCtaFormSuccess } from './KitCtaFormSuccess'

export function KitCtaFormSection() {
  const { status, errorMessage, submitForm } = useLeadFormSubmit()

  const handleSubmit = (e) => {
    e.preventDefault()
    submitForm(e.currentTarget)
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
            <a className="kit-cta__btn kit-cta__btn--ghost" href="tel:+34911096389">
              Hablar con un asesor
            </a>
          </div>
        </div>

        <form className="kit-cta__form" onSubmit={handleSubmit} noValidate>
          {status === 'success' ? (
            <KitCtaFormSuccess variant="section" />
          ) : (
            <>
              {status === 'error' && errorMessage ? (
                <p className="kit-cta__form-error" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <KitCtaFormBody variant="section" isSubmitting={status === 'loading'} />
            </>
          )}
        </form>
      </div>
    </section>
  )
}

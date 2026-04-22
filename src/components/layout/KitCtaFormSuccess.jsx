import './KitCtaFormSection.css'

export function KitCtaFormSuccess({ variant = 'section' }) {
  const wrapClass =
    variant === 'modal' ? 'kit-cta__success kit-cta__success--modal' : 'kit-cta__success'

  const titleId = variant === 'modal' ? 'kit-cta-modal-success' : undefined

  return (
    <div className={wrapClass} role="status" aria-live="polite">
      <p
        {...(titleId ? { id: titleId } : {})}
        className="kit-cta__success-line kit-cta__success-line--strong"
      >
        ¡Hemos recibido sus datos!
      </p>
      <p className="kit-cta__success-line">
        Pronto nos pondremos en contacto con usted.
      </p>
      <p className="kit-cta__success-signoff">
        Muchas gracias,
        <br />
        <span className="kit-cta__success-brand">Siweb</span>
      </p>
    </div>
  )
}

import './KitCtaFormSection.css'

export function KitCtaFormSection() {
  const handleSubmit = (e) => {
    e.preventDefault()
  }

  return (
    <section className="kit-cta" aria-labelledby="kit-cta-heading">
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
            <a className="kit-cta__btn kit-cta__btn--primary" href="#">
              Quiero aprovechar mi bono
            </a>
            <a className="kit-cta__btn kit-cta__btn--ghost" href="#">
              Hablar con un asesor
            </a>
          </div>
        </div>

        <form className="kit-cta__form" onSubmit={handleSubmit} noValidate>
          <div className="kit-cta__glass">
            <p className="kit-cta__form-kicker kit-cta__grad-text">
              Solicita información y activa tu Kit Digital
            </p>

            <div className="kit-cta__fields">
              <label className="kit-cta__field">
                <span className="kit-cta__sr-only">Nombre</span>
                <input className="kit-cta__input" type="text" name="nombre" placeholder="Nombre" autoComplete="name" />
              </label>
              <label className="kit-cta__field">
                <span className="kit-cta__sr-only">Empresa</span>
                <input className="kit-cta__input" type="text" name="empresa" placeholder="Empresa" autoComplete="organization" />
              </label>
              <label className="kit-cta__field">
                <span className="kit-cta__sr-only">Teléfono</span>
                <input className="kit-cta__input" type="tel" name="telefono" placeholder="Teléfono" autoComplete="tel" />
              </label>
              <label className="kit-cta__field">
                <span className="kit-cta__sr-only">Email</span>
                <input className="kit-cta__input" type="email" name="email" placeholder="Email" autoComplete="email" />
              </label>
              <label className="kit-cta__field">
                <span className="kit-cta__sr-only">¿Ya tienes concedido el Kit Digital?</span>
                <select className="kit-cta__select" name="kit_concedido" defaultValue="" required>
                  <option value="" disabled>
                    ¿Ya Tienes Concedido El Kit Digital?
                  </option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                  <option value="no-se">Aún no lo sé</option>
                </select>
              </label>
              <label className="kit-cta__field">
                <span className="kit-cta__sr-only">¿Qué solución te interesa?</span>
                <select className="kit-cta__select" name="solucion" defaultValue="" required>
                  <option value="" disabled>
                    ¿Qué Solución Te Interesa?
                  </option>
                  <option value="crm-factura">Facturación / CRM</option>
                  <option value="web">Web / Tienda online</option>
                  <option value="varias">Varias / Asesoramiento</option>
                </select>
              </label>
            </div>

            <button className="kit-cta__submit" type="submit">
              <span className="kit-cta__submit-label kit-cta__grad-text">Quiero mi portátil gratis</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

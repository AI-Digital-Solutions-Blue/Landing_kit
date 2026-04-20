/**
 * Mismo bloque de formulario que en la sección Kit CTA (cristal + campos + envío).
 * `variant`: "section" mantiene estilos actuales; "modal" añade clase en el contenedor glass.
 */
export function KitCtaFormBody({ variant = 'section', isSubmitting = false }) {
  const glassClass =
    variant === 'modal' ? 'kit-cta__glass kit-cta__glass--modal' : 'kit-cta__glass'

  return (
    <div className={glassClass}>
      <header className="kit-cta__form-header">
        {variant === 'modal' ? (
          <h2 id="kit-cta-modal-title" className="kit-cta__form-kicker kit-cta__form-kicker--modal-two-lines">
            <span className="kit-cta__grad-text kit-cta__form-kicker--modal-grad-block">
              Solicita información
              <br />
              y activa tu Kit Digital
            </span>
          </h2>
        ) : (
          <h3 className="kit-cta__form-kicker">
            <span className="kit-cta__grad-text">
              Solicita información
              <br />
              y activa tu Kit Digital
            </span>
          </h3>
        )}
      </header>

      <div className="kit-cta__fields">
        <label className="kit-cta__field">
          <span className="kit-cta__sr-only">Nombre</span>
          <input
            className="kit-cta__input"
            type="text"
            name="nombre"
            placeholder="Nombre"
            autoComplete="name"
            disabled={isSubmitting}
            required
          />
        </label>
        <label className="kit-cta__field">
          <span className="kit-cta__sr-only">Empresa</span>
          <input
            className="kit-cta__input"
            type="text"
            name="empresa"
            placeholder="Empresa"
            autoComplete="organization"
            disabled={isSubmitting}
            required
          />
        </label>
        <label className="kit-cta__field">
          <span className="kit-cta__sr-only">Teléfono</span>
          <input
            className="kit-cta__input"
            type="tel"
            name="telefono"
            placeholder="Teléfono"
            autoComplete="tel"
            disabled={isSubmitting}
            required
          />
        </label>
        <label className="kit-cta__field">
          <span className="kit-cta__sr-only">Email</span>
          <input
            className="kit-cta__input"
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="email"
            disabled={isSubmitting}
            required
          />
        </label>
        <label className="kit-cta__field">
          <span className="kit-cta__sr-only">¿Ya tienes concedido el Kit Digital?</span>
          <select className="kit-cta__select" name="kit_concedido" defaultValue="" required disabled={isSubmitting}>
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
          <select className="kit-cta__select" name="solucion" defaultValue="" required disabled={isSubmitting}>
            <option value="" disabled>
              ¿Qué Solución Te Interesa?
            </option>
            <option value="crm-factura">Facturación / CRM</option>
            <option value="web">Web / Tienda online</option>
            <option value="varias">Varias / Asesoramiento</option>
          </select>
        </label>
      </div>

      <button className="kit-cta__submit" type="submit" disabled={isSubmitting}>
        <span className="kit-cta__submit-label kit-cta__grad-text">
          {isSubmitting ? 'Enviando…' : 'Quiero mi portátil gratis'}
        </span>
      </button>
    </div>
  )
}

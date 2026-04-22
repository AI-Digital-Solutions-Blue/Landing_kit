/**
 * Mismo bloque de formulario que en la sección Kit CTA (cristal + campos + envío).
 * `variant`: "section" mantiene estilos actuales; "modal" añade clase en el contenedor glass.
 */
export function KitCtaFormBody({ variant = 'section', isSubmitting = false, fieldErrors = {} }) {
  const glassClass =
    variant === 'modal' ? 'kit-cta__glass kit-cta__glass--modal' : 'kit-cta__glass'
  const errorPrefix = variant === 'modal' ? 'kit-cta-modal-error' : 'kit-cta-section-error'

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
            className={`kit-cta__input${fieldErrors.nombre ? ' kit-cta__input--invalid' : ''}`}
            type="text"
            name="nombre"
            placeholder="Nombre"
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.nombre)}
            aria-describedby={fieldErrors.nombre ? `${errorPrefix}-nombre` : undefined}
            disabled={isSubmitting}
            required
          />
          {fieldErrors.nombre ? (
            <span id={`${errorPrefix}-nombre`} className="kit-cta__field-error" role="alert">
              {fieldErrors.nombre}
            </span>
          ) : null}
        </label>
        <label className="kit-cta__field">
          <span className="kit-cta__sr-only">Empresa</span>
          <input
            className={`kit-cta__input${fieldErrors.empresa ? ' kit-cta__input--invalid' : ''}`}
            type="text"
            name="empresa"
            placeholder="Empresa"
            autoComplete="organization"
            aria-invalid={Boolean(fieldErrors.empresa)}
            aria-describedby={fieldErrors.empresa ? `${errorPrefix}-empresa` : undefined}
            disabled={isSubmitting}
            required
          />
          {fieldErrors.empresa ? (
            <span id={`${errorPrefix}-empresa`} className="kit-cta__field-error" role="alert">
              {fieldErrors.empresa}
            </span>
          ) : null}
        </label>
        <label className="kit-cta__field">
          <span className="kit-cta__sr-only">Teléfono</span>
          <input
            className={`kit-cta__input${fieldErrors.telefono ? ' kit-cta__input--invalid' : ''}`}
            type="tel"
            name="telefono"
            placeholder="Teléfono"
            autoComplete="tel"
            aria-invalid={Boolean(fieldErrors.telefono)}
            aria-describedby={fieldErrors.telefono ? `${errorPrefix}-telefono` : undefined}
            disabled={isSubmitting}
            required
          />
          {fieldErrors.telefono ? (
            <span id={`${errorPrefix}-telefono`} className="kit-cta__field-error" role="alert">
              {fieldErrors.telefono}
            </span>
          ) : null}
        </label>
        <label className="kit-cta__field">
          <span className="kit-cta__sr-only">Email</span>
          <input
            className={`kit-cta__input${fieldErrors.email ? ' kit-cta__input--invalid' : ''}`}
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? `${errorPrefix}-email` : undefined}
            disabled={isSubmitting}
            required
          />
          {fieldErrors.email ? (
            <span id={`${errorPrefix}-email`} className="kit-cta__field-error" role="alert">
              {fieldErrors.email}
            </span>
          ) : null}
        </label>
        <label className="kit-cta__field">
          <span className="kit-cta__sr-only">¿Ya tienes concedido el Kit Digital?</span>
          <select
            className={`kit-cta__select${fieldErrors.kit_concedido ? ' kit-cta__select--invalid' : ''}`}
            name="kit_concedido"
            defaultValue=""
            required
            aria-invalid={Boolean(fieldErrors.kit_concedido)}
            aria-describedby={fieldErrors.kit_concedido ? `${errorPrefix}-kit-concedido` : undefined}
            disabled={isSubmitting}
          >
            <option value="" disabled>
              ¿Ya Tienes Concedido El Kit Digital?
            </option>
            <option value="si">Sí</option>
            <option value="no">No</option>
            <option value="no-se">Aún no lo sé</option>
          </select>
          {fieldErrors.kit_concedido ? (
            <span id={`${errorPrefix}-kit-concedido`} className="kit-cta__field-error" role="alert">
              {fieldErrors.kit_concedido}
            </span>
          ) : null}
        </label>
        <label className="kit-cta__field">
          <span className="kit-cta__sr-only">¿Qué solución te interesa?</span>
          <select
            className={`kit-cta__select${fieldErrors.solucion ? ' kit-cta__select--invalid' : ''}`}
            name="solucion"
            defaultValue=""
            required
            aria-invalid={Boolean(fieldErrors.solucion)}
            aria-describedby={fieldErrors.solucion ? `${errorPrefix}-solucion` : undefined}
            disabled={isSubmitting}
          >
            <option value="" disabled>
              ¿Qué Solución Te Interesa?
            </option>
            <option value="crm-factura">Facturación / CRM</option>
            <option value="web">Web / Tienda online</option>
            <option value="varias">Varias / Asesoramiento</option>
          </select>
          {fieldErrors.solucion ? (
            <span id={`${errorPrefix}-solucion`} className="kit-cta__field-error" role="alert">
              {fieldErrors.solucion}
            </span>
          ) : null}
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

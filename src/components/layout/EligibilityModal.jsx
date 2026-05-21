import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useContactModal } from '../../context/ContactModalContext'
import { useEligibilityCheck } from '../../hooks/useEligibilityCheck'
import { useXilonAuthorization } from '../../hooks/useXilonAuthorization'
import { ELIGIBILITY_CATEGORIAS, getLabelByCodigo } from '../../utils/categoriaCatalog'
import { EligibilityActivateForm } from './EligibilityActivateForm'
import './LeadFormModal.css'
import './EligibilityModal.css'

const NIF_REGEX = /^[A-Z0-9]{8,10}$/
const FALLBACK_TEL = '+34828151082'

function validate({ nif, bono, categoria }) {
  const errors = {}
  const cleanNif = String(nif ?? '').trim().toUpperCase()
  const cleanBono = String(bono ?? '').trim()
  const cleanCat = String(categoria ?? '').trim()

  if (!cleanNif) errors.nif = 'Introduce tu NIF/CIF.'
  else if (!NIF_REGEX.test(cleanNif)) errors.nif = 'NIF/CIF con formato no válido.'

  if (!cleanBono) errors.bono = 'Introduce el código de tu bono Kit Digital.'
  else if (cleanBono.length > 64) errors.bono = 'El código de bono es demasiado largo.'

  if (!cleanCat) errors.categoria = 'Selecciona una solución.'

  return { errors, values: { nif: cleanNif, bono: cleanBono, categoria: cleanCat } }
}

function formatEuro(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${Math.round(value)} €`
  }
}

function getFriendlyName(razonSocial) {
  if (!razonSocial || typeof razonSocial !== 'string') return ''
  const first = razonSocial.trim().split(/\s+/)[0]
  if (!first) return ''
  if (first.length <= 4 && first === first.toUpperCase()) return first
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

export function EligibilityModal() {
  const { isEligibilityOpen, closeEligibilityModal } = useContactModal()
  const { status, result, errorMessage, check, reset } = useEligibilityCheck()
  const {
    status: activationStatus,
    errorMessage: activationError,
    submit: submitActivation,
    reset: resetActivation,
  } = useXilonAuthorization()
  const [fieldErrors, setFieldErrors] = useState({})
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)
  const [view, setView] = useState('form') // 'form' | 'result' | 'activate' | 'activated'
  const [lastNif, setLastNif] = useState('')
  const panelRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!isEligibilityOpen) {
      reset()
      resetActivation()
      setFieldErrors({})
      setHasSubmittedOnce(false)
      setView('form')
      setLastNif('')
    }
  }, [isEligibilityOpen, reset, resetActivation])

  useEffect(() => {
    if (status === 'success') setView('result')
    if (status === 'error') setView('form')
    if (status === 'idle') setView('form')
  }, [status])

  useEffect(() => {
    if (activationStatus === 'success') setView('activated')
  }, [activationStatus])

  useEffect(() => {
    if (!isEligibilityOpen) return
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
  }, [isEligibilityOpen])

  useEffect(() => {
    if (!isEligibilityOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeEligibilityModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isEligibilityOpen, closeEligibilityModal])

  if (!isEligibilityOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const payload = {
      nif: formData.get('nif'),
      bono: formData.get('bono'),
      categoria: formData.get('categoria'),
    }
    const { errors, values } = validate(payload)
    setHasSubmittedOnce(true)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      const first = Object.keys(errors)[0]
      e.currentTarget.elements.namedItem(first)?.focus?.()
      return
    }
    setLastNif(values.nif)
    check(values)
  }

  const handleEdit = (e) => {
    if (!hasSubmittedOnce) return
    const form = e.currentTarget
    const data = {
      nif: form.elements.namedItem('nif')?.value,
      bono: form.elements.namedItem('bono')?.value,
      categoria: form.elements.namedItem('categoria')?.value,
    }
    setFieldErrors(validate(data).errors)
  }

  const handleNifInput = (e) => {
    e.target.value = e.target.value.toUpperCase()
  }

  const handleActivar = () => {
    resetActivation()
    setView('activate')
  }

  const handleActivationSubmit = (payload) => {
    submitActivation(payload)
  }

  const handleBackFromActivate = () => {
    setView('result')
  }

  const renderActivated = () => (
    <div className="eligibility-modal__result eligibility-modal__result--ok">
      <div className="eligibility-modal__result-icon" aria-hidden="true">
        ✓
      </div>
      <h2 className="eligibility-modal__result-title">Solicitud enviada</h2>
      <p className="eligibility-modal__result-lead">
        Hemos recibido tu solicitud. Te contactaremos en breve para terminar la activación de tu
        bono Kit Digital.
      </p>
      <button
        type="button"
        className="eligibility-modal__submit"
        onClick={closeEligibilityModal}
      >
        <span className="eligibility-modal__submit-label">Cerrar</span>
      </button>
    </div>
  )

  const renderForm = () => (
    <form
      id="eligibility_form"
      name="eligibility_form"
      className="eligibility-modal__form"
      onSubmit={handleSubmit}
      onInput={handleEdit}
      onChange={handleEdit}
      noValidate
    >
      <header className="eligibility-modal__header">
        <h2 id="eligibility-modal-title" className="eligibility-modal__title">
          <span className="eligibility-modal__title-grad">¿Tu bono está disponible?</span>
        </h2>
        <p className="eligibility-modal__subtitle">
          Introduce los datos de tu bono Kit Digital y comprobamos al instante si puedes
          activarlo con nosotros.
        </p>
      </header>

      <div className="eligibility-modal__fields">
        <label className="eligibility-modal__field">
          <span className="eligibility-modal__label">NIF / CIF</span>
          <input
            className={`eligibility-modal__input${
              fieldErrors.nif ? ' eligibility-modal__input--invalid' : ''
            }`}
            type="text"
            name="nif"
            placeholder="B12345678"
            autoComplete="off"
            maxLength={10}
            disabled={status === 'loading'}
            onInput={handleNifInput}
            aria-invalid={Boolean(fieldErrors.nif)}
            aria-describedby={fieldErrors.nif ? 'eligibility-error-nif' : undefined}
            required
          />
          {fieldErrors.nif ? (
            <span id="eligibility-error-nif" className="eligibility-modal__field-error" role="alert">
              {fieldErrors.nif}
            </span>
          ) : null}
        </label>

        <label className="eligibility-modal__field">
          <span className="eligibility-modal__label eligibility-modal__label--with-help">
            <span>Código de bono</span>
            <a
              className="eligibility-modal__help-link"
              href="/donde-encontrar-codigo-bono.pdf"
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              ¿Cómo localizarlo?
            </a>
          </span>
          <input
            className={`eligibility-modal__input${
              fieldErrors.bono ? ' eligibility-modal__input--invalid' : ''
            }`}
            type="text"
            name="bono"
            placeholder="2025/C022/04629936"
            autoComplete="off"
            maxLength={64}
            disabled={status === 'loading'}
            aria-invalid={Boolean(fieldErrors.bono)}
            aria-describedby={fieldErrors.bono ? 'eligibility-error-bono' : undefined}
            required
          />
          {fieldErrors.bono ? (
            <span id="eligibility-error-bono" className="eligibility-modal__field-error" role="alert">
              {fieldErrors.bono}
            </span>
          ) : null}
        </label>

        <label className="eligibility-modal__field">
          <span className="eligibility-modal__label">¿Qué solución te interesa?</span>
          <select
            className={`eligibility-modal__select${
              fieldErrors.categoria ? ' eligibility-modal__select--invalid' : ''
            }`}
            name="categoria"
            defaultValue=""
            disabled={status === 'loading'}
            aria-invalid={Boolean(fieldErrors.categoria)}
            aria-describedby={fieldErrors.categoria ? 'eligibility-error-categoria' : undefined}
            required
          >
            <option value="" disabled>
              Selecciona una solución
            </option>
            {ELIGIBILITY_CATEGORIAS.map((cat) => (
              <option key={cat.codigo} value={cat.codigo}>
                {cat.label}
              </option>
            ))}
          </select>
          {fieldErrors.categoria ? (
            <span
              id="eligibility-error-categoria"
              className="eligibility-modal__field-error"
              role="alert"
            >
              {fieldErrors.categoria}
            </span>
          ) : null}
        </label>
      </div>

      <button
        className="eligibility-modal__submit"
        type="submit"
        disabled={status === 'loading'}
      >
        <span className="eligibility-modal__submit-label">
          {status === 'loading' ? 'Comprobando…' : 'Comprobar mi bono'}
        </span>
      </button>

      <p className="eligibility-modal__hint">
        Tus datos solo se usan para esta consulta. Más en{' '}
        <a href="/privacidad" target="_blank" rel="noopener noreferrer">
          política de privacidad
        </a>
        .
      </p>
    </form>
  )

  const renderResult = () => {
    const eligible = Boolean(result?.eligible)
    const message = result?.message ?? ''
    const details = result?.details ?? {}
    const importe = Number(details.importe_categoria_preferida ?? 0)
    const catLabel = getLabelByCodigo(details.categoria_preferida)
    const alternativas = Array.isArray(details.alternativas) ? details.alternativas : []
    const elegiblesAlternativas = alternativas.filter(
      (a) => a.slot_libre && a.importe_disponible > 0,
    )

    const friendlyNameOk = getFriendlyName(details.razon_social)

    if (eligible) {
      return (
        <div className="eligibility-modal__result eligibility-modal__result--ok">
          <div className="eligibility-modal__result-icon" aria-hidden="true">
            ✓
          </div>
          <h2 className="eligibility-modal__result-title">
            {friendlyNameOk ? `¡Enhorabuena, ${friendlyNameOk}!` : '¡Tu bono está disponible!'}
          </h2>
          <p className="eligibility-modal__result-lead">
            Puedes activar <strong>{catLabel}</strong> con tu bono Kit Digital.
          </p>
          <div className="eligibility-modal__result-amount">
            <span className="eligibility-modal__result-amount-value">{formatEuro(importe)}</span>
            <span className="eligibility-modal__result-amount-label">disponibles</span>
          </div>
          {details.razon_social ? (
            <p className="eligibility-modal__result-meta">
              Beneficiario: <strong>{details.razon_social}</strong>
            </p>
          ) : null}
          <button
            type="button"
            className="eligibility-modal__submit"
            onClick={handleActivar}
          >
            <span className="eligibility-modal__submit-label">Quiero activarlo</span>
          </button>
          <button
            type="button"
            className="eligibility-modal__link"
            onClick={() => reset()}
          >
            Hacer otra consulta
          </button>
        </div>
      )
    }

    const friendlyName = getFriendlyName(details.razon_social)
    const fallbackMessage = 'No podemos activar esta categoría con tu bono.'

    return (
      <div className="eligibility-modal__result eligibility-modal__result--ko">
        <div className="eligibility-modal__result-icon eligibility-modal__result-icon--ko" aria-hidden="true">
          !
        </div>
        <h2 className="eligibility-modal__result-title">
          {friendlyName ? `Hola, ${friendlyName}` : 'Esta solución no está disponible'}
        </h2>
        {friendlyName ? (
          <p className="eligibility-modal__result-subtitle">Esta solución no está disponible.</p>
        ) : null}
        <p className="eligibility-modal__result-lead">{message || fallbackMessage}</p>

        {elegiblesAlternativas.length > 0 ? (
          <>
            <p className="eligibility-modal__alternativas-intro">
              Pero tu bono <strong>sí cubre</strong> estas otras soluciones:
            </p>
            <ul className="eligibility-modal__alternativas">
              {elegiblesAlternativas.slice(0, 5).map((alt) => (
                <li key={alt.categoria_id} className="eligibility-modal__alternativa">
                  <span className="eligibility-modal__alternativa-label">
                    {getLabelByCodigo(alt.categoria_id)}
                  </span>
                  <span className="eligibility-modal__alternativa-importe">
                    {formatEuro(alt.importe_disponible)}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="eligibility-modal__submit"
              onClick={handleActivar}
            >
              <span className="eligibility-modal__submit-label">Hablar con un asesor</span>
            </button>
          </>
        ) : (
          <>
            <a href={`tel:${FALLBACK_TEL}`} className="eligibility-modal__submit eligibility-modal__submit--link">
              <span className="eligibility-modal__submit-label">Llámanos para ayudarte</span>
            </a>
            <button
              type="button"
              className="eligibility-modal__link"
              onClick={() => reset()}
            >
              Probar con otro código
            </button>
          </>
        )}
      </div>
    )
  }

  const renderError = () => (
    <div className="eligibility-modal__result eligibility-modal__result--error">
      <div
        className="eligibility-modal__result-icon eligibility-modal__result-icon--ko"
        aria-hidden="true"
      >
        !
      </div>
      <h2 className="eligibility-modal__result-title">Servicio no disponible</h2>
      <p className="eligibility-modal__result-lead">{errorMessage}</p>
      <a href={`tel:${FALLBACK_TEL}`} className="eligibility-modal__submit eligibility-modal__submit--link">
        <span className="eligibility-modal__submit-label">Llámanos ahora</span>
      </a>
      <button type="button" className="eligibility-modal__link" onClick={() => reset()}>
        Reintentar
      </button>
    </div>
  )

  return createPortal(
    <div
      className="lead-modal__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeEligibilityModal()
      }}
    >
      <div
        ref={panelRef}
        className="lead-modal__panel eligibility-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="eligibility-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="lead-modal__close"
          onClick={closeEligibilityModal}
          aria-label="Cerrar ventana"
        >
          ×
        </button>

        <div className="eligibility-modal__body">
          {view === 'activated' ? (
            renderActivated()
          ) : view === 'activate' ? (
            <EligibilityActivateForm
              details={result?.details ?? {}}
              baseTaxId={lastNif}
              status={activationStatus}
              errorMessage={activationError}
              onSubmit={handleActivationSubmit}
              onBack={handleBackFromActivate}
            />
          ) : status === 'success' ? (
            renderResult()
          ) : status === 'error' ? (
            renderError()
          ) : (
            renderForm()
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

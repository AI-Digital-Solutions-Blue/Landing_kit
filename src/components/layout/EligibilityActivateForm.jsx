import { useEffect, useMemo, useRef, useState } from 'react'
import {
  inferApplicant,
  inferProvinceFromPostalCode,
  splitFullName,
} from '../../utils/nifInference'

const PROVINCIAS_ES = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz',
  'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real',
  'Córdoba', 'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Gipuzkoa', 'Huelva',
  'Huesca', 'Illes Balears', 'Jaén', 'A Coruña', 'La Rioja', 'Las Palmas', 'León',
  'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Ourense', 'Palencia',
  'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria',
  'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Bizkaia', 'Zamora',
  'Zaragoza', 'Ceuta', 'Melilla',
]

const PHONE_REGEX = /^\+?\d{9,15}$/
const POSTAL_REGEX = /^\d{5}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NIF_REGEX = /^[A-Z0-9]{8,10}$/

function validate(values) {
  const errors = {}
  if (!values.applicant) errors.applicant = 'Selecciona el tipo de solicitante.'
  if (!values.phone || !PHONE_REGEX.test(values.phone)) errors.phone = 'Teléfono no válido.'
  if (!values.email || !EMAIL_REGEX.test(values.email)) errors.email = 'Email no válido.'
  if (!values.address || values.address.length < 3) errors.address = 'Introduce la dirección.'
  if (!values.postalCode || !POSTAL_REGEX.test(values.postalCode))
    errors.postalCode = 'Código postal: 5 dígitos.'
  if (!values.city || values.city.length < 2) errors.city = 'Introduce la población.'
  if (!values.province) errors.province = 'Selecciona la provincia.'
  if (values.grantorTaxId && !NIF_REGEX.test(values.grantorTaxId))
    errors.grantorTaxId = 'NIF del firmante no válido.'
  return errors
}

/**
 * Paso 2 del EligibilityModal: una vez confirmada elegibilidad,
 * pide los datos restantes para activar el bono y enviarlos a Xilon.
 */
export function EligibilityActivateForm({
  details,
  baseTaxId,
  status,
  errorMessage,
  onSubmit,
  onBack,
}) {
  const initial = useMemo(() => {
    const applicant = inferApplicant(baseTaxId)
    const { name, firstSurname, secondSurname } = splitFullName(
      details?.razon_social,
      applicant,
    )
    return {
      applicant,
      phone: '',
      email: '',
      name,
      firstSurname,
      secondSurname,
      grantorTaxId: '',
      address: '',
      postalCode: '',
      city: '',
      province: '',
      notes: '',
    }
  }, [baseTaxId, details?.razon_social])

  const [values, setValues] = useState(initial)
  const [fieldErrors, setFieldErrors] = useState({})
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)
  const autoProvinceRef = useRef('')

  useEffect(() => {
    setValues(initial)
    autoProvinceRef.current = ''
  }, [initial])

  const isLoading = status === 'loading'

  const updateField = (field) => (e) => {
    const value = field === 'grantorTaxId' ? String(e.target.value).toUpperCase() : e.target.value
    let next = { ...values, [field]: value }

    if (field === 'postalCode') {
      const inferredProvince = inferProvinceFromPostalCode(value)
      const userTouchedProvince =
        values.province && values.province !== autoProvinceRef.current
      if (inferredProvince && !userTouchedProvince) {
        next = { ...next, province: inferredProvince }
        autoProvinceRef.current = inferredProvince
      }
    }

    if (field === 'province') {
      autoProvinceRef.current = ''
    }

    setValues(next)
    if (hasSubmittedOnce) setFieldErrors(validate(next))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = validate(values)
    setHasSubmittedOnce(true)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      const first = Object.keys(errors)[0]
      e.currentTarget.elements.namedItem(first)?.focus?.()
      return
    }

    const segmento = Number(details?.segmento ?? 0)
    const employeesBySegmento = { 1: 1, 2: 3, 3: 10 }
    const employees = employeesBySegmento[segmento]

    const payload = {
      business_name: String(details?.razon_social ?? '').trim() || values.name || '—',
      tax_id: String(baseTaxId ?? '').trim().toUpperCase(),
      applicant: values.applicant,
      phone: values.phone.trim(),
      email: values.email.trim(),
      address: values.address.trim(),
      postalCode: values.postalCode.trim(),
      city: values.city.trim(),
      province: values.province.trim(),
      ...(values.name ? { name: values.name.trim() } : {}),
      ...(values.firstSurname ? { firstSurname: values.firstSurname.trim() } : {}),
      ...(values.secondSurname ? { secondSurname: values.secondSurname.trim() } : {}),
      ...(values.grantorTaxId
        ? { grantorTaxId: values.grantorTaxId.trim().toUpperCase() }
        : { grantorTaxId: String(baseTaxId ?? '').trim().toUpperCase() }),
      ...(details?.id_convocatoria ? { record: String(details.id_convocatoria) } : {}),
      ...(employees ? { employees } : {}),
      ...(values.notes ? { notes: values.notes.trim() } : {}),
    }
    onSubmit?.(payload)
  }

  return (
    <form className="eligibility-modal__form" onSubmit={handleSubmit} noValidate>
      <header className="eligibility-modal__header">
        <h2 className="eligibility-modal__title">
          <span className="eligibility-modal__title-grad">Activa tu bono</span>
        </h2>
        <p className="eligibility-modal__subtitle">
          Completa los datos para enviar la solicitud de activación.
        </p>
      </header>

      {status === 'error' && errorMessage ? (
        <p className="eligibility-modal__form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="eligibility-modal__fields">
        <label className="eligibility-modal__field">
          <span className="eligibility-modal__label">Tipo de solicitante</span>
          <select
            className={`eligibility-modal__select${
              fieldErrors.applicant ? ' eligibility-modal__select--invalid' : ''
            }`}
            name="applicant"
            value={values.applicant}
            onChange={updateField('applicant')}
            disabled={isLoading}
            required
          >
            <option value="PYME">PYME</option>
            <option value="Autonomo">Autónomo</option>
          </select>
          {fieldErrors.applicant ? (
            <span className="eligibility-modal__field-error" role="alert">
              {fieldErrors.applicant}
            </span>
          ) : null}
        </label>

        <div className="eligibility-modal__row">
          <label className="eligibility-modal__field">
            <span className="eligibility-modal__label">Teléfono</span>
            <input
              className={`eligibility-modal__input${
                fieldErrors.phone ? ' eligibility-modal__input--invalid' : ''
              }`}
              type="tel"
              name="phone"
              autoComplete="tel"
              value={values.phone}
              onChange={updateField('phone')}
              disabled={isLoading}
              placeholder="+34 600 000 000"
              required
            />
            {fieldErrors.phone ? (
              <span className="eligibility-modal__field-error" role="alert">
                {fieldErrors.phone}
              </span>
            ) : null}
          </label>

          <label className="eligibility-modal__field">
            <span className="eligibility-modal__label">Email</span>
            <input
              className={`eligibility-modal__input${
                fieldErrors.email ? ' eligibility-modal__input--invalid' : ''
              }`}
              type="email"
              name="email"
              autoComplete="email"
              value={values.email}
              onChange={updateField('email')}
              disabled={isLoading}
              placeholder="nombre@empresa.com"
              required
            />
            {fieldErrors.email ? (
              <span className="eligibility-modal__field-error" role="alert">
                {fieldErrors.email}
              </span>
            ) : null}
          </label>
        </div>

        <div className="eligibility-modal__row">
          <label className="eligibility-modal__field">
            <span className="eligibility-modal__label">Nombre</span>
            <input
              className="eligibility-modal__input"
              type="text"
              name="name"
              autoComplete="given-name"
              value={values.name}
              onChange={updateField('name')}
              disabled={isLoading}
            />
          </label>

          <label className="eligibility-modal__field">
            <span className="eligibility-modal__label">Primer apellido</span>
            <input
              className="eligibility-modal__input"
              type="text"
              name="firstSurname"
              autoComplete="family-name"
              value={values.firstSurname}
              onChange={updateField('firstSurname')}
              disabled={isLoading}
            />
          </label>
        </div>

        <div className="eligibility-modal__row">
          <label className="eligibility-modal__field">
            <span className="eligibility-modal__label">Segundo apellido</span>
            <input
              className="eligibility-modal__input"
              type="text"
              name="secondSurname"
              value={values.secondSurname}
              onChange={updateField('secondSurname')}
              disabled={isLoading}
            />
          </label>

          <label className="eligibility-modal__field">
            <span className="eligibility-modal__label">NIF del firmante</span>
            <input
              className={`eligibility-modal__input${
                fieldErrors.grantorTaxId ? ' eligibility-modal__input--invalid' : ''
              }`}
              type="text"
              name="grantorTaxId"
              value={values.grantorTaxId}
              onChange={updateField('grantorTaxId')}
              disabled={isLoading}
              placeholder="Si difiere del titular"
              maxLength={10}
            />
            {fieldErrors.grantorTaxId ? (
              <span className="eligibility-modal__field-error" role="alert">
                {fieldErrors.grantorTaxId}
              </span>
            ) : null}
          </label>
        </div>

        <label className="eligibility-modal__field">
          <span className="eligibility-modal__label">Dirección</span>
          <input
            className={`eligibility-modal__input${
              fieldErrors.address ? ' eligibility-modal__input--invalid' : ''
            }`}
            type="text"
            name="address"
            autoComplete="street-address"
            value={values.address}
            onChange={updateField('address')}
            disabled={isLoading}
            placeholder="C/ Mayor 1, 2ºA"
            required
          />
          {fieldErrors.address ? (
            <span className="eligibility-modal__field-error" role="alert">
              {fieldErrors.address}
            </span>
          ) : null}
        </label>

        <div className="eligibility-modal__row eligibility-modal__row--3">
          <label className="eligibility-modal__field eligibility-modal__field--cp">
            <span className="eligibility-modal__label">C.P.</span>
            <input
              className={`eligibility-modal__input${
                fieldErrors.postalCode ? ' eligibility-modal__input--invalid' : ''
              }`}
              type="text"
              name="postalCode"
              autoComplete="postal-code"
              value={values.postalCode}
              onChange={updateField('postalCode')}
              disabled={isLoading}
              maxLength={5}
              inputMode="numeric"
              placeholder="38001"
              required
            />
            {fieldErrors.postalCode ? (
              <span className="eligibility-modal__field-error" role="alert">
                {fieldErrors.postalCode}
              </span>
            ) : null}
          </label>

          <label className="eligibility-modal__field">
            <span className="eligibility-modal__label">Población</span>
            <input
              className={`eligibility-modal__input${
                fieldErrors.city ? ' eligibility-modal__input--invalid' : ''
              }`}
              type="text"
              name="city"
              autoComplete="address-level2"
              value={values.city}
              onChange={updateField('city')}
              disabled={isLoading}
              required
            />
            {fieldErrors.city ? (
              <span className="eligibility-modal__field-error" role="alert">
                {fieldErrors.city}
              </span>
            ) : null}
          </label>

          <label className="eligibility-modal__field">
            <span className="eligibility-modal__label">Provincia</span>
            <select
              className={`eligibility-modal__select${
                fieldErrors.province ? ' eligibility-modal__select--invalid' : ''
              }`}
              name="province"
              value={values.province}
              onChange={updateField('province')}
              disabled={isLoading}
              required
            >
              <option value="" disabled>
                Selecciona
              </option>
              {PROVINCIAS_ES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {fieldErrors.province ? (
              <span className="eligibility-modal__field-error" role="alert">
                {fieldErrors.province}
              </span>
            ) : null}
          </label>
        </div>

        <label className="eligibility-modal__field">
          <span className="eligibility-modal__label">Notas</span>
          <textarea
            className="eligibility-modal__input eligibility-modal__textarea"
            name="notes"
            rows={3}
            value={values.notes}
            onChange={updateField('notes')}
            disabled={isLoading}
            placeholder="Opcional"
          />
        </label>
      </div>

      <div className="eligibility-modal__actions">
        <button
          type="button"
          className="eligibility-modal__link"
          onClick={onBack}
          disabled={isLoading}
        >
          Volver
        </button>
        <button
          type="submit"
          className="eligibility-modal__submit"
          disabled={isLoading}
        >
          <span className="eligibility-modal__submit-label">
            {isLoading ? 'Enviando…' : 'Activar bono'}
          </span>
        </button>
      </div>

      <p className="eligibility-modal__hint">
        Al enviar, autorizas a Siweb a tramitar tu solicitud Kit Digital.
      </p>
    </form>
  )
}

const FIELD_ORDER = ['nombre', 'empresa', 'telefono', 'email', 'kit_concedido', 'solucion']

const REQUIRED_MESSAGES = {
  nombre: 'Introduce tu nombre.',
  empresa: 'Introduce tu empresa.',
  telefono: 'Introduce tu teléfono.',
  email: 'Introduce tu email.',
  kit_concedido: 'Selecciona si ya tienes concedido el Kit Digital.',
  solucion: 'Selecciona la solución que te interesa.',
}

function isValidEmail(value) {
  return /^\S+@\S+\.\S+$/.test(value)
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7
}

export function validateLeadForm(form) {
  const errors = {}
  if (!(form instanceof HTMLFormElement)) return errors

  for (const fieldName of FIELD_ORDER) {
    const element = form.elements.namedItem(fieldName)
    if (!(element instanceof HTMLElement)) continue

    const rawValue = 'value' in element ? String(element.value ?? '') : ''
    const value = rawValue.trim()

    if (!value) {
      errors[fieldName] = REQUIRED_MESSAGES[fieldName]
      continue
    }

    if (fieldName === 'email' && !isValidEmail(value)) {
      errors[fieldName] = 'Introduce un email válido.'
      continue
    }

    if (fieldName === 'telefono' && !isValidPhone(value)) {
      errors[fieldName] = 'Introduce un teléfono válido.'
      continue
    }
  }

  return errors
}

export function focusFirstInvalidField(form, errors) {
  if (!(form instanceof HTMLFormElement)) return
  const firstInvalidName = FIELD_ORDER.find((name) => errors[name])
  if (!firstInvalidName) return
  const firstInvalid = form.elements.namedItem(firstInvalidName)
  if (firstInvalid instanceof HTMLElement) firstInvalid.focus()
}

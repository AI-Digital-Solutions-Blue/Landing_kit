/**
 * Helpers para deducir datos del solicitante a partir del NIF/CIF y de la
 * respuesta de red.es (razon_social). Solo heurísticas seguras y reversibles
 * por el usuario en el form.
 */

import provincesByPostalCode from '../data/provincesByPostalCode.json'

const NIF_PERSONA_REGEX = /^[XYZ]?\d{7,8}[A-Z]$/
const CIF_EMPRESA_REGEX = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/
const POSTAL_CODE_REGEX = /^\d{5}$/

/**
 * Deriva el tipo de solicitante a partir del NIF/CIF.
 *
 * Reglas:
 *   - NIF persona (8 dígitos + letra) o NIE (X/Y/Z + 7 dígitos + letra) -> 'Autonomo'
 *   - CIF empresa (letra + 7 dígitos + dígito/letra) -> 'PYME'
 *   - Resto -> 'PYME' (fallback razonable: la mayoría de bonos Kit Digital son PYME)
 */
export function inferApplicant(nifOrCif) {
  const v = String(nifOrCif ?? '').toUpperCase().trim()
  if (NIF_PERSONA_REGEX.test(v)) return 'Autonomo'
  if (CIF_EMPRESA_REGEX.test(v)) return 'PYME'
  return 'PYME'
}

/**
 * Devuelve true si el identificador corresponde a una persona física.
 */
export function isNifPersona(nifOrCif) {
  const v = String(nifOrCif ?? '').toUpperCase().trim()
  return NIF_PERSONA_REGEX.test(v)
}

function capitalizeWord(word) {
  if (!word) return ''
  if (word.length <= 2 && word === word.toUpperCase()) return word
  return word.charAt(0) + word.slice(1).toLowerCase()
}

function capitalizePhrase(phrase) {
  return String(phrase ?? '')
    .trim()
    .split(/\s+/)
    .map(capitalizeWord)
    .join(' ')
}

/**
 * Separa la razón social en nombre y apellidos cuando es persona física.
 * Heurística simple (no siempre acierta con nombres compuestos):
 *   - Primer token  -> name
 *   - Segundo token -> firstSurname
 *   - Resto         -> secondSurname
 *
 * El usuario puede editar los campos en el form si la heurística falla.
 *
 * Para empresas (cuando aplicant es PYME), devuelve todo en `name` y los
 * apellidos vacíos.
 */
export function splitFullName(razonSocial, applicant) {
  const raw = String(razonSocial ?? '').trim()
  if (!raw) return { name: '', firstSurname: '', secondSurname: '' }

  if (applicant === 'PYME') {
    return { name: '', firstSurname: '', secondSurname: '' }
  }

  const tokens = raw.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return { name: '', firstSurname: '', secondSurname: '' }
  if (tokens.length === 1) {
    return { name: capitalizeWord(tokens[0]), firstSurname: '', secondSurname: '' }
  }
  if (tokens.length === 2) {
    return {
      name: capitalizeWord(tokens[0]),
      firstSurname: capitalizeWord(tokens[1]),
      secondSurname: '',
    }
  }
  return {
    name: capitalizeWord(tokens[0]),
    firstSurname: capitalizeWord(tokens[1]),
    secondSurname: capitalizePhrase(tokens.slice(2).join(' ')),
  }
}

export { capitalizePhrase }

/**
 * Devuelve la provincia que corresponde a los dos primeros dígitos del CP
 * español (lookup en el dataset oficial de Correos / INE).
 *
 * Devuelve string vacío si:
 *   - El CP no es válido (no son 5 dígitos)
 *   - Los dos primeros dígitos no están en el rango 01-52
 */
export function inferProvinceFromPostalCode(postalCode) {
  const cp = String(postalCode ?? '').trim()
  if (!POSTAL_CODE_REGEX.test(cp)) return ''
  const prefix = cp.slice(0, 2)
  return provincesByPostalCode[prefix] ?? ''
}

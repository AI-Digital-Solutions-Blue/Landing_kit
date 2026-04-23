/** @returns {'es' | 'com'} */
export function getSiteVariant() {
  if (typeof window === 'undefined') return 'es'
  if (import.meta.env.DEV) {
    const promo = new URLSearchParams(window.location.search).get('promo')
    if (promo === 'com' || promo === 'es') return promo
  }
  const host = window.location.hostname.toLowerCase()
  if (host.endsWith('.com')) return 'com'
  return 'es'
}

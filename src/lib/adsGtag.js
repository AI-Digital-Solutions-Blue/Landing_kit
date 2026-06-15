/** Mismos IDs que en `index.html`. */
export const GOOGLE_ADS_ID = 'AW-16835728915'
export const GA4_ID = 'G-EC7SJ7Z808'

/**
 * Actualiza la página virtual para SPA (hash routing).
 * Evita un segundo `config` en la home sin hash (el `index.html` ya envía el primero).
 */
export function syncGoogleAdsPagePath() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  if (!window.location.hash) return
  const pagePath = `${window.location.pathname}${window.location.hash}`
  window.gtag('config', GOOGLE_ADS_ID, { page_path: pagePath })
  window.gtag('config', GA4_ID, { page_path: pagePath })
}

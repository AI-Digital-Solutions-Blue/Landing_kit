/** Mismo ID que en `index.html` (Google Ads). */
export const GOOGLE_ADS_ID = 'AW-18108890308'

/**
 * Actualiza la página virtual para SPA (hash routing).
 * Evita un segundo `config` en la home sin hash (el `index.html` ya envía el primero).
 */
export function syncGoogleAdsPagePath() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  if (!window.location.hash) return
  const pagePath = `${window.location.pathname}${window.location.hash}`
  window.gtag('config', GOOGLE_ADS_ID, { page_path: pagePath })
}

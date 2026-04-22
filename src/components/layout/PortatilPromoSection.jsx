import './PortatilPromoSection.css'

function getPromoVariant() {
  if (typeof window === 'undefined') return 'es'
  if (import.meta.env.DEV) {
    const promo = new URLSearchParams(window.location.search).get('promo')
    if (promo === 'com' || promo === 'es') return promo
  }
  const host = window.location.hostname.toLowerCase()
  if (host.endsWith('.com')) return 'com'
  return 'es'
}

export function PortatilPromoSection() {
  const variant = getPromoVariant()
  const isEs = variant === 'es'

  return (
    <section
      className="promo-strip"
      aria-label={
        isEs
          ? 'Incluimos un portátil gratis al consumir tu bono con nosotros'
          : 'Consume tu bono con nosotros: gestión, Verifactu, control horario y portátil incluidos'
      }
    >
      <div className={`promo-strip__inner ${isEs ? 'promo-strip__inner--es' : 'promo-strip__inner--com'}`}>
        <div className={`promo-strip__copy ${isEs ? 'promo-strip__copy--es' : 'promo-strip__copy--com'}`}>
          {isEs ? (
            <>
              <p className="promo-strip__paragraph promo-strip__paragraph--es-intro">
                Por consumir tu bono con nosotros te incluimos un
              </p>
              <p className="promo-strip__paragraph promo-strip__paragraph--es-highlight">
                portátil <strong>completamente gratis</strong>
              </p>
            </>
          ) : (
            <>
              <p className="promo-strip__paragraph">Consume tu bono con nosotros y te regalamos a</p>
              <p className="promo-strip__paragraph">gestión de clientes y facturación electrónica con</p>
              <p className="promo-strip__paragraph">Verifactu, control horario y portátil incluidos</p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

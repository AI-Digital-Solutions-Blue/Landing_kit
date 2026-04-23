import './MainSection.css'
import { CtaOpenModalLink } from './CtaOpenModalLink'
import { getSiteVariant } from '../../utils/siteVariant'

const heroImageSrc = `/imagenes/${encodeURIComponent('PC 1 1.png')}`
const listIconSrc = `/svg/${encodeURIComponent('iconLis.svg')}`

const heroBulletsEs = [
  'Sin coste para ti',
  'Sin IVA (empresa canaria)',
  'Verifactu incluido',
  'Portátil de regalo',
]

const heroBulletsCom = [
  'Programa de gestión y facturación, con tu bono',
  'Verifactu hasta 2027',
  'Control horario digital hasta 2027',
  'Portátil de regalo',
]

const heroComPerks = ['Sin coste para ti', 'Sin IVA (empresa canaria)']
const heroPerkTickSrc = '/tick.svg'
const heroBadgeMonitorSrc = '/monitor.svg?v=2'

export function MainSection() {
  const variant = getSiteVariant()
  const isCom = variant === 'com'
  const heroBullets = isCom ? heroBulletsCom : heroBulletsEs

  return (
    <section className="hero" aria-labelledby="hero-heading hero-subheading">
      <div className="hero__grid">
        <section className="hero__content">
          <div className={`hero__content-box${isCom ? ' hero__content-box--com' : ''}`}>
            <p className="hero__badge">
              <span className="hero__badge-inner">
                <img
                  className="hero__badge-icon"
                  src={heroBadgeMonitorSrc}
                  alt=""
                  width={26}
                  height={26}
                  loading="eager"
                  decoding="async"
                  aria-hidden="true"
                />
                <span className="hero__badge-text">Kit Digital · Bonos Vigentes 2025</span>
              </span>
            </p>

            <div className="hero__headlines">
              {isCom ? (
                <>
                  <h1 id="hero-heading" className="hero__title">
                    <span className="hero__title-line">
                      Consume <span className="hero__accent">tu bono</span> <br /> Kit Digital
                    </span>
                  </h1>
                  <h2 id="hero-subheading" className="hero__subtitle hero__subtitle--com">
                    Siweb te <span className="hero__accent">regala</span> el resto.
                  </h2>
                </>
              ) : (
                <>
                  <h1 id="hero-heading" className="hero__title">
                    <span className="hero__title-line">
                      Consume <span className="hero__accent">tu bono</span>
                    </span>
                    <span className="hero__title-line">
                      Te cuesta <span className="hero__accent">0 €</span>
                    </span>
                  </h1>
                  <h2 id="hero-subheading" className="hero__subtitle">
                    Te regalamos <span className="hero__accent">un portátil</span>
                  </h2>
                </>
              )}
            </div>

            {isCom ? (
              <div className="hero__lead-stack">
                <p className="hero__lead">
                  Contrata el programa de <strong>gestión de clientes y factura electrónica</strong>
                  <br />
                  con tu Kit Digital. Nosotros incluimos <strong>Verifactu</strong>, control horario digital
                  <br />
                  y un portátil. Sin trámites con la administración, sin coste adicional.
                </p>
              </div>
            ) : (
              <p className="hero__lead">
                Tienes un bono Kit Digital concedido que caduca en menos de 6
                <br />
                meses. Úsalo con Siweb Canarias y <strong>llévate un portátil de regalo</strong>
                <br />
                sin IVA, sin costes ocultos.
              </p>
            )}

            {isCom ? (
              <ul className="hero__perks" aria-label="Ventajas principales">
                {heroComPerks.map((line) => (
                  <li key={line} className="hero__perks-item">
                    <span className="hero__perks-icon-wrap" aria-hidden="true">
                      <img
                        className="hero__perk-icon"
                        src={heroPerkTickSrc}
                        alt=""
                        width={30}
                        height={30}
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                    <span className="hero__perks-text">{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="hero__actions">
              <CtaOpenModalLink className="hero__btn hero__btn--outline">Activar mi bono</CtaOpenModalLink>
              <CtaOpenModalLink className="hero__btn hero__btn--solid">¿Cómo funciona?</CtaOpenModalLink>
            </div>

            <ul className="hero__list">
              {heroBullets.map((line) => (
                <li key={line} className="hero__list-item">
                  <span className="hero__list-icon-wrap" aria-hidden="true">
                    <img
                      className="hero__list-icon"
                      src={listIconSrc}
                      alt=""
                      width={27}
                      height={27}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className="hero__list-text">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="hero__media" aria-label="Portátiles incluidos en la promoción">
          <img
            className="hero__img"
            src={heroImageSrc}
            alt="Portátiles incluidos en la promoción Kit Digital"
            width={800}
            height={600}
            loading="eager"
            decoding="async"
          />
        </section>
      </div>
    </section>
  )
}

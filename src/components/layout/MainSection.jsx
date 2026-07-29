import './MainSection.css'
import { CtaOpenLeadModalLink } from './CtaOpenLeadModalLink'
import { getSiteVariant } from '../../utils/siteVariant'

//const heroImageSrc = '/imagenes/hero-lenovo.png'
const heroImageSrc = '/imagenes/hero-cocomm.png'
const listIconSrc = `/svg/${encodeURIComponent('iconLis.svg')}`

const heroBulletsEs = [
  'Sin coste para ti',
  'Sin IVA (empresa canaria)',
  'Verifactu incluido',
  'Portátil de regalo',
]

const heroBulletsCom = [
  'Sin coste para ti',
  'Sin IVA (empresa canaria)',
  'Verifactu hasta 2027',
  'Portátil de regalo',
  'Programa de gestión y facturación, con tu bono',
  'Control horario digital hasta 2027',
]
const heroBadgeMonitorSrc = '/monitor.svg?v=2'

export function MainSection() {
  const variant = getSiteVariant()
  const isCom = variant === 'com'
  const heroBullets = isCom ? heroBulletsCom : heroBulletsEs

  return (
    <section className={`hero${isCom ? ' hero--com' : ''}`} aria-labelledby="hero-heading hero-subheading">
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
                      Consume <span className="hero__accent">tu Kit Digital</span>
                    </span>
                    <span className="hero__title-line">
                      en servicios
                    </span>
                  </h1>
                  <h2 id="hero-subheading" className="hero__subtitle hero__subtitle--com">
                    Y Siweb te <span className="hero__accent">regala</span> este portátil.
                  </h2>
                </>
              ) : (
                <>
                  <h1 id="hero-heading" className="hero__title">
                    <span className="hero__title-line">
                      Consume los <span className="hero__accent">3.000€</span> de tu
                    </span>
                    <span className="hero__title-line">
                      Kit Digital <span className="hero__accent">en servicios</span>
                    </span>
                  </h1>
                  <h2 id="hero-subheading" className="hero__subtitle">
                    Y Siweb te regala <span className="hero__accent">este portátil.</span>
                  </h2>
                </>
              )}
            </div>

            {isCom ? (
              <div className="hero__lead-stack">
                <p className="hero__lead">
                  Contrata el programa de <strong>gestión de clientes y factura electrónica</strong> con tu Kit Digital.
                  <br />
                  Nosotros incluimos <strong>Verifactu, control horario digital</strong> y un <strong>portátil</strong>. Sin trámites con la
                  <br />
                  administración, sin coste adicional.
                </p>
              </div>
            ) : (
              <p className="hero__lead">
                Tienes un bono Kit Digital concedido que caduca en menos de 6 meses.
              
                Úsalo   <br />con Siweb Canarias y <strong>llévate un portátil de regalo</strong> sin IVA, sin costes ocultos.
              </p>
            )}

            <div className="hero__actions">
              <CtaOpenLeadModalLink className="hero__btn hero__btn--outline">Activar mi bono</CtaOpenLeadModalLink>
              <CtaOpenLeadModalLink className="hero__btn hero__btn--solid">¿Cómo funciona?</CtaOpenLeadModalLink>
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

            <p className="hero__offer">OFERTA VÁLIDA PARA LOS 100 PRIMEROS</p>
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

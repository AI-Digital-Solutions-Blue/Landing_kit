import './MainSection.css'
import { CtaOpenModalLink } from './CtaOpenModalLink'

const heroImageSrc = `/imagenes/${encodeURIComponent('PC 1 1.png')}`
const listIconSrc = `/svg/${encodeURIComponent('iconLis.svg')}`

const heroBullets = [
  'Sin coste para ti',
  'Sin IVA (empresa canaria)',
  'Verifactu incluido',
  'Portátil de regalo',
]

export function MainSection() {
  return (
    <section className="hero" aria-labelledby="hero-heading hero-subheading">
        <div className="hero__grid">
          <section className="hero__content">
            <div className="hero__content-box">
              <p className="hero__badge">
                <span className="hero__badge-inner">
                  <svg
                    className="hero__badge-icon"
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    focusable="false"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M4 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v8h12V6H6zm-2 10h16a1 1 0 010 2H4a1 1 0 010-2z"
                    />
                  </svg>
                  <span className="hero__badge-text">Kit Digital · Bonos Vigentes 2025</span>
                </span>
              </p>

              <div className="hero__headlines">
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
              </div>

              <p className="hero__lead">
                Tienes un bono Kit Digital concedido que caduca en menos de 6
                <br />
                meses. Úsalo con Siweb Canarias y <strong>llévate un portátil de regalo</strong>
                <br />
                sin IVA, sin costes ocultos.
              </p>

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

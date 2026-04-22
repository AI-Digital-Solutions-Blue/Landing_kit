import './KitDigitalSection.css'
import { CtaOpenModalLink } from './CtaOpenModalLink'

const imageSrc = `/imagenes/${encodeURIComponent('img4.jpg')}`

export function KitDigitalSection() {
  return (
    <section className="kit-digital" aria-labelledby="kit-digital-heading">
      <div className="kit-digital__grid">
        <div className="kit-digital__content">
          <h2 id="kit-digital-heading" className="kit-digital__title">
            <span className="kit-digital__title-prefix">Tu Kit Digital </span>
            <span className="kit-digital__title-gradient">
              ya está concedido. Ahora toca aprovecharlo bien.
            </span>
          </h2>
          <p className="kit-digital__lead">
            Muchos autónomos y pequeñas empresas tienen el <strong>bono aprobado</strong>, pero todavía no lo
            han activado. En <strong>Siweb</strong> te ayudamos a convertirlo en una solución práctica, útil y
            fácil de poner en marcha.
          </p>
          <CtaOpenModalLink className="kit-digital__btn">Quiero activar mi bono</CtaOpenModalLink>
        </div>
        <div className="kit-digital__media">
          <img
            className="kit-digital__img"
            src={imageSrc}
            alt="Profesional trabajando con su portátil"
            width={640}
            height={480}
            loading="lazy"
            decoding="async"
          />
        </div>
        
      </div>
    </section>
  )
}

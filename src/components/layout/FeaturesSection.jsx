import './FeaturesSection.css'
import { CtaOpenModalLink } from './CtaOpenModalLink'

const img = (name) => `/imagenes/${encodeURIComponent(name)}`

const items = [
  {
    title: 'Gestión de clientes con Sygna',
    image: 'img1.jpg',
    imageAlt: 'Gestión de clientes y panel de datos con Sygna',
    body: (
      <>
        Organiza contactos, centraliza la información de tus clientes, organiza tu actividad comercial y trabaja con una{' '}
        <strong>visión clara de tu negocio.</strong>
      </>
    ),
  },
  {
    title: 'Factura electrónica con Sygna',
    image: 'img2.png',
    imageAlt: 'Facturación electrónica y listado de facturas con Sygna',
    body: (
      <>
        Facturación con una solución práctica para el día a día. <strong>Simplifica tu operativa diaria</strong> con una
        solución preparada para emitir y gestionar facturas de forma más ágil.
      </>
    ),
  },
  {
    title: 'Equipo informático totalmente gratis',
    image: 'img3.jpg',
    imageAlt: 'Equipos portátiles incluidos en la promoción',
    body: (
      <>
        Completa tu Kit Digital con un <strong>dispositivo adaptado a tu actividad</strong> y empieza a trabajar con tu
        solución desde el primer día.
      </>
    ),
  },
]

export function FeaturesSection() {
  return (
    <section className="features" aria-labelledby="features-heading">
      <h2 id="features-heading" className="features__title">
        La opción más completa para tu gestión diaria
      </h2>

      <div className="features__grid">
        {items.map((item) => (
          <article key={item.title} className="features__card">
            <h3 className="features__card-title">{item.title}</h3>
            <div className="features__media">
              <img
                className="features__img"
                src={img(item.image)}
                alt={item.imageAlt}
                width={400}
                height={260}
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="features__text">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="features__actions">
        <CtaOpenModalLink className="features__btn">Quiero activar mi bono</CtaOpenModalLink>
      </div>
    </section>
  )
}

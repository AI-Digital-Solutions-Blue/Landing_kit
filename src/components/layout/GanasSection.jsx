import './GanasSection.css'
import { CtaOpenModalLink } from './CtaOpenModalLink'

const img = (name) => `/imagenes/${encodeURIComponent(name)}`
const svg = (name) => `/svg/${encodeURIComponent(name)}`

/** Iconos encima del título (izq.→der.) — nombres en `public/svg/` */
const cardIcons = ['GroupLi1.svg', 'Groupli2.svg', 'Grouol3.svg', 'Groupl4.svg']

/** Fondo por tarjeta (izq.→der.): `li1.jpg` … `li4.jpg` en `public/imagenes/` */
const cards = [
  {
    title: 'Portátil de regalo',
    body: (
      <>
        Incluido <strong>sin coste adicional</strong> en cualquier solución que elijas. Valorado en 550 €.
      </>
    ),
  },
  {
    title: 'Sin IVA',
    body: (
      <>
        Al ser empresa radicada en Canarias, <strong>nuestros servicios están exentos de IVA</strong>. Algo que muy
        pocos agentes pueden ofrecerte.
      </>
    ),
  },
  {
    title: 'Verifactu resuelto',
    body: (
      <>
        Con Sygna quedas <strong>adaptado a la normativa de facturación</strong> electrónica desde el primer día, sin
        esperar al último momento.
      </>
    ),
  },
  {
    title: 'Fichaje obligatorio',
    body: (
      <>
        <strong>El registro de jornada será exigible</strong> en breve. Ya lo tienes implantado antes de que llegue la
        fecha.
      </>
    ),
  },
]

export function GanasSection() {
  return (
    <section className="ganas" aria-labelledby="ganas-heading">
      <div className="ganas__inner">
        <header className="ganas__header">
          <h2 id="ganas-heading" className="ganas__title">
            Todo lo que ganas. Nada que perder.
          </h2>
          <p className="ganas__lead">
            Un bono que ya tienes aprobado, <strong>cero euros de desembolso</strong> y cuatro problemas resueltos de
            golpe.
          </p>
          <CtaOpenModalLink className="ganas__btn">Quiero activar mi bono</CtaOpenModalLink>
        </header>

        <div className="ganas__cards">
          {cards.map((card, index) => (
            <article
              key={card.title}
              className="ganas__card"
              style={{
                '--ganas-card-bg': `url("${img(`li${index + 1}.jpg`)}")`,
              }}
            >
              <div className="ganas__card-inner">
                <div className="ganas__card-icon-wrap" aria-hidden="true">
                  <img
                    className="ganas__card-icon"
                    src={svg(cardIcons[index])}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3 className="ganas__card-title">{card.title}</h3>
                <p className="ganas__card-text">{card.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

import './KitSolutionsSection.css'
import { CtaOpenModalLink } from './CtaOpenModalLink'

const svg = (filename) => `/svg/${encodeURIComponent(filename)}`

/** Columna izquierda: Group 1–3. Columna derecha: Group 4–6 (`public/svg/Group1.svg` … `Group6.svg`). */
const solutions = [
  {
    group: 1,
    title: 'Página web',
    body: 'Crea o renueva la presencia online de tu negocio con una web profesional.',
  },
  {
    group: 2,
    title: 'Tienda online',
    body: 'Empieza a vender por internet con una solución adaptada a tu negocio.',
  },
  {
    group: 3,
    title: 'Redes sociales',
    body: 'Mejora tu presencia digital y gana visibilidad donde está tu audiencia.',
  },
  {
    group: 4,
    title: 'SEO',
    body: 'Potencia tu posicionamiento y mejora la visibilidad de tu negocio en buscadores.',
  },
  {
    group: 5,
    title: 'Business Intelligence y Analítica',
    body: 'Información clave para entender mejor tu negocio y tomar decisiones con criterio.',
  },
  {
    group: 6,
    title: 'Puesto de trabajo seguro',
    body: 'Equipa tu actividad con una solución orientada a trabajar con más seguridad.',
  },
]

const leftCol = solutions.slice(0, 3)
const rightCol = solutions.slice(3)

function SolutionsColumn({ items }) {
  return (
    <ul className="kit-solutions__col">
      {items.map((item) => (
        <li key={item.title} className="kit-solutions__item">
          <div className="kit-solutions__icon-wrap" aria-hidden="true">
            <img
              className="kit-solutions__icon"
              src={svg(`Group${item.group}.svg`)}
              alt=""
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="kit-solutions__body">
            <h3 className="kit-solutions__item-title">{item.title}</h3>
            <p className="kit-solutions__item-text">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function KitSolutionsSection() {
  return (
    <section className="kit-solutions" aria-labelledby="kit-solutions-heading">
      <div className="kit-solutions__inner">
        <header className="kit-solutions__header">
          <h2 id="kit-solutions-heading" className="kit-solutions__title">
            <span className="kit-solutions__title-line">Soluciones disponibles con </span>
            <span className="kit-solutions__title-accent">tu Kit Digital</span>
          </h2>
          <p className="kit-solutions__subtitle">
            Además de gestión de clientes y factura electrónica, también puedes consumir tu bono con estas soluciones
          </p>
        </header>

        <div className="kit-solutions__cols">
          <SolutionsColumn items={leftCol} />
          <SolutionsColumn items={rightCol} />
        </div>

        <div className="kit-solutions__actions">
          <CtaOpenModalLink className="kit-solutions__btn">Quiero activar mi bono</CtaOpenModalLink>
        </div>
      </div>
    </section>
  )
}

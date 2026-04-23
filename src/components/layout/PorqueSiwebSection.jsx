import './PorqueSiwebSection.css'

const imageSrc = `/imagenes/${encodeURIComponent('team.png')}`
const tickSrc = '/tick.svg'

const items = [
  {
    title: 'Soluciones útiles para el día a día',
    body: (
      <>
        No solo <strong>digitalizas tu negocio</strong>: incorporas herramientas que realmente vas a utilizar.
      </>
    ),
  },
  {
    title: 'Acompañamiento durante el proceso',
    body: (
      <>
        <strong>Te orientamos</strong> para que elijas la opción más adecuada para tu empresa.
      </>
    ),
  },
  {
    title: 'Más fácil, más claro, más práctico',
    body: (
      <>Reducimos la complejidad para que actives <strong>tu bono sin complicarte.</strong></>
    ),
  },
]

export function PorqueSiwebSection() {
  return (
    <section className="porque-siweb" aria-labelledby="porque-siweb-heading">
      <div className="porque-siweb__inner">
        <div className="porque-siweb__card">
          <div className="porque-siweb__media">
            <img
              className="porque-siweb__img"
              src={imageSrc}
              alt="Equipo Siweb Canarias"
              width={640}
              height={480}
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="porque-siweb__content">
            <h2 id="porque-siweb-heading" className="porque-siweb__title">
              Por qué activarlo con Siweb
            </h2>
            <ul className="porque-siweb__list">
              {items.map((item) => (
                <li key={item.title} className="porque-siweb__item">
                  <span className="porque-siweb__item-icon" aria-hidden="true">
                    <img className="porque-siweb__tick" src={tickSrc} alt="" width={30} height={30} loading="lazy" decoding="async" />
                  </span>
                  <div className="porque-siweb__item-body">
                    <h3 className="porque-siweb__item-title">{item.title}</h3>
                    <p className="porque-siweb__item-text">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

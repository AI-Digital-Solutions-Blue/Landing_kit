import './PatrociniosSection.css'

/** Logos en `public/imagenes/` + copy bajo cada marca */
const PATROCINIO_LOGOS = [
  {
    id: 'celta',
    name: 'RC Celta',
    src: '/imagenes/celta.png',
    text: 'Patrocinador oficial del\nRC Celta.',
    largeLogo: true,
  },
  {
    id: 'sociedad',
    name: 'Real Sociedad',
    src: '/imagenes/sociedad.png',
    text: 'Patrocinador oficial del\nReal Sociedad.',
    largeLogo: true,
  },
  {
    id: 'capital',
    name: 'Capital',
    src: '/imagenes/capital.png',
    text: 'Premio Capital 2024 al mejor\nproyecto de transformación digital.',
  },
  {
    id: 'razon',
    name: 'La Razón',
    src: '/imagenes/razon.png',
    text: 'Premio Ejecutivo del Año en\nInnovación y Transformación Digital.',
  },
]

function PatrocinioLogo({ name, src, largeLogo }) {
  if (src) {
    return (
      <img
        className={
          largeLogo ? 'patrocinios__logo-img patrocinios__logo-img--large' : 'patrocinios__logo-img'
        }
        src={src}
        alt={name}
        width={largeLogo ? 200 : 160}
        height={largeLogo ? 64 : 48}
        loading="lazy"
        decoding="async"
      />
    )
  }
  return (
    <span className="patrocinios__logo-placeholder">
      <span className="patrocinios__logo-placeholder-inner">{name}</span>
    </span>
  )
}

export function PatrociniosSection() {
  return (
    <section className="patrocinios" aria-label="Patrocinios y reconocimientos">
      <div className="patrocinios__inner">
        <div className="patrocinios__viewport">
          <div className="patrocinios__track">
            <ul className="patrocinios__group" role="list">
              {PATROCINIO_LOGOS.map((item) => (
                <li key={item.id} className="patrocinios__item">
                  <div className="patrocinios__card">
                    <PatrocinioLogo name={item.name} src={item.src} largeLogo={item.largeLogo} />
                    <p className="patrocinios__caption">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <ul className="patrocinios__group patrocinios__group--duplicate" role="presentation" aria-hidden="true">
              {PATROCINIO_LOGOS.map((item) => (
                <li key={`dup-${item.id}`} className="patrocinios__item">
                  <div className="patrocinios__card">
                    <PatrocinioLogo name={item.name} src={item.src} largeLogo={item.largeLogo} />
                    <p className="patrocinios__caption">{item.text}</p>
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

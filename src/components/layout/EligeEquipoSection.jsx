import './EligeEquipoSection.css'

const imageSrc = `/imagenes/${encodeURIComponent('lapcolour.png')}`
const listIconSrc = `/svg/${encodeURIComponent('iconLis.svg')}`

const equipos = [
  'Ryzen 5, 16GB de RAM, 512GB SSD',
  'Lenovo ThinkPad E16 16”',
  'Lenovo M75q + pantalla 23.8”',
  'Apple MacBook NEO',
]

export function EligeEquipoSection() {
  return (
    <section className="elige-equipo" aria-labelledby="elige-equipo-heading">
      <div className="elige-equipo__inner">
        <div className="elige-equipo__grid">
          <div className="elige-equipo__media">
            <img
              className="elige-equipo__img"
              src={imageSrc}
              alt="Variedad de portátiles disponibles para tu Kit Digital"
              width={720}
              height={480}
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="elige-equipo__content">
            <h2 id="elige-equipo-heading" className="elige-equipo__title">
              <span className="elige-equipo__title-dark">Elige tu </span>
              <span className="elige-equipo__title-accent">equipo</span>
            </h2>
            <p className="elige-equipo__lead">
              Disponemos de varias opciones para completar tu solución <strong>Kit Digital</strong>. Consulta el PDF
              descargable para ver modelos, características y condiciones.
            </p>
            <ul className="elige-equipo__list">
              {equipos.map((line) => (
                <li key={line} className="elige-equipo__list-item">
                  <span className="elige-equipo__list-icon-wrap">
                    <img
                      className="elige-equipo__bullet-icon"
                      src={listIconSrc}
                      alt=""
                      
                      width={27}
                      height={27}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className="elige-equipo__list-text">{line}</span>
                </li>
              ))}
            </ul>
            <a className="elige-equipo__btn" href="/descargas/Catalogo.pdf" download>
              Descargar PDF
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

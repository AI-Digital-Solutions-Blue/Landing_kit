import './KitDigitalLogosSection.css'

const logosSrc = '/imagenes/kitdigital-logos.png'

export function KitDigitalLogosSection() {
  return (
    <section
      className="kd-logos"
      aria-label="Programa Kit Digital · Financiado por la Unión Europea - NextGenerationEU"
    >
      <div className="kd-logos__inner">
        <img
          className="kd-logos__img"
          src={logosSrc}
          alt="Gobierno de España · Vicepresidencia Primera del Gobierno · Ministerio de Asuntos Económicos y Transformación Digital · Secretaría de Estado de Digitalización e Inteligencia Artificial · Red.es · Kit Digital · Plan de Recuperación, Transformación y Resiliencia · Financiado por la Unión Europea - NextGenerationEU"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  )
}

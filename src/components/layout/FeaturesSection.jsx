import { useEffect, useRef, useState } from 'react'
import './FeaturesSection.css'
import { CtaOpenLeadModalLink } from './CtaOpenLeadModalLink'

const img = (name) => `/imagenes/${encodeURIComponent(name)}`

const items = [
  {
    title: 'Gestión de clientes con Sygna',
    image: 'img1.jpg',
    imageAlt: 'Gestión de clientes y panel de datos con Sygna',
    body: (
      <>
        Registra la jornada laboral de tu equipo, controla horas trabajadas, ausencias y horas extra, y{' '}
        <strong>cumple con la normativa vigente</strong> y obtén informes en tiempo real.
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

const AUTOPLAY_MS = 5000
const SWIPE_THRESHOLD = 40

export function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const touchStartXRef = useRef(null)
  const autoplayRef = useRef(null)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!isMobile) return undefined
    autoplayRef.current = window.setInterval(() => {
      setActiveIndex((idx) => (idx + 1) % items.length)
    }, AUTOPLAY_MS)
    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current)
    }
  }, [isMobile])

  const resetAutoplay = () => {
    if (!isMobile) return
    if (autoplayRef.current) window.clearInterval(autoplayRef.current)
    autoplayRef.current = window.setInterval(() => {
      setActiveIndex((idx) => (idx + 1) % items.length)
    }, AUTOPLAY_MS)
  }

  const goTo = (idx) => {
    setActiveIndex(((idx % items.length) + items.length) % items.length)
    resetAutoplay()
  }

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.touches[0].clientX
  }

  const handleTouchEnd = (event) => {
    const startX = touchStartXRef.current
    if (startX == null) return
    const endX = event.changedTouches[0].clientX
    const delta = endX - startX
    touchStartXRef.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    if (delta < 0) goTo(activeIndex + 1)
    else goTo(activeIndex - 1)
  }

  return (
    <section className="features" aria-labelledby="features-heading">
      <h2 id="features-heading" className="features__title">
        La opción más<br className="features__title-br-mobile" /> completa para tu<br className="features__title-br-mobile" /> gestión diaria
      </h2>

      <div
        className="features__grid"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, idx) => (
          <article
            key={item.title}
            className={`features__card${activeIndex === idx ? ' features__card--active' : ''}`}
            data-index={idx}
            aria-hidden={isMobile && activeIndex !== idx}
          >
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

      <div className="features__dots" role="tablist" aria-label="Selector de tarjeta">
        {items.map((item, idx) => (
          <button
            key={item.title}
            type="button"
            role="tab"
            aria-selected={activeIndex === idx}
            aria-label={`Ir a la tarjeta ${idx + 1}: ${item.title}`}
            className={`features__dot${activeIndex === idx ? ' features__dot--active' : ''}`}
            onClick={() => goTo(idx)}
          />
        ))}
      </div>

      <div className="features__actions">
        <CtaOpenLeadModalLink className="features__btn">Quiero activar mi bono</CtaOpenLeadModalLink>
      </div>
    </section>
  )
}

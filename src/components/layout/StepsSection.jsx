import './StepsSection.css'

const stepNumberSvgs = [
  `/svg/${encodeURIComponent('01 (Stroke).svg')}`,
  `/svg/${encodeURIComponent('02 (Stroke).svg')}`,
  `/svg/${encodeURIComponent('03 (Stroke).svg')}`,
  `/svg/${encodeURIComponent('04 (Stroke).svg')}`,
]

const steps = [
  {
    title: 'Contacta con nosotros',
    body: (
      <>
        Nos <strong>llamas o rellenas el formulario.</strong> Nosotros verificamos el estado de tu bono y te
        presentamos la propuesta en minutos.
      </>
    ),
  },
  {
    title: 'Eliges tu solución',
    body: (
      <>
        Facturación electrónica, CRM u otras. Nosotros <strong>te asesoramos</strong> según tu negocio.
      </>
    ),
  },
  {
    title: 'Firmamos y tramitamos',
    body: (
      <>Gestionamos toda la documentación del Kit Digital. <strong>Sin burocracia</strong> para ti.</>
    ),
  },
  {
    title: 'Recibes el portátil',
    body: (
      <>
        En cuanto el expediente esté en marcha, te enviamos el <strong>portátil de regalo.</strong>
      </>
    ),
  },
]

export function StepsSection() {
  return (
    <section className="steps" aria-label="Cómo funciona">
      <ol className="steps__list">
        {steps.map((step, index) => (
          <li key={step.title} className="steps__item">
            <div className="steps__num" aria-hidden="true">
              <div className="steps__num-slot" data-step={index + 1}>
                <img
                  className="steps__num-img"
                  src={stepNumberSvgs[index]}
                  alt=""
                  width={index === 0 ? 58 : 68}
                  height={index === 0 ? 52 : 60}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            <div className="steps__body">
              <h3 className="steps__title">{step.title}</h3>
              <p className="steps__text">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

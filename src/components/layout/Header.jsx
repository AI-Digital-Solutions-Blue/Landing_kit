import './Header.css'
import { useContactModal } from '../../context/ContactModalContext'

export function Header() {
  const { openLeadModal } = useContactModal()

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href="#">
          Siweb
        </a>
        <div className="site-header__actions">
          <a
            className="site-header__btn site-header__btn--outline"
            href="tel:+34828151082"
          >
            Llámanos
          </a>
          <a
            className="site-header__btn site-header__btn--primary"
            href="#contacto"
            onClick={(e) => {
              e.preventDefault()
              openLeadModal()
            }}
          >
            Quiero mi bono
          </a>
        </div>
      </div>
    </header>
  )
}

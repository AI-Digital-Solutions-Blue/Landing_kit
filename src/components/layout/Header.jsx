import './Header.css'
import { CtaOpenModalLink } from './CtaOpenModalLink'
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
          <CtaOpenModalLink className="site-header__btn site-header__btn--outline">Llámanos</CtaOpenModalLink>
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

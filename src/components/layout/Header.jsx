import './Header.css'
import { CtaOpenModalLink } from './CtaOpenModalLink'

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href="#">
          Siweb
        </a>
        <div className="site-header__actions">
          <a className="site-header__btn site-header__btn--outline" href="tel:+34828151082">
            Llámanos
          </a>
          <CtaOpenModalLink className="site-header__btn site-header__btn--primary">Quiero mi bono</CtaOpenModalLink>
        </div>
      </div>
    </header>
  )
}

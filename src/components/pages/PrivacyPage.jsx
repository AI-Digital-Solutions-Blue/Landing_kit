import { useEffect } from 'react'
import privacyArticleHtml from '../../legal/privacy-article.html?raw'
import './TermsPage.css'

const DEFAULT_TITLE = 'Kit Digital | Siweb'

function goToHome(event) {
  event?.preventDefault?.()
  window.location.hash = ''
}

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Política de privacidad | Siweb'
    window.scrollTo(0, 0)
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [])

  return (
    <div className="terms-page">
      <div className="terms-page__bar">
        <a className="terms-page__back" href="/" onClick={goToHome}>
          ← Volver al inicio
        </a>
        <a className="terms-page__brand" href="/" onClick={goToHome}>
          Siweb
        </a>
      </div>
      <main className="terms-page__main" id="main-content">
        <h1 className="terms-page__title">Política de privacidad</h1>
        <article
          className="terms-page__article"
          dangerouslySetInnerHTML={{ __html: privacyArticleHtml }}
        />
      </main>
    </div>
  )
}

import { useEffect } from 'react'
import termsArticleHtml from '../../legal/terms-article.html?raw'
import './TermsPage.css'

const DEFAULT_TITLE = 'landing-kit'

export function goToHome(event) {
  event?.preventDefault?.()
  window.location.hash = ''
}

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Términos y condiciones | Siweb'
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
        <h1 className="terms-page__title">Términos y condiciones</h1>
        <article
          className="terms-page__article"
          dangerouslySetInnerHTML={{ __html: termsArticleHtml }}
        />
      </main>
    </div>
  )
}

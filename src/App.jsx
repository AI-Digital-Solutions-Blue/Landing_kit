import { useEffect, useState } from 'react'
import { syncGoogleAdsPagePath } from './lib/adsGtag'
import './styles/base.css'
import './styles/poppins-weights.css'
import './styles/layout.css'
import { ContactModalProvider } from './context/ContactModalContext'
import { Layout } from './components/layout/Layout'
import TermsPage from './components/pages/TermsPage'
import PrivacyPage from './components/pages/PrivacyPage'

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, '').replace(/^\/+/, '').toLowerCase()
  if (raw === 'terminos') return 'terminos'
  if (raw === 'privacidad') return 'privacidad'
  return 'home'
}

export default function App() {
  const [route, setRoute] = useState(parseRoute)

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    syncGoogleAdsPagePath()
  }, [route])

  return (
    <ContactModalProvider>
      {route === 'terminos' ? <TermsPage /> : route === 'privacidad' ? <PrivacyPage /> : <Layout />}
    </ContactModalProvider>
  )
}

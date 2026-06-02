import { Header } from './Header'
import { MainSection } from './MainSection'
import { PatrociniosSection } from './PatrociniosSection'
import { PortatilPromoSection } from './PortatilPromoSection'
import { KitDigitalLogosSection } from './KitDigitalLogosSection'
import { FeaturesSection } from './FeaturesSection'
import { KitDigitalSection } from './KitDigitalSection'
import { KitSolutionsSection } from './KitSolutionsSection'
import { GanasSection } from './GanasSection'
import { PorqueSiwebSection } from './PorqueSiwebSection'
import { ProyectosKitSection } from './ProyectosKitSection'
import { KitCtaFormSection } from './KitCtaFormSection'
import { StepsSection } from './StepsSection'
import { Footer } from './Footer'
import { ContactFormModal } from './ContactFormModal'
import { LeadFormModal } from './LeadFormModal'
import { EligibilityModal } from './EligibilityModal'
import { FloatingContactButton } from './FloatingContactButton'

export function Layout() {
  return (
    <>
      <LeadFormModal />
      <EligibilityModal />
      <Header />
      <main className="site-main">
        <MainSection />
        <PatrociniosSection />
        <PortatilPromoSection />
        <KitDigitalLogosSection />
        <FeaturesSection />
        <KitDigitalSection />
        <StepsSection />
        <KitSolutionsSection />
        <GanasSection />
        <ProyectosKitSection />
        <PorqueSiwebSection />
        <KitCtaFormSection />
      </main>
      <ContactFormModal />
      <FloatingContactButton />
      <Footer />
    </>
  )
}

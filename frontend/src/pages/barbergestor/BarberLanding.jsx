import { useScrollAnimation } from './hooks/useScrollAnimation'
import { NavbarSection } from './sections/NavbarSection'
import { HeroSection } from './sections/HeroSection'
import { FeaturesSection } from './sections/FeaturesSection'
import { AgendaSection } from './sections/AgendaSection'
import { FinanceSection } from './sections/FinanceSection'
import { CollaboratorsSection } from './sections/CollaboratorsSection'
import { MobileSection } from './sections/MobileSection'
import { TestimonialsSection } from './sections/TestimonialsSection'
import { PricingSection } from './sections/PricingSection'
import { FAQSection } from './sections/FAQSection'
import { CTASection } from './sections/CTASection'
import { FooterSection } from './sections/FooterSection'
import './BarberLanding.css'

export default function BarberLanding() {
  useScrollAnimation()

  return (
    <div className="barber-landing">
      <NavbarSection />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AgendaSection />
        <FinanceSection />
        <CollaboratorsSection />
        <MobileSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  )
}

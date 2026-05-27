import { Link } from 'react-router-dom'
import { Container } from '../components/Container'
import { Section } from '../components/Section'
import { SectionTitle } from '../components/SectionTitle'
import { Button } from '../components/Button'
import { ScrollReveal } from '../components/ScrollReveal'
import { PRICING } from '../data/pricing'
import { formatCurrency } from '../utils/format'
import './PricingSection.css'

export function PricingSection() {
  return (
    <Section id="precos" className="bl-pricing">
      <Container>
        <SectionTitle
          label="Preços"
          title="Planos que crescem com você"
          subtitle={PRICING.subtitle}
        />

        {PRICING.saveLabel && (
          <div className="bl-pricing__save">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {PRICING.saveLabel}
          </div>
        )}

        <div className="bl-pricing__grid">
          {PRICING.tiers.map((tier, i) => (
            <ScrollReveal key={tier.name} variant="scale" stagger={(i % 3) + 1}>
              <div className={`bl-pricing__tier${tier.featured ? ' bl-pricing__tier--featured' : ''}`}>
                {tier.popular && <div className="bl-pricing__badge">Mais popular</div>}
                <h3 className="bl-pricing__name">{tier.name}</h3>
                <p className="bl-pricing__description">{tier.description}</p>
                <div className="bl-pricing__price">
                  <span className="bl-pricing__value tabular">
                    {tier.price === 0 ? 'Grátis' : formatCurrency(tier.price)}
                  </span>
                  {tier.period && <span className="bl-pricing__period">{tier.period}</span>}
                </div>
                <ul className="bl-pricing__features">
                  {tier.features.map((feat) => (
                    <li key={feat} className="bl-pricing__feature">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  as={tier.price === 0 ? Link : 'button'}
                  to={tier.price === 0 ? '/register' : undefined}
                  variant={tier.featured ? 'primary' : 'secondary'}
                  className="bl-pricing__cta"
                >
                  {tier.cta}
                </Button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </Section>
  )
}

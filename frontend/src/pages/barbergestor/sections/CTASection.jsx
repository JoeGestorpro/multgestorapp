import { Link } from 'react-router-dom'
import { Container } from '../components/Container'
import { Section } from '../components/Section'
import { Button } from '../components/Button'
import { ScrollReveal } from '../components/ScrollReveal'
import './CTASection.css'

export function CTASection() {
  return (
    <Section id="cta-final" className="bl-cta">
      <div className="bl-cta__glow"></div>
      <Container>
        <ScrollReveal variant="scale">
          <div className="bl-cta__content">
            <h2 className="bl-cta__title">
              Comece sua gestão inteligente<br />
              <span>em menos de 5 minutos.</span>
            </h2>
            <p className="bl-cta__subtitle">
              7 dias grátis. Sem cartão de crédito. Sem compromisso.
            </p>
            <div className="bl-cta__actions">
              <Button as={Link} to="/register" variant="primary" size="lg">
                Começar teste grátis
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Button>
              <Button variant="secondary" size="lg" href="https://wa.me/5511999999999">
                Falar com equipe
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </Button>
            </div>
            <div className="bl-cta__trust">
              <div className="bl-cta__trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Dados seguros
              </div>
              <div className="bl-cta__trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Cancele quando quiser
              </div>
              <div className="bl-cta__trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                Suporte via WhatsApp
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  )
}

import { Link } from 'react-router-dom'
import { Container } from '../components/Container'
import { GradientMesh } from '../components/GradientMesh'
import { Button } from '../components/Button'
import { ScrollReveal } from '../components/ScrollReveal'
import { HERO } from '../data/hero'
import './HeroSection.css'

export function HeroSection() {
  return (
    <section className="bl-hero">
      <GradientMesh className="bl-hero__mesh" />
      <Container className="bl-hero__inner">
        <div className="bl-hero__content">
          <ScrollReveal>
            <div className="bl-hero__badges">
              <span className="bl-hero__badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                7 dias grátis
              </span>
              <span className="bl-hero__badge bl-hero__badge--outline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Sem cartão de crédito
              </span>
              <span className="bl-hero__badge bl-hero__badge--outline">
                <img src="/assets/barbergestor/icon-badge.webp" alt="" width="14" height="14" className="bl-hero__badge-icon" />
                BarberGestor
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal stagger={1}>
            <h1 className="bl-hero__title">{HERO.headline}</h1>
          </ScrollReveal>

          <ScrollReveal stagger={2}>
            <p className="bl-hero__subtitle">{HERO.subtitle}</p>
          </ScrollReveal>

          <ScrollReveal stagger={3}>
            <div className="bl-hero__actions">
              <Button as={Link} to="/register" variant="primary" size="lg">
                {HERO.cta}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Button>
              <Button variant="secondary" size="lg">{HERO.ctaSecondary}</Button>
            </div>
          </ScrollReveal>

          <ScrollReveal stagger={4}>
            <p className="bl-hero__trust">{HERO.trustText}</p>
          </ScrollReveal>
        </div>

        <ScrollReveal variant="right" stagger={2}>
          <div className="bl-hero__visual">
            <div className="bl-hero__mockup">
              <img
                src="/assets/barbergestor/dashboard-hero.webp"
                alt="Dashboard do BarberGestor mostrando receita mensal, agendamentos e gráficos financeiros"
                width="1400"
                height="788"
                className="bl-hero__screenshot"
                fetchpriority="high"
              />
            </div>
            <div className="bl-hero__mockup-glow"></div>
            <div className="bl-hero__floating-stats">
              <div className="bl-hero__floating-stat bl-hero__floating-stat--left">
                <span className="bl-hero__floating-value tabular">18</span>
                <span className="bl-hero__floating-label">atendimentos hoje</span>
              </div>
              <div className="bl-hero__floating-stat bl-hero__floating-stat--right">
                <span className="bl-hero__floating-value tabular">92%</span>
                <span className="bl-hero__floating-label">horários ocupados</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  )
}

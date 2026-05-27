import { Container } from '../components/Container'
import { Section } from '../components/Section'
import { SectionTitle } from '../components/SectionTitle'
import { ScrollReveal } from '../components/ScrollReveal'
import { FEATURES, FEATURES_SUBTITLE } from '../data/features'
import './FeaturesSection.css'

const ICONS = {
  calendar: 'M8 2v4M16 2v4M3 13h18M3 6h18v14H3V6z',
  smartphone: 'M12 18h.01M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
  'dollar-sign': 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  'bar-chart-3': 'M18 20V10M12 20V4M6 20v-6',
  package: 'M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.29 7 12 12l8.71-5M12 22V12',
}

export function FeaturesSection() {
  return (
    <Section id="funcionalidades" className="bl-features">
      <Container>
        <SectionTitle
          label="Funcionalidades"
          title="Tudo que sua barbearia precisa"
          subtitle={FEATURES_SUBTITLE}
        />

        <div className="bl-features__grid">
          {FEATURES.map((feat, i) => (
            <ScrollReveal key={feat.title} stagger={(i % 6) + 1}>
              <div className="bl-features__card">
                <div className="bl-features__card-img">
                  <img
                    src={feat.image}
                    alt={feat.title}
                    loading="lazy"
                    width="360"
                    height="200"
                  />
                </div>
                <div className="bl-features__card-body">
                  <div className="bl-features__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={ICONS[feat.icon] || ICONS.calendar} />
                    </svg>
                  </div>
                  <h3 className="bl-features__card-title">{feat.title}</h3>
                  <p className="bl-features__card-desc">{feat.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </Section>
  )
}

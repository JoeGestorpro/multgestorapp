import { Container } from '../components/Container'
import { Section } from '../components/Section'
import { SectionTitle } from '../components/SectionTitle'
import { ScrollReveal } from '../components/ScrollReveal'
import './AgendaSection.css'

export function AgendaSection() {
  return (
    <Section id="agenda" className="bl-agenda">
      <Container>
        <div className="bl-agenda__grid">
          <ScrollReveal variant="left">
            <div className="bl-agenda__content">
              <SectionTitle
                label="Agenda Visual"
                title="Agenda inteligente que organiza sua barbearia"
                subtitle="Visual diário, semanal ou por profissional. Arraste e solte para remarcar. Bloqueie horários, gerencie pausas e nunca mais tenha conflitos de agendamento."
                align="left"
              />
              <ul className="bl-agenda__list">
                {[
                  'Multi-colaborador com visão unificada',
                  'Detecção automática de conflitos',
                  'Blocos de horário e pausas programadas',
                  'Agendamento online integrado',
                  'Confirmação automática por email',
                ].map((item) => (
                  <li key={item} className="bl-agenda__list-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="bl-agenda__live">
                <span className="bl-agenda__live-dot"></span>
                <span>Próximo horário: <strong>14:30</strong> — João Silva · Corte Degradê</span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="right">
            <div className="bl-agenda__mockup">
              <img
                src="/assets/barbergestor/agenda-hero.webp"
                alt="Agenda visual do BarberGestor mostrando horários, profissionais e clientes agendados"
                width="1400"
                height="788"
                className="bl-agenda__screenshot"
                loading="lazy"
              />
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  )
}

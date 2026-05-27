import { Container } from '../components/Container'
import { Section } from '../components/Section'
import { SectionTitle } from '../components/SectionTitle'
import { ScrollReveal } from '../components/ScrollReveal'
import './CollaboratorsSection.css'

export function CollaboratorsSection() {
  return (
    <Section id="colaboradores" className="bl-collab" cream>
      <Container>
        <div className="bl-collab__grid">
          <ScrollReveal variant="left">
            <div className="bl-collab__content">
              <SectionTitle
                label="Equipe"
                title="Gerencie sua equipe com transparência"
                subtitle="Cadastro completo com permissões individuais, ranking de desempenho por serviços realizados e cálculo automático de comissões. Cada profissional acompanha seus próprios números."
                align="left"
              />
              <ul className="bl-collab__list">
                {[
                  'Perfil individual com permissões personalizadas',
                  'Ranking por serviços realizados e faturamento',
                  'Comissões calculadas automaticamente por serviço',
                  'Relatório de produtividade por período',
                  'Acesso mobile para cada colaborador',
                ].map((item) => (
                  <li key={item} className="bl-collab__list-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="bl-collab__highlight">
                <span className="bl-collab__highlight-value tabular">R$ 12.450</span>
                <span className="bl-collab__highlight-label">em comissões pagas este mês</span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="right">
            <div className="bl-collab__mockup">
              <img
                src="/assets/barbergestor/equipe-hero.webp"
                alt="Painel de equipe do BarberGestor com colaboradores, ranking e comissões"
                width="1400"
                height="788"
                className="bl-collab__screenshot"
                loading="lazy"
              />
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  )
}

import { Container } from '../components/Container'
import { Section } from '../components/Section'
import { SectionTitle } from '../components/SectionTitle'
import { ScrollReveal } from '../components/ScrollReveal'
import './MobileSection.css'

export function MobileSection() {
  return (
    <Section id="mobile" className="bl-mobile">
      <Container>
        <div className="bl-mobile__grid">
          <ScrollReveal variant="left">
            <div className="bl-mobile__mockup-wrapper">
              <div className="bl-mobile__device">
                <div className="bl-mobile__notch"></div>
                <div className="bl-mobile__screen">
                  <div className="bl-mobile__screen-header">
                    <span>BarberGestor</span>
                    <span>📶 🔋</span>
                  </div>
                  <div className="bl-mobile__screen-body">
                    <div className="bl-mobile__screen-stat">
                      <span className="tabular">R$ 1.280</span>
                      <span>Faturamento hoje</span>
                    </div>
                    <div className="bl-mobile__screen-agenda">
                      <div className="bl-mobile__screen-agenda-item">
                        <span>14:00</span>
                        <span>Corte Social</span>
                        <span>João</span>
                      </div>
                      <div className="bl-mobile__screen-agenda-item">
                        <span>15:00</span>
                        <span>Degradê</span>
                        <span>Marcos</span>
                      </div>
                      <div className="bl-mobile__screen-agenda-item">
                        <span>16:00</span>
                        <span>Barba</span>
                        <span>Pedro</span>
                      </div>
                    </div>
                    <div className="bl-mobile__screen-nav">
                      <span>🏠</span>
                      <span>📅</span>
                      <span>💰</span>
                      <span>👤</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bl-mobile__device-glow"></div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="right">
            <div className="bl-mobile__content">
              <SectionTitle
                label="Mobile"
                title="Sua barbearia no bolso"
                subtitle="O BarberGestor funciona perfeitamente no celular. Seus colaboradores podem registrar vendas, ver a agenda e marcar presença direto do smartphone. E seus clientes agendam online sem precisar de aplicativo."
                align="left"
              />
              <ul className="bl-mobile__list">
                {[
                  '100% responsivo — funciona em qualquer tela',
                  'Colaboradores usam direto do celular',
                  'Clientes agendam online sem app',
                  'Notificações de novos agendamentos',
                  'Painel simplificado para mobile',
                ].map((item) => (
                  <li key={item} className="bl-mobile__list-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  )
}

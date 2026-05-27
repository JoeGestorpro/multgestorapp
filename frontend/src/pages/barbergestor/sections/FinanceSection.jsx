import { Container } from '../components/Container'
import { Section } from '../components/Section'
import { SectionTitle } from '../components/SectionTitle'
import { ScrollReveal } from '../components/ScrollReveal'
import { formatCurrency } from '../utils/format'
import './FinanceSection.css'

const FINANCE_STATS = [
  { label: 'Faturamento do mês', value: formatCurrency(45280), change: '+12%' },
  { label: 'Serviços realizados', value: '187', change: '+8%' },
  { label: 'Ticket médio', value: formatCurrency(62), change: '+5%' },
  { label: 'Comissões pagas', value: formatCurrency(15840), change: '' },
]

export function FinanceSection() {
  return (
    <Section id="financeiro" className="bl-finance" dark>
      <Container>
        <div className="bl-finance__grid">
          <ScrollReveal variant="left">
            <div className="bl-finance__content">
              <SectionTitle
                label="Controle Financeiro"
                title="Suas finanças em tempo real"
                subtitle="Fluxo de caixa completo, vendas por múltiplas formas de pagamento, comissões automáticas e acertos diários. Veja exatamente quanto sua barbearia faturou a qualquer momento."
                align="left"
              />
              <ul className="bl-finance__list">
                {[
                  'Fluxo de caixa diário com abertura/fechamento',
                  'Vendas com múltiplas formas de pagamento',
                  'Comissões automáticas por colaborador',
                  'Acertos simplificados com relatório completo',
                  'Extrato por período para análise de crescimento',
                ].map((item) => (
                  <li key={item} className="bl-finance__list-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="right">
            <div className="bl-finance__visual">
              <div className="bl-finance__mockup">
                <img
                  src="/assets/barbergestor/financeiro-hero.webp"
                  alt="Painel financeiro do BarberGestor com faturamento, comissões e fluxo de caixa"
                  width="1400"
                  height="788"
                  className="bl-finance__screenshot"
                  loading="lazy"
                />
              </div>
              <div className="bl-finance__stats-overlay">
                <div className="bl-finance__stat-card">
                  <span className="bl-finance__stat-val tabular">R$ 1.248</span>
                  <span className="bl-finance__stat-lbl">Caixa do dia</span>
                </div>
                <div className="bl-finance__stat-card">
                  <span className="bl-finance__stat-val tabular">4</span>
                  <span className="bl-finance__stat-lbl">Barbeiros ativos</span>
                </div>
                <div className="bl-finance__stat-card">
                  <span className="bl-finance__stat-val tabular">R$ 386</span>
                  <span className="bl-finance__stat-lbl">Comissão estimada</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  )
}

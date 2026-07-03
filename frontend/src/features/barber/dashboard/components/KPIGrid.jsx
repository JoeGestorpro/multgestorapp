import { DollarSign, CalendarCheck, TrendingUp, Percent, Users, Award } from 'lucide-react'
import Card from '../../../../components/design-system/ui/Card'
import { Skeleton } from '../../../../components/design-system/feedback/Skeleton'
import { money } from '../../utils/formatters'

function KPICard({ icon, label, value, color }) {
  // Alias em maiúscula para uso como tag JSX (o lint core não conta
  // JSXIdentifier como uso de parâmetro; vars ^[A-Z_] são ignoradas).
  const Icon = icon
  return (
    <Card className="kpi-card" padding="sm">
      <div className="kpi-card__inner">
        <div className="kpi-card__icon" style={{ color }}>
          <Icon size={20} />
        </div>
        <div className="kpi-card__data">
          <span className="kpi-card__label">{label}</span>
          <strong className="kpi-card__value">{value}</strong>
        </div>
      </div>
    </Card>
  )
}

function KPICardSkeleton() {
  return (
    <Card padding="sm" className="kpi-card">
      <div className="kpi-card__inner">
        <Skeleton variant="circle" width={32} height={32} />
        <div className="kpi-card__data">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" height={24} />
        </div>
      </div>
    </Card>
  )
}

export default function KPIGrid({ kpis, loading }) {
  if (loading || !kpis) {
    return (
      <div className="kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
    )
  }

  const cards = [
    { icon: DollarSign, label: 'Faturamento', value: money(kpis.revenue), color: 'var(--success)' },
    { icon: CalendarCheck, label: 'Atendimentos', value: String(kpis.appointments), color: 'var(--accent-primary)' },
    { icon: TrendingUp, label: 'Ticket Médio', value: money(kpis.averageTicket), color: 'var(--info)' },
    { icon: Percent, label: 'Ocupação', value: `${kpis.occupancy}%`, color: 'var(--warning)' },
    { icon: Users, label: 'Clientes Atendidos', value: String(kpis.clientsServed), color: 'var(--accent-secondary)' },
    { icon: Award, label: 'Comissão Prevista', value: money(kpis.expectedCommission), color: 'var(--success)' }
  ]

  return (
    <div className="kpi-grid">
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  )
}

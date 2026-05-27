import { Calendar, CalendarRange, CalendarDays, DollarSign, TrendingUp } from 'lucide-react'

function MiniFinancialCards({
  today,
  week,
  month,
  commission,
  todayCount,
  weekCount,
  monthCount
}) {
  const cards = [
    {
      label: 'Hoje',
      value: today,
      count: todayCount || 0,
      suffix: 'atendimento(s)',
      icon: Calendar,
      gradient: 'linear-gradient(135deg, rgba(140,255,79,0.12) 0%, rgba(140,255,79,0.02) 100%)',
      accent: '#8cff4f',
      key: 'today'
    },
    {
      label: 'Semana',
      value: week,
      count: weekCount || 0,
      suffix: 'atendimento(s)',
      icon: CalendarRange,
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.02) 100%)',
      accent: '#3b82f6',
      key: 'week'
    },
    {
      label: 'Mês',
      value: month,
      count: monthCount || 0,
      suffix: 'atendimento(s)',
      icon: CalendarDays,
      gradient: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.02) 100%)',
      accent: '#a78bfa',
      key: 'month'
    },
    {
      label: 'Comissão',
      value: commission,
      count: null,
      suffix: 'total acumulado',
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.02) 100%)',
      accent: '#f59e0b',
      key: 'commission'
    }
  ]

  return (
    <div className="at-mini-cards">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <div
            className="at-mini-card"
            key={card.key}
            style={{ background: card.gradient }}
          >
            <div className="at-mini-card-top">
              <div
                className="at-mini-card-icon"
                style={{ color: card.accent, background: `${card.accent}15` }}
              >
                <Icon size={16} />
              </div>
              <span className="at-mini-card-label">{card.label}</span>
            </div>
            <div className="at-mini-card-bottom">
              <strong
                className="at-mini-card-value"
                style={{ color: card.accent }}
              >
                {card.value}
              </strong>
              {card.count !== null && (
                <span className="at-mini-card-badge" style={{ background: `${card.accent}20`, color: card.accent }}>
                  {card.count}
                </span>
              )}
            </div>
            <span className="at-mini-card-hint">{card.suffix}</span>
          </div>
        )
      })}
    </div>
  )
}

export default MiniFinancialCards

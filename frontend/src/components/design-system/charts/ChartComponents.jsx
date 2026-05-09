import { TrendingUp } from 'lucide-react'
import '../../../styles/chart-premium.css'

export function ChartTooltip({ active, payload, label, valuePrefix = 'R$' }) {
  if (!active || !payload?.length) {
    return null
  }

  const value = payload[0]?.value || 0
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)

  return (
    <div className="ds-chart-tooltip">
      <div className="ds-chart-tooltip__label">
        <TrendingUp style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
        {label}
      </div>
      <div className="ds-chart-tooltip__value">
        {formattedValue}
      </div>
    </div>
  )
}

export function ChartEmptyState({ title = 'Sem dados', description = 'Os dados aparecerão aqui quando estiverem disponíveis.' }) {
  return (
    <div className="ds-chart-empty">
      <div className="ds-chart-empty__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 16l4-4 4 4 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="ds-chart-empty__title">{title}</h3>
      <p className="ds-chart-empty__description">{description}</p>
    </div>
  )
}

export function ChartLoadingState({ message = 'Carregando...' }) {
  return (
    <div className="ds-chart-loading">
      <div className="ds-chart-loading__spinner" />
      <span className="ds-chart-loading__text">{message}</span>
    </div>
  )
}

export function ChartCard({
  title,
  subtitle,
  badge,
  badgeVariant = 'success',
  value,
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`ds-chart-card ${className}`} {...props}>
      <div className="ds-chart-header">
        <div className="ds-chart-header__content">
          <h3 className="ds-chart-header__title">{title}</h3>
          {subtitle && <p className="ds-chart-header__subtitle">{subtitle}</p>}
        </div>
        {(badge || value) && (
          <div className="ds-chart-header__meta">
            <div className="ds-chart-stat">
              {badge && <span className={`ds-chart-stat__badge ds-chart-stat__badge--${badgeVariant}`}>{badge}</span>}
              {value && <span className="ds-chart-stat__value">{value}</span>}
            </div>
          </div>
        )}
      </div>
      <div className="ds-chart-body">
        {children}
      </div>
    </div>
  )
}

export function ActivityItem({ avatar, title, meta, amount, badge, badgeVariant = 'info' }) {
  const initials = avatar?.slice(0, 1) || '?'

  return (
    <div className="ds-activity-item">
      <div className="ds-activity-item__avatar">{initials}</div>
      <div className="ds-activity-item__content">
        <div className="ds-activity-item__title">{title}</div>
        <div className="ds-activity-item__meta">{meta}</div>
      </div>
      <div className="ds-activity-item__value">
        {amount && <span className="ds-activity-item__amount">{amount}</span>}
        {badge && (
          <span className={`ds-activity-item__badge ds-chart-stat__badge--${badgeVariant}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

export function RankingItem({ index, name, detail, value }) {
  return (
    <div className="ds-ranking-item">
      <div className="ds-ranking-item__index">{index}</div>
      <div className="ds-ranking-item__info">
        <div className="ds-ranking-item__name">{name}</div>
        <div className="ds-ranking-item__detail">{detail}</div>
      </div>
      <div className="ds-ranking-item__value">{value}</div>
    </div>
  )
}

export function ActivityList({ children, className = '' }) {
  return <div className={`ds-activity-list ${className}`}>{children}</div>
}

export function RankingList({ children, className = '' }) {
  return <div className={`ds-ranking-list ${className}`}>{children}</div>
}
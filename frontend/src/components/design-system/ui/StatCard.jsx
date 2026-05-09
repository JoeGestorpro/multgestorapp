import { TrendingUp, TrendingDown } from 'lucide-react'
import './StatCard.premium.css'

export default function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  iconVariant = 'accent',
  compact = false,
  primary = false,
  className = '',
  ...props
}) {
  const Icon = icon

  return (
    <div
      className={[
        'ds-stat-card',
        compact && 'ds-stat-card--compact',
        primary && 'ds-stat-card--primary',
        className
      ].filter(Boolean).join(' ')}
      {...props}
    >
      <div className="ds-stat-card__header">
        {Icon && (
          <div className={`ds-stat-card__icon ds-stat-card__icon--${iconVariant}`}>
            <Icon />
          </div>
        )}

        {trend !== undefined && (
          <div className={`ds-stat-card__trend ds-stat-card__trend--${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? <TrendingUp /> : <TrendingDown />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div>
        <div className="ds-stat-card__value">{value}</div>
        <div className="ds-stat-card__label">{label}</div>
      </div>

      {trendLabel && (
        <div className="ds-stat-card__footer">
          <span className="ds-stat-card__footer-text">{trendLabel}</span>
        </div>
      )}
    </div>
  )
}

StatCard.iconVariants = ['accent', 'success', 'warning', 'danger', 'info']
StatCard.variants = ['compact', 'primary', 'glow', 'dense']
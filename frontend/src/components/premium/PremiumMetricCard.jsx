import './PremiumMetricCard.css'

export default function PremiumMetricCard({ label, value, subtitle, icon, trend, variant = 'default', onClick }) {
  return (
    <article
      className={`pm-metric-card pm-metric-${variant}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="pm-metric-header">
        {icon && <span className="pm-metric-icon">{icon}</span>}
        <span className="pm-metric-label">{label}</span>
      </div>
      <strong className="pm-metric-value">{value}</strong>
      {subtitle && <small className="pm-metric-subtitle">{subtitle}</small>}
      {trend && (
        <span className={`pm-metric-trend ${trend > 0 ? 'up' : 'down'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </article>
  )
}

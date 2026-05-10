import './SummaryCard.css'

export function SummaryItem({ label, description, value, valueVariant = 'default' }) {
  return (
    <div className={`ds-summary-item ${valueVariant !== 'default' ? `ds-summary-item--${valueVariant}` : ''}`}>
      <div className="ds-summary-item__label">
        <strong>{label}</strong>
        {description && <p>{description}</p>}
      </div>
      <div className="ds-summary-item__value">
        {value}
      </div>
    </div>
  )
}

export default function SummaryCard({ 
  children,
  title, 
  subtitle, 
  items = [], 
  badge,
  badgeVariant = 'info',
  className = '',
  ...props 
}) {
  return (
    <div className={`ds-summary-card ${className}`} {...props}>
      {(title || subtitle || badge) && (
        <div className="ds-summary-card__header">
          {title && (
            <div className="ds-summary-card__title-row">
              <h3 className="ds-summary-card__title">{title}</h3>
              {badge && (
                <span className={`ds-summary-card__badge ds-chart-stat__badge--${badgeVariant}`}>
                  {badge}
                </span>
              )}
            </div>
          )}
          {subtitle && <p className="ds-summary-card__subtitle">{subtitle}</p>}
        </div>
      )}
      
      {items.length > 0 ? (
        <div className="ds-summary-card__items">
          {items.map((item, index) => (
            <SummaryItem
              key={index}
              label={item.label}
              description={item.description}
              value={item.value}
              valueVariant={item.valueVariant}
            />
          ))}
        </div>
      ) : children}
    </div>
  )
}
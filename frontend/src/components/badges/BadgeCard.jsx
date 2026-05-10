import './BadgeCard.css'

export default function BadgeCard({ badge, earned = false, compact = false, onClick }) {
  return (
    <div 
      className={`badge-card ${earned ? 'badge-card--earned' : 'badge-card--locked'} ${compact ? 'badge-card--compact' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="badge-card__icon-wrapper" style={{ '--badge-color': badge.color }}>
        <span className="badge-card__icon">{badge.icon}</span>
        {!earned && <div className="badge-card__lock-overlay">🔒</div>}
      </div>
      
      <div className="badge-card__content">
        <h4 className="badge-card__name">{badge.name}</h4>
        <p className="badge-card__description">{badge.description}</p>
      </div>

      {earned && (
        <div className="badge-card__earned-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  )
}
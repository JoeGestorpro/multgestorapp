import './PremiumEmptyState.css'

export default function PremiumEmptyState({ icon, title, description, action, actionLabel }) {
  return (
    <div className="pm-empty-state">
      {icon ? (
        <div className="pm-empty-icon">{icon}</div>
      ) : (
        <div className="pm-empty-icon-default">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>
      )}
      <strong className="pm-empty-title">{title}</strong>
      {description && <p className="pm-empty-desc">{description}</p>}
      {action && actionLabel && (
        <button className="pm-empty-action" onClick={action} type="button">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

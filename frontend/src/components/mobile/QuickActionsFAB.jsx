import { useState } from 'react'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import './QuickActionsFAB.css'

export default function QuickActionsFAB({
  mainAction,
  mainActionLabel = 'Novo',
  mainActionIcon,
  secondaryActions = [],
  position = 'bottom-right',
  show = true
}) {
  const { primaryColor } = useTenantTheme()
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = () => setExpanded(!expanded)

  const handleMainAction = () => {
    mainAction?.()
    setExpanded(false)
  }

  const handleSecondaryAction = (action) => {
    action.onClick?.()
    setExpanded(false)
  }

  if (!show) return null

  return (
    <div className={`fab-container fab-container--${position} ${expanded ? 'fab-container--expanded' : ''}`}>
      {expanded && (
        <div className="fab-overlay" onClick={() => setExpanded(false)} />
      )}
      
      <div className="fab-list">
        {secondaryActions.map((action, index) => (
          <button
            key={action.id || index}
            className="fab-list__item"
            onClick={() => handleSecondaryAction(action)}
            style={{ '--delay': `${index * 0.05}s` }}
          >
            <span className="fab-list__label">{action.label}</span>
            <span className="fab-list__icon">{action.icon}</span>
          </button>
        ))}
      </div>

      <button
        className={`fab-main ${expanded ? 'fab-main--active' : ''}`}
        onClick={expanded ? toggleExpanded : handleMainAction}
        style={{ '--fab-color': primaryColor }}
        aria-label={mainActionLabel}
      >
        {expanded ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : mainActionIcon || (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </button>
    </div>
  )
}
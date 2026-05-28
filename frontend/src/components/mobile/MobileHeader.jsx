import { useTenantTheme } from '../../hooks/useTenantTheme'
import './MobileHeader.css'

function getInitials(name) {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function MobileHeader({
  title: _title,
  subtitle: _subtitle,
  user,
  onMenuClick,
  onNotificationClick,
  logoUrl,
  notificationCount = 0,
  className = ''
}) {
  const { companyName } = useTenantTheme()

  return (
    <header className={`mobile-header ${className}`}>
      <button 
        className="mobile-header__menu"
        onClick={onMenuClick}
        aria-label="Menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="mobile-header__brand">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="mobile-header__logo" />
        ) : (
          <span className="mobile-header__brand-text">{companyName}</span>
        )}
      </div>

      <div className="mobile-header__actions">
        <button 
          className="mobile-header__action"
          onClick={onNotificationClick}
          aria-label="Notificações"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {notificationCount > 0 && (
            <span className="mobile-header__badge">{notificationCount > 9 ? '9+' : notificationCount}</span>
          )}
        </button>

        <button className="mobile-header__avatar" aria-label="Perfil">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            getInitials(user?.name)
          )}
        </button>
      </div>
    </header>
  )
}
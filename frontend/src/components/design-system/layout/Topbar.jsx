import { Menu, Search, Bell, ChevronDown } from 'lucide-react'
import Button from '../ui/Button'
import './Topbar.css'

function getInitials(name) {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function Topbar({
  title = '',
  subtitle = '',
  user,
  onMenuClick,
  onSearchClick,
  notifications = 0,
  className = '',
  actions,
  ...props
}) {
  return (
    <header className={['ds-topbar', className].filter(Boolean).join(' ')} {...props}>
      <div className="ds-topbar__left">
        <button className="ds-topbar__menu-btn" onClick={onMenuClick} aria-label="Menu">
          <Menu />
        </button>

        {(title || subtitle) && (
          <div>
            {title && <h1 className="ds-topbar__title">{title}</h1>}
            {subtitle && <p className="ds-topbar__subtitle">{subtitle}</p>}
          </div>
        )}

        {actions}
      </div>

      <div className="ds-topbar__right">
        <button className="ds-topbar__search" onClick={onSearchClick}>
          <Search />
          <span>Buscar...</span>
          <span className="ds-topbar__search-shortcut">Ctrl+K</span>
        </button>

        <div className="ds-topbar__actions">
          <button className="ds-topbar__action-btn" aria-label="Notificações">
            <Bell />
            {notifications > 0 && <span className="ds-topbar__action-badge" />}
          </button>
        </div>

        {user && (
          <button className="ds-topbar__user-btn">
            <div className="ds-topbar__user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div className="ds-topbar__user-info">
              <span className="ds-topbar__user-name">{user.name}</span>
              <span className="ds-topbar__user-role">{user.role || 'Usuário'}</span>
            </div>
            <span className="ds-topbar__dropdown-icon">
              <ChevronDown />
            </span>
          </button>
        )}
      </div>
    </header>
  )
}

Topbar.getInitials = getInitials
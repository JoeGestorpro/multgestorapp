import { useState, useRef, useEffect } from 'react'
import { Menu, Search, Bell, ChevronDown, X } from 'lucide-react'
import Button from '../ui/Button'
import UserMenu from './UserMenu'
import './Topbar.css'

function getInitials(name) {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function useClickOutside(ref, handler) {
  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        handler()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ref, handler])
}

export default function Topbar({
  title = '',
  subtitle = '',
  user,
  onMenuClick,
  onSearchClick,
  onLogout,
  onNavigate,
  notifications = 0,
  className = '',
  actions,
  ...props
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const userBtnRef = useRef(null)
  const notificationsRef = useRef(null)
  const notifBtnRef = useRef(null)

  useClickOutside(notificationsRef, () => {
    if (notificationsOpen) setNotificationsOpen(false)
  })

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        if (notificationsOpen) setNotificationsOpen(false)
        if (userMenuOpen) setUserMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [notificationsOpen, userMenuOpen])

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

        <div className="ds-topbar__actions" ref={notificationsRef}>
          <button
            className="ds-topbar__action-btn"
            aria-label="Notificações"
            aria-haspopup="true"
            aria-expanded={notificationsOpen}
            onClick={() => { setNotificationsOpen((prev) => !prev); if (userMenuOpen) setUserMenuOpen(false) }}
            ref={notifBtnRef}
          >
            <Bell />
            {notifications > 0 && <span className="ds-topbar__action-badge" />}
          </button>

          {notificationsOpen && (
            <div className="ds-topbar__notifications-popover" role="dialog" aria-label="Notificações">
              <div className="ds-topbar__notifications-header">
                <span className="ds-topbar__notifications-title">Notificações</span>
                <button
                  className="ds-topbar__action-btn"
                  aria-label="Fechar notificações"
                  onClick={() => setNotificationsOpen(false)}
                  style={{ width: 28, height: 28 }}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="ds-topbar__notifications-body">
                <span className="ds-topbar__notifications-empty">
                  {notifications > 0
                    ? `${notifications} notificação(ões) pendente(s)`
                    : 'Nenhuma notificação no momento'}
                </span>
              </div>
            </div>
          )}
        </div>

        {user && (
          <>
            <button
              ref={userBtnRef}
              className="ds-topbar__user-btn"
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen((prev) => !prev)}
            >
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
              <span className={['ds-topbar__dropdown-icon', userMenuOpen && 'ds-topbar__dropdown-icon--open'].filter(Boolean).join(' ')}>
                <ChevronDown />
              </span>
            </button>

            <UserMenu
              user={user}
              isOpen={userMenuOpen}
              onClose={() => setUserMenuOpen(false)}
              onLogout={onLogout}
              onNavigate={onNavigate}
            />
          </>
        )}
      </div>
    </header>
  )
}

Topbar.getInitials = getInitials
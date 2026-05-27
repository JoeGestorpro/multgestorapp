import { useEffect, useRef } from 'react'
import { User, Settings, LogOut } from 'lucide-react'

export default function UserMenu({ user, isOpen, onClose, onLogout, onNavigate }) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="ds-topbar__user-menu" ref={menuRef} role="menu" aria-label="Menu do usuário">
      <div className="ds-topbar__user-menu-header">
        <div className="ds-topbar__user-menu-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            getInitials(user?.name)
          )}
        </div>
        <div className="ds-topbar__user-menu-info">
          <span className="ds-topbar__user-menu-name">{user?.name || 'Usuário'}</span>
          <span className="ds-topbar__user-menu-email">{user?.email || ''}</span>
        </div>
      </div>

      <div className="ds-topbar__user-menu-items">
        <button
          className="ds-topbar__user-menu-item"
          role="menuitem"
          onClick={() => { onClose(); onNavigate?.('settings') }}
        >
          <Settings size={16} />
          <span>Configurações</span>
        </button>
      </div>

      <div className="ds-topbar__user-menu-divider" />

      <div className="ds-topbar__user-menu-items">
        <button
          className="ds-topbar__user-menu-item ds-topbar__user-menu-item--danger"
          role="menuitem"
          onClick={() => { onClose(); onLogout?.() }}
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )
}

function getInitials(name) {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

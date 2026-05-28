import './PremiumCustomerAvatar.css'

function getInitials(name) {
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
}

function getStatusColor(status) {
  const colors = {
    active: 'var(--pm-success)',
    pending: 'var(--pm-warning)',
    blocked: 'var(--pm-danger)',
    online: 'var(--pm-success)',
    offline: 'var(--pm-text-muted)'
  }
  return colors[status] || 'var(--pm-text-muted)'
}

export default function PremiumCustomerAvatar({ name, email: _email, avatarUrl, status, size = 48, showStatus, onClick }) {
  const hasImage = !!avatarUrl

  return (
    <div
      className={`pm-avatar-wrapper ${onClick ? 'pm-avatar-clickable' : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {hasImage ? (
        <img
          className="pm-avatar-img"
          src={avatarUrl}
          alt={name || 'Avatar'}
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="pm-avatar-fallback"
          style={{ width: size, height: size, fontSize: size * 0.38 }}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatus && (
        <span
          className="pm-avatar-status"
          style={{ backgroundColor: getStatusColor(status) }}
        />
      )}
    </div>
  )
}

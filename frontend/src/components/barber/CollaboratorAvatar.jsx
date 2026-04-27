import { useMemo, useState } from 'react'

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) {
    return 'BG'
  }

  return parts.map((part) => part.slice(0, 1).toUpperCase()).join('')
}

function resolveAvatarUrl(avatarUrl) {
  const value = String(avatarUrl || '').trim()

  if (!value) {
    return ''
  }

  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value
  }

  const configured = String(import.meta.env.VITE_API_URL || 'http://localhost:5000').trim()
  const baseUrl = configured.replace(/\/api\/?$/, '').replace(/\/+$/, '')

  return `${baseUrl}${value.startsWith('/') ? value : `/${value}`}`
}

function CollaboratorAvatar({
  name,
  avatarUrl,
  size = 'md',
  selected = false,
  className = ''
}) {
  const [broken, setBroken] = useState(false)
  const resolvedAvatarUrl = useMemo(() => resolveAvatarUrl(avatarUrl), [avatarUrl])
  const initials = useMemo(() => getInitials(name), [name])
  const sizeClass = `barber-avatar-${size}`
  const showImage = Boolean(resolvedAvatarUrl) && !broken

  return (
    <span className={`barber-avatar ${sizeClass} ${selected ? 'barber-avatar-selected' : ''} ${className}`.trim()}>
      {showImage ? (
        <img
          alt={name || 'Colaborador'}
          className="barber-avatar-img"
          onError={() => setBroken(true)}
          src={resolvedAvatarUrl}
        />
      ) : (
        <span className="barber-avatar-fallback">{initials}</span>
      )}
    </span>
  )
}

export default CollaboratorAvatar

import { useEffect } from 'react'

export function BarberIcon({ name, className = '', size = 18, style = {} }) {
  const icons = {
    menu: 'M4 7h16M4 12h16M4 17h16',
    dashboard: 'M4 4h7v7H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 13h7v7H4z',
    sales: 'M4 6h16M6 4v16M10 10h8M10 14h5',
    wallet: 'M3 7.5A2.5 2.5 0 015.5 5h11A2.5 2.5 0 0119 7.5V8h1a1 1 0 011 1v7a3 3 0 01-3 3H6a3 3 0 01-3-3V7.5zM17 13h4',
    catalog: 'M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V4zm0 0v14m4-10h6m-6 4h6m-6 4h4',
    supplier: 'M3 7h11l2 3h5v7h-2a2 2 0 01-4 0H9a2 2 0 01-4 0H3V7zm4 11a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2zM3 7l2-3h8',
    product: 'M4 7l8-4 8 4-8 4-8-4zm2 3.5v5l6 3 6-3v-5',
    users: 'M9 11a4 4 0 100-8 4 4 0 000 8zM3 20a6 6 0 0112 0M17 10a3 3 0 100-6M15 20a5 5 0 017-4',
    reports: 'M6 3h9l3 3v15H6zM9 12h6M9 16h6M9 8h2',
    calendar: 'M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z',
    copy: 'M9 9h9v11H9zM6 15H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v1',
    check: 'M5 13l4 4L19 7',
    clock: 'M12 7v5l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0',
    logout: 'M10 17l5-5-5-5M15 12H3M21 3v18',
    bell: 'M15 17H5l1.5-2.5V10a5.5 5.5 0 1111 0v4.5L19 17h-4zm-1 3a2 2 0 01-4 0',
    switch: 'M8 7l-4 5 4 5M16 7l4 5-4 5M10 19h4M10 5h4',
    refresh: 'M20 12a8 8 0 10-2.34 5.66M20 12v-5m0 5h-5',
    trash: 'M5 7h14M9 7V4h6v3M8 10v7M12 10v7M16 10v7M6 7l1 13h10l1-13',
    plus: 'M12 5v14M5 12h14',
    money: 'M4 7h16v10H4zM12 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM7 9h.01M17 15h.01',
    scissors: 'M7.5 6.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm0 6a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM20 4L9.6 10.2M20 20L9.6 13.8',
    close: 'M6 6l12 12M18 6L6 18',
    chart: 'M5 19V9M12 19V5M19 19v-8',
    settings: 'M12 3l1.7 2.1 2.7-.3.9 2.6 2.5 1.1-1.1 2.5 1.1 2.5-2.5 1.1-.9 2.6-2.7-.3L12 21l-1.7-2.1-2.7.3-.9-2.6-2.5-1.1 1.1-2.5-1.1-2.5 2.5-1.1.9-2.6 2.7.3L12 3zm0 5.2A3.8 3.8 0 1012 16a3.8 3.8 0 000-7.8z',
    arrowLeft: 'M15 6l-6 6 6 6M9 12h12',
    chevronRight: 'M9 6l6 6-6 6',
    chevronDown: 'M6 9l6 6 6-6',
    mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
    lock: 'M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z',
    phone: 'M7 4l3 3-2 2a12 12 0 007 7l2-2 3 3-2 3c-1 1-8-1-12-5S1 5 4 3z',
    home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
    download: 'M12 4v10M8 10l4 4 4-4M5 20h14',
    building: 'M3 21h18M3 7v14M21 7v14M6 7h4v14H6zM14 7h4v14h-4zM9 3h6v4H9z',
    palette: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.1 2.5-.3.5-.1.9-.5.9-1v-2c0-.4-.2-.7-.5-.9-.6-.2-1.1-.3-1.7-.3-2.2 0-4-1.8-4-4 0-1.6 1-3 2.4-3.6.3-.1.5-.4.5-.7V6c0-.6.4-1 1-1s1 .4 1 1v2.3c1.4-.7 3-1.3 5-1.3z',
    layout: 'M4 4h16v16H4zM4 4v16M20 4v16M4 9h16M4 14h16M9 4v16M14 4v16',
    image: 'M4 5h16v14H4zM4 5l5 5 5-5 4 4v4H4v-4l4-4 5-5zm8 2a2 2 0 110 4 2 2 0 010-4z',
    upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
    save: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM12 10v6M9 13h6',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
    mapPin: 'M12 2C8 2 4 5 4 9c0 5 8 13 8 13s8-8 8-13c0-4-4-7-8-7zm0 9a3 3 0 110-6 3 3 0 010 6z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
  }

  const iconPath = icons[name]
  if (!iconPath) {
    return null
  }

  return (
    <svg 
      aria-hidden="true" 
      className={`barber-icon ${className}`.trim()} 
      viewBox="0 0 24 24" 
      width={size} 
      height={size}
      style={style}
    >
      <path d={iconPath} />
    </svg>
  )
}

export function BarberCard({ className = '', children }) {
  return <article className={`barber-card ${className}`.trim()}>{children}</article>
}

export function BarberButton({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  const Tag = Component

  return (
    <Tag className={`barber-button barber-button-${variant} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  )
}

export function BarberBadge({ tone = 'neutral', children }) {
  return <span className={`barber-badge barber-badge-${tone}`}>{children}</span>
}

export function BarberTable({ columns, children, className = '' }) {
  return (
    <div className={`barber-table-wrap ${className}`.trim()}>
      <table className="barber-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function BarberModal({ open, title, subtitle, onClose, children, size = 'large' }) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className="barber-modal-root" role="presentation">
      <button aria-label="Fechar" className="barber-modal-backdrop" onClick={onClose} type="button" />
      <div aria-modal="true" className={`barber-modal barber-modal--${size}`} role="dialog">
        <div className="barber-modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="barber-icon-button" onClick={onClose} type="button">
            <BarberIcon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function BarberEmptyState({ title, description, icon = 'catalog', action, actionLabel }) {
  return (
    <div className="barber-empty-state">
      <div className="barber-empty-icon">
        <BarberIcon name={icon} />
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
      {action && actionLabel && (
        <button className="barber-button barber-button-ghost" onClick={action} type="button">
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  )
}

export function BarberLoadingState({ message = 'Carregando...' }) {
  return (
    <div className="barber-loading-state">
      <div className="barber-loading-spinner">
        <BarberIcon name="refresh" />
      </div>
      <span>{message}</span>
    </div>
  )
}

export function BarberSkeleton({ width = '100%', height = '20px', rounded = 'md' }) {
  return (
    <div 
      className={`barber-skeleton barber-skeleton-${rounded}`} 
      style={{ width, height }}
    />
  )
}

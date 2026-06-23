import { useEffect } from 'react'

export default function ActionDrawer({ open, title, children, footer, onClose }) {
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="master-drawer-overlay" onClick={onClose}>
      <div className="master-drawer" onClick={e => e.stopPropagation()}>
        <div className="master-drawer-header">
          <h2 className="master-drawer-title">{title}</h2>
          <button className="master-btn master-btn--ghost master-drawer-close-btn" type="button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
              <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="master-drawer-body">
          {children}
        </div>
        {footer && (
          <div className="master-drawer-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

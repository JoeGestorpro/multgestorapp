import { useEffect } from 'react'

function ConfirmIcon({ variant }) {
  const icons = {
    danger: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', path: 'M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', color: '#fcd34d', path: 'M12 9v4m0 4h.01M10.29 3.86l-8.1 14c-.6 1.04.15 2.14 1.21 2.14h15.2c1.06 0 1.81-1.1 1.21-2.14l-8.1-14c-.6-1.04-2.14-1.04-2.74 0z' },
    info: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', color: '#93c5fd', path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  }
  const v = icons[variant] || icons.info
  return (
    <span style={{ background: v.bg, border: `1px solid ${v.border}`, color: v.color, borderRadius: 14, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
        <path d={v.path} />
      </svg>
    </span>
  )
}

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'danger', loading = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, loading, onCancel])

  if (!open) return null

  return (
    <div className="master-modal-overlay" onClick={!loading ? onCancel : undefined}>
      <div className="master-modal" onClick={e => e.stopPropagation()}>
        <ConfirmIcon variant={variant} />
        <h3 className="master-modal-title">{title}</h3>
        {message && <p className="master-modal-message">{message}</p>}
        <div className="master-modal-actions">
          <button className="master-btn master-btn--ghost" type="button" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className={`master-btn master-btn--${variant}`} type="button" onClick={onConfirm} disabled={loading}>
            {loading && <span className="master-spinner" />}
            {loading ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

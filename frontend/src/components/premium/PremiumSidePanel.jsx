import { useEffect } from 'react'
import './PremiumSidePanel.css'

export default function PremiumSidePanel({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    function handleKeydown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="pm-sidepanel-root" role="presentation">
      <button className="pm-sidepanel-backdrop" onClick={onClose} type="button" aria-label="Fechar painel" />
      <aside className={`pm-sidepanel ${wide ? 'pm-sidepanel-wide' : ''}`} role="dialog" aria-modal="true">
        <div className="pm-sidepanel-header">
          <h2 className="pm-sidepanel-title">{title}</h2>
          <button className="pm-sidepanel-close" onClick={onClose} type="button" aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="pm-sidepanel-body">
          {children}
        </div>
      </aside>
    </div>
  )
}

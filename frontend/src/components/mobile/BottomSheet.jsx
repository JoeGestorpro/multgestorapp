import { useEffect, useRef, useState } from 'react'
import './BottomSheet.css'

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true,
  closeOnOverlay = true,
  className = ''
}) {
  const sheetRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (open) {
      setIsVisible(true)
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
      document.body.style.overflow = 'hidden'
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => {
        setIsVisible(false)
        document.body.style.overflow = ''
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleOverlayClick = () => {
    if (closeOnOverlay) {
      onClose?.()
    }
  }

  if (!isVisible) return null

  return (
    <div className={`bottom-sheet ${isAnimating ? 'bottom-sheet--open' : ''} ${className}`}>
      <div 
        className="bottom-sheet__overlay"
        onClick={handleOverlayClick}
      />
      
      <div 
        ref={sheetRef}
        className="bottom-sheet__content"
        style={{ maxHeight: height }}
      >
        {showHandle && (
          <div className="bottom-sheet__handle">
            <div className="bottom-sheet__handle-bar" />
          </div>
        )}
        
        {title && (
          <div className="bottom-sheet__header">
            <h3>{title}</h3>
            <button 
              className="bottom-sheet__close"
              onClick={onClose}
              aria-label="Fechar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="bottom-sheet__body">
          {children}
        </div>
      </div>
    </div>
  )
}

export function useBottomSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(prev => !prev)

  return { isOpen, open, close, toggle }
}
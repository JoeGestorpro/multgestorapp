import { useRef, useState } from 'react'
import './SwipeableCard.css'

const SWIPE_THRESHOLD = 80
const ACTION_WIDTH = 80

export default function SwipeableCard({
  children,
  leftAction,
  rightAction,
  leftActionIcon,
  rightActionIcon,
  leftActionColor = 'var(--success)',
  rightActionColor = 'var(--danger)',
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  className = ''
}) {
  const cardRef = useRef(null)
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)

  const handleTouchStart = (e) => {
    if (disabled) return
    startXRef.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (disabled || !isDragging) return
    
    const currentX = e.touches[0].clientX
    let deltaX = currentX - startXRef.current

    if (leftAction && deltaX < 0) {
      deltaX = Math.max(deltaX, -ACTION_WIDTH)
    } else if (rightAction && deltaX > 0) {
      deltaX = Math.min(deltaX, ACTION_WIDTH)
    } else if (!leftAction) {
      deltaX = Math.max(deltaX, 0)
    } else if (!rightAction) {
      deltaX = Math.min(deltaX, 0)
    }

    setTranslateX(deltaX)
  }

  const handleTouchEnd = () => {
    if (disabled) return
    setIsDragging(false)

    if (translateX < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft()
      setTranslateX(0)
    } else if (translateX > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight()
      setTranslateX(0)
    } else {
      setTranslateX(0)
    }
  }

  const handleActionClick = (action) => {
    action?.()
    setTranslateX(0)
  }

  const renderActions = (side, action, icon, color) => {
    if (!action) return null

    return (
      <div 
        className={`swipeable-card__action swipeable-card__action--${side}`}
        style={{ 
          '--action-color': color,
          transform: side === 'left' ? `translateX(${translateX + ACTION_WIDTH}px)` : `translateX(${translateX - ACTION_WIDTH}px)`
        }}
        onClick={() => handleActionClick(action)}
      >
        <span className="swipeable-card__action-icon">
          {icon || (side === 'left' ? '←' : '→')}
        </span>
      </div>
    )
  }

  return (
    <div className={`swipeable-card ${disabled ? 'swipeable-card--disabled' : ''} ${className}`}>
      {renderActions('left', onSwipeLeft, leftActionIcon, leftActionColor)}
      {renderActions('right', onSwipeRight, rightActionIcon, rightActionColor)}
      
      <div
        ref={cardRef}
        className={`swipeable-card__content ${isDragging ? 'swipeable-card__content--dragging' : ''}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
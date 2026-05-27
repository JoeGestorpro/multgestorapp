import { useEffect, useRef, useCallback } from 'react'
import { BarberIcon } from '../../components/barber/BarberUI'

function BookingBottomSheet({ isOpen, onClose, children }) {
  const sheetRef = useRef(null)
  const dragState = useRef({ startY: 0, currentY: 0, isDragging: false, startTime: 0 })

  const handleClose = useCallback(() => {
    if (onClose) onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e) { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function handleTouchStart(e) {
    const target = e.target.closest('.booking-bottom-sheet-body')
    if (target && target.scrollTop > 0) return
    dragState.current = {
      startY: e.touches[0].clientY,
      currentY: 0,
      isDragging: true,
      startTime: Date.now()
    }
  }

  function handleTouchMove(e) {
    const state = dragState.current
    if (!state.isDragging) return
    state.currentY = e.touches[0].clientY - state.startY
    if (state.currentY < 0) return
    if (sheetRef.current) {
      const damping = 1 - (state.currentY / (window.innerHeight * 2))
      sheetRef.current.style.transform = `translateY(${state.currentY * Math.max(0.5, damping)}px)`
      sheetRef.current.style.transition = 'none'
    }
  }

  function handleTouchEnd() {
    const state = dragState.current
    if (!state.isDragging) return
    state.isDragging = false
    const elapsed = Date.now() - state.startTime
    const velocity = state.currentY / Math.max(elapsed, 1)
    const shouldClose = state.currentY > 80 || (velocity > 0.5 && state.currentY > 40)
    if (shouldClose) {
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.3s var(--bf-ease-out)'
        sheetRef.current.style.transform = 'translateY(100%)'
      }
      setTimeout(handleClose, 250)
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.4s var(--bf-ease-out)'
        sheetRef.current.style.transform = 'translateY(0)'
      }
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="booking-bottom-sheet-overlay"
        onClick={handleClose}
        onTouchStart={(e) => { if (e.target === e.currentTarget) handleClose() }}
      />
      <div
        ref={sheetRef}
        className="booking-bottom-sheet"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="booking-bottom-sheet-handle-area">
          <div className="booking-bottom-sheet-handle" />
        </div>
        <button
          className="booking-bottom-sheet-close"
          onClick={handleClose}
          type="button"
          aria-label="Fechar"
        >
          <BarberIcon name="close" />
        </button>
        <div className="booking-bottom-sheet-body">
          {children}
        </div>
      </div>
    </>
  )
}

export default BookingBottomSheet

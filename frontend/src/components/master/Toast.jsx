import { useCallback, useEffect, useState } from 'react'

let nextId = 0
const listeners = new Set()

export function showToast(message, type = 'info', duration = 4000) {
  const id = ++nextId
  listeners.forEach(fn => fn({ id, message, type, duration }))
  return id
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast, onRemove])

  const icons = {
    success: 'M9 12l2 2 4-4M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v4m0 4h.01M10.29 3.86l-8.1 14c-.6 1.04.15 2.14 1.21 2.14h15.2c1.06 0 1.81-1.1 1.21-2.14l-8.1-14c-.6-1.04-2.14-1.04-2.74 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }

  return (
    <div className={`master-toast master-toast--${toast.type}`}>
      <svg className="master-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d={icons[toast.type] || icons.info} />
      </svg>
      <span className="master-toast-message">{toast.message}</span>
      <button className="master-toast-close" type="button" onClick={() => onRemove(toast.id)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
          <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast])
    }
    listeners.add(handler)
    return () => listeners.delete(handler)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="master-toast-container">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  )
}

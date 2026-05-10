import { useEffect, useRef, useState } from 'react'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import './ConfettiCelebration.css'

const COLORS = [
  'var(--accent-primary)',
  'var(--accent-secondary)',
  '#fff',
  'var(--success)',
  'var(--warning)'
]

export default function ConfettiCelebration({ 
  show = true, 
  duration = 3000, 
  particleCount = 80,
  onComplete 
}) {
  const containerRef = useRef(null)
  const { primaryColor } = useTenantTheme()

  useEffect(() => {
    if (!show || !containerRef.current) return

    const container = containerRef.current
    const colors = [primaryColor, 'var(--accent-secondary)', '#fff', ...COLORS]
    
    const createParticle = (index) => {
      const particle = document.createElement('div')
      particle.className = 'confetti-particle'
      
      const color = colors[index % colors.length]
      const size = 6 + Math.random() * 6
      const x = Math.random() * 100
      const delay = Math.random() * 0.5
      const durationVal = 2 + Math.random() * 2
      const rotation = Math.random() * 720 - 360
      
      particle.style.cssText = `
        --x: ${x}%;
        --size: ${size}px;
        --delay: ${delay}s;
        --duration: ${durationVal}s;
        --rotation: ${rotation}deg;
        background: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      `
      
      container.appendChild(particle)
      
      setTimeout(() => {
        particle.remove()
      }, (delay + durationVal) * 1000)
    }

    for (let i = 0; i < particleCount; i++) {
      createParticle(i)
    }

    const timer = setTimeout(() => {
      onComplete?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [show, duration, particleCount, primaryColor, onComplete])

  if (!show) return null

  return (
    <div className="confetti-celebration" ref={containerRef} />
  )
}

export function useConfetti() {
  const [show, setShow] = useState(false)
  const showConfetti = () => setShow(true)
  const hideConfetti = () => setShow(false)

  return { show, showConfetti, hideConfetti, ConfettiComponent: ConfettiCelebration }
}
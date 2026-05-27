import { cn } from '../utils/cn'

export function ScrollReveal({ children, className = '', variant = 'fade', stagger = 0 }) {
  return (
    <div
      className={cn(
        'bl-reveal',
        variant === 'left' && 'bl-reveal-left',
        variant === 'right' && 'bl-reveal-right',
        variant === 'scale' && 'bl-reveal-scale',
        stagger > 0 && `stagger-${stagger}`,
        className
      )}
    >
      {children}
    </div>
  )
}

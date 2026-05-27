import { cn } from '../utils/cn'

export function SectionTitle({ label, title, subtitle, align = 'center', className = '' }) {
  return (
    <div className={cn('bl-section-title', `bl-section-title--${align}`, className)}>
      {label && <span className="bl-section-title__label">{label}</span>}
      {title && <h2 className="bl-section-title__h">{title}</h2>}
      {subtitle && <p className="bl-section-title__sub">{subtitle}</p>}
    </div>
  )
}

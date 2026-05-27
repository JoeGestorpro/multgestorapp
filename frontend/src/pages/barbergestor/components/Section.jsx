import { cn } from '../utils/cn'

export function Section({ children, className = '', id, dark, cream, style, ...props }) {
  return (
    <section
      id={id}
      className={cn(
        'bl-section',
        dark && 'bl-section--dark',
        cream && 'bl-section--cream',
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </section>
  )
}

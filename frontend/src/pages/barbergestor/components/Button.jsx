import { cn } from '../utils/cn'

export function Button({ children, variant = 'primary', size = 'md', className = '', as: Tag = 'button', href, ...props }) {
  const Component = href ? 'a' : Tag
  const extraProps = href ? { href, ...(href.startsWith('#') ? {} : { target: '_blank', rel: 'noopener noreferrer' }) } : {}

  return (
    <Component
      className={cn(
        'bl-btn',
        `bl-btn--${variant}`,
        `bl-btn--${size}`,
        className
      )}
      {...extraProps}
      {...props}
    >
      {children}
    </Component>
  )
}

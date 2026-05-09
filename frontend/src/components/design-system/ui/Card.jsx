import './Card.css'

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  interactive = false,
  selected = false,
  className = '',
  ...props
}) {
  const classes = [
    'ds-card',
    `ds-card--padding-${padding}`,
    variant === 'elevated' && 'ds-card--elevated',
    interactive && 'ds-card--interactive',
    selected && 'ds-card--selected',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return <div className={`ds-card__header ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`ds-card__title ${className}`}>{children}</h3>
}

export function CardSubtitle({ children, className = '' }) {
  return <p className={`ds-card__subtitle ${className}`}>{children}</p>
}

export function CardBody({ children, className = '' }) {
  return <div className={`ds-card__body ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }) {
  return <div className={`ds-card__footer ${className}`}>{children}</div>
}
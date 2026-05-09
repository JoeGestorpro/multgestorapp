import './Badge.css'

const VARIANTS = ['success', 'warning', 'danger', 'info', 'neutral', 'accent']

export default function Badge({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
  ...props
}) {
  const classes = [
    'ds-badge',
    `ds-badge--${variant}`,
    dot && 'ds-badge--dot',
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}

Badge.variants = VARIANTS
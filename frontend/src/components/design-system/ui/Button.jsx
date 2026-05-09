import './Button.css'

const SIZES = ['sm', 'md', 'lg']
const VARIANTS = ['primary', 'secondary', 'ghost', 'danger']

export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  iconOnly = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const classes = [
    'ds-button',
    `ds-button--${variant}`,
    `ds-button--${size}`,
    iconOnly && 'ds-button--icon-only',
    loading && 'ds-button--loading',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

Button.sizes = SIZES
Button.variants = VARIANTS
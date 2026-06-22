export default function ActionButton({ children, variant = 'primary', size = 'md', loading = false, disabled = false, icon: Icon, type = 'button', onClick, className = '' }) {
  const classes = [
    'master-btn',
    `master-btn--${variant}`,
    `master-btn--${size}`,
    loading ? 'master-btn--loading' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} type={type} onClick={onClick} disabled={disabled || loading}>
      {loading ? (
        <span className="master-spinner" />
      ) : Icon ? (
        typeof Icon === 'function' ? <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} /> : <Icon />
      ) : null}
      {children}
    </button>
  )
}

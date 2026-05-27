import './PremiumButton.css'

export default function PremiumButton({
  children, variant = 'primary', size = 'md', icon, className = '', onClick, disabled, type = 'button', ...rest
}) {
  return (
    <button
      className={`pm-btn pm-btn-${variant} pm-btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...rest}
    >
      {icon && <span className="pm-btn-icon">{icon}</span>}
      {children && <span className="pm-btn-text">{children}</span>}
    </button>
  )
}

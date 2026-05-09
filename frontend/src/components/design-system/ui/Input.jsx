import './Input.css'

export default function Input({
  label,
  error,
  size = 'md',
  icon,
  suffix,
  className = '',
  ...props
}) {
  return (
    <div className={`ds-input-wrapper ${className}`}>
      {label && <label className="ds-input-label">{label}</label>}
      <div
        className={[
          'ds-input',
          `ds-input--${size}`,
          error && 'ds-input--error'
        ].filter(Boolean).join(' ')}
      >
        {icon && <span className="ds-input__icon">{icon}</span>}
        <input className="ds-input__field" {...props} />
        {suffix && <span className="ds-input__suffix">{suffix}</span>}
      </div>
      {error && <span className="ds-input__error">{error}</span>}
    </div>
  )
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`ds-input ds-textarea ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`ds-input ds-select ${className}`} {...props}>
      {children}
    </select>
  )
}
import './PremiumActionButton.css'

export default function PremiumActionButton({ icon, label, onClick, variant = 'primary' }) {
  return (
    <button
      className={`pm-action-btn pm-action-${variant}`}
      onClick={onClick}
      type="button"
      title={label}
    >
      {icon && <span className="pm-action-icon">{icon}</span>}
      <span className="pm-action-label">{label}</span>
    </button>
  )
}

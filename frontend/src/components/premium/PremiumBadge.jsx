import './PremiumBadge.css'

export default function PremiumBadge({ status, label, size = 'md' }) {
  return (
    <span className={`pm-badge pm-badge-${status || 'default'} pm-badge-${size}`}>
      <span className="pm-badge-dot" />
      {label}
    </span>
  )
}

import Button from '../ui/Button'
import './Empty.css'

export default function Empty({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
  className = ''
}) {
  return (
    <div
      className={[
        'ds-empty',
        compact && 'ds-empty--compact',
        className
      ].filter(Boolean).join(' ')}
    >
      {icon && <div className="ds-empty__icon">{icon}</div>}
      <h3 className="ds-empty__title">{title}</h3>
      {description && <p className="ds-empty__description">{description}</p>}
      {actionLabel && onAction && (
        <div className="ds-empty__action">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
import PlanLock from './PlanLock'

function LockedFeature({
  children,
  locked = false,
  message,
  onLockedClick,
  className = '',
  inline = false
}) {
  // REGRA GLOBAL: detalhes e acoes bloqueadas por plano devem ser sinalizados antes do clique na API.
  const wrapperClassName = [
    'locked-feature',
    inline ? 'locked-feature-inline' : '',
    locked ? 'is-locked' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  if (!locked) {
    return <>{children}</>
  }

  return (
    <div
      aria-disabled="true"
      className={wrapperClassName}
      onClick={() => onLockedClick?.(message)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onLockedClick?.(message)
        }
      }}
      role="button"
      tabIndex={0}
      title={message}
    >
      <div className="locked-feature-overlay">
        <PlanLock label="Bloqueado" />
      </div>
      <div className="locked-feature-content">{children}</div>
    </div>
  )
}

export default LockedFeature

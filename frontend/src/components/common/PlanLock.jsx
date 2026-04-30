function PlanLock({ label = 'Bloqueado' }) {
  return (
    <span className="plan-lock-badge" aria-label={label} title={label}>
      <span aria-hidden="true">🔒</span>
      <span>{label}</span>
    </span>
  )
}

export default PlanLock

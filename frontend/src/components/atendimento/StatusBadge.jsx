function StatusBadge({ status, label }) {
  const statusConfig = {
    active: { className: 'at-badge-active', defaultLabel: 'Em Atendimento' },
    waiting: { className: 'at-badge-waiting', defaultLabel: 'Aguardando' },
    completed: { className: 'at-badge-completed', defaultLabel: 'Concluído' },
    cancelled: { className: 'at-badge-cancelled', defaultLabel: 'Cancelado' }
  }

  const config = statusConfig[status] || statusConfig.active
  const displayLabel = label || config.defaultLabel

  return (
    <span className={`at-badge ${config.className}`}>
      <span className="at-badge-dot" />
      {displayLabel}
    </span>
  )
}

export default StatusBadge

const STATUS_MAP = {
  active: 'green', ativo: 'green', production: 'green', venda: 'green',
  vendavel: 'green', beta: 'purple', mvp: 'blue',
  inactive: 'gray', inativo: 'gray', ideia: 'gray', planned: 'gray',
  planejado: 'gray', futuro: 'gray', archived: 'gray',
  trial: 'blue', lead: 'blue',
  partial: 'yellow', parcial: 'yellow', warning: 'yellow',
  inadimplente: 'yellow',
  pending: 'orange', pendente: 'orange',
  error: 'red', danger: 'red', critical: 'red', critico: 'red',
  cancelado: 'red', cancelled: 'red',
  success: 'green', info: 'blue'
}

export default function StatusBadge({ status, customColor, label }) {
  const color = customColor || STATUS_MAP[(status || '').toLowerCase()] || 'gray'
  return (
    <span className={`master-status-badge master-status-badge--${color}`}>
      {label || status}
    </span>
  )
}

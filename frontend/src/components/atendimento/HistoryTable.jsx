import { Clock } from 'lucide-react'
import StatusBadge from './StatusBadge'

function HistoryTable({ sales = [] }) {
  if (!sales || sales.length === 0) {
    return null
  }

  const formatPrice = (value) => {
    if (!value && value !== 0) return 'R$ --'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value))
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '--'
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="at-history">
      <div className="at-history-header">
        <h3>Histórico de Atendimentos</h3>
        <span className="at-history-count">{sales.length} registro(s)</span>
      </div>
      <div className="at-history-list">
        {sales.map((sale, idx) => (
          <div className="at-history-row" key={sale.id || idx}>
            <div className="at-history-info">
              <strong className="at-history-client">{sale.client_name || 'Cliente'}</strong>
              <span className="at-history-service">
                {sale.items?.map(i => i.name).join(', ') || '--'}
              </span>
              <span className="at-history-date">
                <Clock size={10} />
                {formatDate(sale.created_at)}
              </span>
            </div>
            <div className="at-history-meta">
              <strong className="at-history-value">{formatPrice(sale.total_amount)}</strong>
              <StatusBadge status={sale.status || 'completed'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HistoryTable

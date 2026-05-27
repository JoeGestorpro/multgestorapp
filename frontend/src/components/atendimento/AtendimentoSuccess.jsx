import { Check, Plus, FileText } from 'lucide-react'

function AtendimentoSuccess({ total, paymentMethod, clientName, onNewAttendance, onViewDetails }) {
  const formatPrice = (value) => {
    if (!value && value !== 0) return 'R$ --'
    const num = Number(value)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  const paymentLabels = {
    pix: 'PIX',
    cash: 'Dinheiro',
    credit: 'Crédito',
    debit: 'Débito',
    permuta: 'Permuta'
  }

  return (
    <div className="at-success">
      <div className="at-success-icon">
        <Check size={36} strokeWidth={3} />
      </div>
      <h3>Atendimento registrado!</h3>
      <p>Registro salvo com sucesso no sistema.</p>

      <div className="at-success-details">
        <span className="at-success-badge">
          {formatPrice(total)}
        </span>
        <span className="at-success-badge">
          {paymentLabels[paymentMethod] || paymentMethod}
        </span>
        {clientName && (
          <span className="at-success-badge">
            {clientName}
          </span>
        )}
      </div>

      <div className="at-success-actions">
        <button onClick={onNewAttendance} type="button">
          <Plus size={16} />
          Novo atendimento
        </button>
        {onViewDetails && (
          <button onClick={onViewDetails} type="button">
            <FileText size={16} />
            Ver detalhes
          </button>
        )}
      </div>
    </div>
  )
}

export default AtendimentoSuccess

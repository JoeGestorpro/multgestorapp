import { useMemo } from 'react'
import { DollarSign, ArrowLeftRight } from 'lucide-react'

function CashPaymentInput({ total, amountReceived, onChange, change }) {
  const formatPrice = (value) => {
    if (!value && value !== 0) return 'R$ --'
    const num = Number(value)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  const quickValues = useMemo(() => {
    const t = Number(total) || 0
    const vals = [Math.ceil(t)]
    if (Math.ceil(t * 1.5) > Math.ceil(t)) {
      vals.push(Math.ceil(t * 1.5))
    }
    vals.push(Math.ceil(t * 2))
    return vals.filter(v => v >= Math.ceil(t)).slice(0, 3)
  }, [total])

  const hasChange = change !== undefined && change > 0

  return (
    <div className="at-cash-input">
      <label htmlFor="cash-received" className="at-cash-label">
        <DollarSign size={12} />
        Valor recebido
      </label>
      <div className="at-cash-field">
        <span className="at-cash-currency">R$</span>
        <input
          id="cash-received"
          type="number"
          min={total}
          step="0.01"
          value={amountReceived}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0,00"
        />
      </div>

      {hasChange && (
        <div className="at-cash-change">
          <ArrowLeftRight size={14} />
          <span>Troco</span>
          <strong>{formatPrice(change)}</strong>
        </div>
      )}

      {quickValues.length > 0 && (
        <div className="at-cash-quick">
          <span className="at-cash-quick-label">Sugestões</span>
          <div className="at-cash-quick-btns">
            {quickValues.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onChange(String(val))}
              >
                {formatPrice(val)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CashPaymentInput

import { Smartphone, Banknote, Receipt, CreditCard, RefreshCw } from 'lucide-react'

const PAYMENT_METHODS = {
  pix: { icon: Smartphone, label: 'PIX', color: '#5ca8ff' },
  cash: { icon: Banknote, label: 'Dinheiro', color: '#8cff4f' },
  credit: { icon: Receipt, label: 'Crédito', color: '#a78bfa' },
  debit: { icon: CreditCard, label: 'Débito', color: '#c084fc' },
  permuta: { icon: RefreshCw, label: 'Permuta', color: '#f4c86c' }
}

function PaymentSelector({ selected, onSelect, options }) {
  const availableMethods = options || ['pix', 'cash', 'credit', 'debit', 'permuta']

  return (
    <div className="at-payment-grid">
      {availableMethods.map((method) => {
        const config = PAYMENT_METHODS[method]
        if (!config) return null
        const Icon = config.icon
        const isActive = selected === method

        return (
          <button
            key={method}
            className={`at-payment-btn ${isActive ? 'active' : ''}`}
            data-method={method}
            onClick={() => onSelect(method)}
            type="button"
            style={{
              '--pm-color': config.color,
              '--pm-glow': `${config.color}25`
            }}
          >
            <Icon size={20} />
            <span>{config.label}</span>
            {isActive && <span className="at-payment-check" />}
          </button>
        )
      })}
    </div>
  )
}

export default PaymentSelector

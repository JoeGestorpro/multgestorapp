import { X, Minus, Plus, Package } from 'lucide-react'
import ServiceIcon from '../barber/ServiceIcon'

function CartItem({ item, onUpdateQty, onRemove, isProduct = false, isFridge = false }) {
  const showPackageIcon = isProduct || isFridge || item.itemType === 'product' || item.itemType === 'fridge'
  return (
    <div className="at-item">
      <button
        className="at-item-remove"
        onClick={() => onRemove(item.key)}
        type="button"
        aria-label="Remover item"
      >
        <X size={12} />
      </button>
      <div className="at-item-icon">
        {showPackageIcon ? (
          <Package size={14} />
        ) : (
          <ServiceIcon icon={item.icon} serviceName={item.name} size={14} />
        )}
      </div>
      <div className="at-item-info">
        <span className="at-item-name">{item.name}</span>
        <span className="at-item-price">{formatPrice(item.unitPrice)}</span>
      </div>
      <div className="at-item-qty">
        <button
          onClick={() => onUpdateQty(item.key, -1)}
          type="button"
          aria-label="Diminuir quantidade"
          className="at-qty-btn"
        >
          <Minus size={10} />
        </button>
        <span className="at-qty-value">{item.quantity}</span>
        <button
          onClick={() => onUpdateQty(item.key, 1)}
          type="button"
          aria-label="Aumentar quantidade"
          className="at-qty-btn"
        >
          <Plus size={10} />
        </button>
      </div>
      <strong className="at-item-total">{formatPrice(item.totalPrice)}</strong>
    </div>
  )
}

function formatPrice(value) {
  if (!value && value !== 0) return 'R$ --'
  const num = Number(value)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num)
}

export default CartItem

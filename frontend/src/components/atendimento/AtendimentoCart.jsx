import { useMemo, useState } from 'react'
import { ShoppingBag, ChevronUp, ChevronDown, Plus } from 'lucide-react'
import CartItem from './CartItem'
import PaymentSelector from './PaymentSelector'
import CashPaymentInput from './CashPaymentInput'

function AtendimentoCart({
  items,
  onUpdateQty,
  onRemoveItem,
  onClear,
  clientName,
  onClientChange,
  paymentMethod,
  onPaymentChange,
  amountReceived,
  onAmountReceived,
  total,
  commission,
  net,
  onSubmit,
  isSubmitting,
  canManageCash,
  isCollaborator,
  collaborators,
  onCollaboratorChange,
  selectedCollaboratorId,
  cashChange,
  paymentOptions,
  isExpanded,
  onToggleExpand
}) {
  const isCashPayment = paymentMethod === 'cash' || paymentMethod === 'dinheiro'
  const [itemsExpanded, setItemsExpanded] = useState(true)

  const formatPrice = (value) => {
    if (!value && value !== 0) return 'R$ --'
    const num = Number(value)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  const itemCount = items.length
  const hasItems = itemCount > 0

  return (
    <div className={`at-cart ${isExpanded ? 'expanded' : ''}`}>
      {!isExpanded && (
        <div className="at-cart-handle" onClick={onToggleExpand}>
          <ChevronUp size={16} />
        </div>
      )}

      <div className="at-cart-header">
        <div className="at-cart-title-group">
          <span className="at-cart-title">Atendimento</span>
          {hasItems && (
            <span className="at-cart-count">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
          )}
        </div>
        {hasItems && (
          <button className="at-cart-clear" onClick={onClear} type="button">
            Limpar
          </button>
        )}
      </div>

      {hasItems && (
        <button
          className="at-cart-items-toggle"
          onClick={() => setItemsExpanded(!itemsExpanded)}
          type="button"
        >
          <span>Itens adicionados</span>
          <span className="at-cart-count">{itemCount}</span>
          {itemsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}

      <div className={`at-cart-items${hasItems && !itemsExpanded ? ' collapsed' : ''}`}>
        {hasItems ? (
          items.map((item) => (
            <CartItem
              key={item.key}
              item={item}
              onUpdateQty={onUpdateQty}
              onRemove={onRemoveItem}
              isProduct={item.itemType === 'product'}
            />
          ))
        ) : (
          <div className="at-cart-empty">
            <ShoppingBag size={28} />
            <span>Toque em um serviço para adicionar</span>
          </div>
        )}
      </div>

      {hasItems && (
        <div className="at-cart-summary">
          <div className="at-cart-summary-row">
            <span>Subtotal</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          {commission > 0 && (
            <div className="at-cart-summary-row">
              <span>Comissão</span>
              <strong>{formatPrice(commission)}</strong>
            </div>
          )}
          <div className="at-cart-summary-divider" />
          <div className="at-cart-summary-row total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </div>
      )}

      <div className="at-cart-checkout">
        <div className="at-cart-client">
          <label htmlFor="at-client-name">Cliente</label>
          <input
            id="at-client-name"
            type="text"
            value={clientName}
            onChange={(e) => onClientChange(e.target.value)}
            placeholder="Nome do cliente (opcional)"
          />
        </div>

        {canManageCash && (
          <div className="at-cart-client">
            <label htmlFor="at-collaborator">Colaborador</label>
            <select
              id="at-collaborator"
              value={selectedCollaboratorId}
              onChange={(e) => onCollaboratorChange(e.target.value)}
            >
              <option value="">Selecione</option>
              {collaborators.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name || col.nickname}
                </option>
              ))}
            </select>
          </div>
        )}

        <PaymentSelector
          selected={paymentMethod}
          onSelect={onPaymentChange}
          options={paymentOptions}
        />

        {isCashPayment && (
          <CashPaymentInput
            total={total}
            amountReceived={amountReceived}
            onChange={onAmountReceived}
            change={cashChange}
          />
        )}

        <button
          className="at-cart-submit"
          onClick={onSubmit}
          disabled={isSubmitting || !hasItems}
          type="button"
        >
          {isSubmitting ? (
            'Salvando...'
          ) : (
            <>
              <Plus size={16} />
              Finalizar {hasItems ? formatPrice(total) : ''}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default AtendimentoCart

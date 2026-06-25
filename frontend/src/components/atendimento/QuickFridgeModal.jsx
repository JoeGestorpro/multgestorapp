import { useState, useMemo } from 'react'
import { X, Search, Plus, Package, Star } from 'lucide-react'

function QuickFridgeModal({ open, onClose, fridgeItems = [], onAddFridgeItem }) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [quantity, setQuantity] = useState(1)

  const sortedItems = useMemo(() => {
    let items = [...fridgeItems]
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(i => i.name?.toLowerCase().includes(q))
    }
    items.sort((a, b) => {
      if (b.isFavorite && !a.isFavorite) return 1
      if (a.isFavorite && !b.isFavorite) return -1
      return 0
    })
    return items
  }, [fridgeItems, search])

  if (!open) return null

  const selectedItem = fridgeItems.find(i => i.id === selectedId)
  const isOutOfStock = selectedItem && (Number(selectedItem.stockCurrent) <= 0)

  const handleConfirm = () => {
    if (!selectedItem || isOutOfStock) return
    onAddFridgeItem({
      id: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.sale_price || selectedItem.price,
      quantity: Math.max(1, quantity),
      commissionEnabled: selectedItem.commissionEnabled || false,
      commissionType: selectedItem.commissionType || 'percentage',
      commissionValue: selectedItem.commissionValue || 0
    })
    setSelectedId(null)
    setQuantity(1)
    setSearch('')
    onClose()
  }

  const handleClose = () => {
    setSelectedId(null)
    setQuantity(1)
    setSearch('')
    onClose()
  }

  const formatPrice = (value) => {
    if (!value && value !== 0) return 'R$ --'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value) || 0)
  }

  return (
    <div className="at-modal-root">
      <button
        aria-label="Fechar"
        className="at-modal-backdrop"
        onClick={handleClose}
        type="button"
      />
      <div className="at-modal at-modal-quick-sale" role="dialog" aria-modal="true">
        <div className="at-modal-header-lined">
          <h3>Item da Geladeira</h3>
          <button
            className="at-modal-close"
            onClick={handleClose}
            type="button"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="at-modal-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Buscar item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="at-modal-product-list">
          {sortedItems.length > 0 ? (
            sortedItems.map(item => {
              const price = item.sale_price || item.price
              const stock = Number(item.stockCurrent) || 0
              const itemOutOfStock = stock <= 0
              const isSelected = selectedId === item.id
              const stockStatus = stock <= 0 ? 'esgotado' : stock <= (item.stockMin || 10) ? 'baixo' : 'normal'
              return (
                <button
                  key={item.id}
                  className={`at-modal-product-item ${isSelected ? 'selected' : ''} ${itemOutOfStock ? 'at-modal-item-disabled' : ''}`}
                  onClick={() => !itemOutOfStock && setSelectedId(item.id)}
                  disabled={itemOutOfStock}
                  type="button"
                  title={itemOutOfStock ? 'Item esgotado' : ''}
                >
                  <div className="at-modal-product-icon">
                    <Package size={16} />
                  </div>
                  <div className="at-modal-product-info">
                    <strong>
                      {item.name}
                      {item.isFavorite && <Star size={11} className="at-fridge-star-icon" />}
                    </strong>
                    <span>{formatPrice(price)}</span>
                    <span className={`at-stock-badge at-stock-${stockStatus}`}>
                      {stock === 0 ? 'ESGOTADO' : `${stock} un`}
                    </span>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="at-modal-empty">Nenhum item encontrado</div>
          )}
        </div>

        {selectedItem && !isOutOfStock && (
          <div className="at-modal-quantity">
            <label>Quantidade</label>
            <div className="at-modal-qty-controls">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                type="button"
              >
                -
              </button>
              <span>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                type="button"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="at-modal-actions">
          <button
            className="at-modal-btn at-modal-btn-primary"
            onClick={handleConfirm}
            disabled={!selectedItem || isOutOfStock}
            type="button"
          >
            <Plus size={14} />
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuickFridgeModal

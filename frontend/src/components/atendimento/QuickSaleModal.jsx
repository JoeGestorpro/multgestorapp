import { useState, useMemo } from 'react'
import { X, Search, Plus, Package } from 'lucide-react'

function QuickSaleModal({ open, onClose, products = [], onAddProduct }) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [quantity, setQuantity] = useState(1)

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(p =>
      p.name?.toLowerCase().includes(q)
    )
  }, [products, search])

  if (!open) return null

  const selectedProduct = products.find(p => p.id === selectedId)

  const handleConfirm = () => {
    if (!selectedProduct) return
    onAddProduct({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price || selectedProduct.sale_price,
      quantity: Math.max(1, quantity)
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
          <h3>Venda Rápida</h3>
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
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="at-modal-product-list">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => {
              const price = product.price || product.sale_price
              const isSelected = selectedId === product.id
              return (
                <button
                  key={product.id}
                  className={`at-modal-product-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedId(product.id)}
                  type="button"
                >
                  <div className="at-modal-product-icon">
                    <Package size={16} />
                  </div>
                  <div className="at-modal-product-info">
                    <strong>{product.name}</strong>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(Number(price) || 0)}
                    </span>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="at-modal-empty">Nenhum produto encontrado</div>
          )}
        </div>

        {selectedProduct && (
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
            disabled={!selectedProduct}
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

export default QuickSaleModal

import { useMemo, useState } from 'react'
import { Search, LayoutGrid, List, Package, Star, Check } from 'lucide-react'
import ServiceCard from './ServiceCard'

function ServiceCatalog({ services, products, fridgeItems = [], onSelectItem, selectedItems }) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const tabs = [
    { key: 'all', label: 'Todos' },
    { key: 'services', label: 'Serviços' },
    { key: 'products', label: 'Produtos' },
    { key: 'fridge', label: 'Geladeira' }
  ]

  const catalogItems = useMemo(() => {
    let items = []

    if (activeTab === 'all' || activeTab === 'services') {
      items = [...items, ...services.map(s => ({ ...s, _type: 'service' }))]
    }

    if (activeTab === 'all' || activeTab === 'products') {
      items = [...items, ...products.map(p => ({ ...p, _type: 'product' }))]
    }

    if (activeTab === 'all' || activeTab === 'fridge') {
      const activeFridge = fridgeItems.filter(f => f.isActive !== false)
      items = [...items, ...activeFridge.map(f => ({ ...f, _type: 'fridge' }))]
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase()
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchLower)
      )
    }

    return items
  }, [services, products, fridgeItems, activeTab, search])

  const tabCounts = useMemo(() => {
    const activeFridge = (fridgeItems || []).filter(f => f.isActive !== false)
    const all = [
      ...services.map(s => ({ ...s, _type: 'service' })),
      ...products.map(p => ({ ...p, _type: 'product' })),
      ...activeFridge.map(f => ({ ...f, _type: 'fridge' }))
    ]
    return {
      all: all.length,
      services: services.length,
      products: products.length,
      fridge: activeFridge.length
    }
  }, [services, products, fridgeItems])

  const handleSelect = (item) => {
    if (item._type === 'fridge') {
      const stock = Number(item.stockCurrent) || 0
      if (stock <= 0) return
      onSelectItem({
        id: item.id,
        name: item.name,
        price: item.sale_price || item.price,
        icon: 'package',
        type: 'fridge',
        commissionEnabled: item.commissionEnabled || false,
        commissionType: item.commissionType || 'percentage',
        commissionValue: item.commissionValue || 0
      })
      return
    }
    onSelectItem({
      id: item.id,
      name: item.name,
      price: item.price || item.sale_price,
      icon: item.icon,
      type: item._type,
      estimated_time_minutes: item.estimated_time_minutes
    })
  }

  const isSelected = (item) => {
    return selectedItems.some(s => s.itemId === item.id && s.itemType === item._type)
  }

  const getStockStatus = (item) => {
    if (item._type !== 'fridge') return null
    const stock = Number(item.stockCurrent) || 0
    if (stock <= 0) return 'esgotado'
    if (stock <= (item.stockMin || 10)) return 'baixo'
    return 'normal'
  }

  return (
    <div className="at-catalog">
      <div className="at-catalog-header">
        <div className="at-catalog-search">
          <Search className="at-catalog-search-icon" size={15} />
          <input
            type="text"
            placeholder="Buscar serviço ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="at-catalog-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`at-catalog-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
              <span className="at-catalog-tab-count">{tabCounts[tab.key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="at-catalog-grid">
        {catalogItems.length > 0 ? (
          catalogItems.map((item) => {
            if (item._type === 'fridge') {
              const stock = Number(item.stockCurrent) || 0
              const stockStatus = getStockStatus(item)
              const outOfStock = stock <= 0
              return (
                <button
                  key={`fridge-${item.id}`}
                  className={`at-service-card ${isSelected(item) ? 'selected' : ''} ${outOfStock ? 'at-card-disabled' : ''}`}
                  onClick={() => handleSelect(item)}
                  disabled={outOfStock}
                  type="button"
                  aria-label={`Adicionar ${item.name}`}
                  title={outOfStock ? 'Item esgotado' : ''}
                >
                  <div className="at-service-card-icon">
                    <Package size={18} />
                  </div>
                  <span className="at-service-card-name">
                    {item.name}
                    {item.isFavorite && <Star size={10} className="at-fridge-star-icon" />}
                  </span>
                  <span className="at-service-card-price">
                    {formatPrice(item.sale_price || item.price)}
                  </span>
                  {stockStatus && (
                    <span className={`at-stock-badge at-stock-${stockStatus}`}>
                      {stock === 0 ? 'ESGOTADO' : `${stock}`}
                    </span>
                  )}
                  {isSelected(item) && (
                    <span className="at-service-card-check">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            }
            return (
              <ServiceCard
                key={`${item._type}-${item.id}`}
                service={{
                  ...item,
                  formattedPrice: formatPrice(item.price || item.sale_price)
                }}
                onSelect={handleSelect}
                isSelected={isSelected(item)}
                isProduct={item._type === 'product'}
              />
            )
          })
        ) : (
          <div className="at-catalog-empty">
            <span>Nenhum item encontrado</span>
          </div>
        )}
      </div>
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

export default ServiceCatalog

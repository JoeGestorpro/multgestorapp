import {
  BarberBadge,
  BarberButton,
  BarberCard,
  BarberEmptyState,
  BarberIcon,
  BarberTable
} from '../../components/barber/BarberUI'
import {
  FRIDGE_LOCATIONS,
  FRIDGE_CATEGORIES,
  getStockStatus
} from '../../features/barber/utils/fridgeHelpers'

function StockBadge({ item }) {
  const status = getStockStatus(item)
  const current = Number(item.stockCurrent ?? item.stock_current ?? 0)

  if (status === 'inactive') {
    return <BarberBadge tone="danger">Inativo</BarberBadge>
  }
  if (status === 'out') {
    return <BarberBadge tone="danger">Esgotado</BarberBadge>
  }
  if (status === 'low') {
    return <BarberBadge tone="pending">Estoque baixo</BarberBadge>
  }
  return (
    <span style={{ color: 'var(--barber-success)', fontSize: 13, fontWeight: 500 }}>
      {current} {item.unit || 'un'}
    </span>
  )
}

function ItensGeladeira({
  filters,
  form,
  isEditing,
  isAdmin,
  money,
  onCancelEdit,
  onDelete,
  onEdit,
  onFilterChange,
  onFormChange,
  onSubmit,
  onToggleStatus,
  onToggleFavorite,
  items
}) {
  const locationOptions = Array.from(
    new Set(
      items
        .map((item) => item.location)
        .filter(Boolean)
        .map((value) => String(value).trim())
    )
  ).sort((first, second) => first.localeCompare(second, 'pt-BR'))

  const categoryOptions = Array.from(
    new Set(
      items
        .map((item) => item.category)
        .filter(Boolean)
        .map((value) => String(value).trim())
    )
  ).sort((first, second) => first.localeCompare(second, 'pt-BR'))

  const lowStockCount = items.filter((item) => {
    const status = getStockStatus(item)
    return status === 'low' || status === 'out'
  }).length

  function getLocationLabel(value) {
    const found = FRIDGE_LOCATIONS.find((loc) => loc.value === value)
    return found ? found.label : value
  }

  function getCategoryLabel(value) {
    const found = FRIDGE_CATEGORIES.find((cat) => cat.value === value)
    return found ? found.label : value
  }

  return (
    <>
      <section className="barber-grid-two">
        <BarberCard>
          <div className="barber-panel-header">
            <div>
              <h3>{isEditing ? 'Editar item' : 'Cadastrar item'}</h3>
              <p>Gerencie bebidas, produtos de balcão e itens de consumo rápido com estoque e comissão.</p>
            </div>
            <BarberBadge tone={form.isActive ? 'success' : 'danger'}>
              {form.isActive ? 'Ativo' : 'Inativo'}
            </BarberBadge>
          </div>

          <form className="barber-panel-stack" onSubmit={onSubmit}>
            <div className="barber-form-grid">
              <div className="barber-form-block">
                <label htmlFor="fridge-name">Nome</label>
                <input className="barber-input" id="fridge-name" name="name" onChange={onFormChange} required value={form.name} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="fridge-category">Categoria</label>
                <select className="barber-select" id="fridge-category" name="category" onChange={onFormChange} value={form.category}>
                  <option value="">Selecione</option>
                  {FRIDGE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="barber-form-block">
                <label htmlFor="fridge-location">Local</label>
                <select className="barber-select" id="fridge-location" name="location" onChange={onFormChange} value={form.location}>
                  {FRIDGE_LOCATIONS.map((loc) => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </select>
              </div>
              <div className="barber-form-block">
                <label htmlFor="fridge-sale-price">Preço de venda</label>
                <input className="barber-input" id="fridge-sale-price" min="0" name="salePrice" onChange={onFormChange} required step="0.01" type="number" value={form.salePrice} />
              </div>
              {isAdmin && (
                <div className="barber-form-block">
                  <label htmlFor="fridge-cost-price">Custo</label>
                  <input className="barber-input" id="fridge-cost-price" min="0" name="costPrice" onChange={onFormChange} step="0.01" type="number" value={form.costPrice} />
                </div>
              )}
              {isAdmin && (
                <div className="barber-form-block">
                  <label htmlFor="fridge-stock-current">Estoque atual</label>
                  <input className="barber-input" id="fridge-stock-current" min="0" name="stockCurrent" onChange={onFormChange} step="1" type="number" value={form.stockCurrent} />
                </div>
              )}
              {isAdmin && (
                <div className="barber-form-block">
                  <label htmlFor="fridge-stock-minimum">Estoque mínimo</label>
                  <input className="barber-input" id="fridge-stock-minimum" min="0" name="stockMinimum" onChange={onFormChange} step="1" type="number" value={form.stockMinimum} />
                </div>
              )}
              <div className="barber-form-block">
                <label htmlFor="fridge-unit">Unidade</label>
                <input className="barber-input" id="fridge-unit" name="unit" onChange={onFormChange} placeholder="un, lata, cx..." value={form.unit} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="fridge-status">Status</label>
                <select className="barber-select" id="fridge-status" name="isActive" onChange={onFormChange} value={String(form.isActive)}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
              {isAdmin && (
                <div className="barber-form-block">
                  <label className="barber-checkbox-label">
                    <input
                      checked={form.isFavorite}
                      className="barber-checkbox"
                      id="fridge-favorite"
                      name="isFavorite"
                      onChange={(e) => onFormChange({ target: { name: 'isFavorite', value: e.target.checked } })}
                      type="checkbox"
                    />
                    <span>Marcar como favorito</span>
                  </label>
                </div>
              )}
              {isAdmin && (
                <div className="barber-form-block barber-form-block-full">
                  <label className="barber-checkbox-label">
                    <input
                      checked={form.commissionEnabled}
                      className="barber-checkbox"
                      id="fridge-commission-enabled"
                      name="commissionEnabled"
                      onChange={(e) => onFormChange({ target: { name: 'commissionEnabled', value: e.target.checked } })}
                      type="checkbox"
                    />
                    <span>Habilitar comissão para este item</span>
                  </label>
                </div>
              )}
              {isAdmin && form.commissionEnabled && (
                <>
                  <div className="barber-form-block">
                    <label htmlFor="fridge-commission-type">Tipo de comissão</label>
                    <select className="barber-select" id="fridge-commission-type" name="commissionType" onChange={onFormChange} value={form.commissionType}>
                      <option value="percent">Percentual</option>
                      <option value="fixed">Valor fixo</option>
                    </select>
                  </div>
                  <div className="barber-form-block">
                    <label htmlFor="fridge-commission-value">
                      {form.commissionType === 'percent' ? 'Percentual (%)' : 'Valor fixo (R$)'}
                    </label>
                    <input className="barber-input" id="fridge-commission-value" min="0" name="commissionValue" onChange={onFormChange} step="0.01" type="number" value={form.commissionValue} />
                  </div>
                </>
              )}
            </div>

            <div className="barber-page-actions">
              <BarberButton type="submit" variant="primary">
                <BarberIcon name="product" />
                <span>{isEditing ? 'Salvar item' : 'Cadastrar item'}</span>
              </BarberButton>
              {isEditing && (
                <BarberButton onClick={onCancelEdit} type="button" variant="ghost">
                  Cancelar
                </BarberButton>
              )}
            </div>
          </form>
        </BarberCard>

        <BarberCard>
          <div className="barber-panel-header">
            <div>
              <h3>Busca e filtros</h3>
              <p>Refine por nome, status, local e categoria para manter o controle do estoque.</p>
            </div>
            <div className="barber-inline-actions">
              <BarberBadge tone="admin">{items.length} itens</BarberBadge>
              <BarberBadge tone={lowStockCount > 0 ? 'pending' : 'success'}>
                {lowStockCount} em estoque baixo
              </BarberBadge>
            </div>
          </div>

          <div className="barber-toolbar">
            <div className="barber-form-block">
              <label htmlFor="fridge-search">Busca</label>
              <input className="barber-input" id="fridge-search" name="search" onChange={onFilterChange} value={filters.search} />
            </div>
            <div className="barber-form-block">
              <label htmlFor="fridge-status-filter">Status</label>
              <select className="barber-select" id="fridge-status-filter" name="status" onChange={onFilterChange} value={filters.status}>
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
            <div className="barber-form-block">
              <label htmlFor="fridge-location-filter">Local</label>
              <select className="barber-select" id="fridge-location-filter" name="location" onChange={onFilterChange} value={filters.location}>
                <option value="">Todos</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>{getLocationLabel(loc)}</option>
                ))}
              </select>
            </div>
            <div className="barber-form-block">
              <label htmlFor="fridge-category-filter">Categoria</label>
              <select className="barber-select" id="fridge-category-filter" name="category" onChange={onFilterChange} value={filters.category}>
                <option value="">Todas</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
            </div>
          </div>
        </BarberCard>
      </section>

      <BarberCard>
        <div className="barber-table-header">
          <div>
            <h2>Itens da Geladeira</h2>
            <p>Catalogo de consumo interno da barbearia com estoque, localização e comissão.</p>
          </div>
        </div>

        <BarberTable columns={['Item', 'Local', 'Preço', 'Estoque', 'Comissão', 'Favorito', 'Status', 'Ações']}>
          {items.length > 0 ? (
            items.map((item) => {
              const stockStatus = getStockStatus(item)
              const commissionLabel = item.commissionEnabled
                ? item.commissionType === 'fixed'
                  ? money(item.commissionValue)
                  : `${item.commissionValue}%`
                : '-'

              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <span>
                      {[getCategoryLabel(item.category), item.unit].filter(Boolean).join(' • ') || 'Sem categoria'}
                    </span>
                  </td>
                  <td>{getLocationLabel(item.location)}</td>
                  <td>
                    <strong>{money(item.salePrice)}</strong>
                    {isAdmin && item.costPrice > 0 && (
                      <span>Custo {money(item.costPrice)}</span>
                    )}
                  </td>
                  <td>
                    <div className="barber-status-grid">
                      <StockBadge item={item} />
                      {stockStatus === 'low' && item.stockMinimum > 0 && (
                        <span className="barber-table-note">Min. {item.stockMinimum}</span>
                      )}
                    </div>
                  </td>
                  <td>{commissionLabel}</td>
                  <td>
                    {item.isFavorite ? (
                      <span style={{ color: '#f59e0b', fontSize: 18 }}>★</span>
                    ) : (
                      <span style={{ color: 'var(--barber-text-muted)', fontSize: 18 }}>☆</span>
                    )}
                  </td>
                  <td>
                    <BarberBadge tone={item.isActive ? 'success' : 'danger'}>
                      {item.isActive ? 'Ativo' : 'Inativo'}
                    </BarberBadge>
                  </td>
                  <td>
                    <div className="barber-inline-actions">
                      <BarberButton onClick={() => onEdit(item.id)} type="button" variant="ghost">Editar</BarberButton>
                      <BarberButton onClick={() => onToggleStatus(item)} type="button" variant={item.isActive ? 'secondary' : 'primary'}>
                        {item.isActive ? 'Desativar' : 'Ativar'}
                      </BarberButton>
                      {isAdmin && (
                        <BarberButton onClick={() => onToggleFavorite(item)} type="button" variant="ghost">
                          {item.isFavorite ? 'Desfavoritar' : 'Favoritar'}
                        </BarberButton>
                      )}
                      <BarberButton onClick={() => onDelete(item.id)} type="button" variant="danger">Excluir</BarberButton>
                    </div>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan="8">
                <BarberEmptyState
                  description="Cadastre itens de consumo da barbearia para controlar estoque, comissão e vendas no atendimento."
                  title="Nenhum item encontrado"
                />
              </td>
            </tr>
          )}
        </BarberTable>
      </BarberCard>
    </>
  )
}

export default ItensGeladeira

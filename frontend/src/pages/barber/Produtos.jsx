import {
  BarberBadge,
  BarberButton,
  BarberCard,
  BarberEmptyState,
  BarberIcon,
  BarberTable
} from '../../components/barber/BarberUI'

function Produtos({
  filters,
  form,
  isEditing,
  money,
  onCancelEdit,
  onDelete,
  onEdit,
  onFilterChange,
  onFormChange,
  onSubmit,
  onToggleStatus,
  products,
  suppliers
}) {
  const categoryOptions = Array.from(
    new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
        .map((value) => String(value).trim())
    )
  ).sort((first, second) => first.localeCompare(second, 'pt-BR'))

  const lowStockCount = products.filter((product) => product.low_stock).length

  return (
    <>
      <section className="barber-grid-two">
        <BarberCard>
          <div className="barber-panel-header">
            <div>
              <h3>{isEditing ? 'Editar produto' : 'Cadastrar produto'}</h3>
              <p>Monte o catalogo de revenda com fornecedor, margem e comissao do colaborador.</p>
            </div>
            <BarberBadge tone={form.isActive ? 'success' : 'danger'}>
              {form.isActive ? 'Ativo' : 'Inativo'}
            </BarberBadge>
          </div>

          <form className="barber-panel-stack" onSubmit={onSubmit}>
            <div className="barber-form-grid">
              <div className="barber-form-block">
                <label htmlFor="product-supplier">Fornecedor</label>
                <select className="barber-select" id="product-supplier" name="supplierId" onChange={onFormChange} value={form.supplierId}>
                  <option value="">Sem fornecedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.company_name || supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-name">Nome</label>
                <input className="barber-input" id="product-name" name="name" onChange={onFormChange} required value={form.name} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-category">Categoria</label>
                <input className="barber-input" id="product-category" name="category" onChange={onFormChange} value={form.category} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-brand">Marca</label>
                <input className="barber-input" id="product-brand" name="brand" onChange={onFormChange} value={form.brand} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-code">Codigo interno</label>
                <input className="barber-input" id="product-code" name="internalCode" onChange={onFormChange} value={form.internalCode} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-cost">Custo</label>
                <input className="barber-input" id="product-cost" min="0" name="costPrice" onChange={onFormChange} step="0.01" type="number" value={form.costPrice} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-sale">Venda</label>
                <input className="barber-input" id="product-sale" min="0" name="salePrice" onChange={onFormChange} required step="0.01" type="number" value={form.salePrice} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-commission-type">Comissao</label>
                <select className="barber-select" id="product-commission-type" name="commissionType" onChange={onFormChange} value={form.commissionType}>
                  <option value="fixed">Valor fixo</option>
                  <option value="percentage">Percentual</option>
                </select>
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-commission-value">Valor da comissao</label>
                <input className="barber-input" id="product-commission-value" min="0" name="commissionValue" onChange={onFormChange} step="0.01" type="number" value={form.commissionValue} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-stock-current">Estoque atual</label>
                <input className="barber-input" id="product-stock-current" min="0" name="stockCurrent" onChange={onFormChange} step="0.01" type="number" value={form.stockCurrent} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-stock-minimum">Estoque minimo</label>
                <input className="barber-input" id="product-stock-minimum" min="0" name="stockMinimum" onChange={onFormChange} step="0.01" type="number" value={form.stockMinimum} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-unit">Unidade</label>
                <input className="barber-input" id="product-unit" name="unit" onChange={onFormChange} placeholder="un, frasco, cx..." value={form.unit} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="product-status">Status</label>
                <select className="barber-select" id="product-status" name="isActive" onChange={onFormChange} value={String(form.isActive)}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
              <div className="barber-form-block barber-form-block-full">
                <label htmlFor="product-description">Descricao</label>
                <textarea className="barber-textarea" id="product-description" name="description" onChange={onFormChange} rows="4" value={form.description} />
              </div>
            </div>

            <div className="barber-page-actions">
              <BarberButton type="submit" variant="primary">
                <BarberIcon name="product" />
                <span>{isEditing ? 'Salvar produto' : 'Cadastrar produto'}</span>
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
              <p>Refine por nome, status e categoria para manter o estoque pronto para uso real no caixa.</p>
            </div>
            <div className="barber-inline-actions">
              <BarberBadge tone="admin">{products.length} itens</BarberBadge>
              <BarberBadge tone={lowStockCount > 0 ? 'pending' : 'success'}>
                {lowStockCount} em estoque baixo
              </BarberBadge>
            </div>
          </div>

          <div className="barber-toolbar">
            <div className="barber-form-block">
              <label htmlFor="product-search">Busca</label>
              <input className="barber-input" id="product-search" name="search" onChange={onFilterChange} value={filters.search} />
            </div>
            <div className="barber-form-block">
              <label htmlFor="product-status-filter">Status</label>
              <select className="barber-select" id="product-status-filter" name="status" onChange={onFilterChange} value={filters.status}>
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
            <div className="barber-form-block">
              <label htmlFor="product-category-filter">Categoria</label>
              <select className="barber-select" id="product-category-filter" name="category" onChange={onFilterChange} value={filters.category}>
                <option value="">Todas</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </BarberCard>
      </section>

      <BarberCard>
        <div className="barber-table-header">
          <div>
            <h2>Produtos</h2>
            <p>Catalogo real da barbearia com fornecedor opcional, estoque e precificacao prontos para evoluir para vendas.</p>
          </div>
        </div>

        <BarberTable columns={['Produto', 'Fornecedor', 'Estoque', 'Preco', 'Comissao', 'Status', 'Acoes']}>
          {products.length > 0 ? (
            products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  <span>
                    {[product.category, product.brand].filter(Boolean).join(' • ') || product.description || 'Sem descricao cadastrada'}
                  </span>
                </td>
                <td>{product.supplier_company_name || product.supplier_name || '-'}</td>
                <td>
                  <div className="barber-status-grid">
                    <strong>
                      {product.stock_current || 0}
                      {product.unit ? ` ${product.unit}` : ''}
                    </strong>
                    <div className="barber-inline-actions">
                      {product.stock_minimum > 0 && (
                        <BarberBadge tone={product.low_stock ? 'pending' : 'success'}>
                          Min. {product.stock_minimum}
                        </BarberBadge>
                      )}
                      {product.low_stock && <BarberBadge tone="danger">Reposicao</BarberBadge>}
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{money(product.sale_price)}</strong>
                  <span>Custo {money(product.cost_price)}</span>
                </td>
                <td>{product.commission_type === 'fixed' ? money(product.commission_value) : `${product.commission_value}%`}</td>
                <td>
                  <div className="barber-status-grid">
                    <BarberBadge tone={product.is_active ? 'success' : 'danger'}>
                      {product.is_active ? 'Ativo' : 'Inativo'}
                    </BarberBadge>
                    {product.internal_code && <span className="barber-table-note">Cod. {product.internal_code}</span>}
                  </div>
                </td>
                <td>
                  <div className="barber-inline-actions">
                    <BarberButton onClick={() => onEdit(product.id)} type="button" variant="ghost">Editar</BarberButton>
                    <BarberButton onClick={() => onToggleStatus(product)} type="button" variant={product.is_active ? 'secondary' : 'primary'}>
                      {product.is_active ? 'Desativar' : 'Ativar'}
                    </BarberButton>
                    <BarberButton onClick={() => onDelete(product.id)} type="button" variant="danger">Excluir</BarberButton>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">
                <BarberEmptyState
                  description="Cadastre produtos reais da barbearia para organizar estoque, precificacao e o uso futuro no caixa."
                  title="Nenhum produto encontrado"
                />
              </td>
            </tr>
          )}
        </BarberTable>
      </BarberCard>
    </>
  )
}

export default Produtos

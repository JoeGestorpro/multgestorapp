import {
  BarberBadge,
  BarberButton,
  BarberCard,
  BarberEmptyState,
  BarberIcon,
  BarberTable
} from '../../components/barber/BarberUI'

function Fornecedores({
  filters,
  form,
  isEditing,
  suppliers,
  onCancelEdit,
  onDelete,
  onEdit,
  onFilterChange,
  onFormChange,
  onSubmit,
  onToggleStatus
}) {
  return (
    <>
      <section className="barber-grid-two">
        <BarberCard>
          <div className="barber-panel-header">
            <div>
              <h3>{isEditing ? 'Editar fornecedor' : 'Cadastrar fornecedor'}</h3>
              <p>Organize parceiros, distribuidores e contatos comerciais da barbearia.</p>
            </div>
            <BarberBadge tone={form.isActive ? 'success' : 'danger'}>
              {form.isActive ? 'Ativo' : 'Inativo'}
            </BarberBadge>
          </div>

          <form className="barber-panel-stack" onSubmit={onSubmit}>
            <div className="barber-form-grid">
              <div className="barber-form-block">
                <label htmlFor="supplier-name">Nome do contato</label>
                <input className="barber-input" id="supplier-name" name="name" onChange={onFormChange} required value={form.name} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="supplier-company">Empresa</label>
                <input className="barber-input" id="supplier-company" name="companyName" onChange={onFormChange} value={form.companyName} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="supplier-phone">Telefone</label>
                <input className="barber-input" id="supplier-phone" name="phone" onChange={onFormChange} value={form.phone} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="supplier-email">Email</label>
                <input className="barber-input" id="supplier-email" name="email" onChange={onFormChange} type="email" value={form.email} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="supplier-document">Documento</label>
                <input className="barber-input" id="supplier-document" name="document" onChange={onFormChange} value={form.document} />
              </div>
              <div className="barber-form-block">
                <label htmlFor="supplier-status">Status</label>
                <select className="barber-select" id="supplier-status" name="isActive" onChange={onFormChange} value={String(form.isActive)}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
              <div className="barber-form-block barber-form-block-full">
                <label htmlFor="supplier-notes">Observacoes</label>
                <textarea className="barber-textarea" id="supplier-notes" name="notes" onChange={onFormChange} rows="4" value={form.notes} />
              </div>
            </div>

            <div className="barber-page-actions">
              <BarberButton type="submit" variant="primary">
                <BarberIcon name="supplier" />
                <span>{isEditing ? 'Salvar fornecedor' : 'Cadastrar fornecedor'}</span>
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
              <p>Localize fornecedores rapidamente por nome, empresa ou status.</p>
            </div>
            <BarberBadge tone="admin">{suppliers.length} parceiros</BarberBadge>
          </div>

          <div className="barber-toolbar">
            <div className="barber-form-block">
              <label htmlFor="supplier-search">Busca</label>
              <input className="barber-input" id="supplier-search" name="search" onChange={onFilterChange} value={filters.search} />
            </div>
            <div className="barber-form-block">
              <label htmlFor="supplier-filter-status">Status</label>
              <select className="barber-select" id="supplier-filter-status" name="status" onChange={onFilterChange} value={filters.status}>
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>
        </BarberCard>
      </section>

      <BarberCard>
        <div className="barber-table-header">
          <div>
            <h2>Fornecedores</h2>
            <p>Base de parceiros comerciais vinculados ao estoque e aos produtos.</p>
          </div>
        </div>

        <BarberTable columns={['Contato', 'Empresa', 'Telefone', 'Email', 'Status', 'Acoes']}>
          {suppliers.length > 0 ? (
            suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>
                  <strong>{supplier.name}</strong>
                  <span>{supplier.document || 'Sem documento'}</span>
                </td>
                <td>{supplier.company_name || '-'}</td>
                <td>{supplier.phone || '-'}</td>
                <td>{supplier.email || '-'}</td>
                <td>
                  <BarberBadge tone={supplier.is_active ? 'success' : 'danger'}>
                    {supplier.is_active ? 'Ativo' : 'Inativo'}
                  </BarberBadge>
                </td>
                <td>
                  <div className="barber-inline-actions">
                    <BarberButton onClick={() => onEdit(supplier.id)} type="button" variant="ghost">Editar</BarberButton>
                    <BarberButton onClick={() => onToggleStatus(supplier)} type="button" variant={supplier.is_active ? 'secondary' : 'primary'}>
                      {supplier.is_active ? 'Desativar' : 'Ativar'}
                    </BarberButton>
                    <BarberButton onClick={() => onDelete(supplier.id)} type="button" variant="danger">Excluir</BarberButton>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">
                <BarberEmptyState
                  description="Cadastre o primeiro fornecedor para vincular produtos e organizar suas compras."
                  title="Nenhum fornecedor encontrado"
                />
              </td>
            </tr>
          )}
        </BarberTable>
      </BarberCard>
    </>
  )
}

export default Fornecedores

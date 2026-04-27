import { useMemo, useState } from 'react'
import {
  BarberBadge,
  BarberButton,
  BarberCard,
  BarberEmptyState,
  BarberIcon,
  BarberTable
} from '../../components/barber/BarberUI'
import ServiceIcon from '../../components/barber/ServiceIcon'
import { SERVICE_ICON_OPTIONS, normalizeServiceIcon } from '../../components/barber/ServiceIcon.utils'

function Servicos({
  isAdmin,
  money,
  services,
  filters,
  form,
  isEditing,
  onFilterChange,
  onFormChange,
  onSubmit,
  onEdit,
  onToggleStatus,
  onDelete,
  onCancelEdit
}) {
  const [iconCategory, setIconCategory] = useState('all')
  const visibleIcons = useMemo(() => {
    if (iconCategory === 'all') {
      return SERVICE_ICON_OPTIONS
    }

    return SERVICE_ICON_OPTIONS.filter((option) => option.category === iconCategory)
  }, [iconCategory])

  return (
    <>
      <section className="barber-grid-two">
        {isAdmin && (
          <BarberCard>
            <div className="barber-panel-header">
              <div>
                <h3>{isEditing ? 'Editar servico' : 'Cadastrar servico'}</h3>
                <p>Monte o catalogo da barbearia com nome, preco, tipo, status e tempo medio.</p>
              </div>
              <BarberBadge tone={form.isActive ? 'success' : 'danger'}>
                {form.isActive ? 'Ativo' : 'Inativo'}
              </BarberBadge>
            </div>

            <form className="barber-panel-stack" onSubmit={onSubmit}>
              <div className="barber-form-grid">
                <div className="barber-form-block">
                  <label htmlFor="service-name">Nome do servico</label>
                  <input
                    className="barber-input"
                    id="service-name"
                    name="name"
                    onChange={onFormChange}
                    required
                    value={form.name}
                  />
                </div>

                <div className="barber-form-block">
                  <label htmlFor="service-price">Preco</label>
                  <input
                    className="barber-input"
                    id="service-price"
                    min="0"
                    name="price"
                    onChange={onFormChange}
                    required
                    step="0.01"
                    type="number"
                    value={form.price}
                  />
                </div>

                <div className="barber-form-block barber-form-block-full">
                  <label htmlFor="service-description">Descricao</label>
                  <textarea
                    className="barber-textarea"
                    id="service-description"
                    name="description"
                    onChange={onFormChange}
                    placeholder="Detalhes do servico, diferenciais ou o que esta incluso."
                    rows="4"
                    value={form.description}
                  />
                </div>

                <div className="barber-form-block">
                  <label htmlFor="service-type">Tipo de servico</label>
                  <select
                    className="barber-select"
                    id="service-type"
                    name="serviceType"
                    onChange={onFormChange}
                    value={form.serviceType}
                  >
                    <option value="service">Servico</option>
                    <option value="product">Produto</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>

                <div className="barber-form-block">
                  <label htmlFor="estimated-time-minutes">Tempo medio (min)</label>
                  <input
                    className="barber-input"
                    id="estimated-time-minutes"
                    min="0"
                    name="estimatedTimeMinutes"
                    onChange={onFormChange}
                    step="1"
                    type="number"
                    value={form.estimatedTimeMinutes}
                  />
                </div>

                <div className="barber-form-block">
                  <label htmlFor="service-status">Status</label>
                  <select
                    className="barber-select"
                    id="service-status"
                    name="isActive"
                    onChange={onFormChange}
                    value={String(form.isActive)}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>

                <div className="barber-form-block barber-form-block-full">
                  <div className="barber-panel-header">
                    <div>
                      <h3>Icone do servico</h3>
                      <p>Escolha um icone que represente melhor este servico.</p>
                    </div>
                  </div>

                  <div className="barber-icon-picker">
                    <div className="barber-icon-picker-tabs">
                      {[
                        { key: 'all', label: 'Todos' },
                        { key: 'corte', label: 'Corte' },
                        { key: 'barba', label: 'Barba' },
                        { key: 'estetica', label: 'Estetica' },
                        { key: 'coloracao', label: 'Coloracao' },
                        { key: 'outros', label: 'Outros' }
                      ].map((category) => (
                        <button
                          className={`barber-icon-filter ${iconCategory === category.key ? 'active' : ''}`}
                          key={category.key}
                          onClick={() => setIconCategory(category.key)}
                          type="button"
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>

                    <div className="barber-icon-grid">
                      {visibleIcons.map((option) => {
                        const active = normalizeServiceIcon(form.icon, form.name) === option.key

                        return (
                          <button
                            className={`barber-icon-option ${active ? 'active' : ''}`}
                            key={option.key}
                            onClick={() => onFormChange({ target: { name: 'icon', value: option.key } })}
                            type="button"
                          >
                            <span className="barber-icon-option-check">{active ? '✓' : ''}</span>
                            <div className="barber-icon-preview">
                              <ServiceIcon icon={option.key} />
                            </div>
                            <strong>{option.label}</strong>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="barber-page-actions">
                <BarberButton type="submit" variant="primary">
                  <BarberIcon name="catalog" />
                  <span>{isEditing ? 'Salvar alteracoes' : 'Salvar servico'}</span>
                </BarberButton>
                {isEditing && (
                  <BarberButton onClick={onCancelEdit} type="button" variant="ghost">
                    Cancelar edicao
                  </BarberButton>
                )}
              </div>
            </form>
          </BarberCard>
        )}

        <BarberCard>
          <div className="barber-panel-header">
            <div>
              <h3>Busca e filtros</h3>
              <p>{isAdmin ? 'Pesquise por nome e filtre status usando o backend novo.' : 'Visualize apenas os servicos ativos liberados para lancamento.'}</p>
            </div>
            <BarberBadge tone="admin">{services.length} itens</BarberBadge>
          </div>

          <div className="barber-toolbar">
            <div className="barber-form-block">
              <label htmlFor="service-search">Busca por nome</label>
              <input
                className="barber-input"
                id="service-search"
                name="search"
                onChange={onFilterChange}
                placeholder="Buscar degradê, barba, combo..."
                value={filters.search}
              />
            </div>

            <div className="barber-form-block">
              <label htmlFor="service-filter-status">Filtro por status</label>
              <select
                className="barber-select"
                id="service-filter-status"
                name="status"
                onChange={onFilterChange}
                value={filters.status}
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>

            <div className="barber-notes-list">
              <div className="barber-notes-item">
                <strong>Catalogo multi-tenant</strong>
                <p>Os servicos listados aqui pertencem apenas a barbearia logada e respeitam a separacao por empresa.</p>
              </div>
              <div className="barber-notes-item">
                <strong>Comissao centralizada no colaborador</strong>
                <p>Servicos ativos aparecem automaticamente na venda e o percentual aplicado vem do colaborador selecionado.</p>
              </div>
            </div>
          </BarberCard>
      </section>

      <BarberCard>
        <div className="barber-table-header">
          <div>
            <h2>Catalogo de servicos</h2>
            <p>Tabela completa com status, tempo medio e acoes de gerenciamento.</p>
          </div>
        </div>

        <BarberTable columns={['Nome', 'Tipo', 'Preco', 'Tempo medio', 'Status', 'Acoes']}>
          {services.length > 0 ? (
            services.map((service) => (
              <tr key={service.id}>
                <td>
                  <div className="barber-service-label">
                    <span className="barber-service-card-icon">
                      <ServiceIcon icon={service.icon} serviceName={service.name} />
                    </span>
                    <div>
                      <strong>{service.name}</strong>
                      <span>{service.description || 'Sem descricao cadastrada'}</span>
                    </div>
                  </div>
                </td>
                <td>{service.service_type === 'combo' ? 'Combo' : service.service_type === 'product' ? 'Produto' : 'Servico'}</td>
                <td>{money(service.price)}</td>
                <td>{service.estimated_time_minutes ? `${service.estimated_time_minutes} min` : '-'}</td>
                <td>
                  <BarberBadge tone={service.is_active ? 'success' : 'danger'}>
                    {service.is_active ? 'Ativo' : 'Inativo'}
                  </BarberBadge>
                </td>
                <td>
                  {isAdmin ? (
                    <div className="barber-inline-actions">
                      <BarberButton onClick={() => onEdit(service.id)} type="button" variant="ghost">
                        Editar
                      </BarberButton>
                      <BarberButton
                        onClick={() => onToggleStatus(service)}
                        type="button"
                        variant={service.is_active ? 'secondary' : 'primary'}
                      >
                        {service.is_active ? 'Desativar' : 'Ativar'}
                      </BarberButton>
                      <BarberButton onClick={() => onDelete(service.id)} type="button" variant="danger">
                        Excluir
                      </BarberButton>
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">
                <BarberEmptyState
                  description="Cadastre o primeiro servico para liberar o catalogo no lancamento das vendas."
                  title="Nenhum servico encontrado"
                />
              </td>
            </tr>
          )}
        </BarberTable>
      </BarberCard>
    </>
  )
}

export default Servicos

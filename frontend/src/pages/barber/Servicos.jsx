import { useMemo, useState } from 'react'
import {
  BarberBadge,
  BarberButton,
  BarberCard,
  BarberEmptyState,
  BarberIcon,
  BarberModal
} from '../../components/barber/BarberUI'
import ServiceIcon from '../../components/barber/ServiceIcon'
import { SERVICE_ICON_OPTIONS, normalizeServiceIcon } from '../../components/barber/ServiceIcon.utils'

function getServiceTypeLabel(type) {
  if (type === 'combo') {
    return 'Combo'
  }

  if (type === 'product') {
    return 'Produto'
  }

  return 'Servico'
}

function Servicos({
  deleteOpen,
  deletePassword,
  deletePin,
  deleteTarget,
  filters,
  form,
  isAdmin,
  isDrawerOpen,
  isEditing,
  isSaving,
  money,
  onCloseDelete,
  onCloseDrawer,
  onDelete,
  onDeleteConfirm,
  onDeletePasswordChange,
  onDeletePinChange,
  onEdit,
  onFilterChange,
  onFormChange,
  onOpenCreate,
  onSubmit,
  onToggleStatus,
  services
}) {
  const [iconCategory, setIconCategory] = useState('all')

  const visibleIcons = useMemo(() => {
    if (iconCategory === 'all') {
      return SERVICE_ICON_OPTIONS
    }

    return SERVICE_ICON_OPTIONS.filter((option) => option.category === iconCategory)
  }, [iconCategory])

  const totalServices = services.length
  const activeServices = services.filter((service) => service.is_active).length
  const averageDuration = services.filter((service) => service.estimated_time_minutes).length
    ? Math.round(
      services
        .filter((service) => service.estimated_time_minutes)
        .reduce((sum, service) => sum + Number(service.estimated_time_minutes || 0), 0)
      / services.filter((service) => service.estimated_time_minutes).length
    )
    : null

  return (
    <>
      <section className="barber-services-shell">
        <BarberCard className="barber-services-hero">
          <div className="barber-services-hero-copy">
            <div>
              <span className="barber-services-eyebrow">Catalogo operacional</span>
              <h2>Servicos</h2>
              <p>Organize o menu da barbearia com status claro, preco certo e edicao rapida.</p>
            </div>
            {isAdmin && (
              <BarberButton onClick={onOpenCreate} type="button" variant="primary">
                <BarberIcon name="plus" />
                <span>Novo servico</span>
              </BarberButton>
            )}
          </div>

          <div className="barber-services-metrics">
            <div className="barber-services-metric">
              <span>Total</span>
              <strong>{totalServices}</strong>
            </div>
            <div className="barber-services-metric">
              <span>Ativos</span>
              <strong>{activeServices}</strong>
            </div>
            <div className="barber-services-metric">
              <span>Tempo medio</span>
              <strong>{averageDuration ? `${averageDuration} min` : '-'}</strong>
            </div>
          </div>
        </BarberCard>

        <BarberCard className="barber-services-toolbar-card">
          <div className="barber-services-toolbar">
            <div className="barber-services-toolbar-search">
              <label htmlFor="service-search">Buscar</label>
              <input
                className="barber-input"
                id="service-search"
                name="search"
                onChange={onFilterChange}
                placeholder="Buscar por nome ou descricao"
                value={filters.search}
              />
            </div>

            <div className="barber-services-toolbar-filter">
              <label htmlFor="service-filter-status">Status</label>
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

            <div className="barber-services-toolbar-summary">
              <BarberBadge tone="admin">{totalServices} itens</BarberBadge>
            </div>
          </div>
        </BarberCard>

        <BarberCard className="barber-services-list-card">
          {services.length > 0 ? (
            <div className="barber-services-grid">
              {services.map((service) => (
                <article className="barber-service-premium-card" key={service.id}>
                  <div className="barber-service-premium-top">
                    <span className="barber-service-card-icon">
                      <ServiceIcon icon={service.icon} serviceName={service.name} />
                    </span>
                    <div className="barber-service-premium-copy">
                      <div className="barber-service-premium-title">
                        <strong>{service.name}</strong>
                        <BarberBadge tone={service.is_active ? 'success' : 'danger'}>
                          {service.is_active ? 'Ativo' : 'Inativo'}
                        </BarberBadge>
                      </div>
                      <span>{service.description || 'Sem descricao cadastrada'}</span>
                    </div>
                  </div>

                  <div className="barber-service-premium-meta">
                    <div>
                      <small>Preco</small>
                      <strong>{money(service.price)}</strong>
                    </div>
                    <div>
                      <small>Tempo</small>
                      <strong>{service.estimated_time_minutes ? `${service.estimated_time_minutes} min` : '-'}</strong>
                    </div>
                    <div>
                      <small>Tipo</small>
                      <strong>{getServiceTypeLabel(service.service_type)}</strong>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="barber-service-premium-actions">
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
                  )}
                </article>
              ))}
            </div>
          ) : (
            <BarberEmptyState
              description="Cadastre o primeiro servico para liberar o catalogo nas vendas e no agendamento."
              title="Nenhum servico encontrado"
            />
          )}
        </BarberCard>
      </section>

      {isAdmin && (
        <>
          <div className={`barber-drawer-root ${isDrawerOpen ? 'open' : ''}`} role="presentation">
            <button
              aria-label="Fechar painel de servicos"
              className="barber-drawer-backdrop"
              onClick={onCloseDrawer}
              type="button"
            />
            <aside aria-modal="true" className="barber-drawer barber-services-drawer" role="dialog">
              <div className="barber-drawer-header">
                <div>
                  <span className="barber-services-eyebrow">{isEditing ? 'Editar servico' : 'Novo servico'}</span>
                  <h3>{isEditing ? 'Atualize o servico' : 'Cadastrar servico'}</h3>
                  <p>Preencha os dados essenciais e publique o servico no catalogo da barbearia.</p>
                </div>
                <button className="barber-icon-button" onClick={onCloseDrawer} type="button">
                  <BarberIcon name="close" />
                </button>
              </div>

              <form className="barber-services-drawer-form" onSubmit={onSubmit}>
                <div className="barber-form-grid">
                  <div className="barber-form-block barber-form-block-full">
                    <label htmlFor="service-name">Nome</label>
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

                  <div className="barber-form-block">
                    <label htmlFor="estimated-time-minutes">Tempo (min)</label>
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
                    <label htmlFor="service-type">Tipo</label>
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
                    <label htmlFor="service-description">Descricao</label>
                    <textarea
                      className="barber-textarea"
                      id="service-description"
                      name="description"
                      onChange={onFormChange}
                      placeholder="Diferenciais, observacoes ou o que esta incluso."
                      rows="4"
                      value={form.description}
                    />
                  </div>

                  <div className="barber-form-block barber-form-block-full">
                    <div className="barber-services-icon-header">
                      <div>
                        <label>Icone</label>
                        <span>Escolha uma representacao visual para o servico.</span>
                      </div>
                      <span className="barber-service-card-icon">
                        <ServiceIcon icon={form.icon} serviceName={form.name} />
                      </span>
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

                <div className="barber-drawer-actions">
                  <BarberButton onClick={onCloseDrawer} type="button" variant="ghost">
                    Cancelar
                  </BarberButton>
                  <BarberButton disabled={isSaving} type="submit" variant="primary">
                    <BarberIcon name="catalog" />
                    <span>{isSaving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Salvar servico'}</span>
                  </BarberButton>
                </div>
              </form>
            </aside>
          </div>

          <BarberModal
            onClose={onCloseDelete}
            open={deleteOpen}
            subtitle={deleteTarget ? `${deleteTarget.name} • ${money(deleteTarget.price)}` : ''}
            title="Confirmar exclusao do servico"
          >
            <div className="barber-modal-content">
              <p className="barber-inline-hint">Confirme com senha admin ou PIN para remover este servico do catalogo.</p>
              <div className="barber-form-grid">
                <div className="barber-form-block">
                  <label htmlFor="delete-service-password">Senha admin</label>
                  <input
                    className="barber-input"
                    id="delete-service-password"
                    onChange={(event) => onDeletePasswordChange(event.target.value)}
                    type="password"
                    value={deletePassword}
                  />
                </div>
                <div className="barber-form-block">
                  <label htmlFor="delete-service-pin">PIN</label>
                  <input
                    className="barber-input"
                    id="delete-service-pin"
                    onChange={(event) => onDeletePinChange(event.target.value)}
                    type="password"
                    value={deletePin}
                  />
                </div>
              </div>
              <div className="barber-modal-actions">
                <BarberButton onClick={onCloseDelete} type="button" variant="ghost">
                  Cancelar
                </BarberButton>
                <BarberButton onClick={onDeleteConfirm} type="button" variant="danger">
                  <BarberIcon name="trash" />
                  <span>Excluir servico</span>
                </BarberButton>
              </div>
            </div>
          </BarberModal>
        </>
      )}
    </>
  )
}

export default Servicos

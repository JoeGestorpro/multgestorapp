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
import SmartServiceForm from '../../components/barber/SmartServiceForm'
import {
  SERVICE_ICON_OPTIONS,
  normalizeServiceIcon,
  getServiceCategory,
  getCategoryConfig
} from '../../components/barber/ServiceIcon.utils'
import { Copy } from 'lucide-react'

function CategoryBadge({ category }) {
  const config = getCategoryConfig(category)
  return (
    <span className={`barber-category-badge ${category}`}>
      {config.label}
    </span>
  )
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
  onDuplicate,
  onSaveAndContinue,
  services
}) {
  const [iconCategory, _setIconCategory] = useState('all')
  const [activeCategory, setActiveCategory] = useState('all')

  const visibleIcons = useMemo(() => {
    if (iconCategory === 'all') return SERVICE_ICON_OPTIONS
    return SERVICE_ICON_OPTIONS.filter((option) => option.category === iconCategory)
  }, [iconCategory])

  const categoryCounts = useMemo(() => {
    const counts = { all: services.length }
    services.forEach((service) => {
      const cat = getServiceCategory(service)
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [services])

  const filteredServices = useMemo(() => {
    let result = services
    if (activeCategory !== 'all') {
      result = result.filter((s) => getServiceCategory(s) === activeCategory)
    }
    if (filters.status === 'active') {
      result = result.filter((s) => s.is_active)
    } else if (filters.status === 'inactive') {
      result = result.filter((s) => !s.is_active)
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          (s.description && s.description.toLowerCase().includes(searchLower))
      )
    }
    return result
  }, [services, activeCategory, filters.status, filters.search])

  const totalServices = services.length
  const activeServices = services.filter((s) => s.is_active).length
  const averageDuration = services.filter((s) => s.estimated_time_minutes).length
    ? Math.round(
        services
          .filter((s) => s.estimated_time_minutes)
          .reduce((sum, s) => sum + Number(s.estimated_time_minutes || 0), 0) /
          services.filter((s) => s.estimated_time_minutes).length
      )
    : null

  const categoryTabs = [
    { key: 'all', label: 'Todos' },
    { key: 'corte', label: 'Corte' },
    { key: 'barba', label: 'Barba' },
    { key: 'combo', label: 'Combo' },
    { key: 'estetica', label: 'Estetica' },
    { key: 'coloracao', label: 'Coloracao' },
    { key: 'quimica', label: 'Quimica' },
    { key: 'premium', label: 'Premium' },
    { key: 'infantil', label: 'Infantil' },
    { key: 'spa', label: 'Spa' }
  ]

  const handleDuplicate = (service) => {
    if (onDuplicate) {
      onDuplicate(service)
    } else {
      onEdit(service.id)
    }
  }

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
              <BarberBadge tone="admin">{filteredServices.length} itens</BarberBadge>
            </div>
          </div>

          <div className="barber-services-category-tabs">
            {categoryTabs.map((tab) => {
              const count = categoryCounts[tab.key] || 0
              if (count === 0 && tab.key !== 'all') return null
              return (
                <button
                  key={tab.key}
                  className={`barber-category-tab ${activeCategory === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(tab.key)}
                  type="button"
                  data-category={tab.key}
                >
                  {tab.label}
                  <span className="barber-category-tab-count">{count}</span>
                </button>
              )
            })}
          </div>
        </BarberCard>

        <BarberCard className="barber-services-list-card">
          {filteredServices.length > 0 ? (
            <div className="barber-services-grid">
              {filteredServices.map((service) => {
                const category = getServiceCategory(service)
                return (
                  <article
                    className="barber-service-premium-card"
                    data-category={category}
                    key={service.id}
                  >
                    <div className="barber-service-premium-top">
                      <span className="barber-service-card-icon">
                        <ServiceIcon icon={service.icon} serviceName={service.name} size={28} />
                      </span>
                      <div className="barber-service-premium-copy">
                        <div className="barber-service-premium-title">
                          <strong>{service.name}</strong>
                          <BarberBadge tone={service.is_active ? 'success' : 'danger'}>
                            {service.is_active ? 'Ativo' : 'Inativo'}
                          </BarberBadge>
                        </div>
                        <span className="barber-service-category-line">
                          <CategoryBadge category={category} />
                          {service.estimated_time_minutes && (
                            <span className="barber-service-duration">{service.estimated_time_minutes} min</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="barber-service-premium-price">
                      <span className="barber-service-price-label">Preco</span>
                      <strong className="barber-service-price-value">{money(service.price)}</strong>
                    </div>

                    {service.description && (
                      <p className="barber-service-description">{service.description}</p>
                    )}

                    {isAdmin && (
                      <div className="barber-service-premium-actions">
                        <button
                          className="barber-service-duplicate-btn"
                          onClick={() => handleDuplicate(service)}
                          type="button"
                        >
                          <Copy size={12} />
                          Duplicar
                        </button>
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
                )
              })}
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

              <SmartServiceForm
                form={form}
                isEditing={isEditing}
                isSaving={isSaving}
                onClose={onCloseDrawer}
                onDuplicate={onDuplicate}
                onFormChange={onFormChange}
                onSaveAndContinue={onSaveAndContinue}
                onSubmit={onSubmit}
                services={services}
              />
            </aside>
          </div>

          <BarberModal
            onClose={onCloseDelete}
            open={deleteOpen}
            subtitle={deleteTarget ? `${deleteTarget.name} - ${money(deleteTarget.price)}` : ''}
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
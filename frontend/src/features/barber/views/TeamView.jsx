import { Card, Badge, Button, SummaryCard } from '../../../components/design-system'
import CollaboratorAvatar from '../../../components/barber/CollaboratorAvatar'
import { BarberTable } from '../../../components/barber/BarberUI'
import TeamList from '../components/team/TeamList'
import TeamEmptyState from '../components/team/TeamEmptyState'
import { money, fullDate } from '../utils/formatters'

export default function TeamView({
  isAdmin,
  collaborators,
  visibleCollaboratorFinancialSummary,
  currentCollaboratorFinancialSummary,
  collaboratorFinancialFilters,
  updateCollaboratorFinancialFilters,
  openCollaboratorSummary,
  editCollaborator,
  setAdvanceForm,
  navigateView,
  openCollaboratorCreateModal,
  toggleCollaboratorStatus,
  removeCollaborator,
}) {
  const financialSummary = visibleCollaboratorFinancialSummary
  const hasOperationalCollaborators = collaborators.length > 0
  const hasFinancialSummary = financialSummary.length > 0
  const selectedPeriodLabel = {
    today: 'Hoje',
    week: 'Semana',
    month: 'Mes',
    custom: 'Periodo personalizado'
  }[collaboratorFinancialFilters.period] || 'Mes'

  return (
    <>
      <Card padding="md">
        <div className="barber-panel-header">
          <div>
            <h3>{isAdmin ? 'Colaboradores' : 'Seu resumo financeiro'}</h3>
            <p>
              {isAdmin
                ? 'Gerencie sua equipe, comissoes e desempenho individual.'
                : 'Acompanhe apenas seu bruto gerado, comissao, vales e liquido a receber.'}
            </p>
          </div>
          <Badge variant="admin">{selectedPeriodLabel}</Badge>
        </div>

        <div className="barber-toolbar">
          <div className="barber-form-block">
            <label htmlFor="collaborator-financial-period">Periodo</label>
            <select
              className="barber-select"
              id="collaborator-financial-period"
              name="period"
              onChange={updateCollaboratorFinancialFilters}
              value={collaboratorFinancialFilters.period}
            >
              <option value="today">Hoje</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {collaboratorFinancialFilters.period === 'custom' && (
            <>
              <div className="barber-form-block">
                <label htmlFor="collaborator-financial-start">Inicio</label>
                <input
                  className="barber-input"
                  id="collaborator-financial-start"
                  name="startDate"
                  onChange={updateCollaboratorFinancialFilters}
                  type="date"
                  value={collaboratorFinancialFilters.startDate}
                />
              </div>
              <div className="barber-form-block">
                <label htmlFor="collaborator-financial-end">Fim</label>
                <input
                  className="barber-input"
                  id="collaborator-financial-end"
                  name="endDate"
                  onChange={updateCollaboratorFinancialFilters}
                  type="date"
                  value={collaboratorFinancialFilters.endDate}
                />
              </div>
            </>
          )}
        </div>
      </Card>

      <section className="barber-collaborator-grid">
        {hasFinancialSummary ? (
          financialSummary.map((collaborator, index) => {
            const collaboratorRecord = collaborators.find((item) => item.id === collaborator.collaborator_id) || {}

            return (
              <Card className="barber-collaborator-card" padding="md" key={collaborator.collaborator_id}>
                <div className="barber-collaborator-top">
                  <div className="barber-collaborator-heading">
                    <CollaboratorAvatar
                      avatarUrl={collaboratorRecord.avatar_url || collaborator.avatar_url}
                      name={collaboratorRecord.name || collaborator.collaborator_name}
                      size="md"
                    />
                    <div>
                      <h3>{collaborator.collaborator_name}</h3>
                      <p>
                        {collaborator.commission_type === 'fixed'
                          ? `Comissao fixa de ${money(collaborator.commission_rate)}`
                          : `${collaborator.commission_rate}% de comissao cadastrada`}
                      </p>
                    </div>
                  </div>
                  <div className="barber-collaborator-top-badges">
                    {isAdmin && <Badge variant={index === 0 ? 'permuta' : 'admin'}>#{index + 1}</Badge>}
                    {isAdmin && (
                      <Badge variant={collaborator.is_active ? 'success' : 'danger'}>
                        {collaborator.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="barber-collaborator-stats">
                  <div>
                    <span>Faturamento bruto</span>
                    <strong>{money(collaborator.gross_revenue)}</strong>
                  </div>
                  <div>
                    <span>Comissao gerada</span>
                    <strong>{money(collaborator.commission_total)}</strong>
                  </div>
                  <div>
                    <span>Adiantamentos</span>
                    <strong>{money(collaborator.advances_total)}</strong>
                  </div>
                  <div>
                    <span>Liquido a receber</span>
                    <strong>{money(collaborator.net_to_receive)}</strong>
                  </div>
                  <div>
                    <span>Atendimentos</span>
                    <strong>{collaborator.sales_count || 0}</strong>
                  </div>
                  <div>
                    <span>Ultima venda</span>
                    <strong>{collaborator.last_sale_at ? fullDate(collaborator.last_sale_at) : '-'}</strong>
                  </div>
                </div>

                {Number(collaborator.sales_count || 0) === 0 && (
                  <p className="barber-inline-hint">Este colaborador ainda nao gerou vendas no periodo.</p>
                )}

                <div className="barber-inline-actions">
                  <Button onClick={() => openCollaboratorSummary(collaborator.collaborator_id)} type="button" variant="secondary">
                    Ver resumo
                  </Button>
                  {isAdmin && (
                    <Button onClick={() => editCollaborator(collaborator.collaborator_id)} type="button" variant="ghost">
                      Editar
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      onClick={() => {
                        setAdvanceForm((current) => ({ ...current, collaboratorId: collaborator.collaborator_id }))
                        navigateView('cashier')
                      }}
                      type="button"
                      variant="ghost"
                    >
                      Registrar adiantamento
                    </Button>
                  )}
                </div>
              </Card>
            )
          })
        ) : (
          <TeamEmptyState
            isAdmin={isAdmin}
            hasOperationalCollaborators={hasOperationalCollaborators}
            onCreate={openCollaboratorCreateModal}
          />
        )}
      </section>

      <section className="barber-grid-two">
        <Card className="barber-card-full" padding="md">
          <div className="barber-panel-header">
            <div>
              <h3>{isAdmin ? 'Equipe cadastrada' : 'Seu resumo profissional'}</h3>
              <p>
                {isAdmin
                  ? 'Lista operacional da equipe com acesso rapido para editar e acompanhar desempenho.'
                  : 'Seus indicadores individuais com base nas vendas reais do periodo.'}
              </p>
            </div>
          </div>

          {isAdmin ? (
            <TeamList
              collaborators={collaborators}
              isAdmin={isAdmin}
              onEdit={editCollaborator}
              onToggleStatus={toggleCollaboratorStatus}
              onRemove={removeCollaborator}
              onCreate={openCollaboratorCreateModal}
            />
          ) : currentCollaboratorFinancialSummary ? (
            <>
              <SummaryCard
                items={[
                  {
                    label: "Atendimentos",
                    description: "Quantidade lancada por voce no periodo",
                    value: <strong>{currentCollaboratorFinancialSummary.sales_count || 0}</strong>
                  },
                  {
                    label: "Comissao gerada",
                    description: "Total real da sua comissao",
                    value: <strong>{money(currentCollaboratorFinancialSummary.commission_total)}</strong>
                  },
                  {
                    label: "Adiantamentos",
                    description: "Somente vales aprovados ou liquidados",
                    value: <strong>{money(currentCollaboratorFinancialSummary.advances_total)}</strong>
                  },
                  {
                    label: "Liquido a receber",
                    description: "Comissao menos adiantamentos",
                    value: <strong>{money(currentCollaboratorFinancialSummary.net_to_receive)}</strong>,
                    valueVariant: "success"
                  }
                ]}
              />
              <div className="barber-inline-actions">
                <Button onClick={() => openCollaboratorSummary(currentCollaboratorFinancialSummary.collaborator_id)} type="button" variant="secondary">
                  Ver resumo
                </Button>
              </div>
            </>
          ) : (
            <div className="barber-empty-state">
              <div className="barber-empty-icon">
                <svg className="barber-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <strong style={{ fontSize: 18, color: '#f8fafc' }}>Sem dados financeiros</strong>
              <p style={{ color: 'var(--barber-muted)', margin: 0, fontSize: 14 }}>
                Seu resumo financeiro aparecera aqui assim que houver vendas reais no periodo.
              </p>
            </div>
          )}
        </Card>
      </section>
    </>
  )
}

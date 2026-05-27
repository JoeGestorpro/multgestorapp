import { Card, Badge, Button, Empty, SummaryCard } from '../../../components/design-system'
import CollaboratorAvatar from '../../../components/barber/CollaboratorAvatar'
import { BarberTable } from '../../../components/barber/BarberUI'
import { money, fullDate, collaboratorDisplayName } from '../utils/formatters'

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
  saveCollaboratorPermissions,
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
<Card className="barber-collaborator-card" padding="md">
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
          <Card className="barber-collaborator-card" padding="md">
            <Empty
              description={isAdmin
                ? hasOperationalCollaborators
                  ? 'A equipe ja foi cadastrada, mas ainda nao gerou movimentacao no periodo selecionado.'
                  : 'Nenhum colaborador cadastrado ainda.'
                : 'Seu resumo financeiro aparecera aqui assim que houver vendas reais no periodo.'}
              title={isAdmin
                ? hasOperationalCollaborators
                  ? 'Equipe sem movimentacao no periodo'
                  : 'Nenhum colaborador cadastrado'
                : 'Sem resumo financeiro'}
            />
            {isAdmin && !hasOperationalCollaborators && (
              <div className="barber-inline-actions">
                <Button onClick={openCollaboratorCreateModal} type="button" variant="primary">
                  Adicionar primeiro colaborador
                </Button>
              </div>
            )}
          </Card>
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
            <BarberTable columns={['Colaborador', 'Comissao', 'Permissoes', 'Status', 'Acoes']}>
              {collaborators.length > 0 ? (
                collaborators.map((collaborator) => {
                  const rank = financialSummary.findIndex((item) => item.collaborator_id === collaborator.id)

                  return (
                    <tr key={collaborator.id}>
                      <td>
                        <div className="barber-collaborator-main-cell">
                          <CollaboratorAvatar
                            avatarUrl={collaborator.avatar_url}
                            name={collaboratorDisplayName(collaborator)}
                            size="sm"
                          />
                          <div>
                            <strong>
                              {collaborator.name || collaborator.nickname}
                              {rank >= 0 ? <span> #{rank + 1}</span> : null}
                            </strong>
                            <span>{collaborator.email || 'Sem email'}</span>
                            <span>{collaborator.phone || 'Sem telefone'} - {collaborator.role || 'collaborator'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {collaborator.commission_type === 'fixed'
                          ? money(collaborator.commission_rate)
                          : `${collaborator.commission_rate}%`}
                      </td>
                      <td>
                        <div className="barber-status-grid">
                          {collaborator.can_view_own_dashboard && <Badge variant="success">Dashboard</Badge>}
                          {collaborator.can_view_own_reports && <Badge variant="pix">Relatorio</Badge>}
                          {collaborator.can_launch_sales && <Badge variant="permuta">Vendas</Badge>}
                        </div>
                      </td>
                      <td>
                        <Badge variant={collaborator.is_active ? 'success' : 'danger'}>
                          {collaborator.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td>
                        <div className="barber-inline-actions">
                          <Button onClick={() => openCollaboratorSummary(collaborator.id)} type="button" variant="secondary">
                            Ver resumo
                          </Button>
                          <Button onClick={() => editCollaborator(collaborator.id)} type="button" variant="ghost">
                            Editar
                          </Button>
                          <Button
                            onClick={() => toggleCollaboratorStatus(collaborator)}
                            type="button"
                            variant={collaborator.is_active ? 'secondary' : 'primary'}
                          >
                            {collaborator.is_active ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            onClick={() => saveCollaboratorPermissions(collaborator.id, {
                              canLaunchSales: !collaborator.can_launch_sales,
                              canViewOwnDashboard: collaborator.can_view_own_dashboard,
                              canViewOwnReports: collaborator.can_view_own_reports
                            })}
                            type="button"
                            variant="ghost"
                          >
                            {collaborator.can_launch_sales ? 'Bloquear vendas' : 'Liberar vendas'}
                          </Button>
                          <Button onClick={() => removeCollaborator(collaborator.id)} type="button" variant="danger">
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5">
                    <Empty
                      description="Cadastre colaboradores para montar o ranking e a distribuicao das comissoes."
                      title="Nenhum colaborador cadastrado"
                    />
                  </td>
                </tr>
              )}
            </BarberTable>
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
            <Empty
              description="Seu resumo financeiro aparecera aqui assim que houver vendas reais no periodo."
              title="Sem dados financeiros"
            />
          )}
        </Card>
      </section>
    </>
  )
}

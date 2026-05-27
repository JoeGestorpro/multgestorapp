import { Card, Badge, Button, Empty } from '../../../components/design-system'
import { BarberCard, BarberBadge, BarberEmptyState, BarberTable } from '../../../components/barber/BarberUI'
import { money, fullDate, shortDate, advanceTone, advanceLabel } from '../utils/formatters'

export default function SettlementsView({
  isAdmin,
  collaborators,
  settlementPreview,
  settlements,
  advances,
  settlementFilters,
  settlementCollaboratorId,
  updateSettlementFilters,
  loadSettlementPreview,
  createSettlement,
  approvalPassword,
  approvalPin,
  setApprovalPassword,
  setApprovalPin,
  advanceForm,
  createAdvance,
  updateAdvanceForm,
  updateAdvanceStatus,
}) {
  if (!isAdmin) {
    return (
      <BarberCard>
        <BarberEmptyState
          description="Os acertos de colaboradores ficam disponiveis apenas para perfis gestores."
          title="Acertos indisponiveis"
        />
      </BarberCard>
    )
  }

  const activeSettlementSummary = settlementPreview || {}
  const totalAttendances = activeSettlementSummary.total_attendances || activeSettlementSummary.totalAttendances || 0
  const totalCommission = activeSettlementSummary.total_commission || 0
  const totalAdvances = activeSettlementSummary.total_advances || 0
  const netAmount = activeSettlementSummary.net_amount || 0
  const totalSettlementsPaid = settlements.reduce((sum, settlement) => sum + Number(settlement.net_amount || 0), 0)
  const totalSettlementsCommission = settlements.reduce((sum, settlement) => sum + Number(settlement.total_commission || 0), 0)
  const pendingAdvances = advances.filter((advance) => advance.status === 'pending').length

  return (
    <section className="settlements-page">
      <BarberCard className="settlements-card settlements-header">
        <div className="barber-panel-header">
          <div>
            <span className="barber-overline">Fechamento</span>
            <h3>Acertos</h3>
            <p>Fechamento de comissoes e pagamentos dos colaboradores.</p>
          </div>
          <BarberBadge tone="admin">Gestao</BarberBadge>
        </div>
</BarberCard>

      <Card className="settlements-card settlements-filters-card" padding="md">
        <div className="barber-panel-header">
          <div>
            <span className="barber-overline">Periodo atual</span>
            <h3>Fechamento por colaborador</h3>
            <p>Selecione o colaborador e o periodo antes de calcular ou fechar o pagamento.</p>
          </div>
          <Badge variant="cash">Comissoes</Badge>
        </div>

        <div className="settlements-filters-grid">
          <div className="barber-form-block">
            <label htmlFor="settlement-collaborator">Colaborador</label>
            <select
              className="barber-select"
              id="settlement-collaborator"
              name="collaboratorId"
              onChange={updateSettlementFilters}
              value={settlementCollaboratorId}
            >
              <option value="">Selecione</option>
              {collaborators
                .filter((collaborator) => collaborator.is_active && !collaborator.is_deleted)
                .map((collaborator) => (
                  <option key={collaborator.id} value={collaborator.id}>
                    {collaborator.name || collaborator.nickname}
                  </option>
                ))}
            </select>
          </div>
          <div className="barber-form-block">
            <label htmlFor="settlement-start-date">Data inicial</label>
            <input
              className="barber-input"
              id="settlement-start-date"
              name="startDate"
              onChange={updateSettlementFilters}
              type="date"
              value={settlementFilters.startDate}
            />
          </div>
          <div className="barber-form-block">
            <label htmlFor="settlement-end-date">Data final</label>
            <input
              className="barber-input"
              id="settlement-end-date"
              name="endDate"
              onChange={updateSettlementFilters}
              type="date"
              value={settlementFilters.endDate}
            />
          </div>
          <div className="settlements-filter-actions">
            <Button onClick={() => loadSettlementPreview(settlementFilters)} type="button" variant="secondary">
              Atualizar
            </Button>
            <Button onClick={createSettlement} type="button" variant="primary">
              Fechar acerto
            </Button>
          </div>
        </div>
      </Card>

      <div className="settlements-summary-grid">
        <div className="settlements-summary-card">
          <span>Total de atendimentos</span>
          <strong>{totalAttendances}</strong>
          <p>No periodo selecionado</p>
        </div>
        <div className="settlements-summary-card">
          <span>Comissao gerada</span>
          <strong>{money(totalCommission)}</strong>
          <p>Antes dos vales</p>
        </div>
        <div className="settlements-summary-card">
          <span>Vales/adiantamentos</span>
          <strong>{money(totalAdvances)}</strong>
          <p>Aprovados no periodo</p>
        </div>
        <div className="settlements-summary-card settlements-summary-card-highlight">
          <span>Valor liquido a pagar</span>
          <strong>{money(netAmount)}</strong>
          <p>Valor previsto</p>
        </div>
      </div>

      {!settlementPreview ? (
        <div className="settlements-empty-state">
          <strong>Fechamento aguardando filtros</strong>
          <p>Escolha um colaborador e clique em Atualizar para carregar o resumo do periodo.</p>
        </div>
      ) : null}

      <div className="settlements-detail-grid">
<Card className="settlements-card" padding="md">
          <div className="barber-panel-header">
            <div>
              <h3>Detalhes de vales e adiantamentos</h3>
              <p>Mantenha as movimentacoes internas da equipe dentro do mesmo fluxo de acertos.</p>
            </div>
            <Badge variant="pending">{pendingAdvances} pendentes</Badge>
          </div>

          <form className="settlements-advance-form" onSubmit={createAdvance}>
            <div className="settlements-advance-grid">
              <div className="barber-form-block">
                <label htmlFor="advance-collaborator">Colaborador</label>
                <select
                  className="barber-select"
                  id="advance-collaborator"
                  name="collaboratorId"
                  onChange={updateAdvanceForm}
                  required
                  value={advanceForm.collaboratorId}
                >
                  <option value="">Selecione</option>
                  {collaborators
                    .filter((collaborator) => collaborator.is_active && !collaborator.is_deleted)
                    .map((collaborator) => (
                      <option key={collaborator.id} value={collaborator.id}>
                        {collaborator.name || collaborator.nickname}
                      </option>
                    ))}
                </select>
              </div>
              <div className="barber-form-block">
                <label htmlFor="advance-amount">Valor</label>
                <input
                  className="barber-input"
                  id="advance-amount"
                  min="0.01"
                  name="amount"
                  onChange={updateAdvanceForm}
                  required
                  step="0.01"
                  type="number"
                  value={advanceForm.amount}
                />
              </div>
              <div className="barber-form-block settlements-advance-reason">
                <label htmlFor="advance-reason">Motivo</label>
                <textarea
                  className="barber-textarea"
                  id="advance-reason"
                  name="reason"
                  onChange={updateAdvanceForm}
                  rows="3"
                  value={advanceForm.reason}
                />
              </div>
            </div>

            <div className="settlements-advance-footer">
              <div className="barber-advance-credentials">
                <div className="barber-form-block">
                  <label htmlFor="approval-password">Senha admin</label>
                  <input
                    className="barber-input"
                    id="approval-password"
                    onChange={(event) => setApprovalPassword(event.target.value)}
                    type="password"
                    value={approvalPassword}
                  />
                </div>
                <div className="barber-form-block">
                  <label htmlFor="approval-pin">PIN</label>
                  <input
                    className="barber-input"
                    id="approval-pin"
                    onChange={(event) => setApprovalPin(event.target.value)}
                    type="password"
                    value={approvalPin}
                  />
                </div>
              </div>
<Button type="submit" variant="primary">
                Solicitar vale
              </Button>
            </div>
          </form>

          <BarberTable className="settlements-table-wrapper" columns={['Data', 'Colaborador', 'Valor', 'Status', 'Acoes']}>
            {advances.slice(0, 6).length > 0 ? (
              advances.slice(0, 6).map((advance) => (
                <tr key={advance.id}>
                  <td>{fullDate(advance.created_at)}</td>
                  <td>{advance.collaborator_name}</td>
                  <td>{money(advance.amount)}</td>
                  <td>
                    <Badge variant={advanceTone(advance.status)}>{advanceLabel(advance.status)}</Badge>
                  </td>
                  <td>
{advance.status === 'pending' ? (
                    <div className="barber-inline-actions">
                      <Button onClick={() => updateAdvanceStatus(advance.id, 'approve')} type="button" variant="primary">
                        Aprovar
                      </Button>
                      <Button onClick={() => updateAdvanceStatus(advance.id, 'reject')} type="button" variant="danger">
                        Rejeitar
                      </Button>
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
<Empty
                    description="Nenhum vale ou adiantamento encontrado para acompanhar agora."
                    title="Sem movimentacoes"
                  />
                </td>
              </tr>
            )}
          </BarberTable>
</Card>

        <Card className="settlements-card" padding="md">
          <div className="barber-panel-header">
            <div>
              <h3>Resumo dos acertos</h3>
              <p>Leitura rapida dos fechamentos ja registrados.</p>
            </div>
            <Badge variant="admin">{settlements.length} registros</Badge>
          </div>

          <div className="settlements-mini-summary">
            <div>
              <span>Total pago</span>
              <strong>{money(totalSettlementsPaid)}</strong>
              <p>Soma liquida dos fechamentos</p>
            </div>
            <div>
              <span>Comissoes</span>
              <strong>{money(totalSettlementsCommission)}</strong>
              <p>Comissao bruta fechada</p>
            </div>
            <div>
              <span>Historico</span>
              <strong>{settlements.length}</strong>
              <p>Acertos anteriores</p>
            </div>
          </div>
</Card>
      </div>

      <Card className="settlements-card settlements-history-card" padding="md">
        <div className="barber-panel-header">
          <div>
            <h3>Historico de acertos anteriores</h3>
            <p>Historico separado do fechamento atual para auditoria e conferencia de pagamentos.</p>
          </div>
          <Badge variant="admin">{settlements.length} registros</Badge>
        </div>

        <BarberTable className="settlements-table-wrapper" columns={['Data do fechamento', 'Colaborador', 'Periodo', 'Valor', 'Comissao', 'Vales']}>
          {settlements.length > 0 ? (
            settlements.map((settlement) => (
              <tr key={settlement.id}>
                <td>{fullDate(settlement.created_at)}</td>
                <td>{settlement.collaborator_name}</td>
                <td>
                  <span>
                    {settlement.period_start
                      ? `${shortDate(settlement.period_start)} ate ${shortDate(settlement.period_end)}`
                      : 'Inicio ate fechamento'}
                    </span>
                </td>
                <td><strong>{money(settlement.net_amount)}</strong></td>
                <td>{money(settlement.total_commission)}</td>
                <td>{money(settlement.total_advances)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">
                <Empty
                  description="Nenhum acerto encontrado para este periodo."
                  title="Historico vazio"
                />
              </td>
            </tr>
          )}
        </BarberTable>
      </Card>
    </section>
  )
}

import { money, fullDate, paymentTone, paymentLabel, advanceTone, advanceLabel } from '../utils/formatters'
import { SummaryCard } from '../../../components/design-system'
import { BarberBadge, BarberCard, BarberEmptyState, BarberModal, BarberTable } from '../../../components/barber/BarberUI'

export default function CollaboratorSummaryModal({
  collaboratorSummaryId,
  closeCollaboratorSummary,
  collaboratorSummaryTarget,
  collaboratorSummarySales,
  collaboratorSummaryAdvances
}) {
  return (
    <BarberModal
      onClose={closeCollaboratorSummary}
      open={Boolean(collaboratorSummaryId)}
      subtitle={collaboratorSummaryTarget ? `Resumo financeiro de ${collaboratorSummaryTarget.collaborator_name} no periodo selecionado.` : ''}
      title={collaboratorSummaryTarget ? `Resumo de ${collaboratorSummaryTarget.collaborator_name}` : 'Resumo do colaborador'}
    >
      <div className="barber-modal-content">
        {collaboratorSummaryTarget ? (
          <>
            <SummaryCard
              items={[
                {
                  label: "Faturamento bruto",
                  description: "Total vendido no periodo",
                  value: <strong>{money(collaboratorSummaryTarget.gross_revenue)}</strong>
                },
                {
                  label: "Comissao gerada",
                  description: "Com base nas vendas reais",
                  value: <strong>{money(collaboratorSummaryTarget.commission_total)}</strong>
                },
                {
                  label: "Adiantamentos",
                  description: "Vales aprovados ou liquidados",
                  value: <strong>{money(collaboratorSummaryTarget.advances_total)}</strong>
                },
                {
                  label: "Liquido a receber",
                  description: "Comissao menos adiantamentos",
                  value: <strong>{money(collaboratorSummaryTarget.net_to_receive)}</strong>,
                  valueVariant: "success"
                },
                {
                  label: "Atendimentos",
                  description: "Quantidade de vendas no periodo",
                  value: <strong>{collaboratorSummaryTarget.sales_count || 0}</strong>
                },
                {
                  label: "Ultima venda",
                  description: "Ultimo registro valido",
                  value: <strong>{collaboratorSummaryTarget.last_sale_at ? fullDate(collaboratorSummaryTarget.last_sale_at) : '-'}</strong>
                }
              ]}
            />

            <BarberCard>
              <div className="barber-table-header">
                <div>
                  <h2>Vendas recentes</h2>
                  <p>Ultimos lancamentos reais deste colaborador no periodo.</p>
                </div>
                <BarberBadge tone="pix">{collaboratorSummarySales.length} registros</BarberBadge>
              </div>
              <BarberTable columns={['Data', 'Servico', 'Pagamento', 'Valor']}>
                {collaboratorSummarySales.length > 0 ? (
                  collaboratorSummarySales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{fullDate(sale.created_at)}</td>
                      <td>
                        <strong>{sale.service_name || sale.client_name || 'Venda registrada'}</strong>
                        <span>{sale.notes || '-'}</span>
                      </td>
                      <td>
                        <BarberBadge tone={paymentTone(sale.payment_method)}>
                          {paymentLabel(sale.payment_method)}
                        </BarberBadge>
                      </td>
                      <td>{money(sale.total_amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      <BarberEmptyState
                        description="Este colaborador ainda nao possui vendas no periodo."
                        title="Sem vendas no periodo"
                      />
                    </td>
                  </tr>
                )}
              </BarberTable>
            </BarberCard>

            {collaboratorSummaryAdvances.length > 0 && (
              <BarberCard>
                <div className="barber-table-header">
                  <div>
                    <h2>Adiantamentos</h2>
                    <p>Movimentacoes de vales associadas a este colaborador.</p>
                  </div>
                  <BarberBadge tone="pending">{collaboratorSummaryAdvances.length} registros</BarberBadge>
                </div>
                <BarberTable columns={['Data', 'Motivo', 'Status', 'Valor']}>
                  {collaboratorSummaryAdvances.map((advance) => (
                    <tr key={advance.id}>
                      <td>{fullDate(advance.created_at)}</td>
                      <td>{advance.reason || '-'}</td>
                      <td>
                        <BarberBadge tone={advanceTone(advance.status)}>
                          {advanceLabel(advance.status)}
                        </BarberBadge>
                      </td>
                      <td>{money(advance.amount)}</td>
                    </tr>
                  ))}
                </BarberTable>
              </BarberCard>
            )}
          </>
        ) : (
          <BarberEmptyState
            description="Nao foi possivel localizar os detalhes financeiros deste colaborador."
            title="Resumo indisponivel"
          />
        )}
      </div>
    </BarberModal>
  )
}

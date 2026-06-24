import { Card, Badge, SummaryCard, Empty } from '../../../components/design-system'
import { BarberTable } from '../../../components/barber/BarberUI'

export default function ReportsView({
  isAdmin,
  personalReport,
  settlements,
  money,
  fullDate,
  shortDate,
  services,
  visibleServices,
  products,
  lowStockProducts,
  fridgeItems = [],
  fridgeReport = null
}) {
  if (!isAdmin) {
    return (
      <>
        <section className="barber-grid-two barber-cash-layout">
          <Card padding="md">
            <div className="barber-panel-header">
              <div>
                <h3>Meu relatorio</h3>
                <p>Resumo apenas dos seus atendimentos, comissoes e adiantamentos.</p>
              </div>
            </div>

            <SummaryCard
              items={[
                {
                  label: "Atendimentos",
                  description: "Total no periodo carregado",
                  value: <strong>{personalReport.totals?.attendances || 0}</strong>
                },
                {
                  label: "Comissao acumulada",
                  description: "Total das suas comissoes",
                  value: <strong>{money(personalReport.totals?.totalCommission)}</strong>
                },
                {
                  label: "Adiantamentos",
                  description: "Somente valores do seu historico",
                  value: <strong>{money(personalReport.totals?.totalAdvances)}</strong>
                },
                {
                  label: "Liquido previsto",
                  description: "Comissao menos adiantamentos",
                  value: <strong>{money(personalReport.totals?.netCommission)}</strong>,
                  valueVariant: "success"
                }
              ]}
            />
          </Card>

          <Card padding="md">
            <div className="barber-panel-header">
              <div>
                <h3>Meus fechamentos</h3>
                <p>Historico pessoal de pagamentos ja fechados.</p>
              </div>
              <Badge variant="admin">{settlements.length} registros</Badge>
            </div>

            <BarberTable columns={['Data', 'Comissao', 'Vales', 'Liquido pago', 'Periodo']}>
              {settlements.length > 0 ? (
                settlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td>{fullDate(settlement.created_at)}</td>
                    <td>{money(settlement.total_commission)}</td>
                    <td>{money(settlement.total_advances)}</td>
                    <td>{money(settlement.net_amount)}</td>
                    <td>
                      {settlement.period_start
                        ? `${shortDate(settlement.period_start)} ate ${shortDate(settlement.period_end)}`
                        : 'Inicio ate fechamento'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <Empty
                      description="Seus fechamentos aparecerao aqui quando forem registrados pelo admin."
                      title="Nenhum fechamento disponivel"
                    />
                  </td>
                </tr>
              )}
            </BarberTable>
          </Card>
        </section>

        <Card padding="md">
          <div className="barber-table-header">
            <div>
              <h2>Meus atendimentos</h2>
              <p>Lista pessoal de atendimentos retornada pelo seu relatorio.</p>
            </div>
            <Badge variant="pix">{personalReport.sales?.length || 0} registros</Badge>
          </div>

          <BarberTable columns={['Data', 'Servico', 'Comissao', 'Observacoes']}>
            {personalReport.sales?.length > 0 ? (
              personalReport.sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{fullDate(sale.created_at)}</td>
                  <td>
                    <strong>{sale.service_name || 'Atendimento registrado'}</strong>
                    <span>{shortDate(sale.sale_date_local)}</span>
                  </td>
                  <td>{money(sale.commission_amount)}</td>
                  <td>{sale.client_name || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">
                  <Empty
                    description="Seu historico pessoal aparecera aqui assim que houver atendimentos no periodo."
                    title="Nenhum atendimento encontrado"
                  />
                </td>
              </tr>
            )}
          </BarberTable>
        </Card>
      </>
    )
  }

  return (
    <>
      <Card className="barber-report-hub" padding="md">
        <div className="barber-panel-header">
          <div>
            <span className="barber-overline">Relatorios</span>
            <h3>Central historica da barbearia</h3>
            <p>Use esta area para analisar periodos, formas de pagamento, servicos, permutas, comissoes e caixa.</p>
          </div>
          <Badge variant="admin">Historico real</Badge>
        </div>

        <div className="barber-report-scope-grid">
          {[
            'Diario',
            'Semanal',
            'Mensal',
            'Periodo personalizado',
            'Por colaborador',
            'Por forma de pagamento',
            'Por servico',
            'Por permuta',
            'Por comissao',
            'Por caixa'
          ].map((scope) => (
            <span className="barber-report-scope" key={scope}>{scope}</span>
          ))}
        </div>
      </Card>

      <section className="barber-report-grid">
        <SummaryCard
          title="Catalogo em numeros"
          subtitle="Visao consolidada do cadastro de servicos desta barbearia."
          items={[
            {
              label: "Total de servicos",
              description: "Itens cadastrados e nao excluidos",
              value: <strong>{services.length}</strong>
            },
            {
              label: "Servicos ativos",
              description: "Disponiveis no lancamento de venda",
              value: <strong>{visibleServices.length}</strong>
            },
            {
              label: "Tempo medio do catalogo",
              description: "Media dos servicos com tempo informado",
              value: (
                <strong>
                  {services.filter((service) => service.estimated_time_minutes).length
                    ? `${Math.round(
                        services
                          .filter((service) => service.estimated_time_minutes)
                          .reduce((sum, service) => sum + Number(service.estimated_time_minutes || 0), 0)
                        / services.filter((service) => service.estimated_time_minutes).length
                      )} min`
                    : '-'}
                </strong>
              )
            },
            {
              label: "Total de produtos",
              description: "Catalogo disponivel para revenda futura",
              value: <strong>{products.length}</strong>
            },
            {
              label: "Estoque baixo",
              description: "Produtos que pedem reposicao imediata",
              value: <strong>{lowStockProducts.length}</strong>,
              valueVariant: lowStockProducts.length > 0 ? 'warning' : 'default'
            }
          ]}
        />
      </section>

      <Card padding="md">
        <div className="barber-panel-header">
          <div>
            <h3>Itens da Geladeira</h3>
            <p>Relatorio de vendas, estoque e desempenho dos itens do frigobar.</p>
          </div>
          <Badge variant="admin">{fridgeItems.filter(i => i.is_active || i.isActive).length} ativos</Badge>
        </div>

        <SummaryCard
          title="Metricas de vendas"
          subtitle="Dados reais de barber_products com product_type='fridge'."
          items={[
            {
              label: "Total de itens",
              description: "Itens ativos no catalogo da geladeira",
              value: <strong>{fridgeItems.filter(i => i.is_active || i.isActive).length}</strong>
            },
            {
              label: "Itens vendidos",
              description: "Quantidade total vendida no periodo",
              value: <strong>{fridgeReport ? fridgeReport.totalItemsSold : 0}</strong>
            },
            {
              label: "Receita gerada",
              description: "Faturamento dos itens vendidos",
              value: <strong>{money(fridgeReport ? fridgeReport.totalRevenue : 0)}</strong>
            },
            {
              label: "Estoque baixo",
              description: "Itens com estoque abaixo do minimo",
              value: <strong>{fridgeReport ? fridgeReport.lowStock : 0}</strong>,
              valueVariant: (fridgeReport ? fridgeReport.lowStock : 0) > 0 ? 'warning' : 'default'
            },
            {
              label: "Esgotados",
              description: "Itens com estoque zero",
              value: <strong>{fridgeReport ? fridgeReport.outOfStock : 0}</strong>,
              valueVariant: (fridgeReport ? fridgeReport.outOfStock : 0) > 0 ? 'danger' : 'default'
            }
          ]}
        />

        {(fridgeReport && fridgeReport.topSelling.length > 0) && (
          <div style={{ marginTop: 16 }}>
            <div className="barber-table-header">
              <h4>Mais vendidos</h4>
              <Badge variant="pix">Top {fridgeReport.topSelling.length}</Badge>
            </div>
            <BarberTable columns={['#', 'Item', 'Vendidos', 'Receita']}>
              {fridgeReport.topSelling.map((item, index) => (
                <tr key={item.id}>
                  <td><strong>{index + 1}</strong></td>
                  <td>
                    <strong>{item.name}</strong>
                    <span>{item.location || '-'}</span>
                  </td>
                  <td>{item.total_items_sold}</td>
                  <td>{money(Number(item.total_revenue || 0))}</td>
                </tr>
              ))}
            </BarberTable>
          </div>
        )}

        {(fridgeReport && fridgeReport.lowStock > 0) && (
          <div style={{ marginTop: 16 }}>
            <div className="barber-table-header">
              <h4>Estoque baixo</h4>
              <Badge variant="warning">{fridgeReport.lowStock} itens</Badge>
            </div>
            <BarberTable columns={['Item', 'Estoque', 'Minimo', 'Status']}>
              {(fridgeReport.topSelling || [])
                .filter(i =>
                  Number(i.stock_minimum) > 0 &&
                  Number(i.stock_current) > 0 &&
                  Number(i.stock_current) <= Number(i.stock_minimum)
                )
                .map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td>{Number(item.stock_current || 0)}</td>
                    <td>{Number(item.stock_minimum || 0)}</td>
                    <td>
                      <span className="fridge-badge fridge-badge-warning">
                        Estoque baixo
                      </span>
                    </td>
                  </tr>
                ))}
            </BarberTable>
          </div>
        )}

        {(fridgeReport && fridgeReport.outOfStock > 0) && (
          <div style={{ marginTop: 16 }}>
            <div className="barber-table-header">
              <h4>Esgotados</h4>
              <Badge variant="danger">{fridgeReport.outOfStock} itens</Badge>
            </div>
            <BarberTable columns={['Item', 'Estoque']}>
              {(fridgeReport.topSelling || [])
                .filter(i => Number(i.stock_current || 0) <= 0)
                .map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td>0</td>
                  </tr>
                ))}
            </BarberTable>
          </div>
        )}
      </Card>
    </>
  )
}

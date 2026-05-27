import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts'
import { Card, Badge, Button, Empty } from '../../../components/design-system'
import { Plus } from 'lucide-react'
import { money } from '../utils/formatters'
import { normalizePaymentMethod } from '../../../utils/paymentMethods'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null
  }

  const value = payload[0]?.value || 0
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)

  return (
    <div className="ds-chart-tooltip">
      <div className="ds-chart-tooltip__label">{label}</div>
      <div className="ds-chart-tooltip__value">{formattedValue}</div>
    </div>
  )
}

export default function CashierView({
  sales,
  dashboard,
  setSaleForm,
  buildEmptySaleForm,
  loggedInCollaboratorId,
  setSaleModalOpen,
  loadData,
  paymentChartData
}) {
    const grossTotal = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
    const cashTotal = sales
      .filter((sale) => normalizePaymentMethod(sale.payment_method) === 'cash')
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
    const pixTotal = sales
      .filter((sale) => normalizePaymentMethod(sale.payment_method) === 'pix')
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
    const creditTotal = sales
      .filter((sale) => normalizePaymentMethod(sale.payment_method) === 'credit')
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
    const debitTotal = sales
      .filter((sale) => normalizePaymentMethod(sale.payment_method) === 'debit')
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)

    return (
      <>
        <section className="barber-grid-two barber-cash-layout">
          <Card padding="md">
            <div className="barber-panel-header">
              <div>
                <h3>Resumo financeiro</h3>
                <p>Consolidado das vendas reais retornadas pelos endpoints existentes.</p>
              </div>
              <div className="barber-inline-actions">
                <Badge variant="cash">Somente dados reais</Badge>
                <Button onClick={() => {
                  setSaleForm(buildEmptySaleForm(loggedInCollaboratorId))
                  setSaleModalOpen(true)
                }} type="button" variant="primary">
                  <Plus />
                  <span>Nova venda</span>
                </Button>
              </div>
            </div>

            <div className="barber-finance-grid">
              <div className="cash-metric-card">
                <div>
                  <span>Bruto total</span>
                  <p>Soma das vendas carregadas</p>
                </div>
                <strong className="cash-metric-value">{money(grossTotal)}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Dinheiro</span>
                  <p>Entradas em espécie</p>
                </div>
                <strong className="cash-metric-value">{money(cashTotal)}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Pix</span>
                  <p>Recebimentos instantâneos</p>
                </div>
                <strong className="cash-metric-value">{money(pixTotal)}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Cartão Crédito</span>
                  <p>Credicard no período</p>
                </div>
                <strong className="cash-metric-value">{money(creditTotal)}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Cartão Débito</span>
                  <p>Débitocard no período</p>
                </div>
                <strong className="cash-metric-value">{money(debitTotal)}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Total de vendas</span>
                  <p>Registros retornados pela API</p>
                </div>
                <strong className="cash-metric-value">{sales.length}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Comissões</span>
                  <p>Resumo do dashboard</p>
                </div>
                <strong className="cash-metric-value">{money(dashboard.totalCommissions)}</strong>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="barber-chart-header">
              <div>
                <h2>Mix de pagamentos</h2>
                <p>Distribuição baseada apenas em vendas reais.</p>
              </div>
              <Button onClick={() => loadData()} type="button" variant="ghost">
                Atualizar dados
              </Button>
            </div>

            <div className="barber-chart-body">
              <div style={{ width: '100%', minHeight: 300, height: 300 }}>
                {paymentChartData.some((entry) => entry.value > 0) ? (
                  <ResponsiveContainer debounce={50} height="100%" minHeight={300} minWidth={280} width="100%">
                    <BarChart data={paymentChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" horizontal={false} />
                      <XAxis type="number" stroke="#7d8c9b" tickFormatter={(value) => `R$${Math.round(value)}`} />
                      <YAxis dataKey="name" type="category" stroke="#7d8c9b" width={96} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="value" radius={[12, 12, 12, 12]}>
                        {paymentChartData.map((entry) => (
                          <Cell fill={entry.fill} key={entry.name} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty
                    description="Assim que houver vendas reais, o mix de pagamentos aparece aqui."
                    title="Sem dados de pagamento"
                  />
                )}
              </div>
</div>
          </Card>
        </section>
      </>
    )
  }

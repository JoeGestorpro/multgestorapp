import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import MasterLayout from '../../components/master/MasterLayout'
import PageHeader from '../../components/master/PageHeader'
import SectionCard from '../../components/master/SectionCard'
import StatCard from '../../components/master/StatCard'
import api from '../../services/api'

const initialOverview = {
  mrr: 0,
  revenueReceivedMonth: 0,
  revenuePending: 0,
  activeSubscriptions: 0,
  trialingSubscriptions: 0,
  lateSubscriptions: 0,
  canceledSubscriptions: 0,
  canceledThisMonth: 0,
  monthlyChurn: 0,
  newClientsMonth: 0,
  activeCompanies: 0,
  arpa: 0
}

const initialSectionLoading = {
  mrr: true,
  moduleRevenue: true,
  gateway: true,
  subscriptions: true,
  events: true,
  alerts: true
}

const initialSectionErrors = {
  mrr: '',
  moduleRevenue: '',
  gateway: '',
  subscriptions: '',
  events: '',
  alerts: ''
}

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value))
}

function FinanceDashboard() {
  const [overview, setOverview] = useState(initialOverview)
  const [mrrSeries, setMrrSeries] = useState([])
  const [revenueByModule, setRevenueByModule] = useState([])
  const [revenueByGateway, setRevenueByGateway] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [events, setEvents] = useState([])
  const [alerts, setAlerts] = useState({ items: [], summary: { critical: 0, warning: 0 } })
  const [loading, setLoading] = useState(true)
  const [sectionLoading, setSectionLoading] = useState(initialSectionLoading)
  const [sectionErrors, setSectionErrors] = useState(initialSectionErrors)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadOverview() {
      setLoading(true)
      setError('')
      setSectionLoading(initialSectionLoading)
      setSectionErrors(initialSectionErrors)

      try {
        const overviewResponse = await api.get('/master/finance/overview')

        if (!isMounted) {
          return
        }

        setOverview(overviewResponse.data.data || initialOverview)
        setLoading(false)
        return true
      } catch (err) {
        if (!isMounted) {
          return false
        }

        setError(err.response?.data?.error || 'Nao foi possivel carregar o dashboard financeiro')
        setLoading(false)
        return false
      }
    }

    function loadSection(key, request, onSuccess) {
      return request
        .then((response) => {
          if (isMounted) {
            setSectionErrors((current) => ({ ...current, [key]: '' }))
            onSuccess(response)
          }
        })
        .catch((err) => {
          if (isMounted) {
            setSectionErrors((current) => ({
              ...current,
              [key]: err.response?.data?.error || 'Nao foi possivel carregar este bloco'
            }))
          }
        })
        .finally(() => {
          if (isMounted) {
            setSectionLoading((current) => ({ ...current, [key]: false }))
          }
        })
    }

    function loadDeferredSections() {
      void Promise.allSettled([
        loadSection('mrr', api.get('/master/finance/mrr'), (response) => {
          setMrrSeries(response.data.data?.items || [])
        }),
        loadSection('moduleRevenue', api.get('/master/finance/revenue-by-module'), (response) => {
          setRevenueByModule(response.data.data?.items || [])
        }),
        loadSection('gateway', api.get('/master/finance/revenue-by-gateway'), (response) => {
          setRevenueByGateway(response.data.data?.items || [])
        }),
        loadSection('subscriptions', api.get('/master/finance/subscriptions', { params: { limit: 8 } }), (response) => {
          setSubscriptions(response.data.data?.items || [])
        }),
        loadSection('events', api.get('/master/finance/events', { params: { limit: 8 } }), (response) => {
          setEvents(response.data.data?.items || [])
        }),
        loadSection('alerts', api.get('/master/finance/alerts'), (response) => {
          setAlerts(response.data.data || { items: [], summary: { critical: 0, warning: 0 } })
        })
      ])
    }

    loadOverview().then((shouldLoadDeferred) => {
      if (shouldLoadDeferred) {
        window.setTimeout(loadDeferredSections, 0)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const cards = [
    { label: 'MRR atual', value: formatMoney(overview.mrr), detail: `${overview.activeSubscriptions} assinaturas ativas` },
    { label: 'Receita do mes', value: formatMoney(overview.revenueReceivedMonth), detail: 'Pagamentos confirmados no periodo' },
    { label: 'Receita pendente', value: formatMoney(overview.revenuePending), detail: `${overview.lateSubscriptions} assinaturas em atraso` },
    { label: 'ARPA', value: formatMoney(overview.arpa), detail: 'Ticket medio por assinatura ativa' },
    { label: 'Churn mensal', value: formatPercent(overview.monthlyChurn), detail: `${overview.canceledThisMonth} cancelamentos no mes` },
    { label: 'Novos clientes', value: overview.newClientsMonth, detail: `${overview.activeCompanies} empresas ativas` }
  ]

  return (
    <MasterLayout title="Financeiro">
      <PageHeader
        eyebrow="Painel Financeiro"
        title="Saude financeira da plataforma"
        description="Acompanhe MRR, recorrencia, pagamentos, assinaturas e sinais de risco do MultGestor."
      />

      {loading && <SectionCard><p>Carregando dashboard financeiro...</p></SectionCard>}
      {!loading && error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          <section className="master-premium-stats">
            {cards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} detail={card.detail} />
            ))}
          </section>

          <section className="master-finance-grid">
            <SectionCard title="MRR por mes" meta={`${mrrSeries.length} pontos`}>
              {sectionLoading.mrr ? (
                <p>Carregando serie de MRR...</p>
              ) : sectionErrors.mrr ? (
                <p className="error-message">{sectionErrors.mrr}</p>
              ) : (
                <div className="master-chart">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={mrrSeries}>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                      <XAxis dataKey="label" stroke="#8f9ca9" />
                      <YAxis stroke="#8f9ca9" tickFormatter={(value) => `R$ ${Math.round(value)}`} />
                      <Tooltip formatter={(value) => formatMoney(value)} />
                      <Line dataKey="mrr" stroke="#5cff6b" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Receita por modulo" meta={`${revenueByModule.length} grupos`}>
              {sectionLoading.moduleRevenue ? (
                <p>Carregando consolidado por modulo...</p>
              ) : sectionErrors.moduleRevenue ? (
                <p className="error-message">{sectionErrors.moduleRevenue}</p>
              ) : (
                <div className="master-chart">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueByModule}>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                      <XAxis dataKey="moduleName" stroke="#8f9ca9" />
                      <YAxis stroke="#8f9ca9" tickFormatter={(value) => `R$ ${Math.round(value)}`} />
                      <Tooltip formatter={(value) => formatMoney(value)} />
                      <Bar dataKey="revenueReceived" fill="#22c55e" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </section>

          <section className="master-finance-grid">
            <SectionCard
              title="Receita por gateway"
              meta={`${revenueByGateway.length} gateways consolidados`}
            >
              {sectionLoading.gateway ? (
                <p>Carregando receita por gateway...</p>
              ) : sectionErrors.gateway ? (
                <p className="error-message">{sectionErrors.gateway}</p>
              ) : (
                <>
                  <div className="master-chart">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={revenueByGateway}
                          dataKey="revenueReceived"
                          nameKey="gatewayName"
                          innerRadius={65}
                          outerRadius={96}
                          paddingAngle={4}
                        >
                          {revenueByGateway.map((entry, index) => (
                            <Cell
                              key={`${entry.gatewayName}-${index}`}
                              fill={['#5cff6b', '#38bdf8', '#f59e0b', '#fb7185', '#c084fc'][index % 5]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatMoney(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="master-finance-legend">
                    {revenueByGateway.map((item) => (
                      <div className="master-finance-legend-item" key={item.gatewayName}>
                        <strong>{item.gatewayName}</strong>
                        <span>{formatMoney(item.revenueReceived)}</span>
                      </div>
                    ))}
                    {revenueByGateway.length === 0 && <p>Nenhuma receita por gateway registrada.</p>}
                  </div>
                </>
              )}
            </SectionCard>

            <SectionCard
              title="Alertas financeiros"
              meta={`${alerts.summary?.critical || 0} criticos / ${alerts.summary?.warning || 0} avisos`}
            >
              {sectionLoading.alerts ? (
                <p>Carregando alertas financeiros...</p>
              ) : sectionErrors.alerts ? (
                <p className="error-message">{sectionErrors.alerts}</p>
              ) : (
                <div className="master-alert-list">
                  {alerts.items?.map((alert) => (
                    <article className={`master-alert-item ${alert.severity}`} key={`${alert.code}-${alert.message}`}>
                      <strong>{alert.title}</strong>
                      <p>{alert.message}</p>
                      <span>{formatDateTime(alert.createdAt)}</span>
                    </article>
                  ))}
                  {(!alerts.items || alerts.items.length === 0) && <p>Nenhum alerta financeiro no momento.</p>}
                </div>
              )}
            </SectionCard>
          </section>

          <section className="master-finance-grid">
            <SectionCard title="Assinaturas recentes" meta={`${subscriptions.length} registros`}>
              {sectionLoading.subscriptions ? (
                <p>Carregando assinaturas recentes...</p>
              ) : sectionErrors.subscriptions ? (
                <p className="error-message">{sectionErrors.subscriptions}</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Empresa</th>
                        <th>Modulo</th>
                        <th>Plano</th>
                        <th>Status</th>
                        <th>MRR eq.</th>
                        <th>Gateway</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((item) => (
                        <tr key={item.id}>
                          <td>{item.company_name || '-'}</td>
                          <td>{item.module_name || item.module_key || '-'}</td>
                          <td>{item.plan_name_resolved || item.plan_name || '-'}</td>
                          <td>{item.status || '-'}</td>
                          <td>{formatMoney(item.monthly_amount)}</td>
                          <td>{item.gateway || 'manual'}</td>
                        </tr>
                      ))}
                      {subscriptions.length === 0 && (
                        <tr>
                          <td colSpan="6">Nenhuma assinatura encontrada.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Ultimos eventos de webhook" meta={`${events.length} eventos`}>
              {sectionLoading.events ? (
                <p>Carregando eventos recentes...</p>
              ) : sectionErrors.events ? (
                <p className="error-message">{sectionErrors.events}</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Gateway</th>
                        <th>Evento</th>
                        <th>Status</th>
                        <th>Empresa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDateTime(item.created_at)}</td>
                          <td>{item.gateway || '-'}</td>
                          <td>{item.event_type || '-'}</td>
                          <td>{item.processing_status || '-'}</td>
                          <td>{item.company_name || '-'}</td>
                        </tr>
                      ))}
                      {events.length === 0 && (
                        <tr>
                          <td colSpan="5">Nenhum evento de pagamento recebido ainda.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </section>
        </>
      )}
    </MasterLayout>
  )
}

export default FinanceDashboard

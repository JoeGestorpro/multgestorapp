import { useEffect, useState } from 'react'
import { Users, BarChart3, AlertTriangle, DollarSign, TrendingUp, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import MasterLayout from '../components/master/MasterLayout'
import PageHeader from '../components/master/PageHeader'
import SectionCard from '../components/master/SectionCard'
import StatCard from '../components/master/StatCard'
import StatusBadge from '../components/master/StatusBadge'
import ActionButton from '../components/master/ActionButton'
import { showToast } from '../components/master/Toast'

const initialDashboard = {
  totalCompanies: 0,
  totalModules: 0,
  totalActiveModules: 0,
  totalActiveSubscriptions: 0,
  totalPendingActivations: 0,
  recentCompanies: [],
  recentModules: []
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(value))
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const MOCK_MRR = 28450
const MOCK_CHURN = 2.4
const MOCK_TRIALS = 18
const MOCK_EXPIRING_TRIALS = 5
const MOCK_OVERDUE = 7
const MOCK_ALERTS = [
  { id: 'CRITICAL-1', title: 'CORS completamente aberto', severity: 'critical' },
  { id: 'RK-01', title: 'barber.service.js god class (~6.500 linhas)', severity: 'critical' },
  { id: 'RK-05', title: 'Multi-tenant manual — risco de data leak', severity: 'high' }
]

export default function MasterDashboard() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get('/master/dashboard')
        setDashboard(response.data.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Não foi possível carregar o dashboard master')
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  function handleAction(action) {
    if (action === 'nova-empresa') {
      navigate('/master/clients')
    } else if (action === 'ver-crm') {
      navigate('/master/crm')
    } else if (action === 'ver-financeiro') {
      navigate('/master/financeiro')
    } else {
      showToast(`[Mock] Ação "${action}" preparada para backend futuro.`, 'info')
    }
  }

  const cards = [
    { label: 'Empresas', value: dashboard.totalCompanies },
    { label: 'Módulos', value: dashboard.totalModules },
    { label: 'Módulos ativos', value: dashboard.totalActiveModules },
    { label: 'Assinaturas ativas', value: dashboard.totalActiveSubscriptions },
    { label: 'Ativações pendentes', value: dashboard.totalPendingActivations },
    { label: 'MRR', value: formatCurrency(MOCK_MRR), detail: 'Receita recorrente mensal' },
    { label: 'Churn rate', value: `${MOCK_CHURN}%`, detail: 'Taxa de cancelamento' },
    { label: 'Novos trials', value: MOCK_TRIALS, detail: 'Esta semana' },
    { label: 'Trials expirando', value: MOCK_EXPIRING_TRIALS, detail: 'Hoje' },
    { label: 'Inadimplentes', value: MOCK_OVERDUE, detail: 'Ações necessárias' }
  ]

  return (
    <MasterLayout title="Dashboard">
      <PageHeader
        title="Dashboard Master"
        description="Controle central da plataforma MultGestor V2."
        actions={
          <div className="master-premium-page-actions">
            <ActionButton variant="primary" icon={Users} onClick={() => handleAction('nova-empresa')}>
              Nova Empresa
            </ActionButton>
            <ActionButton variant="secondary" icon={BarChart3} onClick={() => handleAction('ver-crm')}>
              Ver CRM
            </ActionButton>
            <ActionButton variant="secondary" icon={DollarSign} onClick={() => handleAction('ver-financeiro')}>
              Financeiro
            </ActionButton>
          </div>
        }
      />

      {loading && <SectionCard><p>Carregando dashboard...</p></SectionCard>}
      {!loading && error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          <section className="master-premium-stats">
            {cards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} detail={card.detail} />
            ))}
          </section>

          <div className="master-dashboard-alerts">
            <SectionCard title="Alertas Ativos">
              <div className="master-dashboard-alerts-list">
                {MOCK_ALERTS.map(alert => (
                  <div key={alert.id} className={`master-dashboard-alert master-dashboard-alert--${alert.severity}`}>
                    <AlertTriangle size={16} />
                    <div>
                      <strong>{alert.id}</strong>
                      <span>{alert.title}</span>
                    </div>
                    <StatusBadge status={alert.severity} label={alert.severity === 'critical' ? 'Crítico' : 'Alto'} />
                  </div>
                ))}
              </div>
              <div className="master-dashboard-alerts-more">
                <button className="master-btn master-btn--sm master-btn--ghost" type="button" onClick={() => navigate('/master/governance')}>
                  Ver todos os riscos →
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Ações Rápidas">
              <div className="master-dashboard-quick-actions">
                <button className="master-dashboard-quick-btn" type="button" onClick={() => handleAction('relatorio')}>
                  <TrendingUp size={20} />
                  <span>Relatório Executivo</span>
                </button>
                <button className="master-dashboard-quick-btn" type="button" onClick={() => handleAction('backup')}>
                  <Zap size={20} />
                  <span>Forçar Backup</span>
                </button>
                <button className="master-dashboard-quick-btn" type="button" onClick={() => navigate('/master/niches')}>
                  <TrendingUp size={20} />
                  <span>Ver Nichos</span>
                </button>
                <button className="master-dashboard-quick-btn" type="button" onClick={() => navigate('/master/health')}>
                  <TrendingUp size={20} />
                  <span>Saúde do Sistema</span>
                </button>
              </div>
            </SectionCard>
          </div>

          <section className="master-premium-two-columns">
            <SectionCard title="Empresas recentes" meta={`${dashboard.recentCompanies.length} registros`}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Nicho</th>
                      <th>Status</th>
                      <th>Criada em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentCompanies.map((company) => (
                      <tr key={company.id}>
                        <td>{company.name}</td>
                        <td>{company.niche_type || '-'}</td>
                        <td>{company.status || '-'}</td>
                        <td>{formatDate(company.created_at)}</td>
                      </tr>
                    ))}
                    {dashboard.recentCompanies.length === 0 && (
                      <tr><td colSpan="4">Nenhuma empresa encontrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Módulos recentes" meta={`${dashboard.recentModules.length} registros`}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Módulo</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentModules.map((module) => (
                      <tr key={module.id}>
                        <td>{module.name}</td>
                        <td>{module.slug}</td>
                        <td>{module.is_active ? 'Ativo' : 'Inativo'}</td>
                        <td>{formatDate(module.created_at)}</td>
                      </tr>
                    ))}
                    {dashboard.recentModules.length === 0 && (
                      <tr><td colSpan="4">Nenhum módulo encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </section>
        </>
      )}
    </MasterLayout>
  )
}

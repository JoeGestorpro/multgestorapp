import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import PremiumMetricCard from './PremiumMetricCard'
import PremiumTabs from './PremiumTabs'
import PremiumFilterBar from './PremiumFilterBar'
import PremiumTable from './PremiumTable'
import PremiumBadge from './PremiumBadge'
import PremiumLoadingSkeleton from './PremiumLoadingSkeleton'
import PremiumEmptyState from './PremiumEmptyState'
import PremiumButton from './PremiumButton'
import CustomerSidePanel from './CustomerSidePanel'
import './CrmDashboard.css'

function formatCurrency(value) {
  if (value == null || isNaN(Number(value))) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

function formatDateBR(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
  } catch { return '-' }
}

const statusLabel = {
  pending: 'Pendente', active: 'Ativo', blocked: 'Bloqueado'
}

const DASHBOARD_TABS = [
  { id: 'todos', label: 'Todos' },
  { id: 'inativos', label: 'Inativos' },
  { id: 'aniversariantes', label: 'Aniversariantes' }
]

const CRM_TABS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'customers', label: 'Clientes' },
  { id: 'appointments', label: 'Agendamentos' },
  { id: 'financial', label: 'Financeiro' }
]

const statusFilterOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'active', label: 'Ativos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'blocked', label: 'Bloqueados' }
]

export default function CrmDashboard({ variant = 'list', initialTab }) {
  const [customers, setCustomers] = useState([])
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState(initialTab || 'todos')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [crmTab, setCrmTab] = useState('overview')
  const [crmSummary, setCrmSummary] = useState(null)
  const [crmSummaryLoading, setCrmSummaryLoading] = useState(false)
  const [summaryPeriod, setSummaryPeriod] = useState('month')

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const activeStatus = activeTab === 'inativos' ? 'blocked' : activeTab === 'aniversariantes' ? undefined : undefined
      const res = await api.get('/barber/customers', {
        params: {
          search: search || undefined,
          status: activeStatus || (statusFilter !== 'all' ? statusFilter : undefined)
        }
      })
      let items = res.data.data?.items || []
      const total = res.data.data?.total || 0

      if (activeTab === 'aniversariantes') {
        const hoje = new Date()
        const mesAtual = hoje.getMonth() + 1
        const diaAtual = hoje.getDate()
        items = items.filter(c => {
          if (!c.birth_date) return false
          const d = new Date(c.birth_date)
          return d.getMonth() + 1 === mesAtual && d.getDate() === diaAtual
        })
      }

      setCustomers(items)
      setTotalCustomers(total)
    } catch {
      setCustomers([])
      setTotalCustomers(0)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, activeTab])

  useEffect(() => {
    const id = setTimeout(() => loadCustomers(), 300)
    return () => clearTimeout(id)
  }, [search, statusFilter, activeTab, loadCustomers])

  const fetchCrmSummary = useCallback(async () => {
    setCrmSummaryLoading(true)
    try {
      const res = await api.get('/barber/crm/summary', { params: { period: summaryPeriod } })
      setCrmSummary(res.data.data)
    } catch {
      setCrmSummary(null)
    } finally {
      setCrmSummaryLoading(false)
    }
  }, [summaryPeriod])

  useEffect(() => {
    if (variant === 'crm') fetchCrmSummary()
  }, [variant, fetchCrmSummary])

  const activeCount = useMemo(() => customers.filter(c => c.status === 'active').length, [customers])
  const pendingCount = useMemo(() => customers.filter(c => c.status === 'pending').length, [customers])
  const blockedCount = useMemo(() => customers.filter(c => c.status === 'blocked').length, [customers])
  const vipCustomers = useMemo(() => customers.filter(c => c.loyalty_level === 'vip' || c.loyalty_level === 'fiel'), [customers])

  const isBirthdayMonth = useMemo(() => {
    const hoje = new Date()
    const mesAtual = hoje.getMonth() + 1
    return customers.filter(c => {
      if (!c.birth_date) return false
      const d = new Date(c.birth_date)
      return d.getMonth() + 1 === mesAtual
    }).length
  }, [customers])

  const sortedCustomers = useMemo(() => {
    const sorted = [...customers]
    sorted.sort((a, b) => {
      let aVal = a[sortKey]
      let bVal = b[sortKey]
      if (sortKey === 'name') { aVal = (aVal || '').toLowerCase(); bVal = (bVal || '').toLowerCase() }
      if (sortKey === 'created_at') { aVal = aVal || ''; bVal = bVal || '' }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [customers, sortKey, sortDir])

  const customerColumns = useMemo(() => [
    { key: 'name', label: 'Cliente', sortable: true, render: (row) => (
      <div className="crm-name-cell">
        <div className="crm-name-avatar">{(row.name || '?').slice(0, 2).toUpperCase()}</div>
        <div>
          <div className="crm-name-text">{row.name || 'Sem nome'}</div>
          {row.email && <div className="crm-name-email">{row.email}</div>}
        </div>
      </div>
    )},
    { key: 'phone', label: 'Telefone', render: (row) => row.phone || '-' },
    { key: 'status', label: 'Status', render: (row) => (
      <PremiumBadge status={row.status || 'pending'} label={statusLabel[row.status] || row.status || '-'} size="sm" />
    )},
    { key: 'origin', label: 'Origem', render: (row) => row.origin === 'app' ? 'App' : row.origin === 'manual' ? 'Manual' : 'Online' },
    { key: 'created_at', label: 'Cadastro', sortable: true, render: (row) => formatDateBR(row.created_at) },
    { key: 'birth_date', label: 'Aniversário', render: (row) => row.birth_date ? formatDateBR(row.birth_date) : '-' }
  ], [])

  const crmCustomerColumns = useMemo(() => [
    ...customerColumns,
    { key: 'crm_score', label: 'CRM Score', render: (row) => row.crm_score != null ? (
      <span style={{ fontWeight: 600, color: row.crm_score > 50 ? 'var(--pm-primary)' : 'var(--pm-text)' }}>{row.crm_score}</span>
    ) : '-' },
    { key: 'loyalty_level', label: 'Fidelidade', render: (row) => {
      if (!row.loyalty_level) return '-'
      const colors = { novo: 'var(--pm-text-muted)', regular: 'var(--pm-gold)', fiel: 'var(--pm-primary)', vip: 'var(--pm-primary)' }
      const labels = { novo: 'Novo', regular: 'Regular', fiel: 'Fiel', vip: 'VIP' }
      return (
        <PremiumBadge
          status={row.loyalty_level === 'vip' ? 'success' : row.loyalty_level === 'fiel' ? 'active' : 'default'}
          label={labels[row.loyalty_level] || row.loyalty_level}
          size="sm"
        />
      )
    }},
  ], [customerColumns])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function handleFilterChange(key, value) {
    if (key === 'status') setStatusFilter(value)
  }

  const activeTabIndex = DASHBOARD_TABS.findIndex(t => t.id === activeTab)

  if (variant === 'crm') {
    return (
      <section className="crm-dashboard">
        <div className="crm-hero">
          <div>
            <span className="barber-overline">CRM • Relacionamento</span>
            <h1>Histórico e CRM</h1>
            <p>Acompanhe o desempenho da barbearia com métricas completas de clientes e relacionamento.</p>
          </div>
        </div>

        <div className="crm-summary-toolbar">
          <div className="crm-summary-period">
            <button
              className={`crm-summary-period-btn ${summaryPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setSummaryPeriod('month')}
            >Este mês</button>
            <button
              className={`crm-summary-period-btn ${summaryPeriod === 'last_month' ? 'active' : ''}`}
              onClick={() => setSummaryPeriod('last_month')}
            >Mês passado</button>
            <button
              className={`crm-summary-period-btn ${summaryPeriod === 'year' ? 'active' : ''}`}
              onClick={() => setSummaryPeriod('year')}
            >Este ano</button>
          </div>
        </div>

        <div className="crm-metrics-grid">
          <PremiumMetricCard
            label="Atendimentos no mês"
            value={crmSummaryLoading ? '...' : (crmSummary?.atendimentos_no_mes ?? '—')}
            subtitle="Agendamentos concluídos"
            variant="default"
          />
          <PremiumMetricCard
            label="Ticket médio"
            value={crmSummaryLoading ? '...' : (crmSummary?.ticket_medio && crmSummary.ticket_medio !== '0' ? formatCurrency(crmSummary.ticket_medio) : '—')}
            subtitle="Valor médio por venda"
            variant="default"
          />
          <PremiumMetricCard
            label="Clientes ativos"
            value={crmSummaryLoading ? '...' : (crmSummary?.clientes_ativos ?? '—')}
            subtitle="Com acesso liberado"
            variant="success"
          />
          <PremiumMetricCard
            label="Taxa de retorno"
            value={crmSummaryLoading ? '...' : (crmSummary?.taxa_retorno != null ? `${crmSummary.taxa_retorno}%` : '—')}
            subtitle="Clientes com mais de 1 visita"
            variant="default"
          />
          <PremiumMetricCard
            label="Receita no mês"
            value={crmSummaryLoading ? '...' : (crmSummary?.receita_no_mes && crmSummary.receita_no_mes !== '0' ? formatCurrency(crmSummary.receita_no_mes) : '—')}
            subtitle="Faturamento bruto"
            variant="default"
          />
        </div>

        <PremiumTabs tabs={CRM_TABS} active={crmTab} onChange={setCrmTab} />

        {crmTab === 'overview' && (
          <div className="crm-tab-content">
            <div className="crm-overview-grid">
              <div className="crm-overview-card">
                <h4>Base de clientes</h4>
                <div className="crm-overview-stats">
                  <div className="crm-overview-stat">
                    <strong>{crmSummary?.total_clientes ?? totalCustomers}</strong>
                    <span>Total</span>
                  </div>
                  <div className="crm-overview-stat">
                    <strong>{crmSummary?.clientes_ativos ?? activeCount}</strong>
                    <span>Ativos</span>
                  </div>
                  <div className="crm-overview-stat">
                    <strong>{crmSummary?.clientes_pendentes ?? pendingCount}</strong>
                    <span>Pendentes</span>
                  </div>
                  <div className="crm-overview-stat">
                    <strong>{crmSummary?.clientes_bloqueados ?? blockedCount}</strong>
                    <span>Bloqueados</span>
                  </div>
                </div>
              </div>
              <div className="crm-overview-card">
                <h4>Fidelidade</h4>
                <div className="crm-overview-stats">
                  <div className="crm-overview-stat">
                    <strong>{(crmSummary?.clientes_vip ?? 0) + (crmSummary?.clientes_fieis ?? 0)}</strong>
                    <span>VIP / Fiel</span>
                  </div>
                  <div className="crm-overview-stat">
                    <strong>{crmSummary?.clientes_novos_mes ?? isBirthdayMonth}</strong>
                    <span>Novos (mês)</span>
                  </div>
                  <div className="crm-overview-stat">
                    <strong>{crmSummary?.clientes_inativos ?? 0}</strong>
                    <span>Inativos</span>
                  </div>
                  <div className="crm-overview-stat">
                    <strong>{crmSummary?.taxa_retorno != null ? `${crmSummary.taxa_retorno}%` : '—'}</strong>
                    <span>Taxa de retorno</span>
                  </div>
                </div>
              </div>
            </div>
            {customers.length > 0 && (
              <div className="crm-recent-section">
                <h4>Clientes recentes</h4>
                <div className="crm-recent-list">
                  {sortedCustomers.slice(0, 5).map(c => (
                    <div key={c.id} className="crm-recent-item" onClick={() => setSelectedCustomer(c)}>
                      <div className="crm-name-avatar">{(c.name || '?').slice(0, 2).toUpperCase()}</div>
                      <div className="crm-recent-info">
                        <strong>{c.name || 'Sem nome'}</strong>
                        <span>{c.email || c.phone || '-'}</span>
                      </div>
                      <PremiumBadge status={c.status || 'pending'} label={statusLabel[c.status] || c.status || '-'} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {crmTab === 'customers' && (
          <div>
            <div className="crm-toolbar">
              <PremiumFilterBar
                search={search}
                onSearchChange={setSearch}
                placeholder="Buscar por nome, telefone ou e-mail..."
                filters={[
                  { key: 'status', value: statusFilter, options: statusFilterOptions }
                ]}
                onFilterChange={handleFilterChange}
                actions={
                  <PremiumButton variant="primary" size="sm" icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  } onClick={() => {}}>
                    Novo cliente
                  </PremiumButton>
                }
              />
            </div>

            {loading ? (
              <PremiumLoadingSkeleton rows={6} type="table" />
            ) : sortedCustomers.length === 0 ? (
              <PremiumEmptyState
                title="Nenhum cliente encontrado"
                description="Nenhum cliente corresponde aos filtros atuais."
              />
            ) : (
              <PremiumTable
                columns={crmCustomerColumns}
                rows={sortedCustomers}
                onRowClick={(row) => setSelectedCustomer(row)}
                onColumnSort={handleSort}
                sortKey={sortKey}
                sortDir={sortDir}
              />
            )}
          </div>
        )}

        {crmTab === 'appointments' && (
          <div className="crm-tab-placeholder">
            <div className="crm-tab-placeholder-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h5>Agendamentos</h5>
            <p>Aqui você verá o histórico completo de agendamentos dos clientes, incluindo comparecimentos, cancelamentos e no-shows. Esta visão será conectada aos dados reais do CRM.</p>
          </div>
        )}

        {crmTab === 'financial' && (
          <div className="crm-tab-placeholder">
            <div className="crm-tab-placeholder-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <h5>Financeiro</h5>
            <p>Aqui você verá o resumo financeiro dos clientes: ticket médio, receita gerada, formas de pagamento mais utilizadas e análise de rentabilidade. Esta visão será conectada aos dados reais do CRM.</p>
          </div>
        )}

        <CustomerSidePanel
          customer={selectedCustomer}
          open={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      </section>
    )
  }

  if (variant === 'vip') {
    const vipFiltered = customers.filter(c => c.loyalty_level === 'vip' || c.loyalty_level === 'fiel')
    return (
      <section className="crm-dashboard">
        <div className="crm-hero">
          <div>
            <span className="barber-overline">CRM • Fidelidade</span>
            <h1>Clientes VIP / Fidelidade</h1>
            <p>Clientes classificados como Fiel ou VIP com base nas métricas de fidelidade do CRM.</p>
          </div>
        </div>

        <div className="crm-metrics">
          <PremiumMetricCard label="Clientes VIP/Fiel" value={vipFiltered.length} subtitle="Total de clientes premium" variant="success" />
          <PremiumMetricCard label="Clientes VIP" value={customers.filter(c => c.loyalty_level === 'vip').length} subtitle="Maior pontuação de fidelidade" variant="default" />
          <PremiumMetricCard label="Clientes Fiel" value={customers.filter(c => c.loyalty_level === 'fiel').length} subtitle="Alta recorrência" variant="default" />
        </div>

        {loading ? (
          <PremiumLoadingSkeleton rows={6} type="table" />
        ) : vipFiltered.length === 0 ? (
          <PremiumEmptyState
            title="Nenhum cliente VIP encontrado"
            description="Clientes com alta recorrência de visitas serão classificados como Fiel (10+) e VIP (20+). Os dados serão atualizados conforme o uso do CRM."
          />
        ) : (
          <PremiumTable
            columns={crmCustomerColumns}
            rows={vipFiltered}
            onRowClick={(row) => setSelectedCustomer(row)}
            onColumnSort={handleSort}
            sortKey={sortKey}
            sortDir={sortDir}
          />
        )}

        <CustomerSidePanel
          customer={selectedCustomer}
          open={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      </section>
    )
  }

  return (
    <section className="crm-dashboard">
      <div className="crm-hero">
        <div>
          <span className="barber-overline">CRM • Relacionamento</span>
          <h1>Dashboard de Clientes</h1>
          <p>Visão completa da base de clientes, agendamentos e relacionamento.</p>
        </div>
      </div>

      <div className="crm-metrics">
        <PremiumMetricCard label="Total de clientes" value={totalCustomers} subtitle="Base cadastrada" variant="default" />
        <PremiumMetricCard label="Clientes ativos" value={activeCount} subtitle="Com acesso liberado" variant="success" />
        <PremiumMetricCard label="Pendentes" value={pendingCount} subtitle="Aguardando confirmação" variant="warning" />
      </div>

      <PremiumTabs tabs={DASHBOARD_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'aniversariantes' && activeTabIndex >= 0 && (
        <div className="crm-birthday-banner">
          Clientes que fazem aniversário hoje ({new Date().toLocaleDateString('pt-BR')})
        </div>
      )}

      <div className="crm-toolbar">
        <PremiumFilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Buscar por nome, telefone ou e-mail..."
          filters={[
            { key: 'status', value: statusFilter, options: statusFilterOptions }
          ]}
          onFilterChange={handleFilterChange}
          actions={
            <PremiumButton variant="primary" size="sm" icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            } onClick={() => {}}>
              Novo cliente
            </PremiumButton>
          }
        />
      </div>

      {loading ? (
        <PremiumLoadingSkeleton rows={6} type="table" />
      ) : sortedCustomers.length === 0 ? (
        <PremiumEmptyState
          title="Nenhum cliente encontrado"
          description="Nenhum cliente corresponde aos filtros atuais. Tente ajustar a busca ou os filtros."
        />
      ) : (
        <PremiumTable
          columns={customerColumns}
          rows={sortedCustomers}
          onRowClick={(row) => setSelectedCustomer(row)}
          onColumnSort={handleSort}
          sortKey={sortKey}
          sortDir={sortDir}
        />
      )}

      <CustomerSidePanel
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </section>
  )
}

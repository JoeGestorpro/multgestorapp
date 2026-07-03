import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import { ChartCard, ChartTooltip } from '../../../components/design-system'
import CollaboratorMobileDashboard from '../../../components/barber/CollaboratorMobileDashboard'
import { TrendingUp, DollarSign, Repeat, Percent, Users, Clock, AlertCircle, Link, Plus, CreditCard, Calendar, Eye, CalendarCheck, Landmark } from 'lucide-react'
import { money, fullDate, shortDate } from '../utils/formatters'
import { getPaymentMethodTone, getPaymentMethodLabel } from '../../../utils/paymentMethods'
import BarberOverviewPage from '../dashboard/BarberOverviewPage'

function paymentTone(method) {
  return getPaymentMethodTone(method)
}

function paymentLabel(method) {
  return getPaymentMethodLabel(method)
}

function StatCard({ icon: Icon, label, value, detail, glow, compact }) {
  const glowMap = {
    green: 'var(--success)',
    blue: 'var(--accent-primary)',
    gold: 'var(--warning)',
    red: 'var(--danger)'
  }
  return (
    <article className={`ds-stat-card ${compact ? 'ds-stat-card--compact' : ''}`}>
      <div className="ds-stat-card__header">
        {Icon && (
          <div className="ds-stat-card__icon" style={{ color: glowMap[glow] || 'var(--text-muted)' }}>
            <Icon size={20} />
          </div>
        )}
        <span className="ds-stat-card__label">{label}</span>
      </div>
      <strong className="ds-stat-card__value">{value}</strong>
      {detail && <p className="ds-stat-card__detail">{detail}</p>}
    </article>
  )
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="ds-chart-empty">
      {Icon && (
        <div className="ds-chart-empty__icon">
          <Icon size={48} />
        </div>
      )}
      <h3 className="ds-chart-empty__title">{title}</h3>
      {description && <p className="ds-chart-empty__description">{description}</p>}
    </div>
  )
}

function getStatusLabel(s) {
  return { scheduled: 'Agendado', confirmed: 'Confirmado', arrived: 'Chegou', in_progress: 'Em andamento', completed: 'Concluído', canceled: 'Cancelado', no_show: 'Falta' }[s] || s
}

function getStatusTone(s) {
  return { scheduled: 'info', confirmed: 'primary', arrived: 'warning', in_progress: 'success', completed: 'success', canceled: 'danger', no_show: 'danger' }[s] || 'info'
}

function AdminDashboardContent({
  dashboard,
  todaySalesCount,
  ranking: _ranking,
  topCollaborator: _topCollaborator,
  salesChartData,
  visibleCollaboratorSummary: _visibleCollaboratorSummary,
  collaborators,
  user,
  appointmentsOverview,
  onNewSale,
  onCopyLink
}) {
  const navigate = useNavigate()
  const cashSession = dashboard.cashSession
  const cashBalance = cashSession?.current_balance ?? 0
  const cashStatus = cashSession?.status
  const isCashOpen = cashStatus === 'open'
  const appointmentsToday = appointmentsOverview?.summary?.appointments_today ?? 0

  const upcomingAppointments = (appointmentsOverview?.appointments || [])
    .filter((a) => a.status === 'scheduled' || a.status === 'confirmed')
  const upcomingCount = upcomingAppointments.length

  const now = new Date()
  const hour = now.getHours()
  const _minute = now.getMinutes()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const todayStr = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(now)
  const ticketMedio = todaySalesCount > 0 ? dashboard.totalDaySales / todaySalesCount : 0
  const activeCollaboratorsCount = (collaborators || []).filter((c) => c.is_active && !c.is_deleted).length
  const totalAppointmentsToday = appointmentsOverview?.summary?.appointments_today ?? 0
  const occupancyRate = totalAppointmentsToday > 0
    ? Math.round(((todaySalesCount || 0) / Math.max(totalAppointmentsToday, 1)) * 100)
    : 0

  const volume = todaySalesCount || 0
  let operationalPhrase = ''
  if (volume === 0 && hour < 12) operationalPhrase = 'O dia está começando — hora de aquecer!'
  else if (volume === 0) operationalPhrase = 'Ainda sem movimentação hoje. Vamos mudar isso?'
  else if (volume <= 3) operationalPhrase = 'Movimento leve por enquanto. Ótimo para organizar a agenda.'
  else if (volume <= 8) operationalPhrase = 'Bom ritmo! A casa está aquecendo.'
  else if (volume <= 15) operationalPhrase = 'Dia cheio! Sua equipe está mandando bem.'
  else operationalPhrase = 'Dia de alta demanda! Produção a todo vapor.'

  const closingHour = 20
  const remainingHours = Math.max(0, closingHour - hour)
  const _remainingLabel = remainingHours > 0
    ? `${remainingHours}h de operação`
    : 'Operação encerrada'

  const occupancyLabel = occupancyRate >= 80 ? 'Alta'
    : occupancyRate >= 50 ? 'Média'
    : 'Baixa'

  const collaboratorsWithSales = new Set(
    (dashboard.recentSales || []).map((s) => s.collaborator_id)
  )
  const teamInService = (collaborators || []).filter(
    (c) => c.is_active && !c.is_deleted && collaboratorsWithSales.has(c.id)
  ).length

  const paymentMethodKey = { Dinheiro: 'Cash', Pix: 'Pix', 'Cartão Crédito': 'Credit', 'Cartão Débito': 'Debit', Permutas: 'Permuta' }

  const paymentCards = [
    { label: 'Dinheiro', value: money(dashboard.totalCash), glow: 'gold', icon: DollarSign },
    { label: 'Pix', value: money(dashboard.totalPix), glow: 'blue', icon: TrendingUp },
    { label: 'Cartão Crédito', value: money(dashboard.totalCredit), glow: 'blue', icon: CreditCard },
    { label: 'Cartão Débito', value: money(dashboard.totalDebit), glow: 'green', icon: CreditCard },
    { label: 'Permutas', value: money(dashboard.totalPermuta), glow: 'red', icon: Repeat }
  ]

  const paymentCardsWithValue = paymentCards.filter((c) => {
    const key = `total${paymentMethodKey[c.label]}`
    return Number(dashboard[key] || 0) > 0
  })

  const upcomingList = upcomingAppointments.slice(0, 5)

  function fmtTime(d) {
    if (!d) return '--:--'
    try { return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(d)) } catch { return '--:--' }
  }

  const alerts = []
  if (appointmentsToday === 0 && todaySalesCount === 0) {
    alerts.push({ icon: AlertCircle, title: 'Nenhum movimento hoje', description: 'Ainda não há agendamentos ou atendimentos registrados para hoje.', tone: 'warning' })
  }
  if (!appointmentsOverview?.public_booking_path) {
    alerts.push({ icon: Link, title: 'Link público não configurado', description: 'Configure o link de agendamento online para receber clientes automaticamente.', tone: 'info' })
  }

  return (
    <div className="dashboard-admin">
      {/* ==============================
          HERO — Saudação + Ops + Ações
          ============================== */}
      <section className="dashboard-hero">
        <div className="dashboard-hero__header">
          <div className="dashboard-hero__header-left">
            <span className="dashboard-hero__overline">{user?.company_name || 'Barbearia'} &middot; {todayStr}</span>
            <h2 className="dashboard-hero__title">{greeting}, {user?.name?.split(' ')[0] || 'admin'}!</h2>
            <p className="dashboard-hero__subtitle">{operationalPhrase}</p>
            <div className="dashboard-hero__ticket">
              <small>Ticket médio</small>
              <strong>{money(ticketMedio)}</strong>
            </div>
          </div>
          <div className="dashboard-hero__header-right">
            <div className="dashboard-hero__ops-card">
              <div className="dashboard-hero__ops-item">
                <small>Caixa</small>
                <span className={isCashOpen ? 'text-green' : 'text-red'}>
                  {isCashOpen ? 'Aberto' : 'Fechado'}
                </span>
                <strong>{money(cashBalance)}</strong>
              </div>
              <div className="dashboard-hero__ops-item">
                <small>Atendimentos</small>
                <strong>{todaySalesCount}</strong>
                <span>hoje</span>
              </div>
              <div className="dashboard-hero__ops-item">
                <small>Equipe</small>
                <strong>{activeCollaboratorsCount}</strong>
                <span>ativos</span>
              </div>
              <div className="dashboard-hero__ops-item">
                <small>Ocupação</small>
                <strong>{occupancyRate}%</strong>
                <span>{occupancyLabel}</span>
              </div>
            </div>
            <div className="dashboard-hero__actions">
              <button className="ds-button ds-button--primary" onClick={onNewSale} type="button">
                <Plus size={16} />
                <span>Novo atendimento</span>
              </button>
              <button className="ds-button ds-button--primary" onClick={() => navigate('/barber/agenda')} type="button">
                <Calendar size={16} />
                <span>Novo agendamento</span>
              </button>
              <button className="ds-button ds-button--ghost" onClick={() => navigate('/barber/agenda')} type="button">
                <Eye size={16} />
                <span>Ver agenda</span>
              </button>
              {appointmentsOverview?.public_booking_path && (
                <button className="ds-button ds-button--ghost" onClick={onCopyLink} type="button">
                  <Link size={16} />
                  <span>Copiar link</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
          COMO ESTÁ O DIA HOJE?
          ============================== */}
      <section className="dashboard-day-status">
        <div className="dashboard-day-status__header">
          <TrendingUp size={18} />
          <span>Como está o dia hoje?</span>
        </div>
        <div className="dashboard-day-status__hero">
          <span className="dashboard-day-status__hero-label">Hoje sua equipe já faturou</span>
          <strong className="dashboard-day-status__hero-value">{money(dashboard.totalDaySales)}</strong>
          <span className="dashboard-day-status__hero-meta">
            {todaySalesCount} atendimento{todaySalesCount !== 1 ? 's' : ''}
            {todaySalesCount > 0 ? ` · R$ ${Number(ticketMedio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ticket médio` : ''}
          </span>
        </div>
        <div className="dashboard-day-status__grid">
          <div className="dashboard-day-status__metric">
            <div className="dashboard-day-status__metric-icon" style={{ color: 'var(--success)' }}>
              <DollarSign size={16} />
            </div>
            <div className="dashboard-day-status__metric-content">
              <span className="dashboard-day-status__metric-label">Caixa</span>
              <strong className="dashboard-day-status__metric-value">{money(cashBalance)}</strong>
              <span className={`dashboard-day-status__metric-badge ${isCashOpen ? 'badge-open' : 'badge-closed'}`}>
                {isCashOpen ? 'Aberto' : 'Fechado'}
              </span>
            </div>
          </div>
          <div className="dashboard-day-status__metric">
            <div className="dashboard-day-status__metric-icon" style={{ color: 'var(--warning)' }}>
              <Percent size={16} />
            </div>
            <div className="dashboard-day-status__metric-content">
              <span className="dashboard-day-status__metric-label">Ocupação</span>
              <strong className="dashboard-day-status__metric-value">{occupancyRate}%</strong>
              <span className="dashboard-day-status__metric-badge badge-soft">{occupancyLabel}</span>
            </div>
          </div>
          <div className="dashboard-day-status__metric">
            <div className="dashboard-day-status__metric-icon" style={{ color: 'var(--accent-primary)' }}>
              <TrendingUp size={16} />
            </div>
            <div className="dashboard-day-status__metric-content">
              <span className="dashboard-day-status__metric-label">Comissão</span>
              <strong className="dashboard-day-status__metric-value">{money(dashboard.totalCommissions)}</strong>
              <span className="dashboard-day-status__metric-badge badge-soft">gerada</span>
            </div>
          </div>
          <div className="dashboard-day-status__metric">
            <div className="dashboard-day-status__metric-icon" style={{ color: 'var(--info)' }}>
              <Users size={16} />
            </div>
            <div className="dashboard-day-status__metric-content">
              <span className="dashboard-day-status__metric-label">Equipe</span>
              <strong className="dashboard-day-status__metric-value">{teamInService}/{activeCollaboratorsCount}</strong>
              <span className="dashboard-day-status__metric-badge badge-soft">em serviço</span>
            </div>
          </div>
          <div className="dashboard-day-status__metric">
            <div className="dashboard-day-status__metric-icon" style={{ color: 'var(--text-muted)' }}>
              <Clock size={16} />
            </div>
            <div className="dashboard-day-status__metric-content">
              <span className="dashboard-day-status__metric-label">Operação</span>
              <strong className="dashboard-day-status__metric-value">{remainingHours}h</strong>
              <span className="dashboard-day-status__metric-badge badge-soft">restantes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
          PRÓXIMOS CLIENTES
          ============================== */}
      <section className="dashboard-clients">
        <div className="dashboard-section__title-row">
          <CalendarCheck size={18} />
          <h3>Próximos clientes</h3>
          {upcomingCount > 0 && <span className="dashboard-section__badge">{upcomingCount} pendente{upcomingCount !== 1 ? 's' : ''}</span>}
        </div>
        {upcomingList.length > 0 ? (
          <div className="ds-activity-list">
            {upcomingList.map((a) => (
              <div className="ds-client-card" key={a.id || a.starts_at}>
                <div className="ds-client-card__time">
                  <strong>{fmtTime(a.starts_at)}</strong>
                </div>
                <div className="ds-activity-item__avatar">
                  {(a.customer_name || a.client_name || '?').slice(0, 1)}
                </div>
                <div className="ds-activity-item__content">
                  <div className="ds-activity-item__title">{a.customer_name || a.client_name || 'Cliente'}</div>
                  <div className="ds-activity-item__meta">
                    {a.service_name || 'Serviço'} &middot; {a.collaborator_name || a.collaborator_nickname || 'Profissional'}
                  </div>
                </div>
                <span className={`ds-activity-item__badge ds-chart-stat__badge--${getStatusTone(a.status)}`}>
                  {getStatusLabel(a.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="dashboard-empty-note">Nenhum agendamento pendente para hoje.</p>
        )}
      </section>

      {/* ==============================
          MOVIMENTO FINANCEIRO
          ============================== */}
      <section className="dashboard-grid-two">
        <div className="dashboard-section">
          <ChartCard
            title="Faturamento por dia"
            subtitle="Últimos 7 dias"
            badge="Receita"
            badgeVariant="cash"
            value={money(salesChartData.reduce((sum, item) => sum + item.total, 0))}
          >
            {salesChartData.length > 0 ? (
              <div style={{ width: '100%', minHeight: 240, height: 240 }}>
                <ResponsiveContainer debounce={50} height="100%" minHeight={240} minWidth={260} width="100%">
                  <BarChart data={salesChartData}>
                    <defs>
                      <linearGradient id="barberSalesGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="var(--success)" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border-subtle)" vertical={false} strokeDasharray="0" />
                    <XAxis
                      dataKey="label"
                      stroke="var(--text-muted)"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      width={60}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="total" fill="url(#barberSalesGradient)" radius={[8, 8, 4, 4]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="Sem dados para o gráfico" description="As vendas dos últimos dias aparecerão aqui." />
            )}
          </ChartCard>
        </div>

        <div className="dashboard-section">
          <ChartCard
            title="Recebimentos do dia"
            subtitle="Formas de pagamento"
            badge={`${paymentCardsWithValue.length} métodos`}
            badgeVariant="info"
          >
            {paymentCardsWithValue.length > 0 ? (
              <div className="ds-payment-list">
                {paymentCardsWithValue.map((card) => (
                  <div className="ds-payment-item" key={card.label}>
                    <div className="ds-payment-item__icon" style={{ color: `var(--${card.glow === 'gold' ? 'warning' : card.glow === 'red' ? 'danger' : card.glow === 'green' ? 'success' : 'accent-primary'})` }}>
                      <card.icon size={18} />
                    </div>
                    <div className="ds-payment-item__content">
                      <span className="ds-payment-item__label">{card.label}</span>
                      <strong className="ds-payment-item__value">{card.value}</strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dashboard-empty-note">Nenhum recebimento registrado hoje</p>
            )}
          </ChartCard>
        </div>
      </section>

      {/* ==============================
          EQUIPE EM ATIVIDADE
          ============================== */}
      <section className="dashboard-grid-two">
        <div className="dashboard-section">
          <ChartCard
            title="Equipe em atividade"
            subtitle="Colaboradores disponíveis hoje"
            badge={`${activeCollaboratorsCount} ativos`}
            badgeVariant="info"
          >
            {activeCollaboratorsCount > 0 ? (
              <div className="ds-activity-list">
                {(collaborators || []).filter((c) => c.is_active && !c.is_deleted).slice(0, 8).map((collab) => (
                  <div className="ds-team-item" key={collab.id}>
                    <div className="ds-activity-item__avatar">
                      {(collab.name || collab.nickname || 'C').slice(0, 1)}
                    </div>
                    <div className="ds-activity-item__content">
                      <div className="ds-activity-item__title">{collab.name || collab.nickname || 'Colaborador'}</div>
                      <div className="ds-activity-item__meta">
                        {collab.can_launch_sales ? 'Pode lançar vendas' : 'Apenas agenda'}
                      </div>
                    </div>
                    {collab.can_launch_sales && (
                      <span className="ds-team-item__indicator" title="Em atividade" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="Sem colaboradores" description="Cadastre colaboradores para aparecerem aqui." />
            )}
          </ChartCard>
        </div>

        <div className="dashboard-section">
          <ChartCard
            title="Últimas vendas"
            subtitle="Atividades mais recentes"
            badge={`${dashboard.recentSales.length} registros`}
            badgeVariant="info"
          >
            {dashboard.recentSales.length > 0 ? (
              <div className="ds-activity-list">
                {dashboard.recentSales.map((sale, idx) => (
                  <div className="ds-activity-item" key={sale?.id || `sale-${idx}`}>
                    <div className="ds-activity-item__avatar">
                      {(sale.collaborator_name || 'S').slice(0, 1)}
                    </div>
                    <div className="ds-activity-item__content">
                      <div className="ds-activity-item__title">{sale.collaborator_name || 'Sem colaborador'}</div>
                      <div className="ds-activity-item__meta">{paymentLabel(sale.payment_method)} &middot; {fullDate(sale.created_at)}</div>
                    </div>
                    <div className="ds-activity-item__value">
                      <span className="ds-activity-item__amount">{money(sale.total_amount)}</span>
                      <span className={`ds-activity-item__badge ds-chart-stat__badge--${paymentTone(sale.payment_method)}`}>
                        {paymentLabel(sale.payment_method)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Sem atividades recentes" description="Assim que novas vendas entrarem, aparecerão aqui." />
            )}
          </ChartCard>
        </div>
      </section>

      {/* ==============================
          ALERTAS OPERACIONAIS
          ============================== */}
      {alerts.length > 0 && (
        <section className="dashboard-alerts">
          <div className="dashboard-section__title-row">
            <AlertCircle size={18} />
            <h3>Alertas operacionais</h3>
          </div>
          <div className="dashboard-alerts__grid">
            {alerts.map((a, i) => (
              <div className="ds-alert-card" key={i}>
                <div className="ds-alert-card__icon">
                  <a.icon size={20} />
                </div>
                <div className="ds-alert-card__content">
                  <strong className="ds-alert-card__title">{a.title}</strong>
                  <p className="ds-alert-card__desc">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function CollaboratorDashboardContent({
  collaboratorMetrics,
  collaboratorRecentAttendances,
  advances,
  user,
  buildEmptySaleForm,
  loggedInCollaboratorId,
  setSaleForm,
  setSaleModalOpen
}) {
  const firstName = user?.name ? user.name.split(' ')[0] : 'colaborador'
  const collaboratorTodayCommission = collaboratorMetrics.today?.commission ?? collaboratorMetrics.todayCommission ?? 0
  const collaboratorTodayBarterTotal = collaboratorMetrics.today?.barterTotal ?? collaboratorMetrics.todayBarterTotal ?? 0
  const _collaboratorTodayBarterCommission = collaboratorMetrics.today?.barterCommission ?? collaboratorMetrics.todayBarterCommission ?? 0
  const collaboratorWeekCommission = collaboratorMetrics.week?.commission ?? collaboratorMetrics.weekCommission ?? 0
  const collaboratorMonthCommission = collaboratorMetrics.month?.commission ?? collaboratorMetrics.monthCommission ?? 0
  const collaboratorTodayAttendances = collaboratorMetrics.today?.appointments ?? collaboratorMetrics.todayAttendances ?? 0
  const _collaboratorMonthAttendances = collaboratorMetrics.month?.appointments ?? collaboratorMetrics.monthAttendances ?? 0
  const collaboratorNetBalance = collaboratorMetrics.mySettlementBalance || collaboratorMetrics.netCommission || 0
  const pendingAdvancesCount = advances.filter((advance) => advance.status === 'pending').length

  const metricsCards = [
    {
      icon: TrendingUp,
      label: 'Comissão do dia',
      value: money(collaboratorTodayCommission),
      detail: 'Atendimentos que você lançou hoje',
      glow: 'green'
    },
    {
      icon: CalendarCheck,
      label: 'Atendimentos hoje',
      value: `${collaboratorTodayAttendances}`,
      detail: 'Registros vinculados ao seu usuário',
      glow: 'blue'
    },
    {
      icon: Repeat,
      label: 'Permutas hoje',
      value: money(collaboratorTodayBarterTotal),
      detail: 'Valor cheio lançado como permuta',
      glow: 'red'
    },
    {
      icon: Percent,
      label: 'Comissão da semana',
      value: money(collaboratorWeekCommission),
      detail: 'Acumulado nos últimos 7 dias',
      glow: 'green'
    },
    {
      icon: Landmark,
      label: 'Comissão do mês',
      value: money(collaboratorMonthCommission),
      detail: 'Acumulado no mês',
      glow: 'gold'
    },
    {
      icon: DollarSign,
      label: 'Saldo líquido',
      value: money(collaboratorNetBalance),
      detail: `${pendingAdvancesCount} vale(s) pendente(s)`,
      glow: Number(collaboratorNetBalance) < 0 ? 'red' : 'green'
    }
  ]

  return (
    <div className="dashboard-collaborator">
      <section className="dashboard-hero">
        <div className="dashboard-hero__header">
          <div>
            <span className="dashboard-hero__overline">BarberGestor Colaborador</span>
            <h2 className="dashboard-hero__title">Olá, {firstName}</h2>
            <p className="dashboard-hero__subtitle">
              Sua produção e comissão em tempo real — sem expor valores da barbearia.
            </p>
          </div>
          {user?.can_launch_sales && (
            <div className="dashboard-hero__actions">
              <button
                className="ds-button ds-button--primary"
                onClick={() => {
                  setSaleForm(buildEmptySaleForm(loggedInCollaboratorId))
                  setSaleModalOpen(true)
                }}
                type="button"
              >
                <Plus size={16} />
                <span>Novo atendimento</span>
              </button>
            </div>
          )}
        </div>

        <div className="dashboard-hero__stats">
          <div className="dashboard-hero__stat">
            <small>Atendimentos hoje</small>
            <strong>{collaboratorTodayAttendances}</strong>
          </div>
          <div className="dashboard-hero__stat">
            <small>Comissão hoje</small>
            <strong>{money(collaboratorTodayCommission)}</strong>
          </div>
          <div className="dashboard-hero__stat">
            <small>Saldo líquido</small>
            <strong>{money(collaboratorNetBalance)}</strong>
          </div>
          <div className="dashboard-hero__stat">
            <small>Vales pendentes</small>
            <strong>{pendingAdvancesCount}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-metrics">
        <div className="dashboard-metrics__grid">
          {metricsCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <section className="dashboard-double">
        <section className="dashboard-section">
          <ChartCard
            title="Meus atendimentos recentes"
            subtitle="Histórico pessoal"
            badge={`${collaboratorRecentAttendances.length} registros`}
            badgeVariant="pix"
          >
            {collaboratorRecentAttendances.length > 0 ? (
              <div className="ds-activity-list">
                {collaboratorRecentAttendances.map((sale) => (
                  <div className="ds-activity-item" key={sale.id}>
                    <div className="ds-activity-item__avatar">
                      {(sale.service_name || 'A').slice(0, 1)}
                    </div>
                    <div className="ds-activity-item__content">
                      <div className="ds-activity-item__title">{sale.service_name || 'Atendimento registrado'}</div>
                      <div className="ds-activity-item__meta">{paymentLabel(sale.payment_method)} &middot; {fullDate(sale.created_at)}</div>
                    </div>
                    <div className="ds-activity-item__value">
                      <span className="ds-activity-item__amount">
                        {sale.commission_effect === 'debit'
                          ? money(-Math.abs(Number(sale.commission_amount || 0)))
                          : money(sale.commission_amount || 0)}
                      </span>
                      <span className={`ds-activity-item__badge ds-chart-stat__badge--${paymentTone(sale.payment_method)}`}>
                        {sale.commission_effect === 'debit' ? 'Permuta' : 'Comissão'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhum atendimento" description="Seus atendimentos registrados aparecerão aqui." />
            )}
          </ChartCard>
        </section>

        <section className="dashboard-section">
          <ChartCard
            title="Meus vales"
            subtitle="Vales pendentes"
            badge={`${advances.filter((a) => a.status === 'pending').length} pendentes`}
            badgeVariant="info"
          >
            {advances.filter((a) => a.status === 'pending').length > 0 ? (
              <div className="ds-activity-list">
                {advances.filter((a) => a.status === 'pending').slice(0, 5).map((adv) => (
                  <div className="ds-activity-item" key={adv.id}>
                    <div className="ds-activity-item__avatar">V</div>
                    <div className="ds-activity-item__content">
                      <div className="ds-activity-item__title">Vale de {money(adv.amount || 0)}</div>
                      <div className="ds-activity-item__meta">{adv.created_at ? shortDate(adv.created_at) : ''}</div>
                    </div>
                    <span className="ds-activity-item__badge ds-chart-stat__badge--warning">Pendente</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhum vale pendente" description="Todos os seus vales estão quitados." />
            )}
          </ChartCard>
        </section>
      </section>
    </div>
  )
}

export default function DashboardView({
  isAdmin,
  isMobileViewport,
  advances,
  collaboratorMetrics,
  collaboratorRecentAttendances,
  user,
  setSaleForm,
  buildEmptySaleForm,
  loggedInCollaboratorId,
  setSaleModalOpen
}) {
  if (!isAdmin) {
    if (isMobileViewport) {
      return (
        <CollaboratorMobileDashboard
          advances={advances}
          canLaunchSales={Boolean(user?.can_launch_sales)}
          fullDate={fullDate}
          metrics={collaboratorMetrics}
          money={money}
          onOpenSale={() => {
            setSaleForm(buildEmptySaleForm(loggedInCollaboratorId))
            setSaleModalOpen(true)
          }}
          recentAttendances={collaboratorRecentAttendances}
          user={user}
        />
      )
    }

    return (
      <CollaboratorDashboardContent
        collaboratorMetrics={collaboratorMetrics}
        collaboratorRecentAttendances={collaboratorRecentAttendances}
        advances={advances}
        user={user}
        buildEmptySaleForm={buildEmptySaleForm}
        loggedInCollaboratorId={loggedInCollaboratorId}
        setSaleForm={setSaleForm}
        setSaleModalOpen={setSaleModalOpen}
      />
    )
  }

  return (
    <BarberOverviewPage
      user={user}
      onNewSale={() => {
        setSaleForm(buildEmptySaleForm(loggedInCollaboratorId))
        setSaleModalOpen(true)
      }}
    />
  )
}

import {
  BarberBadge,
  BarberButton,
  BarberCard,
  BarberEmptyState,
  BarberIcon
} from './BarberUI'

function CollaboratorMobileDashboard({
  advances,
  canLaunchSales,
  metrics,
  money,
  onOpenSale,
  recentAttendances,
  user,
  fullDate
}) {
  const firstName = user?.name ? user.name.split(' ')[0] : 'colaborador'
  const pendingAdvances = advances.filter((advance) => advance.status === 'pending').length
  const commissionToday = money(metrics.myCommissionAccumulated || metrics.totalCommission)
  const netBalance = money(metrics.mySettlementBalance || metrics.netCommission)

  const quickActions = [
    {
      key: 'sale',
      icon: 'plus',
      label: 'Nova venda',
      enabled: canLaunchSales,
      onClick: onOpenSale
    },
    {
      key: 'attendances',
      icon: 'catalog',
      label: 'Meus atendimentos',
      value: metrics.totalAttendances || metrics.todayAttendances || 0
    },
    {
      key: 'commissions',
      icon: 'money',
      label: 'Minhas comissoes',
      value: money(metrics.weekCommission)
    },
    {
      key: 'advances',
      icon: 'wallet',
      label: 'Adiantamento',
      value: pendingAdvances
    }
  ]

  return (
    <div className="barber-collab-mobile barber-collab-mobile-premium">
      <section className="barber-collab-mobile-header">
        <div className="barber-collab-mobile-user">
          <span className="barber-overline">BarberGestor colaborador</span>
          <h2>{`Ola, ${firstName}`}</h2>
          <p>Seu painel rapido com atendimentos, comissao e adiantamentos.</p>
        </div>

        <div className="barber-collab-mobile-header-actions">
          <button className="barber-icon-button" type="button">
            <BarberIcon name="bell" />
          </button>
          <button className="barber-icon-button" type="button">
            <BarberIcon name="switch" />
          </button>
        </div>
      </section>

      <BarberCard className="barber-collab-mobile-commission-card">
        <div className="barber-collab-mobile-commission-copy">
          <div>
            <span>Minha comissao</span>
            <strong>{commissionToday}</strong>
            <p>Valor acumulado no seu dia de trabalho, sem expor totais da barbearia.</p>
          </div>
          <BarberBadge tone="cash">Hoje</BarberBadge>
        </div>

        <div className="barber-collab-mobile-commission-strip">
          <div>
            <small>Atendimentos</small>
            <strong>{metrics.totalAttendances || metrics.todayAttendances || 0}</strong>
          </div>
          <div>
            <small>Liquido previsto</small>
            <strong>{netBalance}</strong>
          </div>
        </div>
      </BarberCard>

      <section className="barber-collab-mobile-quick-actions">
        {quickActions.map((action) => (
          action.onClick ? (
            <BarberButton
              className="barber-collab-mobile-quick-card"
              disabled={!action.enabled}
              key={action.key}
              onClick={action.onClick}
              type="button"
              variant="ghost"
            >
              <BarberIcon name={action.icon} />
              <strong>{action.label}</strong>
              <span>{action.enabled ? 'Abrir agora' : 'Indisponivel'}</span>
            </BarberButton>
          ) : (
            <BarberCard className="barber-collab-mobile-quick-card" key={action.key}>
              <BarberIcon name={action.icon} />
              <strong>{action.label}</strong>
              <span>{action.value}</span>
            </BarberCard>
          )
        ))}
      </section>

      <BarberCard className="barber-collab-mobile-history-card">
        <div className="barber-list-header">
          <div>
            <h2>Ultimos atendimentos</h2>
            <p>Somente registros do seu perfil.</p>
          </div>
          <BarberBadge tone="pix">{recentAttendances.length}</BarberBadge>
        </div>

        <div className="barber-collab-mobile-history-list">
          {recentAttendances.length > 0 ? (
            recentAttendances.slice(0, 6).map((sale) => (
              <div className="barber-collab-mobile-history-item" key={sale.id}>
                <span className="barber-collab-mobile-history-avatar">
                  {(sale.service_name || 'A').slice(0, 1)}
                </span>
                <div className="barber-collab-mobile-history-copy">
                  <strong>{sale.service_name || 'Atendimento registrado'}</strong>
                  <span>{fullDate(sale.created_at)}</span>
                </div>
                <div className="barber-collab-mobile-history-value">
                  <strong>{money(sale.commission_amount || 0)}</strong>
                  <span>{sale.status || 'Comissao registrada'}</span>
                </div>
              </div>
            ))
          ) : (
            <BarberEmptyState
              description="Assim que seus atendimentos forem registrados, eles aparecem aqui no novo layout mobile."
              title="Nenhum atendimento encontrado"
            />
          )}
        </div>
      </BarberCard>

      <nav className="barber-collab-mobile-nav" aria-label="Navegacao do colaborador">
        <button className="barber-collab-mobile-nav-item active" type="button">
          <BarberIcon name="dashboard" />
          <span>Inicio</span>
        </button>
        <button className="barber-collab-mobile-nav-item" type="button">
          <BarberIcon name="catalog" />
          <span>Atendimentos</span>
        </button>
        <button
          className="barber-collab-mobile-nav-center"
          disabled={!canLaunchSales}
          onClick={canLaunchSales ? onOpenSale : undefined}
          type="button"
        >
          <BarberIcon name="plus" />
        </button>
        <button className="barber-collab-mobile-nav-item" type="button">
          <BarberIcon name="money" />
          <span>Comissoes</span>
        </button>
        <button className="barber-collab-mobile-nav-item" type="button">
          <BarberIcon name="users" />
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  )
}

export default CollaboratorMobileDashboard

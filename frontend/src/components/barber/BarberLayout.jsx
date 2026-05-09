import { useState } from 'react'
import { BarberButton, BarberIcon } from './BarberUI'
import PlanLock from '../common/PlanLock'

const adminMenuGroups = [
  {
    title: 'Principal',
    items: [
      { id: 'dashboard', label: 'Visao Geral', icon: 'dashboard' },
      { id: 'sales', label: 'Atendimentos', icon: 'sales' },
      { id: 'appointments', label: 'Agenda', icon: 'calendar' },
      { id: 'team', label: 'Colaboradores', icon: 'users' },
      { id: 'services', label: 'Servicos', icon: 'catalog' },
      { id: 'products', label: 'Produtos', icon: 'product' },
      { id: 'cashier', label: 'Caixa', icon: 'wallet' },
      { id: 'settlements', label: 'Acertos', icon: 'money' },
      { id: 'reports', label: 'Relatorios', icon: 'reports' },
      { id: 'settings', label: 'Configuracoes', icon: 'settings' }
    ]
  },
  {
    title: 'Relacionamento',
    items: [
      { id: 'customers', label: 'Clientes', icon: 'users' }
    ]
  }
]

function getMenuGroups(user, isAdmin) {
  if (isAdmin) {
    return adminMenuGroups
  }

  const items = [
    { id: 'dashboard', label: 'Visao Geral', icon: 'dashboard' }
  ]

  if (user?.can_launch_sales) {
    items.push({ id: 'sales', label: 'Atendimentos', icon: 'sales' })
  }

  if (user?.can_view_own_reports) {
    items.push({ id: 'reports', label: 'Relatorios', icon: 'reports' })
  }

  return [{ title: 'Colaborador', items }]
}

function BarberSidebar({
  activeView,
  isAdmin,
  modulesCount,
  lockedViews = {},
  onNavigate,
  onLockedFeature,
  onSwitchModule,
  open,
  onClose,
  user,
  planLabel
}) {
  const menuGroups = getMenuGroups(user, isAdmin)

  return (
    <>
      <button
        aria-hidden={!open}
        className={`barber-sidebar-backdrop ${open ? 'visible' : ''}`}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        type="button"
      />
      <aside className={`barber-sidebar ${open ? 'open' : ''}`}>
        <div className="barber-brand">
          <span className="barber-brand-mark" />
          <div>
            <strong>Barber Store</strong>
            <small>Donda Barbearia</small>
          </div>
        </div>

        <nav className="barber-nav">
          {menuGroups.map((group) => (
            <div className="barber-nav-group" key={group.title}>
              <p>{group.title}</p>
              {group.items.map((item) => {
                const locked = Boolean(lockedViews[item.id])
                const lockMessage = lockedViews[item.id]

                return (
                  <button
                    className={`barber-nav-item ${activeView === item.id ? 'active' : ''} ${locked ? 'is-locked' : ''}`.trim()}
                    key={item.id}
                    onClick={() => {
                      if (locked) {
                        onLockedFeature?.(lockMessage)
                        onClose()
                        return
                      }
                      onNavigate(item.id)
                      onClose()
                    }}
                    type="button"
                  >
                    <BarberIcon name={item.icon} />
                    <span>{item.label}</span>
                    {locked ? <PlanLock label="Plano" /> : null}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="barber-sidebar-footer">
          <span>{isAdmin ? 'Admin' : 'Colaborador'}</span>
          <strong>{isAdmin ? 'Operacao do dia' : 'Seu painel pessoal'}</strong>
          <p>
            Dados reais, leitura rapida e fechamento organizado sem misturar permissoes.
          </p>
          <div className="barber-plan-pill">Plano atual: {planLabel}</div>
          {modulesCount > 1 && (
            <BarberButton className="barber-sidebar-switch" onClick={onSwitchModule} type="button" variant="ghost">
              <BarberIcon name="switch" />
              <span>Trocar modulo</span>
            </BarberButton>
          )}
        </div>
      </aside>
    </>
  )
}

function BarberTopbar({ activeLabel, title, user, isAdmin, onLogout, onSidebarToggle }) {
  return (
    <header className="barber-topbar">
      <div className="barber-topbar-main">
        <button className="barber-icon-button barber-mobile-toggle" onClick={onSidebarToggle} type="button">
          <BarberIcon name="menu" />
        </button>
        <div className="barber-topbar-copy">
          <span>{activeLabel}</span>
          <strong>{title}</strong>
        </div>
      </div>

      <div className="barber-topbar-actions">
        <button className="barber-icon-button" type="button">
          <BarberIcon name="bell" />
        </button>
        <div className="barber-user-chip">
          <span>{(user?.name || 'B').slice(0, 1)}</span>
          <div>
            <strong>{user?.name || 'Usuario'}</strong>
            <small>{isAdmin ? 'Admin' : 'Colaborador'}</small>
          </div>
        </div>
        <BarberButton onClick={onLogout} type="button" variant="ghost">
          <BarberIcon name="logout" />
          <span>Sair</span>
        </BarberButton>
      </div>
    </header>
  )
}

function BarberLayout({
  activeView,
  title,
  activeLabel,
  user,
  isAdmin,
  modulesCount,
  lockedViews,
  onLockedFeature,
  planLabel,
  onNavigate,
  onSwitchModule,
  onLogout,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <main className="barber-premium-shell">
      <BarberSidebar
        activeView={activeView}
        isAdmin={isAdmin}
        lockedViews={lockedViews}
        modulesCount={modulesCount}
        onClose={() => setSidebarOpen(false)}
        onLockedFeature={onLockedFeature}
        onNavigate={onNavigate}
        onSwitchModule={onSwitchModule}
        open={sidebarOpen}
        planLabel={planLabel}
        user={user}
      />

      <section className="barber-main">
        <BarberTopbar
          activeLabel={activeLabel}
          isAdmin={isAdmin}
          onLogout={onLogout}
          onSidebarToggle={() => setSidebarOpen((current) => !current)}
          title={title}
          user={user}
        />
        {children}
      </section>
    </main>
  )
}

export default BarberLayout

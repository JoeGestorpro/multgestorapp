import { useState } from 'react'
import { BarberButton, BarberIcon } from './BarberUI'

const adminMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'appointments', label: 'Agendamentos', icon: 'calendar' },
  { id: 'customers', label: 'Clientes', icon: 'users' },
  { id: 'services', label: 'Servicos', icon: 'catalog' },
  { id: 'products', label: 'Produtos', icon: 'product' },
  { id: 'sales', label: 'Vendas', icon: 'sales' },
  { id: 'cashier', label: 'Caixa', icon: 'wallet' },
  { id: 'team', label: 'Colaboradores', icon: 'users' },
  { id: 'reports', label: 'Relatorios', icon: 'reports' }
]

function getMenuItems(user, isAdmin) {
  if (isAdmin) {
    return adminMenuItems
  }

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' }
  ]

  if (user?.can_launch_sales) {
    items.push({ id: 'sales', label: 'Lancar venda', icon: 'sales' })
  }

  if (user?.can_view_own_reports) {
    items.push({ id: 'reports', label: 'Meu relatorio', icon: 'reports' })
  }

  return items
}

function BarberSidebar({
  activeView,
  isAdmin,
  modulesCount,
  onNavigate,
  onSwitchModule,
  open,
  onClose,
  user
}) {
  const menuItems = getMenuItems(user, isAdmin)

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
            <strong>BarberGestor</strong>
            <small>MultGestor premium</small>
          </div>
        </div>

        <nav className="barber-nav">
          <div className="barber-nav-group">
            <p>{isAdmin ? 'Operacao' : 'Colaborador'}</p>
            {menuItems.map((item) => (
              <button
                className={`barber-nav-item ${activeView === item.id ? 'active' : ''}`.trim()}
                key={item.id}
                onClick={() => {
                  onNavigate(item.id)
                  onClose()
                }}
                type="button"
              >
                <BarberIcon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="barber-sidebar-footer">
          <span>{isAdmin ? 'Admin mode' : 'Colaborador mode'}</span>
          <strong>{isAdmin ? 'Controle total da barbearia' : 'Sua producao em um so lugar'}</strong>
          <p>
            Ambiente premium com foco em leitura rapida, fechamento de caixa e operacao sem atrito.
          </p>
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
        modulesCount={modulesCount}
        onClose={() => setSidebarOpen(false)}
        onNavigate={onNavigate}
        onSwitchModule={onSwitchModule}
        open={sidebarOpen}
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

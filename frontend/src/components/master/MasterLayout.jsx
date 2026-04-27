import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

const menuGroups = [
  {
    title: 'Gestao',
    items: [
      { label: 'Dashboard', path: '/master/dashboard', icon: 'dashboard' },
      { label: 'Modulos', path: '/master/modules', icon: 'modules' },
      { label: 'Clientes', path: '/master/clients', icon: 'clients' },
      { label: 'Assinaturas', path: '/master/subscriptions', icon: 'subscriptions' },
      { label: 'Ativacoes', path: '/master/activations', icon: 'activations' }
    ]
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Configuracoes', path: '/master/settings', icon: 'settings' }
    ]
  }
]

function MasterIcon({ name }) {
  const icons = {
    dashboard: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    modules: 'M12 3l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5',
    clients: 'M8 11a4 4 0 100-8 4 4 0 000 8zM2 20a6 6 0 0112 0M17 11a3 3 0 100-6M15 20a5 5 0 017-4',
    subscriptions: 'M3 6h18v12H3zM3 10h18',
    activations: 'M13 2L4 14h7l-1 8 9-12h-7z',
    settings: 'M12 8a4 4 0 100 8 4 4 0 000-8zM4 12H2m20 0h-2M12 4V2m0 20v-2M5.6 5.6L4.2 4.2m15.6 15.6l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4',
    search: 'M10 18a8 8 0 100-16 8 8 0 000 16zM21 21l-5-5',
    logout: 'M10 17l5-5-5-5M15 12H3M21 3v18'
  }

  return (
    <svg aria-hidden="true" className="master-icon" viewBox="0 0 24 24">
      <path d={icons[name]} />
    </svg>
  )
}

function MasterSidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside className="master-premium-sidebar">
      <div className="master-premium-brand">
        <span className="master-brand-mark"></span>
        <div>
          <strong>MULTGESTOR</strong>
          <small>Painel Master</small>
        </div>
      </div>

      <nav className="master-premium-nav">
        {menuGroups.map((group) => (
          <section key={group.title}>
            <p>{group.title}</p>
            {group.items.map((item) => (
              <button
                className={location.pathname === item.path ? 'active' : ''}
                key={item.path}
                onClick={() => navigate(item.path)}
                type="button"
              >
                <MasterIcon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </section>
        ))}
      </nav>
    </aside>
  )
}

function MasterTopbar({ title }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/master/login', { replace: true })
  }

  return (
    <header className="master-premium-topbar">
      <div className="master-premium-search">
        <MasterIcon name="search" />
        <input aria-label="Buscar" placeholder="Buscar no painel master" />
      </div>

      <div className="master-premium-profile">
        <span>{(user?.name || 'M').slice(0, 1)}</span>
        <div>
          <strong>{user?.name || 'Master Admin'}</strong>
          <small>{title}</small>
        </div>
        <button type="button" onClick={handleLogout}>
          <MasterIcon name="logout" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  )
}

function MasterLayout({ title, children }) {
  return (
    <main className="master-premium-shell">
      <MasterSidebar />
      <section className="master-premium-main">
        <MasterTopbar title={title} />
        {children}
      </section>
    </main>
  )
}

export default MasterLayout

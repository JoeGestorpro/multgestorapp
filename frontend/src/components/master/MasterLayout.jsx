import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import {
  LayoutDashboard, Users, BarChart3, CreditCard, DollarSign, Zap,
  Grid3x3, Puzzle, Headphones, Shield, Activity, Brain, Link, Settings,
  Search, LogOut
} from 'lucide-react'
import ToastContainer from './Toast'

const menuGroups = [
  {
    title: 'Gestão',
    items: [
      { label: 'Dashboard', path: '/master/dashboard', icon: LayoutDashboard },
      { label: 'Clientes', path: '/master/clients', icon: Users },
      { label: 'CRM / Vendas', path: '/master/crm', icon: BarChart3 },
      { label: 'Planos / Ass.', path: '/master/subscriptions', icon: CreditCard },
      { label: 'Financeiro', path: '/master/financeiro', icon: DollarSign },
      { label: 'Ativações', path: '/master/activations', icon: Zap }
    ]
  },
  {
    title: 'Produto',
    items: [
      { label: 'Nichos', path: '/master/niches', icon: Grid3x3 },
      { label: 'Módulos', path: '/master/modules', icon: Puzzle }
    ]
  },
  {
    title: 'Operação',
    items: [
      { label: 'Suporte', path: '/master/support', icon: Headphones },
      { label: 'Governança', path: '/master/governance', icon: Shield },
      { label: 'Saúde / Status', path: '/master/health', icon: Activity }
    ]
  },
  {
    title: 'Inteligência',
    items: [
      { label: 'JoeFelipe', path: '/master/joe-felipe', icon: Brain }
    ]
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Integrações', path: '/master/integrations', icon: Link },
      { label: 'Configurações', path: '/master/settings', icon: Settings }
    ]
  }
]

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
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <button
                  className={location.pathname === item.path ? 'active' : ''}
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  type="button"
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </button>
              )
            })}
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
        <Search size={18} strokeWidth={1.8} />
        <input aria-label="Buscar" placeholder="Buscar no painel master" />
      </div>

      <div className="master-premium-profile">
        <span>{(user?.name || 'M').slice(0, 1)}</span>
        <div>
          <strong>{user?.name || 'Master Admin'}</strong>
          <small>{title}</small>
        </div>
        <button type="button" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={1.8} />
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
      <ToastContainer />
    </main>
  )
}

export default MasterLayout

import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Package,
  Users,
  Wallet,
  BarChart3,
  Lock,
  Settings,
  Crown
} from 'lucide-react'
import Badge from '../ui/Badge'
import './Sidebar.css'

const NAV_ITEMS = [
  {
    section: 'Principal',
    items: [
      { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
      { id: 'sales', label: 'Atendimentos', icon: Scissors },
      { id: 'appointments', label: 'Agenda', icon: Calendar },
    ]
  },
  {
    section: 'Operações',
    items: [
      { id: 'services', label: 'Serviços', icon: Scissors },
      { id: 'products', label: 'Produtos', icon: Package },
      { id: 'team', label: 'Equipe', icon: Users },
      { id: 'cashier', label: 'Caixa', icon: Wallet },
    ]
  },
  {
    section: 'Relacionamento',
    items: [
      { id: 'customers', label: 'Clientes', icon: Users },
    ]
  },
  {
    section: 'Gerenciamento',
    items: [
      { id: 'reports', label: 'Relatórios', icon: BarChart3 },
      { id: 'settlements', label: 'Acertos', icon: Lock },
    ]
  }
]

const SETTINGS_ITEM = { id: 'settings', label: 'Configurações', icon: Settings }

function getInitials(name) {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function Sidebar({
  activeItem = 'dashboard',
  onNavigate,
  companyName = 'Barbearia',
  logoUrl = null,
  primaryColor = null,
  planName = 'Premium',
  user,
  collapsed = false,
  className = '',
  ...props
}) {
  const logoStyle = primaryColor ? {
    background: primaryColor,
    color: '#07090d'
  } : {}

  return (
    <aside
      className={['ds-sidebar', className].filter(Boolean).join(' ')}
      {...props}
    >
      <div className="ds-sidebar__header">
        <div className="ds-sidebar__logo">
          <div className="ds-sidebar__logo-icon" style={logoStyle}>
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="ds-sidebar__logo-img" />
            ) : (
              <Scissors />
            )}
          </div>
          <div className="ds-sidebar__logo-text">
            <span className="ds-sidebar__brand">{companyName}</span>
            <span className="ds-sidebar__app">BarberGestor</span>
          </div>
        </div>
      </div>

      <nav className="ds-sidebar__nav">
        {NAV_ITEMS.map((section) => (
          <div key={section.section} className="ds-sidebar__section">
            <div className="ds-sidebar__section-title">{section.section}</div>
            <div className="ds-sidebar__items">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.id
                return (
                  <div
                    key={item.id}
                    className={['ds-sidebar__item', isActive && 'ds-sidebar__item--active'].filter(Boolean).join(' ')}
                    onClick={() => onNavigate?.(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onNavigate?.(item.id)}
                  >
                    <span className="ds-sidebar__item-icon">
                      <Icon />
                    </span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ds-sidebar__item-badge">
                        <Badge variant="accent" size="sm">{item.badge}</Badge>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="ds-sidebar__section">
          <div className="ds-sidebar__section-title">Sistema</div>
          <div className="ds-sidebar__items">
            <div
              className={['ds-sidebar__item', activeItem === SETTINGS_ITEM.id && 'ds-sidebar__item--active'].filter(Boolean).join(' ')}
              onClick={() => onNavigate?.(SETTINGS_ITEM.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate?.(SETTINGS_ITEM.id)}
            >
              <span className="ds-sidebar__item-icon">
                <Settings />
              </span>
              <span>{SETTINGS_ITEM.label}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="ds-sidebar__footer">
        <div className="ds-sidebar__plan">
          <div className="ds-sidebar__plan-icon">
            <Crown />
          </div>
          <div className="ds-sidebar__plan-text">
            <div className="ds-sidebar__plan-label">Plano</div>
            <div className="ds-sidebar__plan-name">{planName}</div>
          </div>
        </div>

        {user && (
          <div className="ds-sidebar__user">
            <div className="ds-sidebar__avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div className="ds-sidebar__user-info">
              <div className="ds-sidebar__user-name">{user.name}</div>
              <div className="ds-sidebar__user-role">{user.role || 'Usuário'}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

Sidebar.getInitials = getInitials
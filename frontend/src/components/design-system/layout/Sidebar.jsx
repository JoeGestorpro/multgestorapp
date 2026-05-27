import { useState } from 'react'
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
  Crown,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import Badge from '../ui/Badge'
import './Sidebar.css'

const NAV_ITEMS = [
  {
    section: 'Principal',
    items: [
      { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
      { id: 'sales', label: 'Atendimentos', icon: Scissors },
      {
        id: 'appointments',
        label: 'Agenda',
        icon: Calendar,
        subItems: [
          { id: 'appointments', label: 'Agenda do dia' },
          { id: 'appointments-history', label: 'Histórico' },
          { id: 'appointments-crm', label: 'CRM da agenda' },
          { id: 'appointments-blocks', label: 'Bloqueios e horários' },
        ]
      },
    ]
  },
  {
    section: 'Operações',
    items: [
      {
        id: 'services',
        label: 'Serviços',
        icon: Scissors,
        subItems: [
          { id: 'services', label: 'Todos os serviços' },
          { id: 'services-top', label: 'Mais vendidos' },
          { id: 'services-favorites', label: 'Favoritos' },
          { id: 'services-commissions', label: 'Comissões' },
        ]
      },
      { id: 'products', label: 'Produtos', icon: Package },
      { id: 'team', label: 'Equipe', icon: Users },
      { id: 'cashier', label: 'Caixa', icon: Wallet },
    ]
  },
  {
    section: 'Relacionamento',
    items: [
      {
        id: 'customers',
        label: 'Clientes',
        icon: Users,
        subItems: [
          { id: 'customers', label: 'Todos os clientes' },
          { id: 'customers-crm', label: 'Histórico e CRM' },
          { id: 'customers-birthdays', label: 'Aniversariantes' },
          { id: 'customers-inactive', label: 'Inativos' },
          { id: 'customers-vip', label: 'VIP / Fidelidade' },
        ]
      },
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
  const getInitialExpanded = () => {
    const expanded = {}
    NAV_ITEMS.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems) {
          const hasActiveSub = item.subItems.some(si => si.id === activeItem)
          if (hasActiveSub) expanded[item.id] = true
        }
      })
    })
    return expanded
  }

  const [expandedSections, setExpandedSections] = useState(getInitialExpanded)

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

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
              <span className="ds-sidebar__logo-initials">{getInitials(companyName)}</span>
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
                const hasSubItems = item.subItems && item.subItems.length > 0
                const isExpanded = expandedSections[item.id]
                const isParentActive = hasSubItems && item.subItems.some(si => si.id === activeItem)

                return (
                  <div key={item.id} className="ds-sidebar__item-wrapper">
                    <div
                      className={[
                        'ds-sidebar__item',
                        hasSubItems && 'ds-sidebar__item--parent',
                        (isActive || isParentActive) && 'ds-sidebar__item--active'
                      ].filter(Boolean).join(' ')}
                      onClick={() => {
                        if (hasSubItems) toggleSection(item.id)
                        onNavigate?.(item.id)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && onNavigate?.(item.id)}
                    >
                      <span className="ds-sidebar__item-icon">
                        <Icon />
                      </span>
                      <span>{item.label}</span>
                      {hasSubItems && (
                        <span className="ds-sidebar__item-chevron">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                      )}
                      {item.badge && (
                        <span className="ds-sidebar__item-badge">
                          <Badge variant="accent" size="sm">{item.badge}</Badge>
                        </span>
                      )}
                    </div>

                    {hasSubItems && isExpanded && (
                      <div className="ds-sidebar__sub-items">
                        {item.subItems.map((sub) => {
                          const isSubActive = activeItem === sub.id
                          return (
                            <div
                              key={sub.id}
                              className={[
                                'ds-sidebar__sub-item',
                                isSubActive && 'ds-sidebar__sub-item--active'
                              ].filter(Boolean).join(' ')}
                              onClick={() => onNavigate?.(sub.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && onNavigate?.(sub.id)}
                            >
                              <span className="ds-sidebar__sub-item-dot" />
                              <span>{sub.label}</span>
                            </div>
                          )
                        })}
                      </div>
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
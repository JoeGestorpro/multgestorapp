import { useMemo } from 'react'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import './HeroWelcomeCard.css'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatDate() {
  const options = { weekday: 'long', day: 'numeric', month: 'long' }
  return new Date().toLocaleDateString('pt-BR', options)
}

export default function HeroWelcomeCard({
  userName,
  todayStats = {},
  onQuickAction
}) {
  const { companyName, logoUrl, primaryColor } = useTenantTheme()
  
  const greeting = useMemo(() => getGreeting(), [])
  const dateFormatted = useMemo(() => formatDate(), [])
  
  const stats = [
    {
      label: 'Atendimentos',
      value: todayStats.attendances ?? 0,
      icon: 'scissors'
    },
    {
      label: 'Faturamento',
      value: todayStats.revenue ? `R$ ${Number(todayStats.revenue).toFixed(0)}` : 'R$ 0',
      icon: 'money'
    },
    {
      label: 'Equipe',
      value: todayStats.teamSize ?? 0,
      icon: 'team'
    }
  ]

  return (
    <div className="hero-welcome" style={{ '--hero-accent': primaryColor }}>
      <div className="hero-welcome__background" />
      
      <div className="hero-welcome__content">
        <div className="hero-welcome__header">
          <div className="hero-welcome__brand">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="hero-welcome__logo" />
            ) : (
              <div className="hero-welcome__logo-fallback">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 3v18M18 9l-3 3-3-3M8 9l-3 3-3-3M18 9l-3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <div className="hero-welcome__brand-text">
              <span className="hero-welcome__company">{companyName}</span>
              <span className="hero-welcome__date">{dateFormatted}</span>
            </div>
          </div>
          
          <div className="hero-welcome__greeting">
            <h1>{greeting}, {userName?.split(' ')[0] || 'Usuário'}</h1>
            <p>
              {todayStats.attendances > 0 
                ? `Você tem ${todayStats.attendances} atendimento${todayStats.attendances > 1 ? 's' : ''} hoje`
                : 'Nenhum atendimento agendado para hoje'}
            </p>
          </div>
        </div>

        <div className="hero-welcome__stats">
          {stats.map((stat, index) => (
            <div key={stat.label} className="hero-welcome__stat" style={{ '--delay': `${index * 0.1}s` }}>
              <div className="hero-welcome__stat-icon">
                {stat.icon === 'scissors' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <line x1="20" y1="4" x2="8.12" y2="15.88" />
                    <line x1="14.47" y1="14.48" x2="20" y2="20" />
                    <line x1="8.12" y1="8.12" x2="12" y2="12" />
                  </svg>
                )}
                {stat.icon === 'money' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                )}
                {stat.icon === 'team' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
              </div>
              <div className="hero-welcome__stat-content">
                <span className="hero-welcome__stat-value">{stat.value}</span>
                <span className="hero-welcome__stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {onQuickAction && (
          <div className="hero-welcome__action">
            <button 
              className="hero-welcome__btn"
              style={{ '--btn-bg': primaryColor }}
              onClick={onQuickAction}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Novo atendimento
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
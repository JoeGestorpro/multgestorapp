import { useEffect, useState } from 'react'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import './WelcomeScreen.css'

export default function WelcomeScreen({ onStartSetup, onSkip }) {
  const { companyName, logoUrl, primaryColor } = useTenantTheme()
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleStart = () => {
    onStartSetup?.()
  }

  const handleSkip = () => {
    onSkip?.()
  }

  return (
    <div className={`welcome-screen ${animated ? 'welcome-screen--visible' : ''}`}>
      <div className="welcome-screen__backdrop" />
      
      <div className="welcome-screen__content">
        <div className="welcome-screen__celebration">
          <div className="welcome-screen__icon-wrapper">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={companyName} 
                className="welcome-screen__logo"
                style={{ borderColor: primaryColor }}
              />
            ) : (
              <div 
                className="welcome-screen__icon"
                style={{ background: primaryColor }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 3v18M18 9l-3 3-3-3M8 9l-3 3-3-3M18 9l-3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="welcome-screen__confetti">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="welcome-screen__confetti-piece" style={{ '--delay': `${i * 0.1}s` }} />
            ))}
          </div>
        </div>

        <h1 className="welcome-screen__title">
          {companyName} está no ar!
        </h1>

        <p className="welcome-screen__subtitle">
          Sua gestão está pronta. Configure em poucos minutos e comece a operar com controle total.
        </p>

        <div className="welcome-screen__meta">
          <div className="welcome-screen__meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Tempo estimado: 3 minutos</span>
          </div>
        </div>

        <div className="welcome-screen__actions">
          <button 
            className="welcome-screen__btn welcome-screen__btn--primary"
            onClick={handleStart}
            style={{ 
              '--btn-color': primaryColor,
              '--btn-bg': `${primaryColor}15`
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Começar configuração
          </button>
          
          <button 
            className="welcome-screen__btn welcome-screen__btn--ghost"
            onClick={handleSkip}
          >
            Ver dashboard primeiro
          </button>
        </div>

        <div className="welcome-screen__features">
          <div className="welcome-screen__feature">
            <div className="welcome-screen__feature-icon" style={{ background: `${primaryColor}20` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span>Sua marca</span>
          </div>
          <div className="welcome-screen__feature-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <div className="welcome-screen__feature">
            <div className="welcome-screen__feature-icon" style={{ background: `${primaryColor}20` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span>Localização</span>
          </div>
          <div className="welcome-screen__feature-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <div className="welcome-screen__feature">
            <div className="welcome-screen__feature-icon" style={{ background: `${primaryColor}20` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span>Equipe</span>
          </div>
          <div className="welcome-screen__feature-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <div className="welcome-screen__feature">
            <div className="welcome-screen__feature-icon" style={{ background: `${primaryColor}20` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span>Serviços</span>
          </div>
        </div>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import './StepComplete.css'

export default function StepComplete({ data, onComplete }) {
  const { primaryColor, companyName } = useTenantTheme()
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const configSummary = [
    { label: 'Nome', value: data.company_name || companyName, icon: 'store' },
    { label: 'Cor principal', value: data.primary_color || primaryColor, icon: 'palette' },
    { label: 'Endereço', value: data.address || 'Não informado', icon: 'location' },
    { label: 'Telefone', value: data.phone || 'Não informado', icon: 'phone' },
  ].filter(item => item.value)

  return (
    <div className="step-complete">
      {showConfetti && (
        <div className="step-complete__confetti">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="step-complete__confetti-piece"
              style={{
                '--x': `${Math.random() * 100}%`,
                '--delay': `${Math.random() * 0.5}s`,
                '--duration': `${1.5 + Math.random() * 1}s`,
                '--color': i % 3 === 0 ? primaryColor : i % 3 === 1 ? '#fff' : 'var(--accent-secondary)'
              }}
            />
          ))}
        </div>
      )}

      <div className="step-complete__content">
        <div className="step-complete__badge" style={{ '--badge-color': primaryColor }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h2 className="step-complete__title">Tudo pronto!</h2>
        <p className="step-complete__subtitle">
          {companyName} está configurada e pronta para operar.
          <br />
          Comece aceitando seu primeiro atendimento.
        </p>

        <div className="step-complete__summary">
          <h3>O que foi configurado</h3>
          <div className="step-complete__summary-list">
            {configSummary.map((item, index) => (
              <div key={index} className="step-complete__summary-item">
                <span className="step-complete__summary-label">{item.label}</span>
                <span className="step-complete__summary-value">
                  {item.icon === 'palette' ? (
                    <span 
                      className="step-complete__color-dot"
                      style={{ background: item.value }}
                    />
                  ) : null}
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="step-complete__actions">
          <button 
            className="step-complete__btn step-complete__btn--primary"
            style={{ '--btn-color': primaryColor }}
            onClick={onComplete}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3v18M18 9l-3 3-3-3M8 9l-3 3-3-3M18 9l-3 3-3 3" />
            </svg>
            Acessar dashboard
          </button>
        </div>

        <div className="step-complete__tip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Dica: Você pode personalizar tudo mais tarde nas configurações.</span>
        </div>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './ChoosePlan.css'

function resolveApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_URL || '').trim()
  if (!configured) return 'http://localhost:5000/api'
  return configured.endsWith('/api') ? configured : `${configured.replace(/\/+$/, '')}/api`
}

const PLAN_LINKS = {
  essencial: import.meta.env.VITE_KIWIFY_URL_STARTER || '#',
  profissional: import.meta.env.VITE_KIWIFY_URL_PRO || '#',
  premium: import.meta.env.VITE_KIWIFY_URL_PREMIUM || '#',
}

export default function ChoosePlan() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`${resolveApiBaseUrl()}/public/plan-options`)
      .then(res => {
        setPlans(res.data?.data?.plans || [])
        setLoading(false)
      })
      .catch(err => {
        setError('Nao foi possivel carregar os planos. Tente novamente.')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="choose-plan-page">
        <div className="choose-plan-loader">Carregando planos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="choose-plan-page">
        <div className="choose-plan-error">{error}</div>
        <button className="choose-plan-btn" onClick={() => window.location.reload()}>Recarregar</button>
      </div>
    )
  }

  return (
    <div className="choose-plan-page">
      <div className="choose-plan-container">
        <h1 className="choose-plan-title">Escolha seu plano</h1>
        <p className="choose-plan-subtitle">
          Seu periodo de teste expirou. Escolha um plano para continuar usando o MultGestor.
        </p>

        <div className="choose-plan-grid">
          {plans.map(plan => (
            <div key={plan.value} className="choose-plan-card">
              <h3 className="choose-plan-name">{plan.label}</h3>
              <p className="choose-plan-desc">{plan.description}</p>
              <div className="choose-plan-price">
                <span className="choose-plan-currency">R$</span>
                <span className="choose-plan-amount">
                  {plan.price_monthly.toFixed(2).replace('.', ',')}
                </span>
                <span className="choose-plan-period">/mes</span>
              </div>
              <ul className="choose-plan-features">
                {plan.features.map((f, i) => (
                  <li key={i} className="choose-plan-feature">{f}</li>
                ))}
              </ul>
              <a
                href={PLAN_LINKS[plan.value] || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="choose-plan-cta"
              >
                Assinar {plan.label}
              </a>
            </div>
          ))}
        </div>

        <button className="choose-plan-back" onClick={() => navigate('/barber/login')}>
          Voltar para o login
        </button>
      </div>
    </div>
  )
}

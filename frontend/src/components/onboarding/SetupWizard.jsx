import { useCallback, useState } from 'react'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import ProgressBar from './ProgressBar'
import StepBrand from './StepBrand'
import StepAddress from './StepAddress'
import StepComplete from './StepComplete'
import api from '../../services/api'
import './SetupWizard.css'

const STEPS = [
  { id: 'brand', label: 'Marca' },
  { id: 'address', label: 'Local' },
  { id: 'team', label: 'Equipe' },
  { id: 'complete', label: 'Pronto' },
]

export default function SetupWizard({ onComplete, onSkip }) {
  const { primaryColor, companyName } = useTenantTheme()
  const [currentStep, setCurrentStep] = useState(0)
  const [stepData, setStepData] = useState({
    brand: {
      company_name: companyName,
      primary_color: primaryColor,
      logo_url: null,
      slogan: ''
    },
    address: {
      address: '',
      phone: '',
      whatsapp: '',
      business_hours: {}
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleDataChange = useCallback((stepKey, data) => {
    setStepData(prev => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], ...data }
    }))
  }, [])

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token_barber') || 
                    sessionStorage.getItem('auth_token_barber')

      const allData = {
        ...stepData.brand,
        ...stepData.address
      }

      await api.put('/barber/company/setup', allData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      onComplete?.()
    } catch (err) {
      console.error('Erro ao salvar configuração:', err)
      setError('Erro ao salvar. Tente novamente.')
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepBrand
            data={stepData.brand}
            onChange={(data) => handleDataChange('brand', data)}
            onNext={handleNext}
          />
        )
      case 1:
        return (
          <StepAddress
            data={stepData.address}
            onChange={(data) => handleDataChange('address', data)}
            onNext={handleNext}
          />
        )
      case 2:
        return (
          <div className="setup-wizard__skip-step">
            <div className="setup-wizard__skip-content">
              <div className="setup-wizard__skip-icon" style={{ background: `${primaryColor}20` }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2>Configure sua equipe</h2>
              <p>Adicione barbeiros e profissionais que trabalham com você.</p>
              <button 
                className="setup-wizard__skip-btn"
                style={{ '--skip-color': primaryColor }}
                onClick={handleNext}
              >
                Cadastrar depois
              </button>
            </div>
          </div>
        )
      case 3:
        return (
          <StepComplete
            data={{ ...stepData.brand, ...stepData.address }}
            onComplete={handleComplete}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="setup-wizard">
      <div className="setup-wizard__backdrop" />
      
      <div className="setup-wizard__container">
        <div className="setup-wizard__header">
          <h1>Configure sua barbearia</h1>
          <p>Personalize em poucos minutos</p>
        </div>

        <ProgressBar
          currentStep={currentStep}
          totalSteps={STEPS.length}
          stepLabels={STEPS.map(s => s.label)}
        />

        {error && (
          <div className="setup-wizard__error">
            {error}
          </div>
        )}

        <div className="setup-wizard__content">
          {renderStep()}
        </div>

        {currentStep < 3 && currentStep > 0 && (
          <div className="setup-wizard__nav">
            <button
              className="setup-wizard__nav-btn setup-wizard__nav-btn--back"
              onClick={handleBack}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
            
            <button
              className="setup-wizard__nav-btn setup-wizard__nav-btn--skip"
              onClick={onSkip}
            >
              Pular setup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
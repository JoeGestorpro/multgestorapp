import { useEffect, useState } from 'react'
import Barber from '../Barber'
import { WelcomeScreen, SetupWizard } from '../../components/onboarding'
import { TutorialSpotlight } from '../../components/tutorial'
import { useAuth } from '../../contexts/useAuth'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import api from '../../services/api'

function checkOnboardingCompleted() {
  return localStorage.getItem('onboarding_completed_barber') === 'true'
}

function setOnboardingCompleted(value) {
  localStorage.setItem('onboarding_completed_barber', value ? 'true' : 'false')
}

function checkTutorialSeen(companyId) {
  if (!companyId) return true
  return localStorage.getItem(`barbergestor_tutorial_seen_${companyId}`) === 'true'
}

function setTutorialSeen(companyId) {
  if (!companyId) return
  localStorage.setItem(`barbergestor_tutorial_seen_${companyId}`, 'true')
}

async function fetchOnboardingStatus(token) {
  try {
    const response = await api.get('/barber/company/onboarding-status', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data?.data?.onboarding_completed ?? false
  } catch {
    return checkOnboardingCompleted()
  }
}

const TUTORIAL_STEPS = [
  {
    title: 'Bem-vindo ao BarberGestor',
    description: 'Este é o painel principal da sua barbearia. Aqui você vê tudo em tempo real.',
    position: { top: 100, left: 280, width: 600, height: 150 }
  },
  {
    title: 'Atendimentos',
    description: 'Registre vendas, atendimentos e pagamentos rapidamente.',
    position: { top: 150, left: 50, width: 200, height: 60 }
  },
  {
    title: 'Agenda',
    description: 'Gerencie agendamentos e disponibilidade da equipe.',
    position: { top: 210, left: 50, width: 200, height: 60 }
  },
  {
    title: 'Caixa',
    description: 'Acompanhe o fluxo de caixa e fechamento do dia.',
    position: { top: 270, left: 50, width: 200, height: 60 }
  },
  {
    title: 'Equipe',
    description: 'Gerencie barbeiros, comissões e adiantamentos.',
    position: { top: 330, left: 50, width: 200, height: 60 }
  },
  {
    title: 'Pronto para começar!',
    description: 'Clique em "Novo atendimento" para registrar sua primeira venda.',
    position: { top: 400, left: 300, width: 200, height: 80 }
  }
]

function BarberDashboard() {
  const { user, isBarberAuthenticated, token } = useAuth()
  const { companyId: _companyId } = useTenantTheme()
  const [showWelcome, setShowWelcome] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    async function checkOnboarding() {
      if (!isBarberAuthenticated || !token) {
        setChecked(true)
        return
      }

      try {
        const statusCompleted = await fetchOnboardingStatus(token)
        const localCompleted = checkOnboardingCompleted()
        
        if (!statusCompleted && !localCompleted) {
          setShowWelcome(true)
        } else {
          setShowWelcome(false)
          setShowWizard(false)
          if (!checkTutorialSeen(user?.company_id)) {
            setShowTutorial(true)
          }
        }
      } catch {
        setShowWelcome(false)
        setShowWizard(false)
      } finally {
        setChecked(true)
      }
    }

    checkOnboarding()
  }, [isBarberAuthenticated, token, user?.company_id])

  const handleStartSetup = () => {
    setShowWelcome(false)
    setShowWizard(true)
  }

  const handleSkipWelcome = () => {
    setShowWelcome(false)
    setShowWizard(false)
    setOnboardingCompleted(true)
    setShowTutorial(true)
  }

  const handleCompleteSetup = () => {
    setShowWizard(false)
    setOnboardingCompleted(true)
    setShowTutorial(true)
  }

  const handleSkipSetup = () => {
    setShowWizard(false)
    setOnboardingCompleted(true)
    setShowTutorial(true)
  }

  const handleTutorialComplete = () => {
    setTutorialSeen(user?.company_id)
    setShowTutorial(false)
  }

  const handleTutorialSkip = () => {
    setTutorialSeen(user?.company_id)
    setShowTutorial(false)
  }

  if (!checked) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (showWelcome) {
    return <WelcomeScreen onStartSetup={handleStartSetup} onSkip={handleSkipWelcome} />
  }

  if (showWizard) {
    return <SetupWizard onComplete={handleCompleteSetup} onSkip={handleSkipSetup} />
  }

  return (
    <>
      <Barber />
      {showTutorial && (
        <TutorialSpotlight
          steps={TUTORIAL_STEPS}
          isActive={showTutorial}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
          autoStart={true}
        />
      )}
    </>
  )
}

export default BarberDashboard
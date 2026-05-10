import { useEffect, useState } from 'react'
import './TutorialSpotlight.css'

export default function TutorialSpotlight({ 
  steps = [],
  isActive = false,
  onComplete,
  onSkip,
  autoStart = false
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isActive) {
      if (autoStart || currentStep > 0) {
        setVisible(true)
      }
    } else {
      setVisible(false)
      setCurrentStep(0)
    }
  }, [isActive, autoStart])

  const currentStepData = steps[currentStep]
  if (!currentStepData || !visible) return null

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    setVisible(false)
    onComplete?.()
  }

  const handleSkip = () => {
    setVisible(false)
    onSkip?.()
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="tutorial-spotlight">
      <div className="tutorial-spotlight__overlay" onClick={handleSkip} />
      
      <div 
        className="tutorial-spotlight__spotlight"
        style={{
          top: currentStepData.position?.top || 0,
          left: currentStepData.position?.left || 0,
          width: currentStepData.position?.width || 200,
          height: currentStepData.position?.height || 100
        }}
      />

      <div 
        className={`tutorial-spotlight__tooltip ${currentStepData.tooltipPosition || 'bottom'}`}
        style={{
          top: currentStepData.tooltipPosition === 'top' 
            ? `calc(${currentStepData.position?.top}px - 160px)`
            : `calc(${currentStepData.position?.top} + ${currentStepData.position?.height}px + 16px)`,
          left: `calc(${currentStepData.position?.left}px + ${currentStepData.position?.width / 2}px - 160px)`,
          maxWidth: 320
        }}
      >
        <div className="tutorial-spotlight__header">
          <span className="tutorial-spotlight__step">
            Passo {currentStep + 1} de {steps.length}
          </span>
          <button className="tutorial-spotlight__skip" onClick={handleSkip}>
            Pular
          </button>
        </div>

        <div className="tutorial-spotlight__progress">
          <div 
            className="tutorial-spotlight__progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h3 className="tutorial-spotlight__title">{currentStepData.title}</h3>
        <p className="tutorial-spotlight__description">{currentStepData.description}</p>

        <div className="tutorial-spotlight__actions">
          {currentStep > 0 && (
            <button 
              className="tutorial-spotlight__btn tutorial-spotlight__btn--back"
              onClick={handlePrev}
            >
              Anterior
            </button>
          )}
          
          <button 
            className="tutorial-spotlight__btn tutorial-spotlight__btn--next"
            onClick={handleNext}
          >
            {currentStep < steps.length - 1 ? 'Próximo' : 'Concluir'}
          </button>
        </div>

        <div className="tutorial-spotlight__dots">
          {steps.map((_, index) => (
            <span 
              key={index}
              className={`tutorial-spotlight__dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
import { Check } from 'lucide-react'

const STEPS = [
  { key: 'client', label: 'Cliente' },
  { key: 'services', label: 'Servicos' },
  { key: 'payment', label: 'Pagamento' },
  { key: 'finish', label: 'Finalizar' }
]

function StepperPremium({ currentStep, onStepClick }) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep)

  const getStepState = (index) => {
    if (index < currentIndex) return 'done'
    if (index === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <div className="at-stepper">
      {STEPS.map((step, index) => {
        const state = getStepState(index)
        const isClickable = index <= currentIndex

        return (
          <div key={step.key} style={{ display: 'contents' }}>
            <button
              className={`at-stepper-item ${state}`}
              onClick={() => isClickable && onStepClick && onStepClick(step.key)}
              type="button"
              disabled={!isClickable}
              style={{ opacity: isClickable ? 1 : 0.5, cursor: isClickable ? 'pointer' : 'default' }}
            >
              <span className="at-stepper-number">
                {state === 'done' ? <Check size={12} /> : index + 1}
              </span>
              <span>{step.label}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div className={`at-stepper-line ${index < currentIndex ? 'done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default StepperPremium
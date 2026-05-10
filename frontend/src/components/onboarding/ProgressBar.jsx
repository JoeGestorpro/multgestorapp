import { useTenantTheme } from '../../hooks/useTenantTheme'
import './ProgressBar.css'

export default function ProgressBar({ currentStep, totalSteps, stepLabels }) {
  const { primaryColor } = useTenantTheme()
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100)

  return (
    <div className="setup-progress">
      <div className="setup-progress__header">
        <span className="setup-progress__step">
          Etapa {currentStep + 1} de {totalSteps}
        </span>
        <span className="setup-progress__percent">{progress}%</span>
      </div>

      <div className="setup-progress__bar">
        <div 
          className="setup-progress__fill"
          style={{ 
            width: `${progress}%`,
            '--progress-color': primaryColor
          }}
        />
      </div>

      <div className="setup-progress__steps">
        {stepLabels?.map((label, index) => (
          <div 
            key={index}
            className={[
              'setup-progress__step-item',
              index < currentStep && 'setup-progress__step-item--completed',
              index === currentStep && 'setup-progress__step-item--active',
              index > currentStep && 'setup-progress__step-item--pending'
            ].filter(Boolean).join(' ')}
          >
            <div className="setup-progress__step-dot">
              {index < currentStep ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className="setup-progress__step-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
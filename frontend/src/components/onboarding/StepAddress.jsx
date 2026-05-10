import { useState } from 'react'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import './StepAddress.css'

const WEEKDAYS = [
  { key: 'monday', label: 'Seg' },
  { key: 'tuesday', label: 'Ter' },
  { key: 'wednesday', label: 'Qua' },
  { key: 'thursday', label: 'Qui' },
  { key: 'friday', label: 'Sex' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
]

export default function StepAddress({ data, onChange, onNext }) {
  const { primaryColor } = useTenantTheme()
  const [showTimeForm, setShowTimeForm] = useState(false)

  const defaultHours = { open: '09:00', close: '20:00' }

  const handleToggleDay = (day) => {
    const current = data.business_hours?.[day] || null
    onChange({
      ...data,
      business_hours: {
        ...data.business_hours,
        [day]: current ? null : defaultHours
      }
    })
  }

  const handleTimeChange = (day, field, value) => {
    onChange({
      ...data,
      business_hours: {
        ...data.business_hours,
        [day]: {
          ...data.business_hours?.[day] || defaultHours,
          [field]: value
        }
      }
    })
  }

  return (
    <div className="step-address">
      <div className="step-address__header">
        <h2>Localização e horários</h2>
        <p>Configure o endereço e horário de funcionamento</p>
      </div>

      <div className="step-address__form">
        <div className="step-address__field">
          <label>Endereço</label>
          <input
            type="text"
            value={data.address || ''}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            placeholder="Rua, número, bairro, cidade"
            className="step-address__input"
          />
        </div>

        <div className="step-address__row">
          <div className="step-address__field">
            <label>Telefone</label>
            <input
              type="tel"
              value={data.phone || ''}
              onChange={(e) => onChange({ ...data, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="step-address__input"
            />
          </div>

          <div className="step-address__field">
            <label>WhatsApp</label>
            <input
              type="tel"
              value={data.whatsapp || ''}
              onChange={(e) => onChange({ ...data, whatsapp: e.target.value })}
              placeholder="(11) 99999-9999"
              className="step-address__input"
            />
          </div>
        </div>

        <div className="step-address__field">
          <button
            type="button"
            className="step-address__toggle"
            onClick={() => setShowTimeForm(!showTimeForm)}
            style={{ '--toggle-color': primaryColor }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {showTimeForm ? 'Ocultar horários' : 'Configurar horários de funcionamento'}
          </button>

          {showTimeForm && (
            <div className="step-address__hours">
              {WEEKDAYS.map((day) => {
                const hours = data.business_hours?.[day.key]
                const isOpen = Boolean(hours)
                return (
                  <div key={day.key} className="step-address__day">
                    <label className="step-address__day-toggle">
                      <input
                        type="checkbox"
                        checked={isOpen}
                        onChange={() => handleToggleDay(day.key)}
                      />
                      <span>{day.label}</span>
                    </label>
                    {isOpen && (
                      <div className="step-address__day-hours">
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleTimeChange(day.key, 'open', e.target.value)}
                          className="step-address__time"
                        />
                        <span>às</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleTimeChange(day.key, 'close', e.target.value)}
                          className="step-address__time"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="step-address__actions">
        <button 
          className="step-address__btn step-address__btn--primary"
          style={{ '--btn-color': primaryColor }}
          onClick={onNext}
        >
          Continuar
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
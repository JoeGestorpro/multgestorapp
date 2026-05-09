import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BarberIcon } from '../../components/barber/BarberUI'
import ServiceIcon from '../../components/barber/ServiceIcon'
import CollaboratorAvatar from '../../components/barber/CollaboratorAvatar'
import { BarberBadge } from '../../components/barber/BarberUI'
import api from '../../services/api'
import { anyCollaboratorValue, draftBookingKey, savePendingBooking } from './pendingBooking'
import { getStoredToken } from '../../services/authStorage'
import './BookingFlow.css'

const STEPS = {
  SERVICE: 1,
  PROFESSIONAL: 2,
  DATETIME: 3,
  SUMMARY: 4,
  AUTH: 5,
  SUCCESS: 6
}

const STEP_LABELS = {
  [STEPS.SERVICE]: 'Servico',
  [STEPS.PROFESSIONAL]: 'Profissional',
  [STEPS.DATETIME]: 'Data e Hora',
  [STEPS.SUMMARY]: 'Resumo',
  [STEPS.AUTH]: 'Identificacao',
  [STEPS.SUCCESS]: 'Confirmado'
}

const emptyForm = {
  serviceId: '',
  collaboratorId: anyCollaboratorValue,
  appointmentDate: '',
  appointmentTime: '',
  customerName: '',
  customerPhone: '',
  notes: ''
}

function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeZone: 'America/Cuiaba'
  }).format(new Date(`${value}T12:00:00-04:00`))
}

function formatShortDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BT', {
    day: '2-digit',
    month: 'short'
  }).format(new Date(value))
}

function buildStartsAt(date, time) {
  if (!date || !time) return ''
  const parsed = new Date(`${date}T${time}:00`)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

function isLogged() {
  return Boolean(getStoredToken('booking'))
}

function formatGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function BookingHeader({ company, currentStep, onBack, showBack }) {
  return (
    <header className="booking-header">
      <div className="booking-header-content">
        {showBack && onBack ? (
          <button className="booking-back-btn" onClick={onBack} type="button">
            <BarberIcon name="arrowLeft" />
          </button>
        ) : (
          <div className="booking-back-placeholder" />
        )}
        <div className="booking-brand">
          <div className="booking-brand-icon">
            <BarberIcon name="scissors" />
          </div>
          <div className="booking-brand-info">
            <span>{company?.name || 'BarberGestor'}</span>
            <small>Agendamento online</small>
          </div>
        </div>
        <div className="booking-header-spacer" />
      </div>
      <div className="booking-progress">
        {Object.entries(STEP_LABELS).map(([step, label]) => (
          <div
            key={step}
            className={`booking-progress-item ${Number(step) === currentStep ? 'active' : ''} ${Number(step) < currentStep ? 'done' : ''}`}
          >
            <div className="booking-progress-dot">
              {Number(step) < currentStep ? (
                <BarberIcon name="check" />
              ) : (
                <span>{step}</span>
              )}
            </div>
            <small>{label}</small>
          </div>
        ))}
      </div>
    </header>
  )
}

function ServiceCard({ service, selected, onSelect }) {
  return (
    <button
      className={`booking-service-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(service.id)}
      type="button"
    >
      <div className="booking-service-icon">
        <ServiceIcon icon={service.icon} name={service.name} />
      </div>
      <div className="booking-service-content">
        <h3>{service.name}</h3>
        {service.description && <p>{service.description}</p>}
        <div className="booking-service-meta">
          <span className="booking-service-duration">
            <BarberIcon name="clock" />
            {service.estimated_time_minutes || 30} min
          </span>
          <span className="booking-service-price">{money(service.price)}</span>
        </div>
      </div>
      <div className="booking-service-check">
        {selected && <BarberIcon name="check" />}
      </div>
    </button>
  )
}

function ProfessionalCard({ collaborator, selected, onSelect, allowAny }) {
  const isAny = collaborator.id === anyCollaboratorValue || collaborator.isAny

  return (
    <button
      className={`booking-professional-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(isAny ? anyCollaboratorValue : collaborator.id)}
      type="button"
    >
      {isAny ? (
        <div className="booking-professional-avatar any">
          <BarberIcon name="users" />
        </div>
      ) : (
        <CollaboratorAvatar
          avatarUrl={collaborator.avatar_url}
          name={collaborator.name || collaborator.nickname}
          size="lg"
        />
      )}
      <div className="booking-professional-content">
        <h3>{isAny ? 'Qualquer profissional' : (collaborator.name || collaborator.nickname)}</h3>
        <p>{isAny ? 'Primeiro horario disponivel' : (collaborator.specialty || 'Disponivel')}</p>
      </div>
      <div className="booking-professional-check">
        {selected ? <BarberIcon name="check" /> : <BarberIcon name="chevronRight" />}
      </div>
    </button>
  )
}

function Calendar({ selectedDate, onSelect, minDate }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  const days = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []

    for (let i = 0; i < firstDay; i++) {
      cells.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      cells.push(new Date(year, month, i))
    }

    return cells
  }, [viewDate])

  function prevMonth() {
    setViewDate(d => {
      const newD = new Date(d)
      newD.setMonth(newD.getMonth() - 1)
      return newD
    })
  }

  function nextMonth() {
    setViewDate(d => {
      const newD = new Date(d)
      newD.setMonth(newD.getMonth() + 1)
      return newD
    })
  }

  function isToday(date) {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  function isPast(date) {
    if (!date) return true
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  function isSelected(date) {
    if (!date || !selectedDate) return false
    return date.toISOString().slice(0, 10) === selectedDate
  }

  function formatDateKey(date) {
    if (!date) return ''
    return date.toISOString().slice(0, 10)
  }

  return (
    <div className="booking-calendar">
      <div className="booking-calendar-header">
        <button type="button" onClick={prevMonth} className="booking-calendar-nav">
          <BarberIcon name="arrowLeft" />
        </button>
        <span>
          {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
        <button type="button" onClick={nextMonth} className="booking-calendar-nav">
          <BarberIcon name="chevronRight" />
        </button>
      </div>
      <div className="booking-calendar-weekdays">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="booking-calendar-grid">
        {days.map((date, i) => (
          <button
            key={i}
            type="button"
            className={`booking-calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${isPast(date) ? 'past' : ''} ${isSelected(date) ? 'selected' : ''}`}
            disabled={!date || isPast(date)}
            onClick={() => date && !isPast(date) && onSelect(formatDateKey(date))}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}

function TimeSlots({ slots, selected, onSelect, loading }) {
  if (loading) {
    return (
      <div className="booking-slots-loading">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="booking-slot-skeleton" />
        ))}
      </div>
    )
  }

  if (!slots.length) {
    return (
      <div className="booking-slots-empty">
        <BarberIcon name="calendar" />
        <p>Selecione uma data para ver os horarios</p>
      </div>
    )
  }

  const available = slots.filter(s => s.available)
  const unavailable = slots.filter(s => !s.available)

  return (
    <div className="booking-slots">
      {available.length > 0 ? (
        <>
          <p className="booking-slots-hint">{available.length} horarios disponiveis</p>
          <div className="booking-slots-grid">
            {available.map(slot => (
              <button
                key={`${slot.starts_at}-${slot.collaborator_id || 'any'}`}
                type="button"
                className={`booking-slot ${selected === slot.time ? 'selected' : ''}`}
                onClick={() => onSelect(slot.time)}
              >
                <span>{slot.time}</span>
                {slot.collaborator_name && <small>{slot.collaborator_name}</small>}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="booking-slots-empty">
          <BarberIcon name="clock" />
          <p>Nenhum horario disponivel para esta data</p>
        </div>
      )}
    </div>
  )
}

function BookingSummary({ form, service, collaborator, company, onConfirm, loading }) {
  const dateLabel = form.appointmentDate ? formatDate(form.appointmentDate) : ''
  const collaboratorName = collaborator?.name || collaborator?.nickname || 'A definir'

  return (
    <div className="booking-summary">
      <div className="booking-summary-card">
        <h3>Resumo do agendamento</h3>
        
        <div className="booking-summary-row">
          <div className="booking-summary-icon">
            <BarberIcon name="scissors" />
          </div>
          <div className="booking-summary-content">
            <span>Servico</span>
            <strong>{service?.name || 'Nao selecionado'}</strong>
          </div>
        </div>

        <div className="booking-summary-row">
          <div className="booking-summary-icon">
            <BarberIcon name="users" />
          </div>
          <div className="booking-summary-content">
            <span>Profissional</span>
            <strong>{collaboratorName}</strong>
          </div>
        </div>

        <div className="booking-summary-row">
          <div className="booking-summary-icon">
            <BarberIcon name="calendar" />
          </div>
          <div className="booking-summary-content">
            <span>Data</span>
            <strong>{dateLabel}</strong>
          </div>
        </div>

        <div className="booking-summary-row">
          <div className="booking-summary-icon">
            <BarberIcon name="clock" />
          </div>
          <div className="booking-summary-content">
            <span>Horario</span>
            <strong>{form.appointmentTime || '--:--'}</strong>
          </div>
        </div>

        <div className="booking-summary-row">
          <div className="booking-summary-icon">
            <BarberIcon name="catalog" />
          </div>
          <div className="booking-summary-content">
            <span>Duracao</span>
            <strong>{service?.estimated_time_minutes || 30} min</strong>
          </div>
        </div>

        <div className="booking-summary-divider" />

        <div className="booking-summary-total">
          <span>Valor total</span>
          <strong>{money(service?.price)}</strong>
        </div>
      </div>

      <div className="booking-summary-actions">
        <button
          type="button"
          className="booking-confirm-btn"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="booking-btn-spinner" />
              <span>Confirmando...</span>
            </>
          ) : (
            <>
              <BarberIcon name="check" />
              <span>Confirmar agendamento</span>
            </>
          )}
        </button>
        <p className="booking-summary-note">
          Ao confirmar, voce concorda com as politicas de agendamento
        </p>
      </div>
    </div>
  )
}

function AuthForm({ onSubmit, loading, error, onBack }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  })
  const [mode, setMode] = useState('login')

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(form, mode)
  }

  return (
    <div className="booking-auth">
      <div className="booking-auth-card">
        <h2>{mode === 'login' ? 'Faca seu login' : 'Crie sua conta'}</h2>
        <p>Precisamos te identificar para confirmar seu agendamento</p>

        {error && <div className="booking-auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="booking-auth-form">
          {mode === 'register' && (
            <div className="booking-field">
              <label>Nome completo</label>
              <div className="booking-input-wrap">
                <BarberIcon name="users" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
            </div>
          )}

          <div className="booking-field">
            <label>Telefone / WhatsApp</label>
            <div className="booking-input-wrap">
              <BarberIcon name="phone" />
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
          </div>

          <div className="booking-field">
            <label>E-mail</label>
            <div className="booking-input-wrap">
              <BarberIcon name="mail" />
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="booking-field">
            <label>Senha</label>
            <div className="booking-input-wrap">
              <BarberIcon name="lock" />
              <input
                type="password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="********"
                required
              />
            </div>
          </div>

          <button type="submit" className="booking-auth-submit" disabled={loading}>
            {loading ? (
              <>
                <div className="booking-btn-spinner" />
                <span>Aguarde...</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Entrar' : 'Criar conta'}</span>
            )}
          </button>
        </form>

        <div className="booking-auth-toggle">
          {mode === 'login' ? (
            <p>
              Nao tem conta?{' '}
              <button type="button" onClick={() => setMode('register')}>
                Cadastre-se
              </button>
            </p>
          ) : (
            <p>
              Ja tem conta?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Faca login
              </button>
            </p>
          )}
        </div>

        <button type="button" className="booking-auth-back" onClick={onBack}>
          <BarberIcon name="arrowLeft" />
          <span>Voltar ao agendamento</span>
        </button>
      </div>
    </div>
  )
}

function SuccessScreen({ form, service, collaborator, company, onDone }) {
  return (
    <div className="booking-success">
      <div className="booking-success-icon">
        <BarberIcon name="check" />
      </div>
      <h2>Agendamento confirmado!</h2>
      <p>Seu horario foi reservado com sucesso</p>

      <div className="booking-success-card">
        <div className="booking-success-row">
          <BarberIcon name="scissors" />
          <div>
            <small>Servico</small>
            <strong>{service?.name}</strong>
          </div>
        </div>
        <div className="booking-success-row">
          <BarberIcon name="calendar" />
          <div>
            <small>Data</small>
            <strong>{form.appointmentDate ? formatDate(form.appointmentDate) : ''}</strong>
          </div>
        </div>
        <div className="booking-success-row">
          <BarberIcon name="clock" />
          <div>
            <small>Horario</small>
            <strong>{form.appointmentTime}</strong>
          </div>
        </div>
        <div className="booking-success-row">
          <BarberIcon name="users" />
          <div>
            <small>Profissional</small>
            <strong>{collaborator?.name || collaborator?.nickname || 'A definir'}</strong>
          </div>
        </div>
      </div>

      <div className="booking-success-actions">
        <Link to={`/agendar/${company?.public_booking_slug}/minha-conta`} className="booking-success-primary">
          <span>Ver meus agendamentos</span>
          <BarberIcon name="chevronRight" />
        </Link>
        <button type="button" className="booking-success-secondary" onClick={onDone}>
          <BarberIcon name="home" />
          <span>Novo agendamento</span>
        </button>
      </div>
    </div>
  )
}

function BookingFlow() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(STEPS.SERVICE)
  const [company, setCompany] = useState(null)
  const [services, setServices] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [settings, setSettings] = useState(null)
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [authError, setAuthError] = useState('')

  const selectedService = useMemo(() =>
    services.find(s => s.id === form.serviceId),
    [form.serviceId, services]
  )

  const selectedCollaborator = useMemo(() => {
    if (form.collaboratorId === anyCollaboratorValue) return null
    return collaborators.find(c => c.id === form.collaboratorId)
  }, [form.collaboratorId, collaborators])

  const collaboratorsWithAny = useMemo(() => {
    const list = [...collaborators]
    if (settings?.allow_any_collaborator !== false) {
      list.unshift({ id: anyCollaboratorValue, isAny: true, name: 'Qualquer profissional' })
    }
    return list
  }, [collaborators, settings])

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case STEPS.SERVICE: return !!form.serviceId
      case STEPS.PROFESSIONAL: return true
      case STEPS.DATETIME: return !!form.appointmentDate && !!form.appointmentTime
      case STEPS.SUMMARY: return true
      default: return false
    }
  }, [currentStep, form])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError('')
        const { data } = await api.get(`/barber/public/${slug}/booking-info`)
        setCompany(data.data.company)
        setServices(data.data.services || [])
        setCollaborators(data.data.collaborators || [])
        setSettings(data.data.settings)

        const draft = localStorage.getItem(draftBookingKey(slug))
        if (draft) {
          const parsed = JSON.parse(draft)
          setForm(f => ({ ...f, ...parsed }))
          if (parsed.serviceId) setCurrentStep(STEPS.PROFESSIONAL)
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [slug])

  useEffect(() => {
    localStorage.setItem(draftBookingKey(slug), JSON.stringify(form))
  }, [form, slug])

  useEffect(() => {
    async function loadSlots() {
      if (!form.serviceId || !form.appointmentDate) {
        setSlots([])
        return
      }

      try {
        setSlotsLoading(true)
        const params = {
          serviceId: form.serviceId,
          date: form.appointmentDate
        }
        if (form.collaboratorId && form.collaboratorId !== anyCollaboratorValue) {
          params.collaboratorId = form.collaboratorId
        }
        const { data } = await api.get(`/barber/public/${slug}/available-slots`, { params })
        setSlots(data.data.slots || [])
      } catch {
        setSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }
    loadSlots()
  }, [form.serviceId, form.appointmentDate, form.collaboratorId, slug])

  function selectService(serviceId) {
    setForm(f => ({ ...f, serviceId, appointmentTime: '' }))
  }

  function selectProfessional(collaboratorId) {
    setForm(f => ({ ...f, collaboratorId, appointmentTime: '' }))
  }

  function selectDate(date) {
    setForm(f => ({ ...f, appointmentDate: date, appointmentTime: '' }))
  }

  function selectTime(time) {
    setForm(f => ({ ...f, appointmentTime: time }))
  }

  function goNext() {
    if (!canProceed) return
    setCurrentStep(s => Math.min(s + 1, STEPS.SUMMARY))
  }

  function goBack() {
    setCurrentStep(s => Math.max(s - 1, STEPS.SERVICE))
  }

  function handleConfirm() {
    if (isLogged()) {
      submitAppointment()
    } else {
      setCurrentStep(STEPS.AUTH)
    }
  }

  async function submitAppointment() {
    try {
      setSubmitting(true)
      setError('')
      const startsAt = buildStartsAt(form.appointmentDate, form.appointmentTime)
      const payload = {
        serviceId: form.serviceId,
        collaboratorId: form.collaboratorId === anyCollaboratorValue ? null : form.collaboratorId,
        startsAt,
        customerName: form.customerName || company?.name,
        customerPhone: form.customerPhone,
        notes: form.notes
      }
      await api.post(`/barber/public/${slug}/appointments`, payload)
      localStorage.removeItem(draftBookingKey(slug))
      setCurrentStep(STEPS.SUCCESS)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao confirmar')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAuth(formData, mode) {
    try {
      setAuthError('')
      setSubmitting(true)
      
      if (mode === 'register') {
        await api.post(`/barber/public/${slug}/register`, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          password: formData.password
        })
      }

      await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      })

      await submitAppointment()
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Erro na autenticacao')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSuccessDone() {
    setForm(emptyForm)
    setCurrentStep(STEPS.SERVICE)
  }

  if (loading) {
    return (
      <div className="booking-flow booking-loading">
        <div className="booking-loading-spinner" />
        <p>Carregando barbearia...</p>
      </div>
    )
  }

  if (error && !company) {
    return (
      <div className="booking-flow booking-error">
        <BarberIcon name="close" />
        <h2>Ops!</h2>
        <p>{error}</p>
        <Link to="/" className="booking-error-btn">Voltar ao inicio</Link>
      </div>
    )
  }

  return (
    <div className="booking-flow">
      {currentStep !== STEPS.SUCCESS && (
        <BookingHeader
          company={company}
          currentStep={currentStep}
          showBack={currentStep > STEPS.SERVICE}
          onBack={goBack}
        />
      )}

      <main className="booking-content">
        {currentStep === STEPS.SERVICE && (
          <div className="booking-step">
            <div className="booking-step-header">
              <h1>Escolha o servico</h1>
              <p>Selecione o atendimento desejado</p>
            </div>
            <div className="booking-services">
              {services.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={form.serviceId === service.id}
                  onSelect={selectService}
                />
              ))}
            </div>
          </div>
        )}

        {currentStep === STEPS.PROFESSIONAL && (
          <div className="booking-step">
            <div className="booking-step-header">
              <h1>Escolha o profissional</h1>
              <p>Ou deixe-nos escolher o primeiro disponivel</p>
            </div>
            <div className="booking-professionals">
              {collaboratorsWithAny.map(collab => (
                <ProfessionalCard
                  key={collab.id}
                  collaborator={collab}
                  selected={form.collaboratorId === collab.id}
                  onSelect={selectProfessional}
                  allowAny={settings?.allow_any_collaborator !== false}
                />
              ))}
            </div>
          </div>
        )}

        {currentStep === STEPS.DATETIME && (
          <div className="booking-step">
            <div className="booking-step-header">
              <h1>Escolha data e hora</h1>
              <p>Horarios considerando agenda e bloqueios</p>
            </div>
            <Calendar
              selectedDate={form.appointmentDate}
              onSelect={selectDate}
            />
            {form.appointmentDate && (
              <TimeSlots
                slots={slots}
                selected={form.appointmentTime}
                onSelect={selectTime}
                loading={slotsLoading}
              />
            )}
          </div>
        )}

        {currentStep === STEPS.SUMMARY && (
          <BookingSummary
            form={form}
            service={selectedService}
            collaborator={selectedCollaborator}
            company={company}
            onConfirm={handleConfirm}
            loading={submitting}
          />
        )}

        {currentStep === STEPS.AUTH && (
          <AuthForm
            onSubmit={handleAuth}
            loading={submitting}
            error={authError}
            onBack={goBack}
          />
        )}

        {currentStep === STEPS.SUCCESS && (
          <SuccessScreen
            form={form}
            service={selectedService}
            collaborator={selectedCollaborator}
            company={company}
            onDone={handleSuccessDone}
          />
        )}
      </main>

      {currentStep !== STEPS.AUTH && currentStep !== STEPS.SUCCESS && currentStep !== STEPS.SUMMARY && (
        <footer className="booking-footer">
          <button
            type="button"
            className="booking-next-btn"
            onClick={goNext}
            disabled={!canProceed}
          >
            <span>Continuar</span>
            <BarberIcon name="chevronRight" />
          </button>
        </footer>
      )}
    </div>
  )
}

export default BookingFlow

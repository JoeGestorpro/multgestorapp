import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CollaboratorAvatar from '../components/barber/CollaboratorAvatar'
import ServiceIcon from '../components/barber/ServiceIcon'
import { BarberBadge, BarberButton, BarberCard, BarberIcon } from '../components/barber/BarberUI'
import api from '../services/api'
import { getStoredToken } from '../services/authStorage'
import { anyCollaboratorValue, draftBookingKey, savePendingBooking } from './booking/pendingBooking'
import './Barber.css'

const emptyBookingForm = {
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

function formatDateLabel(value) {
  if (!value) {
    return 'Selecione uma data'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeZone: 'America/Cuiaba'
  }).format(new Date(`${value}T12:00:00-04:00`))
}

function buildStartsAt(date, time) {
  const normalizedDate = String(date || '').trim()
  const normalizedTime = String(time || '').trim()

  if (!normalizedDate || !normalizedTime) {
    return ''
  }

  const parsed = new Date(`${normalizedDate}T${normalizedTime}:00`)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

function formatGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'Bom dia'
  }

  if (hour < 18) {
    return 'Boa tarde'
  }

  return 'Boa noite'
}

function isClientLogged() {
  return Boolean(getStoredToken('booking'))
}

function MobileBottomNav({ active = 'booking' }) {
  const items = [
    ['home', 'Inicio', 'dashboard'],
    ['discover', 'Explorar', 'catalog'],
    ['booking', 'Horario', 'calendar'],
    ['messages', 'Alertas', 'bell'],
    ['account', 'Conta', 'users']
  ]

  return (
    <nav className="client-booking-bottom-nav" aria-label="Navegacao do cliente">
      {items.map(([key, label, icon]) => (
        <button
          className={`client-booking-bottom-item ${active === key ? 'active' : ''}`}
          key={key}
          type="button"
        >
          <span className="client-booking-bottom-icon">
            <BarberIcon name={icon} />
          </span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  )
}

function PublicBooking() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [booking, setBooking] = useState({
    company: null,
    services: [],
    collaborators: [],
    settings: null
  })
  const [availability, setAvailability] = useState([])
  const [form, setForm] = useState(emptyBookingForm)

  useEffect(() => {
    async function loadBooking() {
      setLoading(true)
      setError('')

      try {
        const response = await api.get(`/barber/public/${slug}/booking-info`)
        const data = response.data.data
        const storedDraft = window.localStorage.getItem(draftBookingKey(slug))
        const parsedDraft = storedDraft ? JSON.parse(storedDraft) : {}
        const defaultCollaboratorId = data.settings?.allow_any_collaborator !== false
          ? anyCollaboratorValue
          : (data.collaborators[0]?.id || '')

        setBooking(data)
        setForm({
          ...emptyBookingForm,
          ...parsedDraft,
          serviceId: parsedDraft.serviceId || data.services[0]?.id || '',
          collaboratorId: parsedDraft.collaboratorId || defaultCollaboratorId,
          appointmentDate: parsedDraft.appointmentDate || '',
          appointmentTime: parsedDraft.appointmentTime || '',
          customerName: parsedDraft.customerName || '',
          customerPhone: parsedDraft.customerPhone || '',
          notes: parsedDraft.notes || ''
        })
      } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel carregar o link de agendamento')
      } finally {
        setLoading(false)
      }
    }

    loadBooking()
  }, [slug])

  useEffect(() => {
    window.localStorage.setItem(draftBookingKey(slug), JSON.stringify(form))
  }, [form, slug])

  useEffect(() => {
    async function loadAvailability() {
      if (!form.serviceId || !form.appointmentDate) {
        setAvailability([])
        return
      }

      if (!booking.settings?.allow_any_collaborator && !form.collaboratorId) {
        setAvailability([])
        return
      }

      setAvailabilityLoading(true)
      setError('')

      try {
        const params = {
          serviceId: form.serviceId,
          date: form.appointmentDate
        }

        if (form.collaboratorId && form.collaboratorId !== anyCollaboratorValue) {
          params.collaboratorId = form.collaboratorId
        }

        const response = await api.get(`/barber/public/${slug}/available-slots`, { params })
        setAvailability(response.data.data.slots || [])
      } catch (err) {
        setAvailability([])
        setError(err.response?.data?.error || 'Nao foi possivel consultar a disponibilidade')
      } finally {
        setAvailabilityLoading(false)
      }
    }

    loadAvailability()
  }, [booking.settings?.allow_any_collaborator, form.appointmentDate, form.collaboratorId, form.serviceId, slug])

  const filteredServices = useMemo(() => {
    const search = String(serviceSearch || '').trim().toLowerCase()

    if (!search) {
      return booking.services
    }

    return booking.services.filter((service) => (
      String(service.name || '').toLowerCase().includes(search)
      || String(service.description || '').toLowerCase().includes(search)
    ))
  }, [booking.services, serviceSearch])

  const selectedService = useMemo(() => (
    booking.services.find((service) => service.id === form.serviceId) || null
  ), [booking.services, form.serviceId])

  const featuredServices = useMemo(() => filteredServices.slice(0, 5), [filteredServices])

  const selectedCollaborator = useMemo(() => {
    if (form.collaboratorId === anyCollaboratorValue) {
      return null
    }

    return booking.collaborators.find((collaborator) => collaborator.id === form.collaboratorId) || null
  }, [booking.collaborators, form.collaboratorId])

  const selectedSlot = useMemo(() => (
    availability.find((slot) => slot.time === form.appointmentTime) || null
  ), [availability, form.appointmentTime])

  const availableSlots = useMemo(() => availability.filter((slot) => slot.available), [availability])

  const minimumAdvanceMessage = useMemo(() => {
    const enabled = booking.settings?.online_min_advance_enabled === true
    const value = Number(booking.settings?.online_min_advance_value || 0)

    if (!enabled || value <= 0) {
      return ''
    }

    return `Escolha um horario com pelo menos ${value} horas de antecedencia.`
  }, [booking.settings?.online_min_advance_enabled, booking.settings?.online_min_advance_value])

  const resolvedCollaboratorName = selectedCollaborator?.name
    || selectedCollaborator?.nickname
    || selectedSlot?.collaborator_name
    || 'Profissional disponivel'

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value
    }))
  }

  function selectService(serviceId) {
    setForm((current) => ({
      ...current,
      serviceId,
      appointmentTime: ''
    }))
  }

  function selectCollaborator(collaboratorId) {
    setForm((current) => ({
      ...current,
      collaboratorId,
      appointmentTime: ''
    }))
  }

  async function createAppointment(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      setSaving(true)
      const startsAt = buildStartsAt(form.appointmentDate, form.appointmentTime)
      const appointmentPayload = {
        serviceId: form.serviceId,
        collaboratorId: form.collaboratorId === anyCollaboratorValue ? selectedSlot?.collaborator_id || null : form.collaboratorId,
        startsAt,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        notes: form.notes
      }

      if (!isClientLogged()) {
        savePendingBooking(slug, {
          payload: appointmentPayload,
          summary: {
            companyName: booking.company?.name || 'BarberGestor',
            serviceName: selectedService?.name || 'Servico selecionado',
            servicePrice: selectedService?.price || 0,
            serviceDuration: `${selectedService?.estimated_time_minutes || 30} min`,
            collaboratorName: resolvedCollaboratorName,
            appointmentDate: form.appointmentDate,
            appointmentTime: form.appointmentTime,
            dateLabel: formatDateLabel(form.appointmentDate),
            customerName: form.customerName,
            customerPhone: form.customerPhone
          },
          createdAt: new Date().toISOString()
        })
        navigate(`/agendar/${slug}/login`, { replace: true })
        return
      }

      await api.post(`/barber/public/${slug}/appointments`, appointmentPayload)

      setSuccess(booking.settings?.confirmation_message || 'Agendamento criado com sucesso. Em breve a barbearia podera confirmar pelo WhatsApp.')
      setAvailability((current) => current.map((slot) => (
        slot.time === form.appointmentTime ? { ...slot, available: false } : slot
      )))
      setForm((current) => ({
        ...current,
        appointmentTime: '',
        notes: ''
      }))
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel concluir o agendamento')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <main className="barber-public-shell"><div className="barber-public-loading">Carregando agenda...</div></main>
  }

  return (
    <main className="client-booking-mobile">
      <section className="client-booking-viewport">
        <div className="client-booking-phone">
          <header className="client-booking-header">
            <div>
              <span>Agendamento online</span>
              <h1>{formatGreeting()}, {booking.company?.name || 'vamos reservar'}</h1>
              <p>Escolha o melhor horario com uma experiencia pensada para celular.</p>
            </div>
            <button className="client-booking-notification" type="button" aria-label="Alertas">
              <BarberIcon name="bell" />
            </button>
          </header>

          <div className="client-booking-search">
            <BarberIcon name="catalog" />
            <input
              onChange={(event) => setServiceSearch(event.target.value)}
              placeholder="Buscar servico"
              type="search"
              value={serviceSearch}
            />
          </div>

          <section className="client-booking-special">
            <div>
              <span>Servico em destaque</span>
              <h2>{selectedService?.name || filteredServices[0]?.name || 'Seu proximo cuidado premium'}</h2>
              <p>{selectedService?.description || filteredServices[0]?.description || 'Agende com poucos toques em uma jornada limpa, elegante e intuitiva.'}</p>
            </div>
            <div className="client-booking-special-price">
              <strong>{selectedService ? money(selectedService.price) : 'R$ 0,00'}</strong>
              <span>{selectedService?.estimated_time_minutes || 30} min</span>
            </div>
          </section>

          <section className="client-booking-section">
            <div className="client-booking-section-head">
              <h3>Servicos</h3>
            </div>
            <div className="client-booking-category-row">
              {featuredServices.map((service) => (
                <button
                  className={`client-booking-category-card ${form.serviceId === service.id ? 'active' : ''}`}
                  key={service.id}
                  onClick={() => selectService(service.id)}
                  type="button"
                >
                  <span>
                    <ServiceIcon icon={service.icon} name={service.name} />
                  </span>
                  <strong>{service.name}</strong>
                </button>
              ))}
            </div>
          </section>

          {error && <div className="barber-message barber-message-error">{error}</div>}
          {success && <div className="barber-message barber-message-success">{success}</div>}

          <form className="client-booking-stack" onSubmit={createAppointment}>
            <BarberCard className="client-booking-service-hero">
              <div className="client-booking-service-media">
                <span>
                  <ServiceIcon icon={selectedService?.icon} name={selectedService?.name || 'Servico'} />
                </span>
                <div className="client-booking-avatar-cluster">
                  {booking.collaborators.slice(0, 3).map((collaborator) => (
                    <CollaboratorAvatar
                      avatarUrl={collaborator.avatar_url}
                      key={collaborator.id}
                      name={collaborator.name || collaborator.nickname}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
              <div className="client-booking-service-copy">
                <h2>{selectedService?.name || 'Escolha um servico'}</h2>
                <p>{selectedService?.description || 'Selecione um servico para visualizar a disponibilidade real.'}</p>
                <div className="client-booking-service-stats">
                  <BarberBadge tone="warning">{selectedService?.estimated_time_minutes || 30} min</BarberBadge>
                  <BarberBadge tone="success">{selectedService ? money(selectedService.price) : 'R$ 0,00'}</BarberBadge>
                </div>
                <div className="client-booking-service-actions">
                  <button type="button" aria-label="Alertas">
                    <BarberIcon name="bell" />
                  </button>
                  <button type="button" aria-label="Calendario">
                    <BarberIcon name="calendar" />
                  </button>
                  <button type="button" aria-label="Trocar">
                    <BarberIcon name="switch" />
                  </button>
                </div>
              </div>
            </BarberCard>

            <BarberCard className="client-booking-card">
              <div className="client-booking-section-head">
                <h3>Profissional</h3>
                {booking.settings?.allow_any_collaborator !== false && <BarberBadge tone="admin">Flexivel</BarberBadge>}
              </div>

              <div className="client-booking-professionals">
                {booking.settings?.allow_any_collaborator !== false && (
                  <button
                    className={`client-booking-professional-card ${form.collaboratorId === anyCollaboratorValue ? 'active' : ''}`}
                    onClick={() => selectCollaborator(anyCollaboratorValue)}
                    type="button"
                  >
                    <span><BarberIcon name="users" /></span>
                    <strong>Qualquer profissional</strong>
                    <small>Primeiro horario livre da equipe</small>
                  </button>
                )}

                {booking.collaborators.map((collaborator) => (
                  <button
                    className={`client-booking-professional-card ${form.collaboratorId === collaborator.id ? 'active' : ''}`}
                    key={collaborator.id}
                    onClick={() => selectCollaborator(collaborator.id)}
                    type="button"
                  >
                    <CollaboratorAvatar
                      avatarUrl={collaborator.avatar_url}
                      name={collaborator.name || collaborator.nickname}
                      size="md"
                    />
                    <strong>{collaborator.name || collaborator.nickname}</strong>
                    <small>Disponivel</small>
                  </button>
                ))}
              </div>
            </BarberCard>

            <BarberCard className="client-booking-card client-booking-date-card">
              <div className="client-booking-section-head">
                <h3>Selecionar data</h3>
              </div>
              <label className="client-booking-date-field" htmlFor="public-appointment-date">
                <span>Data escolhida</span>
                <input
                  className="barber-input"
                  id="public-appointment-date"
                  min={new Date().toISOString().slice(0, 10)}
                  name="appointmentDate"
                  onChange={updateForm}
                  required
                  type="date"
                  value={form.appointmentDate}
                />
              </label>
              <div className="client-booking-date-display">
                <strong>{formatDateLabel(form.appointmentDate)}</strong>
                <small>Os horarios ja respeitam agenda da equipe, bloqueios e regras online.</small>
              </div>
            </BarberCard>

            <BarberCard className="client-booking-card">
              <div className="client-booking-section-head">
                <h3>Selecionar horario</h3>
                <BarberBadge tone="warning">{availableSlots.length} livres</BarberBadge>
              </div>

              {availabilityLoading ? (
                <div className="barber-public-slot-grid"><span>Carregando horarios...</span></div>
              ) : availability.length > 0 ? (
                <div className="client-booking-slots">
                  {minimumAdvanceMessage ? (
                    <span className="barber-public-slot-hint">{minimumAdvanceMessage}</span>
                  ) : null}
                  {availableSlots.map((slot) => (
                    <button
                      className={`client-booking-slot ${form.appointmentTime === slot.time ? 'active' : ''}`}
                      key={`${slot.starts_at}-${slot.collaborator_id || 'any'}`}
                      onClick={() => setForm((current) => ({ ...current, appointmentTime: slot.time }))}
                      type="button"
                    >
                      <span>{slot.time}</span>
                      {slot.collaborator_name && <small>{slot.collaborator_name}</small>}
                    </button>
                  ))}
                  {availableSlots.length === 0 && (
                    <span>{minimumAdvanceMessage || 'Nenhum horario disponivel para a data escolhida.'}</span>
                  )}
                </div>
              ) : (
                <div className="barber-public-slot-grid">
                  <span>Selecione servico, profissional e data para ver os horarios reais.</span>
                </div>
              )}
            </BarberCard>

            <BarberCard className="client-booking-card">
              <div className="client-booking-section-head">
                <h3>Seus dados</h3>
              </div>

              <div className="client-booking-form-grid">
                <label className="barber-form-block" htmlFor="public-customer-name">
                  <span>Seu nome</span>
                  <input
                    className="barber-input"
                    id="public-customer-name"
                    name="customerName"
                    onChange={updateForm}
                    placeholder="Como voce gostaria de ser chamado"
                    required
                    type="text"
                    value={form.customerName}
                  />
                </label>

                <label className="barber-form-block" htmlFor="public-customer-phone">
                  <span>WhatsApp</span>
                  <input
                    className="barber-input"
                    id="public-customer-phone"
                    name="customerPhone"
                    onChange={updateForm}
                    placeholder="(00) 00000-0000"
                    required
                    type="tel"
                    value={form.customerPhone}
                  />
                </label>

                <label className="barber-form-block" htmlFor="public-booking-notes">
                  <span>Observacoes</span>
                  <textarea
                    className="barber-textarea"
                    id="public-booking-notes"
                    name="notes"
                    onChange={updateForm}
                    placeholder="Algo que a equipe precise saber?"
                    rows="4"
                    value={form.notes}
                  />
                </label>
              </div>
            </BarberCard>

            <BarberCard className="client-booking-card">
              <div className="client-booking-section-head">
                <h3>Resumo do agendamento</h3>
              </div>
              <div className="client-booking-summary">
                <div>
                  <span>Servico</span>
                  <strong>{selectedService?.name || 'Escolha um servico'}</strong>
                </div>
                <div>
                  <span>Profissional</span>
                  <strong>{resolvedCollaboratorName}</strong>
                </div>
                <div>
                  <span>Data</span>
                  <strong>{formatDateLabel(form.appointmentDate)}</strong>
                </div>
                <div>
                  <span>Horario</span>
                  <strong>{form.appointmentTime || 'Selecione um horario'}</strong>
                </div>
              </div>
            </BarberCard>

            <div className="client-booking-bottom-space" />

            <div className="client-booking-sticky-cta">
              <BarberButton
                className="client-booking-primary-cta"
                disabled={saving || !form.appointmentTime || !form.customerName || !form.customerPhone}
                type="submit"
                variant="primary"
              >
                <BarberIcon name={saving ? 'clock' : 'calendar'} />
                <span>{saving ? 'Confirmando...' : 'Confirmar horario'}</span>
              </BarberButton>
            </div>
          </form>

          <MobileBottomNav active="booking" />
        </div>
      </section>
    </main>
  )
}

export default PublicBooking

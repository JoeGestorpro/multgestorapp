import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CollaboratorAvatar from '../components/barber/CollaboratorAvatar'
import ServiceIcon from '../components/barber/ServiceIcon'
import { BarberBadge, BarberButton, BarberCard, BarberEmptyState, BarberIcon } from '../components/barber/BarberUI'
import { useBookingAuth } from '../contexts/useBookingAuth'
import api from '../services/api'
import { getAuthHeaders } from '../services/authStorage'
import './Barber.css'

const anyCollaboratorValue = 'any'

const emptyBookingForm = {
  serviceId: '',
  collaboratorId: anyCollaboratorValue,
  appointmentDate: '',
  appointmentTime: '',
  notes: ''
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Cuiaba'
  }).format(new Date(value))
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

function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}

function getFirstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'Cliente'
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

function getStatusBucket(status) {
  if (['completed'].includes(status)) {
    return 'completed'
  }

  if (['canceled', 'no_show'].includes(status)) {
    return 'canceled'
  }

  return 'upcoming'
}

function getStatusLabel(status) {
  const labels = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    arrived: 'Chegou',
    in_progress: 'Em atendimento',
    completed: 'Concluido',
    canceled: 'Cancelado',
    no_show: 'Faltou'
  }

  return labels[status] || status
}

function getStatusTone(status) {
  const tones = {
    scheduled: 'warning',
    confirmed: 'success',
    arrived: 'admin',
    in_progress: 'info',
    completed: 'neutral',
    canceled: 'danger',
    no_show: 'danger'
  }

  return tones[status] || 'neutral'
}

function getAlertsFromAppointments(appointments = []) {
  return appointments.slice(0, 6).map((appointment) => ({
    id: appointment.id,
    title: `${getStatusLabel(appointment.status)}: ${appointment.service_name}`,
    description: `${appointment.collaborator_name} • ${formatDateTime(appointment.starts_at)}`,
    tone: getStatusTone(appointment.status)
  }))
}

function MobileBottomNav({ active, onChange }) {
  const items = [
    ['appointments', 'Agenda', 'calendar'],
    ['services', 'Servicos', 'catalog'],
    ['booking', 'Novo', 'plus'],
    ['alerts', 'Avisos', 'bell'],
    ['profile', 'Perfil', 'users']
  ]

  return (
    <nav className="barber-mobile-bottom-nav" aria-label="Navegacao do cliente">
      {items.map(([key, label, icon]) => (
        <button
          aria-label={label}
          aria-current={active === key ? 'page' : undefined}
          className={`barber-mobile-bottom-item ${active === key ? 'active' : ''} ${key === 'booking' ? 'is-primary' : ''}`}
          key={key}
          onClick={() => onChange(key)}
          type="button"
        >
          <span className="barber-mobile-bottom-icon">
            <BarberIcon name={icon} />
          </span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  )
}

function ClientAppointments() {
  const { user, logout } = useBookingAuth()
  const [clientTab, setClientTab] = useState('appointments')
  const [appointments, setAppointments] = useState([])
  const [bookingInfo, setBookingInfo] = useState({
    company: null,
    services: [],
    collaborators: [],
    settings: null
  })
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingInfoLoading, setBookingInfoLoading] = useState(true)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeHistoryTab, setActiveHistoryTab] = useState('completed')
  const [serviceSearch, setServiceSearch] = useState('')
  const [form, setForm] = useState(emptyBookingForm)

  const bookingSlug = user?.company_public_booking_slug || ''

  const loadAppointments = useCallback(async function loadAppointments() {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/client/appointments', {
        headers: getAuthHeaders('booking')
      })
      setAppointments(response.data.data || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar seus agendamentos')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadBookingInfo = useCallback(async function loadBookingInfo() {
    if (!bookingSlug) {
      setBookingInfoLoading(false)
      return
    }

    setBookingInfoLoading(true)

    try {
      const response = await api.get(`/barber/public/${bookingSlug}/booking-info`)
      const data = response.data.data
      const defaultCollaboratorId = data.settings?.allow_any_collaborator !== false
        ? anyCollaboratorValue
        : (data.collaborators[0]?.id || '')

      setBookingInfo(data)
      setForm((current) => ({
        ...current,
        serviceId: current.serviceId || data.services[0]?.id || '',
        collaboratorId: current.collaboratorId || defaultCollaboratorId
      }))
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar os dados de agendamento')
    } finally {
      setBookingInfoLoading(false)
    }
  }, [bookingSlug])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadAppointments()
      loadBookingInfo()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [bookingSlug, loadAppointments, loadBookingInfo])

  useEffect(() => {
    async function loadAvailability() {
      if (clientTab !== 'booking') {
        return
      }

      if (!form.serviceId || !form.appointmentDate) {
        setAvailability([])
        return
      }

      if (!bookingInfo.settings?.allow_any_collaborator && !form.collaboratorId) {
        setAvailability([])
        return
      }

      setAvailabilityLoading(true)

      try {
        const params = {
          serviceId: form.serviceId,
          date: form.appointmentDate
        }

        if (form.collaboratorId && form.collaboratorId !== anyCollaboratorValue) {
          params.collaboratorId = form.collaboratorId
        }

        const response = await api.get(`/barber/public/${bookingSlug}/available-slots`, { params })
        setAvailability(response.data.data?.slots || [])
      } catch (err) {
        setAvailability([])
        setError(err.response?.data?.error || 'Nao foi possivel consultar os horarios')
      } finally {
        setAvailabilityLoading(false)
      }
    }

    loadAvailability()
  }, [bookingInfo.settings?.allow_any_collaborator, bookingSlug, clientTab, form.appointmentDate, form.collaboratorId, form.serviceId])

  const groupedCounts = useMemo(() => (
    appointments.reduce((accumulator, appointment) => {
      const bucket = getStatusBucket(appointment.status)
      accumulator[bucket] += 1
      return accumulator
    }, {
      upcoming: 0,
      completed: 0,
      canceled: 0
    })
  ), [appointments])

  const visibleHistoryAppointments = useMemo(() => (
    appointments.filter((appointment) => getStatusBucket(appointment.status) === activeHistoryTab)
  ), [activeHistoryTab, appointments])

  const upcomingAppointments = useMemo(() => (
    appointments.filter((appointment) => getStatusBucket(appointment.status) === 'upcoming')
  ), [appointments])

  const historyAppointments = useMemo(() => (
    appointments.filter((appointment) => getStatusBucket(appointment.status) !== 'upcoming')
  ), [appointments])

  const nextAppointment = useMemo(() => (
    appointments.find((appointment) => getStatusBucket(appointment.status) === 'upcoming') || null
  ), [appointments])

  const filteredServices = useMemo(() => {
    const search = String(serviceSearch || '').trim().toLowerCase()

    if (!search) {
      return bookingInfo.services
    }

    return bookingInfo.services.filter((service) => (
      String(service.name || '').toLowerCase().includes(search)
      || String(service.description || '').toLowerCase().includes(search)
    ))
  }, [bookingInfo.services, serviceSearch])

  const selectedService = useMemo(() => (
    bookingInfo.services.find((service) => service.id === form.serviceId) || null
  ), [bookingInfo.services, form.serviceId])

  const availableSlots = useMemo(() => availability.filter((slot) => slot.available), [availability])

  const selectedSlot = useMemo(() => (
    availability.find((slot) => slot.time === form.appointmentTime) || null
  ), [availability, form.appointmentTime])

  const selectedCollaborator = useMemo(() => {
    if (form.collaboratorId === anyCollaboratorValue) {
      return null
    }

    return bookingInfo.collaborators.find((collaborator) => collaborator.id === form.collaboratorId) || null
  }, [bookingInfo.collaborators, form.collaboratorId])

  const resolvedCollaboratorName = selectedCollaborator?.name
    || selectedCollaborator?.nickname
    || selectedSlot?.collaborator_name
    || 'Profissional disponivel'

  const alerts = useMemo(() => getAlertsFromAppointments(appointments), [appointments])

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
    setClientTab('booking')
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
      await api.post('/client/appointments', {
        companySlug: bookingSlug,
        serviceId: form.serviceId,
        collaboratorId: form.collaboratorId === anyCollaboratorValue ? selectedSlot?.collaborator_id || null : form.collaboratorId,
        startsAt,
        notes: form.notes
      }, {
        headers: getAuthHeaders('booking')
      })

      setSuccess('Agendamento criado com sucesso.')
      setForm((current) => ({
        ...current,
        appointmentTime: '',
        notes: ''
      }))
      await loadAppointments()
      setClientTab('appointments')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel criar o agendamento')
    } finally {
      setSaving(false)
    }
  }

  async function cancelAppointment(appointmentId) {
    setError('')
    setSuccess('')

    try {
      await api.patch(
        `/client/appointments/${appointmentId}/cancel`,
        {},
        {
          headers: getAuthHeaders('booking')
        }
      )
      setSuccess('Agendamento cancelado com sucesso.')
      await loadAppointments()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel cancelar o agendamento')
    }
  }

  function renderAppointmentCard(appointment) {
    return (
      <article className="barber-client-appointment-card barber-client-appointment-card-premium barber-client-appointment-card-mobile" key={appointment.id}>
        <div className="barber-client-appointment-thumb">
          <span className="barber-booking-detail-icon barber-client-appointment-icon">
            <BarberIcon name="calendar" />
          </span>
        </div>

        <div className="barber-client-appointment-main">
          <div className="barber-client-appointment-topline">
            <BarberBadge tone={getStatusTone(appointment.status)}>{getStatusLabel(appointment.status)}</BarberBadge>
            {appointment.company_name && <span>{appointment.company_name}</span>}
          </div>
          <strong>{appointment.service_name}</strong>
          <p>{appointment.collaborator_name}</p>
          <div className="barber-client-appointment-meta-row">
            <span>
              <BarberIcon name="calendar" />
              {formatDateTime(appointment.starts_at)}
            </span>
          </div>
        </div>

        <div className="barber-client-appointment-side">
          {['scheduled', 'confirmed'].includes(appointment.status) ? (
            <BarberButton type="button" variant="ghost" onClick={() => cancelAppointment(appointment.id)}>
              <BarberIcon name="close" />
              <span>Cancelar</span>
            </BarberButton>
          ) : (
            <div className="barber-client-appointment-side-note">
              <span>Status</span>
              <strong>{getStatusLabel(appointment.status)}</strong>
            </div>
          )}
        </div>
      </article>
    )
  }

  function renderAppointments() {
    return (
      <>
        <section className="barber-mobile-promo-card barber-mobile-bookings-banner barber-figma-appointments-hero">
          <div>
            <span className="barber-overline">Meus agendamentos</span>
            <h2>{nextAppointment ? 'Seu proximo horario esta reservado' : 'Sua agenda esta livre para um novo cuidado'}</h2>
            <p>
              {nextAppointment
                ? `${nextAppointment.service_name} com ${nextAppointment.collaborator_name} em ${formatDateTime(nextAppointment.starts_at)}.`
                : 'Agende, acompanhe e consulte seu historico sem sair da area do cliente.'}
            </p>
          </div>
          <div className="barber-mobile-promo-offer">
            <strong>{groupedCounts.upcoming}</strong>
            <span>proximos</span>
          </div>
        </section>

        <div className="barber-client-summary-row barber-client-summary-row-mobile">
          <BarberCard className="barber-client-metric-card">
            <span>Proximos</span>
            <strong>{groupedCounts.upcoming}</strong>
            <small>Agendamentos ativos</small>
          </BarberCard>
          <BarberCard className="barber-client-metric-card">
            <span>Concluidos</span>
            <strong>{groupedCounts.completed}</strong>
            <small>Historico</small>
          </BarberCard>
          <BarberCard className="barber-client-metric-card">
            <span>Alertas</span>
            <strong>{alerts.length}</strong>
            <small>Atualizacoes</small>
          </BarberCard>
        </div>

        <BarberCard className="barber-mobile-section-card barber-figma-list-section">
          <div className="barber-mobile-section-head">
            <h3>Proximos</h3>
            <button className="barber-mobile-link-button" onClick={() => setClientTab('booking')} type="button">
              Agendar
            </button>
          </div>

          {loading ? (
            <div className="barber-public-loading barber-client-loading">Carregando...</div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="barber-client-list barber-client-list-premium">
              {upcomingAppointments.map((appointment) => renderAppointmentCard(appointment))}
            </div>
          ) : (
            <BarberEmptyState
              description="Assim que voce reservar um horario, ele aparecera aqui com todos os detalhes."
              title="Nenhum agendamento proximo"
            />
          )}
        </BarberCard>

        <BarberCard className="barber-mobile-section-card barber-figma-list-section">
          <div className="barber-mobile-section-head">
            <h3>Historico</h3>
            <BarberBadge tone="neutral">{historyAppointments.length}</BarberBadge>
          </div>

          <div className="barber-client-tabs barber-client-tabs-mobile">
            {[
              ['completed', 'Concluidos', groupedCounts.completed],
              ['canceled', 'Cancelados', groupedCounts.canceled]
            ].map(([key, label, count]) => (
              <button
                className={`barber-client-tab ${activeHistoryTab === key ? 'active' : ''}`}
                key={key}
                onClick={() => setActiveHistoryTab(key)}
                type="button"
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>

          <div className="barber-client-list barber-client-list-premium">
            {loading ? (
              <div className="barber-public-loading barber-client-loading">Carregando historico...</div>
            ) : visibleHistoryAppointments.length === 0 ? (
              <BarberEmptyState
                description="Seus horarios finalizados ou cancelados ficarao organizados aqui."
                title="Historico vazio"
              />
            ) : (
              visibleHistoryAppointments.map((appointment) => renderAppointmentCard(appointment))
            )}
          </div>
        </BarberCard>
      </>
    )
  }

  function renderServices() {
    return (
      <>
        <div className="barber-booking-searchbar barber-mobile-searchbar">
          <BarberIcon name="catalog" />
          <input
            aria-label="Buscar servicos"
            onChange={(event) => setServiceSearch(event.target.value)}
            placeholder="Buscar servico"
            type="search"
            value={serviceSearch}
          />
        </div>

        <BarberCard className="barber-mobile-section-card">
          <div className="barber-mobile-section-head">
            <h3>Servicos</h3>
            <BarberBadge tone="admin">{filteredServices.length}</BarberBadge>
          </div>

          {bookingInfoLoading ? (
            <div className="barber-public-loading barber-client-loading">Carregando servicos...</div>
          ) : filteredServices.length > 0 ? (
            <div className="barber-booking-service-grid barber-mobile-service-grid">
              {filteredServices.map((service) => (
                <button
                  className={`barber-booking-service-card ${form.serviceId === service.id ? 'active' : ''}`}
                  key={service.id}
                  onClick={() => selectService(service.id)}
                  type="button"
                >
                  <span className="barber-booking-service-card-icon">
                    <ServiceIcon icon={service.icon} name={service.name} />
                  </span>
                  <strong>{service.name}</strong>
                  <small>{service.estimated_time_minutes || 30} min</small>
                  <span>{money(service.price)}</span>
                </button>
              ))}
            </div>
          ) : (
            <BarberEmptyState
              description="Nenhum servico disponivel para agendamento no momento."
              title="Sem servicos ativos"
            />
          )}
        </BarberCard>
      </>
    )
  }

  function renderBooking() {
    return (
      <form className="barber-mobile-booking-stack" onSubmit={createAppointment}>
        <BarberCard className="barber-mobile-service-hero">
          <div className="barber-mobile-service-media">
            <div className="barber-booking-detail-image-surface">
              <span className="barber-booking-detail-icon barber-mobile-service-icon">
                <ServiceIcon icon={selectedService?.icon} name={selectedService?.name || 'Servico'} />
              </span>
              <div className="barber-booking-avatar-stack">
                {bookingInfo.collaborators.slice(0, 3).map((collaborator) => (
                  <CollaboratorAvatar
                    avatarUrl={collaborator.avatar_url}
                    key={collaborator.id}
                    name={collaborator.name || collaborator.nickname}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="barber-mobile-service-copy">
            <h2>{selectedService?.name || 'Escolha um servico'}</h2>
            <p>{selectedService?.description || 'Selecione o servico que deseja reservar para continuar.'}</p>
            <div className="barber-mobile-service-stats">
              <BarberBadge tone="warning">{selectedService?.estimated_time_minutes || 30} min</BarberBadge>
              <BarberBadge tone="success">{selectedService ? money(selectedService.price) : 'R$ 0,00'}</BarberBadge>
            </div>
          </div>
        </BarberCard>

        <BarberCard className="barber-mobile-section-card">
          <div className="barber-mobile-section-head">
            <h3>Profissional</h3>
            {bookingInfo.settings?.allow_any_collaborator !== false && <BarberBadge tone="admin">Flexivel</BarberBadge>}
          </div>

          <div className="barber-booking-collaborator-row barber-mobile-collaborators">
            {bookingInfo.settings?.allow_any_collaborator !== false && (
              <button
                aria-label="Qualquer profissional"
                className={`barber-booking-collaborator-card barber-mobile-collaborator-card ${form.collaboratorId === anyCollaboratorValue ? 'active' : ''}`}
                onClick={() => selectCollaborator(anyCollaboratorValue)}
                type="button"
              >
                <span className="barber-booking-choice-avatar"><BarberIcon name="users" /></span>
                <strong>Qualquer profissional</strong>
                <small>Primeiro horario livre da equipe</small>
              </button>
            )}

            {bookingInfo.collaborators.map((collaborator) => (
              <button
                aria-label={`Selecionar ${collaborator.name || collaborator.nickname}`}
                className={`barber-booking-collaborator-card barber-mobile-collaborator-card ${form.collaboratorId === collaborator.id ? 'active' : ''}`}
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

        <BarberCard className="barber-mobile-section-card barber-mobile-calendar-card">
          <div className="barber-mobile-section-head">
            <h3>Agendar</h3>
          </div>
          <label className="barber-mobile-date-field" htmlFor="client-appointment-date">
            <span>Data</span>
            <input
              className="barber-input"
              id="client-appointment-date"
              min={new Date().toISOString().slice(0, 10)}
              name="appointmentDate"
              onChange={updateForm}
              required
              type="date"
              value={form.appointmentDate}
            />
          </label>
          <div className="barber-mobile-date-display">
            <strong>{formatDateLabel(form.appointmentDate)}</strong>
            <small>Os horarios respeitam a agenda real da barbearia.</small>
          </div>
        </BarberCard>

        <BarberCard className="barber-mobile-section-card">
          <div className="barber-mobile-section-head">
            <h3>Horarios</h3>
            <BarberBadge tone="warning">{availableSlots.length} livres</BarberBadge>
          </div>

          {availabilityLoading ? (
            <div className="barber-public-loading barber-client-loading">Carregando horarios...</div>
          ) : availableSlots.length > 0 ? (
            <div className="barber-public-slot-grid barber-mobile-slot-grid">
              {availableSlots.map((slot) => (
                <button
                  aria-label={`Selecionar horario ${slot.time}`}
                  className={`barber-public-slot barber-mobile-slot ${form.appointmentTime === slot.time ? 'active' : ''}`}
                  key={`${slot.starts_at}-${slot.collaborator_id || 'any'}`}
                  onClick={() => setForm((current) => ({ ...current, appointmentTime: slot.time }))}
                  type="button"
                >
                  <span>{slot.time}</span>
                  {slot.collaborator_name && <small>{slot.collaborator_name}</small>}
                </button>
              ))}
            </div>
          ) : (
            <div className="barber-public-slot-grid">
              <span>Selecione servico, profissional e data para ver os horarios reais.</span>
            </div>
          )}
        </BarberCard>

        <BarberCard className="barber-mobile-section-card">
          <div className="barber-mobile-section-head">
            <h3>Observacoes</h3>
          </div>
          <label className="barber-form-block" htmlFor="client-booking-notes">
            <textarea
              className="barber-textarea"
              id="client-booking-notes"
              name="notes"
              onChange={updateForm}
              placeholder="Algo que a equipe precise saber?"
              rows="4"
              value={form.notes}
            />
          </label>
        </BarberCard>

        <BarberCard className="barber-mobile-section-card">
          <div className="barber-mobile-section-head">
            <h3>Resumo</h3>
          </div>
          <div className="barber-booking-summary-grid barber-mobile-summary-grid">
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

        <div className="barber-mobile-bottom-space" />

        <div className="barber-mobile-sticky-cta">
          <BarberButton
            className="barber-booking-primary-cta barber-mobile-primary-cta"
            disabled={saving || !form.serviceId || !form.appointmentDate || !form.appointmentTime}
            type="submit"
            variant="primary"
          >
            <BarberIcon name={saving ? 'clock' : 'calendar'} />
            <span>{saving ? 'Confirmando...' : 'Confirmar horario'}</span>
          </BarberButton>
        </div>
      </form>
    )
  }

  function renderAlerts() {
    return (
      <BarberCard className="barber-mobile-section-card">
        <div className="barber-mobile-section-head">
          <h3>Avisos</h3>
        </div>

        {alerts.length > 0 ? (
          <div className="barber-mobile-alert-list">
            {alerts.map((alert) => (
              <article className="barber-mobile-alert-card" key={alert.id}>
                <BarberBadge tone={alert.tone}>{alert.title}</BarberBadge>
                <p>{alert.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <BarberEmptyState
            description="Confirmacoes, lembretes e atualizacoes da barbearia aparecerao aqui."
            title="Nenhum aviso no momento"
          />
        )}
      </BarberCard>
    )
  }

  function renderProfile() {
    return (
      <>
        <BarberCard className="barber-mobile-section-card">
          <div className="barber-mobile-section-head">
            <h3>Perfil</h3>
          </div>

          <div className="barber-mobile-profile-grid">
            <div>
              <span>Nome</span>
              <strong>{user?.name || '-'}</strong>
            </div>
            <div>
              <span>Telefone</span>
              <strong>{user?.phone || '-'}</strong>
            </div>
            <div>
              <span>E-mail</span>
              <strong>{user?.email || '-'}</strong>
            </div>
            <div>
              <span>Barbearia</span>
              <strong>{bookingInfo.company?.name || '-'}</strong>
            </div>
          </div>

        <div className="barber-public-inline-actions barber-mobile-bookings-actions">
            <Link className="barber-button barber-button-primary" to={`/agendar/${bookingSlug}/perfil`}>
              Abrir perfil completo
            </Link>
            <BarberButton type="button" variant="ghost" onClick={logout}>
              <BarberIcon name="logout" />
              <span>Sair</span>
            </BarberButton>
          </div>
        </BarberCard>

        <section className="barber-client-tabs-panel">
          <div className="barber-client-tabs barber-client-tabs-mobile">
            {[
              ['upcoming', 'Upcoming', groupedCounts.upcoming],
              ['completed', 'Completed', groupedCounts.completed],
              ['canceled', 'Canceled', groupedCounts.canceled]
            ].map(([key, label, count]) => (
              <button
                className={`barber-client-tab ${activeHistoryTab === key ? 'active' : ''}`}
                key={key}
                onClick={() => setActiveHistoryTab(key)}
                type="button"
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>
        </section>

        <div className="barber-client-list barber-client-list-premium">
          {loading ? (
            <div className="barber-public-loading barber-client-loading">Carregando historico...</div>
          ) : visibleHistoryAppointments.length === 0 ? (
            <BarberCard className="barber-client-empty-card">
              <span className="barber-overline">Historico vazio</span>
              <h3>Nada por aqui nesta aba</h3>
              <p>Quando houver movimentacao nesta categoria, ela aparecera aqui.</p>
            </BarberCard>
          ) : (
            visibleHistoryAppointments.map((appointment) => renderAppointmentCard(appointment))
          )}
        </div>
      </>
    )
  }

  function renderClientContent() {
    switch (clientTab) {
      case 'services':
        return renderServices()
      case 'booking':
        return renderBooking()
      case 'alerts':
        return renderAlerts()
      case 'profile':
        return renderProfile()
      default:
        return renderAppointments()
    }
  }

  return (
    <main className="barber-figma-page barber-figma-appointments-page">
      <header className="barber-figma-top-hero">
        <div className="barber-figma-grid-texture" aria-hidden="true" />
        <div className="barber-figma-header-actions">
          <Link className="barber-figma-round-button" to={`/agendar/${bookingSlug}`} aria-label="Voltar ao inicio">
            <BarberIcon name="home" />
          </Link>
          <Link className="barber-figma-round-button" to={`/agendar/${bookingSlug}/perfil`} aria-label="Perfil">
            <BarberIcon name="users" />
          </Link>
        </div>
        <div className="barber-figma-hero-title">
          <h1>Meus Agendamentos</h1>
          <p>Ola, {getFirstName(user?.name)}</p>
        </div>
      </header>

      <section className="barber-figma-content barber-figma-client-content">
        {error && <div className="barber-message barber-message-error">{error}</div>}
        {success && <div className="barber-message barber-message-success">{success}</div>}

        {renderClientContent()}

        <div className="barber-figma-fixed-cta">
          <button className="barber-figma-gold-button" type="button" onClick={() => setClientTab('booking')}>
            <span>Novo agendamento</span>
            <BarberIcon name="chevronRight" />
          </button>
        </div>

        <MobileBottomNav active={clientTab} onChange={setClientTab} />
      </section>
    </main>
  )
}

export default ClientAppointments

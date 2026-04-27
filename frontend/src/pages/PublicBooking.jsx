import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CollaboratorAvatar from '../components/barber/CollaboratorAvatar'
import ServiceIcon from '../components/barber/ServiceIcon'
import { BarberButton, BarberCard, BarberEmptyState, BarberIcon } from '../components/barber/BarberUI'
import { useBookingAuth } from '../contexts/useBookingAuth'
import api from '../services/api'
import { getAuthHeaders } from '../services/authStorage'
import './Barber.css'

const emptyBookingForm = {
  serviceId: '',
  collaboratorId: '',
  appointmentDate: '',
  appointmentTime: '',
  notes: ''
}

function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}

function draftStorageKey(slug) {
  return `public-booking-draft:${slug}`
}

function PublicBooking() {
  const { slug } = useParams()
  const { isAuthenticated, user } = useBookingAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [booking, setBooking] = useState({
    company: null,
    services: [],
    collaborators: []
  })
  const [availability, setAvailability] = useState([])
  const [form, setForm] = useState(emptyBookingForm)

  useEffect(() => {
    async function loadBooking() {
      setLoading(true)
      setError('')

      try {
        const response = await api.get(`/public/booking/${slug}`)
        const data = response.data.data
        const storedDraft = window.localStorage.getItem(draftStorageKey(slug))
        const parsedDraft = storedDraft ? JSON.parse(storedDraft) : {}

        setBooking(data)
        setForm({
          ...emptyBookingForm,
          ...parsedDraft,
          serviceId: parsedDraft.serviceId || data.services[0]?.id || '',
          collaboratorId: parsedDraft.collaboratorId || data.collaborators[0]?.id || '',
          appointmentDate: parsedDraft.appointmentDate || '',
          appointmentTime: parsedDraft.appointmentTime || ''
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
    window.localStorage.setItem(draftStorageKey(slug), JSON.stringify(form))
  }, [form, slug])

  useEffect(() => {
    async function loadAvailability() {
      if (!form.serviceId || !form.collaboratorId || !form.appointmentDate) {
        setAvailability([])
        return
      }

      setAvailabilityLoading(true)

      try {
        const response = await api.get(`/public/scheduling/${slug}/availability`, {
          params: {
            serviceId: form.serviceId,
            collaboratorId: form.collaboratorId,
            date: form.appointmentDate
          }
        })

        setAvailability(response.data.data.slots || [])
      } catch (err) {
        setAvailability([])
        setError(err.response?.data?.error || 'Nao foi possivel consultar a disponibilidade')
      } finally {
        setAvailabilityLoading(false)
      }
    }

    loadAvailability()
  }, [form.appointmentDate, form.collaboratorId, form.serviceId, slug])

  const selectedService = useMemo(() => {
    return booking.services.find((service) => service.id === form.serviceId) || null
  }, [booking.services, form.serviceId])

  const canBook = isAuthenticated &&
    user?.auth_scope === 'booking_customer' &&
    user?.company_public_booking_slug === slug &&
    user?.email_verified !== false &&
    user?.status === 'active'

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value
    }))
  }

  async function createAppointment(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const selectedTime = form.appointmentTime

    try {
      setSaving(true)
      await api.post(
        '/client/appointments',
        {
          companySlug: slug,
          serviceId: form.serviceId,
          collaboratorId: form.collaboratorId,
          appointmentDate: form.appointmentDate,
          appointmentTime: form.appointmentTime,
          notes: form.notes
        },
        {
          headers: getAuthHeaders('booking')
        }
      )

      setSuccess('Agendamento criado com sucesso')
      setAvailability((current) => current.map((slot) => (
        slot.time === selectedTime ? { ...slot, available: false } : slot
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
    return <main className="barber-public-shell"><div className="barber-public-loading">Carregando agendamento...</div></main>
  }

  return (
    <main className="barber-public-shell">
      <section className="barber-public-page">
        <BarberCard className="barber-public-hero">
          <div className="barber-public-hero-copy">
            <span className="barber-overline">Agendamento online</span>
            <h1>{booking.company?.name || 'Agende seu horario'}</h1>
            <p>Escolha o servico, profissional e melhor horario para reservar seu atendimento com confirmacao de e-mail.</p>
          </div>

          <div className="barber-public-steps">
            {['Servico', 'Profissional', 'Data', 'Login', 'Confirmar'].map((step, index) => (
              <div className={`barber-sales-step ${index === 0 ? 'active' : ''}`} key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </BarberCard>

        {error && <div className="barber-message barber-message-error">{error}</div>}
        {success && <div className="barber-message barber-message-success">{success}</div>}

        <div className="barber-public-grid">
          <BarberCard className="barber-public-panel">
            <div className="barber-table-header">
              <div>
                <h2>Servicos disponiveis</h2>
                <p>Somente servicos ativos da barbearia aparecem aqui.</p>
              </div>
            </div>

            {booking.services.length > 0 ? (
              <div className="barber-public-choice-grid">
                {booking.services.map((service) => (
                  <button
                    className={`barber-public-choice-card ${form.serviceId === service.id ? 'active' : ''}`}
                    key={service.id}
                    name="serviceId"
                    onClick={() => setForm((current) => ({ ...current, serviceId: service.id, appointmentTime: '' }))}
                    type="button"
                  >
                    <span className="barber-service-card-icon">
                      <ServiceIcon icon={service.icon} name={service.name} />
                    </span>
                    <strong>{service.name}</strong>
                    <small>{money(service.price)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <BarberEmptyState
                description="Nenhum servico ativo foi disponibilizado para agendamento ainda."
                title="Sem servicos disponiveis"
              />
            )}
          </BarberCard>

          <BarberCard className="barber-public-panel">
            <div className="barber-table-header">
              <div>
                <h2>Profissionais disponiveis</h2>
                <p>Aparecem apenas colaboradores ativos e liberados para agenda online.</p>
              </div>
            </div>

            {booking.collaborators.length > 0 ? (
              <div className="barber-public-choice-grid">
                {booking.collaborators.map((collaborator) => (
                  <button
                    className={`barber-public-choice-card ${form.collaboratorId === collaborator.id ? 'active' : ''}`}
                    key={collaborator.id}
                    onClick={() => setForm((current) => ({ ...current, collaboratorId: collaborator.id, appointmentTime: '' }))}
                    type="button"
                  >
                    <CollaboratorAvatar
                      avatarUrl={collaborator.avatar_url}
                      name={collaborator.name || collaborator.nickname}
                      size="md"
                    />
                    <strong>{collaborator.name || collaborator.nickname}</strong>
                    <small>Disponivel para agenda</small>
                  </button>
                ))}
              </div>
            ) : (
              <BarberEmptyState
                description="Nenhum profissional esta disponivel para agendamento publico neste momento."
                title="Sem profissionais disponiveis"
              />
            )}
          </BarberCard>
        </div>

        {!canBook && (
          <BarberCard className="barber-public-auth-gate">
            <div>
              <h2>Identifique-se para confirmar o horario</h2>
              <p>Para proteger seus dados e seu historico, o agendamento so e liberado para clientes confirmados por e-mail.</p>
            </div>
            <div className="barber-public-inline-actions">
              <Link className="button-secondary" to={`/agendar/${slug}/cadastro`}>Criar cadastro</Link>
              <Link to={`/agendar/${slug}/login?redirect=${encodeURIComponent(`/agendar/${slug}`)}`}>Ja tenho conta</Link>
            </div>
          </BarberCard>
        )}

        <BarberCard className="barber-public-booking-card">
          <div className="barber-table-header">
            <div>
              <h2>Escolha data e horario</h2>
              <p>Os horarios abaixo ja respeitam servico, profissional, antecedencia minima e conflitos em tempo real.</p>
            </div>
            {selectedService && (
              <div className="barber-public-service-pill">
                <ServiceIcon icon={selectedService.icon} name={selectedService.name} />
                <div>
                  <strong>{selectedService.name}</strong>
                  <span>{money(selectedService.price)}</span>
                </div>
              </div>
            )}
          </div>

          <form className="barber-form-grid" onSubmit={createAppointment}>
            <div className="barber-form-block">
              <label htmlFor="public-appointment-date">Data</label>
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
            </div>

            <div className="barber-form-block barber-form-block-full">
              <label>Horarios disponiveis</label>
              {availabilityLoading ? (
                <div className="barber-public-slot-grid"><span>Carregando horarios...</span></div>
              ) : availability.length > 0 ? (
                <div className="barber-public-slot-grid">
                  {availability
                    .filter((slot) => slot.available)
                    .map((slot) => (
                      <button
                        className={`barber-public-slot ${form.appointmentTime === slot.time ? 'active' : ''}`}
                        key={slot.starts_at}
                        onClick={() => setForm((current) => ({ ...current, appointmentTime: slot.time }))}
                        type="button"
                      >
                        {slot.time}
                      </button>
                    ))}
                  {availability.filter((slot) => slot.available).length === 0 && (
                    <span>Nenhum horario disponivel para a data escolhida.</span>
                  )}
                </div>
              ) : (
                <div className="barber-public-slot-grid">
                  <span>Selecione data, servico e profissional para ver a agenda.</span>
                </div>
              )}
            </div>

            <div className="barber-form-block barber-form-block-full">
              <label htmlFor="public-booking-notes">Observacoes</label>
              <textarea
                className="barber-textarea"
                id="public-booking-notes"
                name="notes"
                onChange={updateForm}
                placeholder="Algo que a equipe precise saber?"
                rows="4"
                value={form.notes}
              />
            </div>

            <div className="barber-modal-actions barber-form-block-full">
              <BarberButton disabled={saving || !canBook || !form.appointmentTime} type="submit" variant="primary">
                <BarberIcon name={saving ? 'clock' : 'calendar'} />
                <span>{saving ? 'Confirmando horario...' : 'Confirmar agendamento'}</span>
              </BarberButton>
            </div>
          </form>
        </BarberCard>
      </section>
    </main>
  )
}

export default PublicBooking

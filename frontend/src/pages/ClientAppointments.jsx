import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBookingAuth } from '../contexts/useBookingAuth'
import api from '../services/api'
import { getAuthHeaders } from '../services/authStorage'
import './Barber.css'

function formatDateTime(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Cuiaba'
  }).format(new Date(value))
}

function ClientAppointments() {
  const { user, logout } = useBookingAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadAppointments() {
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
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadAppointments()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

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

  return (
    <main className="barber-public-shell">
      <section className="barber-public-page">
        <div className="barber-client-header">
          <div>
            <span className="barber-overline">Area do cliente</span>
            <h1>Meus agendamentos</h1>
            <p>Veja seus horarios, crie um novo agendamento ou cancele dentro do prazo da empresa.</p>
          </div>
          <div className="barber-public-inline-actions">
            {user?.company_public_booking_slug && (
              <Link className="button-secondary barber-client-link" to={`/agendar/${user.company_public_booking_slug}`}>
                Novo agendamento
              </Link>
            )}
            <button className="button-secondary" type="button" onClick={logout}>
              Sair
            </button>
          </div>
        </div>

        {error && <div className="barber-message barber-message-error">{error}</div>}
        {success && <div className="barber-message barber-message-success">{success}</div>}

        <div className="barber-client-list">
          {loading ? (
            <div className="barber-public-loading">Carregando seus agendamentos...</div>
          ) : appointments.length === 0 ? (
            <section className="auth-card barber-public-auth-card">
              <h2>Nenhum agendamento encontrado</h2>
              <p>Quando voce agendar um horario, ele aparecera aqui.</p>
            </section>
          ) : (
            appointments.map((appointment) => (
              <article className="barber-client-appointment-card" key={appointment.id}>
                <div>
                  <strong>{appointment.service_name}</strong>
                  <p>{appointment.collaborator_name}</p>
                  <span>{formatDateTime(appointment.starts_at)}</span>
                </div>
                <div className="barber-client-appointment-meta">
                  <span className={`master-client-status-pill ${appointment.status === 'canceled' ? 'cancelado' : 'ativo'}`}>
                    {appointment.status}
                  </span>
                  {['scheduled', 'confirmed'].includes(appointment.status) && (
                    <button className="button-secondary" type="button" onClick={() => cancelAppointment(appointment.id)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

export default ClientAppointments

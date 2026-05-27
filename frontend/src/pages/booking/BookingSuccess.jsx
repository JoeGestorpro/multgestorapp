import { Link, useLocation, useParams } from 'react-router-dom'
import { BarberIcon } from '../../components/barber/BarberUI'
import { readConfirmedBooking } from './pendingBooking'
import './css/BookingFlow.index.css'

function formatAppointmentDate(value) {
  if (!value) {
    return 'Data confirmada'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeZone: 'America/Cuiaba'
  }).format(new Date(`${value}T12:00:00-04:00`))
}

function BookingSuccess() {
  const { slug } = useParams()
  const { state } = useLocation()
  const storedConfirmation = readConfirmedBooking(slug)
  const summary = state?.summary || storedConfirmation?.summary || {}
  const appointment = state?.appointment || storedConfirmation?.appointment || {}

  const dateLabel = summary.dateLabel
    || formatAppointmentDate(summary.appointmentDate || appointment.starts_at?.slice(0, 10))
  const timeLabel = summary.appointmentTime || appointment.starts_at?.slice(11, 16) || 'Horario confirmado'
  const priceLabel = summary.servicePrice
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(summary.servicePrice))
    : ''

  return (
    <div className="booking-page-auth">
      <section className="booking-confirmation-panel" style={{ margin: '0 auto' }}>
        <div className="booking-confirmation-content">
          <div className="booking-confirmation-icon" aria-hidden="true">
            <BarberIcon name="check" />
          </div>

          <div className="booking-confirmation-copy">
            <h1>Agendamento confirmado!</h1>
            <p>Seu horario foi reservado com sucesso</p>
          </div>

          <div className="booking-confirmation-details">
            <h2>Detalhes do agendamento</h2>

            <div className="booking-confirmation-detail-row">
              <span><BarberIcon name="scissors" /></span>
              <div>
                <small>Servico</small>
                <strong>{summary.serviceName || appointment.service_name || 'Servico confirmado'}</strong>
                {summary.serviceDuration && <em>{summary.serviceDuration}</em>}
              </div>
            </div>

            <div className="booking-confirmation-detail-row">
              <span><BarberIcon name="users" /></span>
              <div>
                <small>Profissional</small>
                <strong>{summary.collaboratorName || appointment.collaborator_name || 'Profissional confirmado'}</strong>
              </div>
            </div>

            <div className="booking-confirmation-detail-row">
              <span><BarberIcon name="calendar" /></span>
              <div>
                <small>Data</small>
                <strong>{dateLabel}</strong>
              </div>
            </div>

            <div className="booking-confirmation-detail-row">
              <span><BarberIcon name="clock" /></span>
              <div>
                <small>Horario</small>
                <strong>{timeLabel}</strong>
              </div>
            </div>

            {priceLabel && (
              <div className="booking-confirmation-total">
                <span>Valor total</span>
                <strong>{priceLabel}</strong>
              </div>
            )}
          </div>

          <div className="booking-confirmation-actions">
            <Link className="booking-action-primary" to={`/agendar/${slug}/minha-conta`}>
              <span>Ver meus agendamentos</span>
              <BarberIcon name="chevronRight" />
            </Link>
            <Link className="booking-action-secondary" to={`/agendar/${slug}`}>
              <BarberIcon name="home" />
              <span>Voltar ao inicio</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default BookingSuccess

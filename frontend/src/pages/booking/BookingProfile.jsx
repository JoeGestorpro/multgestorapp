import { Link, useParams } from 'react-router-dom'
import { BarberIcon } from '../../components/barber/BarberUI'
import { useBookingAuth } from '../../contexts/useBookingAuth'
import './css/BookingFlow.index.css'

function BookingProfile() {
  const { slug } = useParams()
  const { user, logout } = useBookingAuth()

  return (
    <div className="booking-page-auth">
      <header className="booking-auth-hero">
        <div className="booking-auth-hero-content">
          <Link className="booking-auth-hero-back" to={`/agendar/${slug}/minha-conta`} aria-label="Voltar aos agendamentos">
            <BarberIcon name="arrowLeft" />
          </Link>
          <div className="booking-auth-hero-title">
            <h1>Meu Perfil</h1>
            <p>Gerencie suas informacoes</p>
          </div>
        </div>
      </header>

      <section className="booking-auth-content">
        <div className="booking-profile-card">
          <div className="booking-profile-avatar">
            <BarberIcon name="users" />
          </div>
          <h2>{user?.name || 'Minha conta'}</h2>
          <p>{user?.email || 'Cliente BarberGestor'}</p>

          <div className="booking-profile-list">
            <div className="booking-profile-item">
              <span><BarberIcon name="users" /></span>
              <div>
                <small>Nome completo</small>
                <strong>{user?.name || '-'}</strong>
              </div>
              <BarberIcon name="chevronRight" />
            </div>
            <div className="booking-profile-item">
              <span><BarberIcon name="mail" /></span>
              <div>
                <small>E-mail</small>
                <strong>{user?.email || '-'}</strong>
              </div>
              <BarberIcon name="chevronRight" />
            </div>
            <div className="booking-profile-item">
              <span><BarberIcon name="phone" /></span>
              <div>
                <small>Telefone</small>
                <strong>{user?.phone || '-'}</strong>
              </div>
              <BarberIcon name="chevronRight" />
            </div>
          </div>

          <div className="booking-action-stack">
            <Link className="booking-action-primary" to={`/agendar/${slug}/minha-conta`}>
              <span>Meus agendamentos</span>
              <BarberIcon name="chevronRight" />
            </Link>
            <button className="booking-danger-btn" type="button" onClick={logout}>
              <BarberIcon name="logout" />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default BookingProfile

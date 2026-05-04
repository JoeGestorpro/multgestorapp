import { Link, useParams } from 'react-router-dom'
import { BarberButton, BarberIcon } from '../../components/barber/BarberUI'
import { useBookingAuth } from '../../contexts/useBookingAuth'
import '../Barber.css'

function BookingProfile() {
  const { slug } = useParams()
  const { user, logout } = useBookingAuth()

  return (
    <main className="barber-figma-page">
      <header className="barber-figma-top-hero">
        <div className="barber-figma-grid-texture" aria-hidden="true" />
        <Link className="barber-figma-round-button" to={`/agendar/${slug}/minha-conta`} aria-label="Voltar aos agendamentos">
          <BarberIcon name="arrowLeft" />
        </Link>
        <div className="barber-figma-hero-title">
          <h1>Meu Perfil</h1>
          <p>Gerencie suas informacoes</p>
        </div>
      </header>

      <section className="barber-figma-content">
        <div className="barber-figma-profile-card">
          <div className="barber-figma-profile-avatar">
            <BarberIcon name="users" />
          </div>
          <h2>{user?.name || 'Minha conta'}</h2>
          <p>{user?.email || 'Cliente BarberGestor'}</p>

          <div className="barber-figma-profile-list">
            <div className="barber-figma-profile-item">
              <span><BarberIcon name="users" /></span>
              <div>
                <small>Nome completo</small>
                <strong>{user?.name || '-'}</strong>
              </div>
              <BarberIcon name="chevronRight" />
            </div>
            <div className="barber-figma-profile-item">
              <span><BarberIcon name="mail" /></span>
              <div>
                <small>E-mail</small>
                <strong>{user?.email || '-'}</strong>
              </div>
              <BarberIcon name="chevronRight" />
            </div>
            <div className="barber-figma-profile-item">
              <span><BarberIcon name="phone" /></span>
              <div>
                <small>Telefone</small>
                <strong>{user?.phone || '-'}</strong>
              </div>
              <BarberIcon name="chevronRight" />
            </div>
          </div>

          <div className="barber-figma-action-stack">
            <Link className="barber-button barber-button-primary" to={`/agendar/${slug}/minha-conta`}>
              <span>Meus agendamentos</span>
              <BarberIcon name="chevronRight" />
            </Link>
            <BarberButton className="barber-figma-danger-button" type="button" variant="secondary" onClick={logout}>
              <BarberIcon name="logout" />
              <span>Sair da conta</span>
            </BarberButton>
          </div>
        </div>
      </section>
    </main>
  )
}

export default BookingProfile

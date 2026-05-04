import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useBookingAuth } from '../../contexts/useBookingAuth'
import {
  confirmPendingBooking,
  getPendingSummary,
  readPendingBooking
} from './pendingBooking'
import { BarberIcon } from '../../components/barber/BarberUI'
import '../Barber.css'

function getErrorMessage(error) {
  return error.response?.data?.error || 'Nao foi possivel fazer login'
}

function BookingLogin() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { login, isAuthenticated, loading, user } = useBookingAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmingPending, setConfirmingPending] = useState(false)
  const [autoConfirmAttempted, setAutoConfirmAttempted] = useState(false)

  const pendingBooking = readPendingBooking(slug)
  const pendingSummary = getPendingSummary(pendingBooking)

  useEffect(() => {
    async function continueAuthenticatedFlow() {
      if (loading || !isAuthenticated || confirmingPending || autoConfirmAttempted) {
        return
      }

      const currentPendingBooking = readPendingBooking(slug)
      const targetSlug = user?.company_public_booking_slug || slug

      if (!currentPendingBooking) {
        navigate(`/agendar/${targetSlug}/minha-conta`, { replace: true })
        return
      }

      try {
        setError('')
        setConfirmingPending(true)
        setAutoConfirmAttempted(true)
        const appointment = await confirmPendingBooking(slug, currentPendingBooking)
        navigate(`/agendar/${slug}/confirmado`, {
          replace: true,
          state: {
            appointment,
            summary: getPendingSummary(currentPendingBooking)
          }
        })
      } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel confirmar o agendamento pendente')
        setConfirmingPending(false)
      }
    }

    continueAuthenticatedFlow()
  }, [autoConfirmAttempted, confirmingPending, isAuthenticated, loading, navigate, slug, user?.company_public_booking_slug])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const authUser = await login({
        email,
        password,
        companySlug: slug
      })
      const currentPendingBooking = readPendingBooking(slug)

      if (currentPendingBooking) {
        const appointment = await confirmPendingBooking(slug, currentPendingBooking)
        navigate(`/agendar/${slug}/confirmado`, {
          replace: true,
          state: {
            appointment,
            summary: getPendingSummary(currentPendingBooking)
          }
        })
        return
      }

      const redirectTo = searchParams.get('redirect')

      if (redirectTo && redirectTo.startsWith('/')) {
        navigate(redirectTo, { replace: true })
        return
      }

      navigate(`/agendar/${authUser.company_public_booking_slug || slug}/minha-conta`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="barber-figma-page">
      <header className="barber-figma-top-hero">
        <div className="barber-figma-grid-texture" aria-hidden="true" />
        <Link className="barber-figma-round-button" to={`/agendar/${slug}`} aria-label="Voltar ao inicio">
          <BarberIcon name="arrowLeft" />
        </Link>
        <div className="barber-figma-hero-title">
          <h1>BarberGestor</h1>
          <p>Bem-vindo de volta</p>
        </div>
      </header>

      <section className="barber-figma-content">
        <div className="barber-figma-form-card">
          <h2>Finalize seu agendamento</h2>
          <p>Entre para confirmar seu horario</p>

          {pendingSummary && (
            <div className="barber-booking-pending-summary barber-figma-summary-card">
              <span>Resumo do horario</span>
              <strong>{pendingSummary.serviceName}</strong>
              <div>
                <small>{pendingSummary.collaboratorName}</small>
                <small>{pendingSummary.dateLabel} as {pendingSummary.appointmentTime}</small>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="barber-figma-form">
            <label htmlFor="booking-email">E-mail</label>
            <div className="barber-figma-input-wrap">
              <BarberIcon name="mail" />
              <input
                id="booking-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="seu@email.com"
                required
              />
            </div>

            <label htmlFor="booking-password">Senha</label>
            <div className="barber-figma-input-wrap">
              <BarberIcon name="lock" />
              <input
                id="booking-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="********"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={submitting || confirmingPending}>
              <span>{submitting || confirmingPending ? 'Confirmando...' : 'Entrar e confirmar'}</span>
              <BarberIcon name="chevronRight" />
            </button>
          </form>

          <p className="auth-link">
            Nao tem uma conta? <Link to={`/agendar/${slug}/cadastro`}>Criar conta</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default BookingLogin

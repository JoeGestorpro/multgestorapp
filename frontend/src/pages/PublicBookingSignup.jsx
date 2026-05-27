import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BarberIcon } from '../components/barber/BarberUI'
import { useBookingAuth } from '../contexts/useBookingAuth'
import api from '../services/api'
import {
  confirmPendingBooking,
  getPendingSummary,
  readPendingBooking
} from './booking/pendingBooking'
import './booking/css/BookingFlow.index.css'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: ''
}

function PublicBookingSignup() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { login } = useBookingAuth()
  const [booking, setBooking] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [registrationStarted, setRegistrationStarted] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const pendingBooking = readPendingBooking(slug)
  const pendingSummary = getPendingSummary(pendingBooking)

  useEffect(() => {
    async function loadBooking() {
      try {
        const response = await api.get(`/public/booking/${slug}`)
        setBooking(response.data.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel carregar a barbearia')
      } finally {
        setLoading(false)
      }
    }

    loadBooking()
  }, [slug])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await api.post(`/public/booking/${slug}/register`, form)

      try {
        const authUser = await login({
          email: form.email,
          password: form.password,
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

        navigate(`/agendar/${authUser.company_public_booking_slug || slug}/minha-conta`, { replace: true })
        return
      } catch {
        // Algumas contas precisam confirmar o e-mail antes do primeiro login.
      }

      setRegisteredEmail(form.email)
      setRegistrationStarted(true)
      setSuccess('')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel iniciar seu cadastro')
    } finally {
      setSubmitting(false)
    }
  }

  async function resendConfirmation() {
    setError('')
    setSuccess('')
    setResending(true)

    try {
      const response = await api.post(`/public/booking/${slug}/resend-confirmation`, {
        email: registeredEmail || form.email
      })
      setSuccess(response.data.message || 'Confirmacao reenviada com sucesso.')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel reenviar o email')
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return (
      <div className="booking-page-auth">
        <div className="booking-flow booking-loading">
          <div className="booking-loading-spinner" />
          <p>Carregando cadastro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-page-auth">
      <header className="booking-auth-hero">
        <div className="booking-auth-hero-content">
          <Link className="booking-auth-hero-back" to={`/agendar/${slug}/login`} aria-label="Voltar ao login">
            <BarberIcon name="arrowLeft" />
          </Link>
          <div className="booking-auth-hero-title">
            <h1>BarberGestor</h1>
            <p>Crie sua conta</p>
          </div>
        </div>
      </header>

      <section className="booking-auth-content booking-auth-centered">
        <div className="booking-auth-form-card">
          {registrationStarted ? (
            <div className="booking-success-state">
              <div className="booking-success-state-icon">
                <BarberIcon name="check" />
              </div>
              <h2>Cadastro iniciado</h2>
              <p>Enviamos um link de confirmacao para o seu e-mail.</p>
              <strong>{registeredEmail}</strong>
              <p>
                Abra sua caixa de entrada e clique no link para confirmar sua conta. Depois da confirmacao, voce podera acessar sua area de agendamento.
              </p>

              {error && <div className="booking-auth-error-box">{error}</div>}
              {success && <div className="booking-auth-success-box">{success}</div>}

              <div className="booking-action-stack">
                <a className="booking-action-primary" href={`mailto:${registeredEmail}`}>
                  <BarberIcon name="mail" />
                  <span>Abrir meu e-mail</span>
                </a>
                <button
                  className="booking-action-secondary"
                  type="button"
                  disabled={!registeredEmail || resending}
                  onClick={resendConfirmation}
                >
                  <span>{resending ? 'Reenviando...' : 'Reenviar confirmacao'}</span>
                </button>
              </div>

              <div className="booking-auth-links">
                <Link className="booking-auth-link-btn" to={`/agendar/${slug}/login?redirect=${encodeURIComponent(`/agendar/${slug}`)}`}>
                  <BarberIcon name="arrowLeft" />
                  <span>Voltar para o login</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <span className="booking-overline">{booking?.company?.name || 'BarberGestor'}</span>
              <h2>Criar conta</h2>
              <p>Cadastre-se rapidamente para confirmar seu horario</p>

              {pendingSummary && (
                <div className="booking-auth-pending">
                  <span>Resumo do horario</span>
                  <strong>{pendingSummary.serviceName}</strong>
                  <div>
                    <small>{pendingSummary.collaboratorName}</small>
                    <small>{pendingSummary.dateLabel} as {pendingSummary.appointmentTime}</small>
                  </div>
                </div>
              )}

              {error && <div className="booking-auth-error-box">{error}</div>}

              <form onSubmit={handleSubmit} className="booking-auth-form-wrap">
                <div className="booking-field">
                  <label htmlFor="signup-name">Nome</label>
                  <div className="booking-input-wrap">
                    <BarberIcon name="users" />
                    <input id="signup-name" name="name" value={form.name} onChange={handleChange} placeholder="Joao Silva" required />
                  </div>
                </div>

                <div className="booking-field">
                  <label htmlFor="signup-phone">Telefone</label>
                  <div className="booking-input-wrap">
                    <BarberIcon name="phone" />
                    <input id="signup-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="(11) 99999-9999" required />
                  </div>
                </div>

                <div className="booking-field">
                  <label htmlFor="signup-email">E-mail</label>
                  <div className="booking-input-wrap">
                    <BarberIcon name="mail" />
                    <input id="signup-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" required />
                  </div>
                </div>

                <div className="booking-field">
                  <label htmlFor="signup-password">Senha</label>
                  <div className="booking-input-wrap">
                    <BarberIcon name="lock" />
                    <input id="signup-password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="********" required />
                  </div>
                </div>

                <div className="booking-field">
                  <label htmlFor="signup-confirm-password">Confirmar senha</label>
                  <div className="booking-input-wrap">
                    <BarberIcon name="lock" />
                    <input id="signup-confirm-password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="********" required />
                  </div>
                </div>

                <button type="submit" disabled={submitting}>
                  <span>{submitting ? 'Confirmando...' : 'Criar conta e confirmar'}</span>
                  <BarberIcon name="chevronRight" />
                </button>
              </form>

              <div className="booking-auth-links">
                <Link to={`/agendar/${slug}/login`}>Ja tenho conta</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default PublicBookingSignup

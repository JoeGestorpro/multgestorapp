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
import './Barber.css'

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
    return <main className="barber-public-shell"><div className="barber-public-loading">Carregando cadastro...</div></main>
  }

  return (
    <main className="barber-figma-page">
      <header className="barber-figma-top-hero">
        <div className="barber-figma-grid-texture" aria-hidden="true" />
        <Link className="barber-figma-round-button" to={`/agendar/${slug}/login`} aria-label="Voltar ao login">
          <BarberIcon name="arrowLeft" />
        </Link>
        <div className="barber-figma-hero-title">
          <h1>BarberGestor</h1>
          <p>Crie sua conta</p>
        </div>
      </header>

      <section className="barber-figma-content">
        <div className="barber-figma-form-card">
          {registrationStarted ? (
            <div className="barber-public-success-state">
              <div className="barber-public-success-icon" aria-hidden="true">
                <span />
              </div>

              <div className="barber-public-success-copy">
                <h1>Cadastro iniciado</h1>
                <p className="barber-public-success-lead">Enviamos um link de confirmacao para o seu e-mail.</p>
                <strong>{registeredEmail}</strong>
                <p>
                  Abra sua caixa de entrada e clique no link para confirmar sua conta. Depois da confirmacao, voce podera acessar sua area de agendamento.
                </p>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="barber-public-success-hint">{success}</div>}

              <div className="barber-public-success-actions">
                <a className="barber-button barber-button-primary barber-public-mail-link" href={`mailto:${registeredEmail}`}>
                  Abrir meu e-mail
                </a>
                <button
                  className="barber-button barber-button-secondary"
                  type="button"
                  disabled={!registeredEmail || resending}
                  onClick={resendConfirmation}
                >
                  {resending ? 'Reenviando...' : 'Reenviar confirmacao'}
                </button>
              </div>

              <Link className="barber-public-back-link" to={`/agendar/${slug}/login?redirect=${encodeURIComponent(`/agendar/${slug}`)}`}>
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <span className="barber-overline">{booking?.company?.name || 'BarberGestor'}</span>
              <h2>Criar conta</h2>
              <p>Cadastre-se rapidamente para confirmar seu horario</p>

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

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSubmit} className="barber-figma-form">
                <label htmlFor="signup-name">Nome</label>
                <div className="barber-figma-input-wrap">
                  <BarberIcon name="users" />
                  <input id="signup-name" name="name" value={form.name} onChange={handleChange} placeholder="Joao Silva" required />
                </div>

                <label htmlFor="signup-phone">Telefone</label>
                <div className="barber-figma-input-wrap">
                  <BarberIcon name="phone" />
                  <input id="signup-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="(11) 99999-9999" required />
                </div>

                <label htmlFor="signup-email">E-mail</label>
                <div className="barber-figma-input-wrap">
                  <BarberIcon name="mail" />
                  <input id="signup-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" required />
                </div>

                <label htmlFor="signup-password">Senha</label>
                <div className="barber-figma-input-wrap">
                  <BarberIcon name="lock" />
                  <input id="signup-password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="********" required />
                </div>

                <label htmlFor="signup-confirm-password">Confirmar senha</label>
                <div className="barber-figma-input-wrap">
                  <BarberIcon name="lock" />
                  <input id="signup-confirm-password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="********" required />
                </div>

                <button type="submit" disabled={submitting}>
                  <span>{submitting ? 'Confirmando...' : 'Criar conta e confirmar'}</span>
                  <BarberIcon name="chevronRight" />
                </button>
              </form>

              <div className="barber-public-inline-actions">
                <button className="button-secondary" type="button" disabled={!form.email || resending} onClick={resendConfirmation}>
                  {resending ? 'Reenviando...' : 'Reenviar confirmacao'}
                </button>
                <Link to={`/agendar/${slug}/login`}>Ja tenho conta</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default PublicBookingSignup

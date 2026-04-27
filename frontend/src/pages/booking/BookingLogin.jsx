import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useBookingAuth } from '../../contexts/useBookingAuth'

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

  if (!loading && isAuthenticated) {
    const targetSlug = user?.company_public_booking_slug || slug
    return <Navigate to={`/agendar/${targetSlug}/minha-conta`} replace />
  }

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
    <main className="auth-page">
      <section className="auth-card">
        <h1>Entrar para agendar</h1>
        <p>Acesse sua conta de cliente para confirmar e acompanhar seus horarios.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="booking-email">Email</label>
          <input
            id="booking-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="booking-password">Senha</label>
          <input
            id="booking-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="auth-link">
          Ainda nao tem conta? <Link to={`/agendar/${slug}/cadastro`}>Criar cadastro</Link>
        </p>
      </section>
    </main>
  )
}

export default BookingLogin

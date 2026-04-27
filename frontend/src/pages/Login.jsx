import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function getErrorMessage(error) {
  return error.response?.data?.error || 'Nao foi possivel fazer login'
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login, isAuthenticated, loading, getDefaultRoute } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated) {
    return <Navigate to={getDefaultRoute()} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const session = await login(email, password)
      const redirectTo = searchParams.get('redirect')

      if (redirectTo && redirectTo.startsWith('/')) {
        navigate(redirectTo, { replace: true })
        return
      }

      if (session.user.role === 'master_admin') {
        navigate('/dashboard', { replace: true })
        return
      }

      if (session.user.role === 'client') {
        const target = session.user.company_public_booking_slug
          ? `/agendar/${session.user.company_public_booking_slug}`
          : '/cliente/agendamentos'
        navigate(target, { replace: true })
        return
      }

      if (session.modules.length === 1) {
        navigate(`/${session.modules[0].slug}`, { replace: true })
        return
      }

      if (session.modules.length > 1) {
        navigate('/select-module', { replace: true })
        return
      }

      navigate('/no-modules', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Entrar</h1>
        <p>Acesse sua conta MultGestor.</p>

        {location.state?.message && (
          <div className="success-message">{location.state.message}</div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
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
          Ainda nao tem conta? <Link to="/register">Criar conta</Link>
        </p>
        <p className="auth-link">
          <Link to="/forgot-password">Esqueci minha senha</Link>
        </p>
      </section>
    </main>
  )
}

export default Login

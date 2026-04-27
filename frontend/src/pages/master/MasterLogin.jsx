import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

function getErrorMessage(error) {
  return error.response?.data?.error || 'Nao foi possivel fazer login'
}

function MasterLogin() {
  const navigate = useNavigate()
  const { loginMaster, isMasterAuthenticated, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isMasterAuthenticated) {
    return <Navigate to="/master/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await loginMaster(email, password)
      navigate('/master/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Entrar no MultGestor</h1>
        <p>Acesse o painel master da plataforma.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="master-email">Email</label>
          <input
            id="master-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="master-password">Senha</label>
          <input
            id="master-password"
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
          <Link to="/barber/login">Ir para o login da barbearia</Link>
        </p>
      </section>
    </main>
  )
}

export default MasterLogin

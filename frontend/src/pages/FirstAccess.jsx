import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

function FirstAccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [session, setSession] = useState(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('Token nao informado')
        setLoading(false)
        return
      }

      try {
        const response = await api.post('/auth/first-access/validate', { token })
        setSession(response.data.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Token invalido')
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [token])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('As senhas nao conferem')
      return
    }

    setSubmitting(true)

    try {
      await api.post('/auth/first-access/set-password', {
        token,
        password
      })

      setSuccess('Senha definida com sucesso. Faca login para continuar.')
      window.setTimeout(() => {
        navigate('/barber/login', {
          replace: true,
          state: { message: 'Senha definida com sucesso. Faca login para continuar.' }
        })
      }, 900)
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel definir a senha')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Primeiro acesso</h1>

        {loading && <p>Validando convite...</p>}

        {!loading && error && <div className="error-message">{error}</div>}

        {!loading && !error && session && (
          <>
            <p>
              Ative o acesso de {session.user.name} em {session.company.name}.
            </p>

            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
              <label htmlFor="password">Nova senha</label>
              <input
                id="password"
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <label htmlFor="confirm-password">Confirmar senha</label>
              <input
                id="confirm-password"
                type="password"
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />

              <button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Definir senha'}
              </button>
            </form>
          </>
        )}

        <p className="auth-link">
          Ja tenho senha. <Link to="/barber/login">Entrar</Link>
        </p>
      </section>
    </main>
  )
}

export default FirstAccess

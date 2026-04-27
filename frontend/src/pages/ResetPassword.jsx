import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Token nao informado')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas nao conferem')
      return
    }

    setSubmitting(true)

    try {
      await api.post('/reset-password', {
        token,
        password
      })

      setSuccess('Senha redefinida com sucesso.')
      window.setTimeout(() => {
        navigate('/barber/login', {
          replace: true,
          state: { message: 'Senha redefinida com sucesso. Faca login para continuar.' }
        })
      }, 900)
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel redefinir a senha')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Redefinir senha</h1>
        <p>Crie uma nova senha para acessar sua conta.</p>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

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
            {submitting ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>

        <p className="auth-link">
          <Link to="/barber/login">Voltar para login</Link>
        </p>
      </section>
    </main>
  )
}

export default ResetPassword

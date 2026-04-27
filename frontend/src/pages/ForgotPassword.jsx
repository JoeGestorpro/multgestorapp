import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      const response = await api.post('/forgot-password', { email })
      setMessage(response.data.message)
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel solicitar redefinicao')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Esqueci minha senha</h1>
        <p>Informe seu email para receber as instrucoes de redefinicao.</p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar instrucoes'}
          </button>
        </form>

        <p className="auth-link">
          <Link to="/barber/login">Voltar para login</Link>
        </p>
      </section>
    </main>
  )
}

export default ForgotPassword

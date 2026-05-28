import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function getErrorMessage(error) {
  return error.response?.data?.error || 'Nao foi possivel criar a conta'
}

function Register() {
  const navigate = useNavigate()
  const { register, isAuthenticated, loading, getDefaultRoute } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated) {
    return <Navigate to={getDefaultRoute()} replace />
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        niche_type: 'barber'
      })
      navigate('/barber/login', {
        replace: true,
        state: { message: 'Conta criada com sucesso. Faca login para continuar.' }
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Criar conta</h1>
        <p>Cadastre sua empresa e seu usuario administrador.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Nome</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={6}
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <p className="auth-link">
          Ja tem conta? <Link to="/barber/login">Entrar</Link>
        </p>
      </section>
    </main>
  )
}

export default Register

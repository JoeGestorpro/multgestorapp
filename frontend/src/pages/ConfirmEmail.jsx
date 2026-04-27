import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'

function ConfirmEmail() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    async function confirm() {
      try {
        const token = searchParams.get('token')
        const response = await api.get(`/public/scheduling/confirm-email?token=${encodeURIComponent(token || '')}`)
        setResult(response.data.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Nao foi possivel confirmar seu e-mail')
      } finally {
        setLoading(false)
      }
    }

    confirm()
  }, [searchParams])

  return (
    <main className="auth-page">
      <section className="auth-card">
        {loading ? (
          <>
            <h1>Confirmando e-mail</h1>
            <p>Estamos validando seu link de acesso.</p>
          </>
        ) : error ? (
          <>
            <h1>Falha na confirmacao</h1>
            <p>{error}</p>
            <p className="auth-link"><Link to="/login">Ir para login</Link></p>
          </>
        ) : (
          <>
            <h1>E-mail confirmado</h1>
            <p>{result?.message || 'Seu e-mail foi confirmado com sucesso.'}</p>
            <p className="auth-link">
              <Link to={result?.login_url || '/login'}>Entrar e continuar para o agendamento</Link>
            </p>
            {result?.booking_url && (
              <p className="auth-link">
                <Link to={result.booking_url}>Voltar para a pagina de agendamento</Link>
              </p>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default ConfirmEmail

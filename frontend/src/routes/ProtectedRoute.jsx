import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <main className="page-center">Carregando...</main>
  }

  if (!isAuthenticated) {
    return <Navigate to="/barber/login" replace />
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return (
      <main className="page-center">
        <section className="auth-card">
          <h1>Acesso restrito</h1>
          <p>Voce nao tem permissao para acessar esta area.</p>
        </section>
      </main>
    )
  }

  return children
}

export default ProtectedRoute

import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function HomeRedirect() {
  const { getDefaultRoute, isAuthenticated, loading } = useAuth()

  if (loading) {
    return <main className="page-center">Carregando...</main>
  }

  if (!isAuthenticated) {
    return <Navigate to="/barber/login" replace />
  }

  return <Navigate to={getDefaultRoute()} replace />
}

export default HomeRedirect

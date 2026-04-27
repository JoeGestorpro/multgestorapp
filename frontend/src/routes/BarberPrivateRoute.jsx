import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function BarberPrivateRoute({ children }) {
  const { isAuthenticated, isBarberAuthenticated, loading } = useAuth()

  if (loading) {
    return <main className="page-center">Carregando...</main>
  }

  if (!isAuthenticated) {
    return <Navigate to="/barber/login" replace />
  }

  if (!isBarberAuthenticated) {
    return <Navigate to="/barber/login" replace />
  }

  return children
}

export default BarberPrivateRoute

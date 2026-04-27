import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function MasterPrivateRoute({ children }) {
  const { isAuthenticated, isMasterAuthenticated, loading } = useAuth()

  if (loading) {
    return <main className="page-center">Carregando...</main>
  }

  if (!isAuthenticated) {
    return <Navigate to="/master/login" replace />
  }

  if (!isMasterAuthenticated) {
    return <Navigate to="/master/login" replace />
  }

  return children
}

export default MasterPrivateRoute

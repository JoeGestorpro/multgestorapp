import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { AUTH_SCOPE_TENANT_ADMIN } from '../constants/authScopes'

function ModuleRoute({ children, slug }) {
  const { hasModule, isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <main className="page-center">Carregando...</main>
  }

  if (!isAuthenticated) {
    return <Navigate to="/barber/login" replace />
  }

  if (user?.auth_scope !== AUTH_SCOPE_TENANT_ADMIN) {
    return <Navigate to="/barber/login" replace />
  }

  if (!hasModule(slug)) {
    return <Navigate to="/select-module" replace />
  }

  return children
}

export default ModuleRoute

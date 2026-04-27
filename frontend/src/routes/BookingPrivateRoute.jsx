import { Navigate, useParams } from 'react-router-dom'
import { useBookingAuth } from '../contexts/useBookingAuth'

function BookingPrivateRoute({ children }) {
  const { slug } = useParams()
  const { isAuthenticated, loading, user } = useBookingAuth()

  if (loading) {
    return <main className="page-center">Carregando...</main>
  }

  if (!isAuthenticated) {
    return <Navigate to={`/agendar/${slug}/login`} replace />
  }

  if (user?.auth_scope !== 'booking_customer') {
    return <Navigate to={`/agendar/${slug}/login`} replace />
  }

  if (slug && user?.company_public_booking_slug && user.company_public_booking_slug !== slug) {
    return <Navigate to={`/agendar/${user.company_public_booking_slug}/minha-conta`} replace />
  }

  return children
}

export default BookingPrivateRoute

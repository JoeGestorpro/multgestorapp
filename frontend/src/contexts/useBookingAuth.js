import { useContext } from 'react'
import { BookingAuthContext } from './booking.context'

export function useBookingAuth() {
  const context = useContext(BookingAuthContext)

  if (!context) {
    throw new Error('useBookingAuth deve ser usado dentro de BookingAuthProvider')
  }

  return context
}

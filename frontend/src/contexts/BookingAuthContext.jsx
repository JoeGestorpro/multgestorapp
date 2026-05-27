import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { clearStoredToken, getStoredToken, setStoredToken } from '../services/authStorage'
import { BookingAuthContext } from './booking.context'

const BOOKING_SCOPE = 'booking'

export function BookingAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => getStoredToken(BOOKING_SCOPE))
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    clearStoredToken(BOOKING_SCOPE)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    async function loadUser() {
      let storedToken = getStoredToken(BOOKING_SCOPE)

      if (!storedToken) {
        try {
          const refreshResponse = await api.post('/booking-auth/refresh')
          if (refreshResponse.data?.success && refreshResponse.data?.data?.token) {
            storedToken = refreshResponse.data.data.token
            setStoredToken(BOOKING_SCOPE, storedToken)
          }
        } catch {
          setLoading(false)
          return
        }
      }

      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/booking-auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        })
        setUser(response.data.data.user)
        setToken(storedToken)
      } catch {
        clearSession()
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [clearSession])

  async function login({ email, password, companySlug }) {
    const response = await api.post(`/public/booking/${companySlug}/login`, {
      email,
      password
    })

    const authToken = response.data.data.token
    const authUser = response.data.data.user

    setStoredToken(BOOKING_SCOPE, authToken)
    setToken(authToken)
    setUser(authUser)

    return authUser
  }

  const logout = useCallback(async () => {
    try {
      await api.post('/booking-auth/logout')
    } catch {
      // Ignorar
    }
    clearSession()
  }, [clearSession])

  const getDefaultRoute = useCallback((fallbackSlug) => {
    const slug = fallbackSlug || user?.company_public_booking_slug
    return slug ? `/agendar/${slug}/minha-conta` : '/'
  }, [user])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
      getDefaultRoute
    }),
    [user, token, loading, logout, getDefaultRoute]
  )

  return <BookingAuthContext.Provider value={value}>{children}</BookingAuthContext.Provider>
}

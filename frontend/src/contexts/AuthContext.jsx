import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import {
  clearStoredToken,
  getActiveBackofficeScope,
  getStoredToken,
  setActiveBackofficeScope,
  setStoredToken
} from '../services/authStorage'
import { AuthContext } from './auth.context'

function resolveStoredBackofficeSession() {
  const activeScope = getActiveBackofficeScope()

  if (activeScope === 'master') {
    const masterToken = getStoredToken('master')

    if (masterToken) {
      return {
        scope: 'master',
        token: masterToken
      }
    }
  }

  if (activeScope === 'barber') {
    const barberToken = getStoredToken('barber')

    if (barberToken) {
      return {
        scope: 'barber',
        token: barberToken
      }
    }
  }

  const masterToken = getStoredToken('master')

  if (masterToken) {
    return {
      scope: 'master',
      token: masterToken
    }
  }

  const barberToken = getStoredToken('barber')

  if (barberToken) {
    return {
      scope: 'barber',
      token: barberToken
    }
  }

  return {
    scope: null,
    token: null
  }
}

export function AuthProvider({ children }) {
  const storedSession = resolveStoredBackofficeSession()
  const [user, setUser] = useState(null)
  const [modules, setModules] = useState([])
  const [scope, setScope] = useState(storedSession.scope)
  const [token, setToken] = useState(storedSession.token)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback((targetScope = scope) => {
    if (targetScope === 'master') {
      clearStoredToken('master')
    }

    if (targetScope === 'barber') {
      clearStoredToken('barber')
    }

    if (!targetScope || getActiveBackofficeScope() === targetScope) {
      setActiveBackofficeScope('')
    }

    setScope(null)
    setToken(null)
    setUser(null)
    setModules([])
  }, [scope])

  useEffect(() => {
    async function loadUser() {
      const currentSession = resolveStoredBackofficeSession()

      if (!currentSession.token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${currentSession.token}`
          }
        })

        setUser(response.data.data.user)
        setModules(response.data.data.modules || [])
        setToken(currentSession.token)
        setScope(currentSession.scope)
      } catch {
        clearStoredToken('barber')
        clearStoredToken('master')
        setActiveBackofficeScope('')
        setUser(null)
        setModules([])
        setToken(null)
        setScope(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  async function loginBarber(email, password) {
    const response = await api.post('/auth/barber/login', {
      email,
      password
    })

    const authToken = response.data.data.token
    const authUser = response.data.data.user
    const authModules = response.data.data.modules || []

    setStoredToken('barber', authToken)
    setActiveBackofficeScope('barber')
    setScope('barber')
    setToken(authToken)
    setUser(authUser)
    setModules(authModules)

    return {
      user: authUser,
      modules: authModules,
      scope: 'barber'
    }
  }

  async function loginMaster(email, password) {
    const response = await api.post('/auth/master/login', {
      email,
      password
    })

    const authToken = response.data.data.token
    const authUser = response.data.data.user
    const authModules = response.data.data.modules || []

    setStoredToken('master', authToken)
    setActiveBackofficeScope('master')
    setScope('master')
    setToken(authToken)
    setUser(authUser)
    setModules(authModules)

    return {
      user: authUser,
      modules: authModules,
      scope: 'master'
    }
  }

  async function login(email, password) {
    return loginBarber(email, password)
  }

  async function register({ name, email, password }) {
    const response = await api.post('/auth/register', {
      name,
      email,
      password
    })

    return response.data.data
  }

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const hasModule = useCallback((slug) => {
    return modules.some((module) => module.slug === slug)
  }, [modules])

  const getDefaultRoute = useCallback(() => {
    if (scope === 'master' || user?.auth_scope === 'master' || user?.role === 'master_admin') {
      return '/master/dashboard'
    }

    if (hasModule('barber')) {
      return '/barber/dashboard'
    }

    if (modules.length === 1) {
      return `/${modules[0].slug}`
    }

    if (modules.length > 1) {
      return '/select-module'
    }

    return '/no-modules'
  }, [hasModule, modules, scope, user])

  const value = useMemo(
    () => ({
      user,
      modules,
      token,
      scope,
      loading,
      isAuthenticated: Boolean(user && token),
      isMasterAuthenticated: Boolean(user && token && (scope === 'master' || user?.auth_scope === 'master')),
      isBarberAuthenticated: Boolean(user && token && (scope === 'barber' || user?.auth_scope === 'barber_admin')),
      login,
      loginBarber,
      loginMaster,
      register,
      logout,
      hasModule,
      getDefaultRoute
    }),
    [user, modules, token, scope, loading, login, register, logout, hasModule, getDefaultRoute]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

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
import { AUTH_SCOPE_MASTER, AUTH_SCOPE_TENANT_ADMIN } from '../constants/authScopes'

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
  const [planLoading, setPlanLoading] = useState(false)

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
    setPlanLoading(false)
  }, [scope])

  const applyCompanyPlanToUser = useCallback((currentUser, companyPlan) => {
    if (!currentUser || !companyPlan) {
      return currentUser
    }

    return {
      ...currentUser,
      plan_type: companyPlan.plan || currentUser.plan_type,
      plan_status: companyPlan.status || currentUser.plan_status,
      trial_ends_at: companyPlan.trialEndsAt ?? currentUser.trial_ends_at ?? null,
      current_period_end: companyPlan.currentPeriodEnd ?? currentUser.current_period_end ?? null,
      next_due_date: companyPlan.nextDueDate ?? currentUser.next_due_date ?? null,
      max_collaborators: companyPlan.maxCollaborators ?? currentUser.max_collaborators ?? null,
      plan_source: companyPlan.source || currentUser.plan_source || null,
      plan_is_active: companyPlan.isActive ?? currentUser.plan_is_active ?? null
    }
  }, [])

  const fetchBarberCompanyPlan = useCallback(async (authToken) => {
    const response = await api.get('/barber/company/plan', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })

    return response.data?.data || null
  }, [])

  const rehydrateBarberPlan = useCallback(async (authToken, baseUser) => {
    if (!authToken || !baseUser?.company_id) {
      return baseUser
    }

    setPlanLoading(true)

    try {
      const companyPlan = await fetchBarberCompanyPlan(authToken)
      return applyCompanyPlanToUser(baseUser, companyPlan)
    } catch (error) {
      console.error('Erro ao reidratar plano da empresa no Barber:', error)
      return baseUser
    } finally {
      setPlanLoading(false)
    }
  }, [applyCompanyPlanToUser, fetchBarberCompanyPlan])

  useEffect(() => {
    async function loadUser() {
      // Tentar token já em memória (caso raro: mount duplo)
      const currentSession = resolveStoredBackofficeSession()

      let activeToken = currentSession.token
      let activeScope = currentSession.scope

      // Se não há token em memória, tentar refresh via cookie
      if (!activeToken) {
        try {
          const refreshResponse = await api.post('/auth/refresh')
          // withCredentials envia o cookie automaticamente
          if (refreshResponse.data?.success && refreshResponse.data?.data?.token) {
            activeToken = refreshResponse.data.data.token

            // Descobrir o scope pelo role do user retornado
            const refreshedUser = refreshResponse.data.data.user
            activeScope = refreshedUser?.auth_scope === AUTH_SCOPE_MASTER ? 'master' : 'barber'

            setStoredToken(activeScope, activeToken)
            setActiveBackofficeScope(activeScope)
          }
        } catch {
          // Cookie expirado ou não existe — usuário não autenticado
          setLoading(false)
          return
        }
      }

      if (!activeToken) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${activeToken}`
          }
        })

        const authUser = response.data.data.user
        const resolvedUser = activeScope === 'barber'
          ? await rehydrateBarberPlan(activeToken, authUser)
          : authUser

        setUser(resolvedUser)
        setModules(response.data.data.modules || [])
        setToken(activeToken)
        setScope(activeScope)
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
    const authUser = await rehydrateBarberPlan(authToken, response.data.data.user)
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

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout') // limpa o cookie HttpOnly
    } catch {
      // Ignorar erro — limpar estado local de qualquer forma
    }
    clearSession()
  }, [clearSession])

  const hasModule = useCallback((slug) => {
    return modules.some((module) => module.slug === slug)
  }, [modules])

  const getDefaultRoute = useCallback(() => {
    if (scope === 'master' || user?.auth_scope === AUTH_SCOPE_MASTER || user?.role === 'master_admin') {
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
      isMasterAuthenticated: Boolean(user && token && (scope === 'master' || user?.auth_scope === AUTH_SCOPE_MASTER)),
      isBarberAuthenticated: Boolean(user && token && (scope === 'barber' || user?.auth_scope === AUTH_SCOPE_TENANT_ADMIN)),
      planLoading,
      login,
      loginBarber,
      loginMaster,
      register,
      logout,
      hasModule,
      getDefaultRoute,
      refreshCompanyPlan: async () => {
        if (scope !== 'barber' || !token || !user) {
          return null
        }

        const nextUser = await rehydrateBarberPlan(token, user)
        setUser(nextUser)
        return nextUser
      }
    }),
    [user, modules, token, scope, loading, planLoading, login, register, logout, hasModule, getDefaultRoute, rehydrateBarberPlan]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

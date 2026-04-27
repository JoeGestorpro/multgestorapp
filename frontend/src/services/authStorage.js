export const AUTH_TOKEN_KEYS = {
  booking: 'booking_customer_token',
  barber: 'barber_admin_token',
  master: 'master_admin_token'
}

const ACTIVE_BACKOFFICE_SCOPE_KEY = 'backoffice_active_scope'

export function getStoredToken(scope) {
  const key = AUTH_TOKEN_KEYS[scope]
  return key ? window.localStorage.getItem(key) : null
}

export function setStoredToken(scope, token) {
  const key = AUTH_TOKEN_KEYS[scope]

  if (!key) {
    return
  }

  if (token) {
    window.localStorage.setItem(key, token)
    return
  }

  window.localStorage.removeItem(key)
}

export function clearStoredToken(scope) {
  setStoredToken(scope, '')
}

export function getActiveBackofficeScope() {
  return window.localStorage.getItem(ACTIVE_BACKOFFICE_SCOPE_KEY)
}

export function setActiveBackofficeScope(scope) {
  if (scope) {
    window.localStorage.setItem(ACTIVE_BACKOFFICE_SCOPE_KEY, scope)
    return
  }

  window.localStorage.removeItem(ACTIVE_BACKOFFICE_SCOPE_KEY)
}

export function getDefaultBackofficeToken() {
  const activeScope = getActiveBackofficeScope()

  if (activeScope === 'master' || activeScope === 'barber') {
    return getStoredToken(activeScope)
  }

  return getStoredToken('barber') || getStoredToken('master')
}

export function getAuthHeaders(scope) {
  const token = scope === 'backoffice'
    ? getDefaultBackofficeToken()
    : getStoredToken(scope)

  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}

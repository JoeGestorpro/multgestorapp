// ATENÇÃO: tokens agora ficam em memória (não mais localStorage).
// Persistência entre reloads é feita via HttpOnly cookie no backend
// chamando POST /api/auth/refresh no mount do AuthContext.
// Ref: CF-009

const _tokenStore = new Map()
// Chaves: 'booking_customer_token', 'barber_admin_token', 'master_admin_token'

let _activeBackofficeScope = null

export const AUTH_TOKEN_KEYS = {
  booking: 'booking_customer_token',
  barber:  'barber_admin_token',
  master:  'master_admin_token'
}

export function getStoredToken(scope) {
  const key = AUTH_TOKEN_KEYS[scope]
  return key ? (_tokenStore.get(key) || null) : null
}

export function setStoredToken(scope, token) {
  const key = AUTH_TOKEN_KEYS[scope]
  if (!key) return
  if (token) {
    _tokenStore.set(key, token)
  } else {
    _tokenStore.delete(key)
  }
}

export function clearStoredToken(scope) {
  setStoredToken(scope, null)
}

export function getActiveBackofficeScope() {
  return _activeBackofficeScope
}

export function setActiveBackofficeScope(scope) {
  _activeBackofficeScope = scope || null
}

export function getDefaultBackofficeToken() {
  const activeScope = _activeBackofficeScope

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

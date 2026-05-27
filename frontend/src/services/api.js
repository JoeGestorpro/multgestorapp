import axios from 'axios'
import { getDefaultBackofficeToken } from './authStorage'

function resolveApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_URL || '').trim()

  if (!configured) {
    return 'http://localhost:5000/api'
  }

  return configured.endsWith('/api') ? configured : `${configured.replace(/\/+$/, '')}/api`
}

const apiBaseUrl = resolveApiBaseUrl()

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = getDefaultBackofficeToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const data = error.response?.data

    // Redirecionar para escolha de plano quando trial expirar
    if (
      status === 403 &&
      data?.error === 'Plano inativo' &&
      !window.location.pathname.startsWith('/escolher-plano') &&
      !window.location.pathname.startsWith('/agendar/')
    ) {
      window.location.href = '/escolher-plano'
    }

    return Promise.reject(error)
  }
)

export default api

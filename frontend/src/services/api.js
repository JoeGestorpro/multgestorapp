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
  baseURL: apiBaseUrl
})

api.interceptors.request.use((config) => {
  const token = getDefaultBackofficeToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api

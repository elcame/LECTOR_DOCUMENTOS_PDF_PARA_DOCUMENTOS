/**
 * Construye query params con JWT para peticiones directas del navegador
 * (window.open, <img src>) donde no se envía el header Authorization.
 */
import { getLocalStorage } from './storage'
import { API_CONFIG, STORAGE_KEYS } from '../config/constants'

export function withAuthQueryParams(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })
  const token = getLocalStorage(STORAGE_KEYS.AUTH_TOKEN)
  if (token) {
    search.set('token', token)
  }
  return search
}

export function buildAuthenticatedApiUrl(path, params = {}) {
  const query = withAuthQueryParams(params).toString()
  return query ? `${API_CONFIG.BASE_URL}${path}?${query}` : `${API_CONFIG.BASE_URL}${path}`
}

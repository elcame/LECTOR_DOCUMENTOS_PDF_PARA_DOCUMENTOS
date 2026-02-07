/**
 * Cliente API centralizado con Axios
 */
import axios from 'axios'
import { API_CONFIG } from '../config/constants'
import { errorHandler } from '../utils/errorHandler'
import { getLocalStorage, removeLocalStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../config/constants'

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de request - Siempre enviar token como Authorization header
api.interceptors.request.use(
  (config) => {
    const token = getLocalStorage(STORAGE_KEYS.AUTH_TOKEN)
    
    if (token) {
      // Usar Authorization header en todos los entornos (producción y desarrollo)
      // El backend soporta tanto header como query parameter
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor de response
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const handledError = errorHandler(error)
    
    if (handledError.status === 401) {
      // Si la petición TENÍA un token y aún así devuelve 401,
      // significa que el token es inválido/expirado → limpiar y redirigir
      const hadToken = error?.config?.headers?.Authorization
      if (hadToken) {
        removeLocalStorage(STORAGE_KEYS.AUTH_TOKEN)
        removeLocalStorage(STORAGE_KEYS.USER_DATA)
        // Redirigir solo si no estamos ya en una ruta pública
        const path = window.location.pathname
        const rutasPublicas = ['/', '/landing', '/login', '/register']
        if (!rutasPublicas.includes(path)) {
          window.location.href = '/login'
        }
      }
      // Si NO tenía token (ej. checkAuth en primera carga), solo propagar el error
      // El AuthContext maneja este caso poniendo user = null
    }
    
    return Promise.reject(handledError)
  }
)

export default api

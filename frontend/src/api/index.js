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

// Interceptor de request
api.interceptors.request.use(
  (config) => {
    // Agregar token si existe
    const token = getLocalStorage(STORAGE_KEYS.AUTH_TOKEN)
    if (token) {
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
    // Retornar solo los datos
    return response
  },
  (error) => {
    // Manejar errores
    const handledError = errorHandler(error)
    
    // Si es error 401, limpiar datos de autenticación
    if (handledError.status === 401) {
      removeLocalStorage(STORAGE_KEYS.AUTH_TOKEN)
      removeLocalStorage(STORAGE_KEYS.USER_DATA)
    }
    
    return Promise.reject(handledError)
  }
)

export default api

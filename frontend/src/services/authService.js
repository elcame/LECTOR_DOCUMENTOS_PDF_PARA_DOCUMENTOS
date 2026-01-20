/**
 * Servicio de autenticación
 */
import api from '../api'
import { ENDPOINTS } from '../api/endpoints'
import { setLocalStorage, removeLocalStorage } from '../utils/storage'
import { STORAGE_KEYS } from '../config/constants'

export const authService = {
  /**
   * Iniciar sesión
   */
  async login(username, password) {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, { username, password })
    
    // Verificar que la respuesta sea exitosa
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Error al iniciar sesión')
    }
    
    const user = response.data.user
    
    // Guardar token y datos de usuario
    if (user) {
      setLocalStorage(STORAGE_KEYS.USER_DATA, user)
      // Si el backend devuelve un token, guardarlo
      if (response.data.token) {
        setLocalStorage(STORAGE_KEYS.AUTH_TOKEN, response.data.token)
      }
    }
    
    return user
  },

  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, userData)
    
    // Verificar que la respuesta sea exitosa
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Error al registrar usuario')
    }
    
    const user = response.data.user
    
    // Guardar datos de usuario
    if (user) {
      setLocalStorage(STORAGE_KEYS.USER_DATA, user)
      if (response.data.token) {
        setLocalStorage(STORAGE_KEYS.AUTH_TOKEN, response.data.token)
      }
    }
    
    return user
  },

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      // Limpiar datos locales
      removeLocalStorage(STORAGE_KEYS.AUTH_TOKEN)
      removeLocalStorage(STORAGE_KEYS.USER_DATA)
    }
  },

  /**
   * Obtener usuario actual
   */
  async getCurrentUser() {
    const response = await api.get(ENDPOINTS.AUTH.ME)
    const user = response.data.user
    
    // Actualizar datos de usuario
    if (user) {
      setLocalStorage(STORAGE_KEYS.USER_DATA, user)
    }
    
    return user
  },
}

export default authService

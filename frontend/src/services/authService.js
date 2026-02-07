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
    console.log('DEBUG AUTH 1 - Función login iniciada')
    try {
      console.log('DEBUG AUTH 2 - Llamando a api.post...')
      const response = await api.post(ENDPOINTS.AUTH.LOGIN, { username, password })
      console.log('DEBUG AUTH 3 - Respuesta recibida:', JSON.stringify(response))
      console.log('DEBUG AUTH 4 - response.data:', JSON.stringify(response.data))
      
      // Verificar que la respuesta sea exitosa
      if (!response.data || !response.data.success) {
        console.log('DEBUG AUTH 5 - Login fallido:', response.data)
        throw new Error(response.data?.message || 'Error al iniciar sesión')
      }
      
      console.log('DEBUG AUTH 6 - Login exitoso, procesando...')
      const user = response.data.user
      const token = response.data.token
      console.log('DEBUG AUTH 7 - user:', JSON.stringify(user))
      console.log('DEBUG AUTH 8 - token existe:', !!token)
      
      // Guardar token y datos de usuario
      if (user) {
        console.log('DEBUG AUTH 9 - Guardando en localStorage...')
        setLocalStorage(STORAGE_KEYS.USER_DATA, user)
        
        if (token) {
          console.log('DEBUG AUTH 10 - Guardando token...')
          setLocalStorage(STORAGE_KEYS.AUTH_TOKEN, token)
          console.log('DEBUG AUTH 11 - Token guardado, verificando...')
          const verifyToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
          console.log('DEBUG AUTH 12 - Token en localStorage:', verifyToken ? 'SÍ' : 'NO')
        }
      }
      
      console.log('DEBUG AUTH 13 - Retornando usuario')
      console.log('DEBUG AUTH 14 - Verificación final localStorage:', localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ? 'SÍ' : 'NO')
      return user
    } catch (error) {
      console.error('DEBUG AUTH ERROR:', error.message)
      console.error('DEBUG AUTH ERROR stack:', error.stack)
      throw error
    }
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

/**
 * Servicio para operaciones de administración
 */
import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const adminService = {
  /**
   * Obtener lista de conductores desde manifiestos
   */
  async getConductores() {
    const response = await api.get('/manifiestos/conductores')
    return response.data
  },

  /**
   * Obtener todos los usuarios
   */
  async getUsuarios() {
    const response = await api.get(ENDPOINTS.USUARIOS_FIREBASE)
    return response.data
  },

  /**
   * Crear nuevo usuario
   */
  async createUsuario(userData) {
    const response = await api.post(ENDPOINTS.USUARIOS_FIREBASE, userData)
    return response.data
  },

  /**
   * Actualizar usuario existente
   */
  async updateUsuario(userId, userData) {
    const response = await api.put(`${ENDPOINTS.USUARIOS_FIREBASE}/${userId}`, userData)
    return response.data
  },

  /**
   * Eliminar usuario
   */
  async deleteUsuario(userId) {
    const response = await api.delete(`${ENDPOINTS.USUARIOS_FIREBASE}/${userId}`)
    return response.data
  },

  /**
   * Obtener todos los roles
   */
  async getRoles() {
    const response = await api.get(ENDPOINTS.ROLES)
    return response.data
  },

  /**
   * Crear nuevo rol
   */
  async createRol(rolData) {
    const response = await api.post(ENDPOINTS.ROLES, rolData)
    return response.data
  },

  /**
   * Actualizar rol
   */
  async updateRol(rolId, rolData) {
    const response = await api.put(`${ENDPOINTS.ROLES}/${rolId}`, rolData)
    return response.data
  },

  /**
   * Eliminar rol
   */
  async deleteRol(rolId) {
    const response = await api.delete(`${ENDPOINTS.ROLES}/${rolId}`)
    return response.data
  }
}

export default adminService

/**
 * Servicio de usuarios Firebase
 */
import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const usuariosFirebaseService = {
  /**
   * Obtener todos los usuarios
   */
  async getAll() {
    const response = await api.get(ENDPOINTS.USUARIOS_FIREBASE.BASE)
    return response.data
  },

  /**
   * Obtener un usuario por username
   */
  async getByUsername(username) {
    const response = await api.get(ENDPOINTS.USUARIOS_FIREBASE.BY_USERNAME(username))
    return response.data
  },

  /**
   * Crear un nuevo usuario
   */
  async create(userData) {
    const response = await api.post(ENDPOINTS.USUARIOS_FIREBASE.BASE, userData)
    return response.data
  },

  /**
   * Actualizar un usuario
   */
  async update(username, userData) {
    const response = await api.put(ENDPOINTS.USUARIOS_FIREBASE.BY_USERNAME(username), userData)
    return response.data
  },

  /**
   * Eliminar un usuario
   */
  async delete(username) {
    const response = await api.delete(ENDPOINTS.USUARIOS_FIREBASE.BY_USERNAME(username))
    return response.data
  },

  /**
   * Asignar rol a un usuario
   */
  async assignRole(username, roleId) {
    const response = await api.put(ENDPOINTS.USUARIOS_FIREBASE.ROLE(username), { role_id: roleId })
    return response.data
  },

  /**
   * Obtener usuarios por rol
   */
  async getByRole(roleId) {
    const response = await api.get(ENDPOINTS.USUARIOS_FIREBASE.BY_ROLE(roleId))
    return response.data
  },

  /**
   * Alias para compatibilidad con componentes existentes
   */
  async getAllUsuarios(activeOnly = false) {
    const response = await api.get(ENDPOINTS.USUARIOS_FIREBASE.BASE, {
      params: { active_only: activeOnly }
    })
    return response.data
  },

  async createUsuario(userData) {
    return this.create(userData)
  },

  async updateUsuario(username, userData) {
    return this.update(username, userData)
  },

  async deleteUsuario(username) {
    return this.delete(username)
  },
}

export default usuariosFirebaseService

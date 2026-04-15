/**
 * Servicio para operaciones de administración
 */
import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const adminService = {
  async getConductores() {
    const response = await api.get('/manifiestos/conductores')
    return response.data
  },

  async getUsuarios() {
    const response = await api.get(ENDPOINTS.USUARIOS_FIREBASE.BASE)
    return response.data
  },

  async createUsuario(userData) {
    const response = await api.post(ENDPOINTS.USUARIOS_FIREBASE.BASE, userData)
    return response.data
  },

  async updateUsuario(username, userData) {
    const response = await api.put(ENDPOINTS.USUARIOS_FIREBASE.BY_USERNAME(username), userData)
    return response.data
  },

  async deleteUsuario(username) {
    const response = await api.delete(ENDPOINTS.USUARIOS_FIREBASE.BY_USERNAME(username))
    return response.data
  },

  async assignRole(username, roleId) {
    const response = await api.put(ENDPOINTS.USUARIOS_FIREBASE.ROLE(username), { role_id: roleId })
    return response.data
  },

  async assignCarro(username, carroId) {
    const response = await api.put(ENDPOINTS.USUARIOS_FIREBASE.CARRO(username), { carro_id: carroId })
    return response.data
  },

  async getConductoresWithCarros() {
    const response = await api.get(ENDPOINTS.USUARIOS_FIREBASE.CONDUCTORES_WITH_CARROS)
    return response.data
  },

  async getRoles() {
    const response = await api.get(ENDPOINTS.ROLES.BASE)
    return response.data
  },

  async createRol(rolData) {
    const response = await api.post(ENDPOINTS.ROLES.BASE, rolData)
    return response.data
  },

  async updateRol(rolName, rolData) {
    const response = await api.put(ENDPOINTS.ROLES.BY_NAME(rolName), rolData)
    return response.data
  },

  async deleteRol(rolName) {
    const response = await api.delete(ENDPOINTS.ROLES.BY_NAME(rolName))
    return response.data
  },

  async getCarrosDisponibles() {
    const response = await api.get(ENDPOINTS.CARROS.BASE)
    return response.data
  },
}

export default adminService

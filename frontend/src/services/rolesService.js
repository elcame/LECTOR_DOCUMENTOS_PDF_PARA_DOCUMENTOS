/**
 * Servicio de roles
 */
import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const rolesService = {
  /**
   * Obtener todos los roles
   */
  async getAll() {
    const response = await api.get(ENDPOINTS.ROLES.BASE)
    return response.data
  },

  /**
   * Obtener un rol por nombre
   */
  async getByName(name) {
    const response = await api.get(ENDPOINTS.ROLES.BY_NAME(name))
    return response.data
  },

  /**
   * Crear un nuevo rol
   */
  async create(roleData) {
    const response = await api.post(ENDPOINTS.ROLES.BASE, roleData)
    return response.data
  },

  /**
   * Actualizar un rol
   */
  async update(name, roleData) {
    const response = await api.put(ENDPOINTS.ROLES.BY_NAME(name), roleData)
    return response.data
  },

  /**
   * Eliminar un rol
   */
  async delete(name) {
    const response = await api.delete(ENDPOINTS.ROLES.BY_NAME(name))
    return response.data
  },

  /**
   * Agregar permiso a un rol
   */
  async addPermission(name, permission) {
    const response = await api.post(ENDPOINTS.ROLES.PERMISSIONS(name), { permission })
    return response.data
  },

  /**
   * Eliminar permiso de un rol
   */
  async removePermission(name, permission) {
    const response = await api.delete(ENDPOINTS.ROLES.PERMISSIONS(name), {
      data: { permission },
    })
    return response.data
  },

  /**
   * Alias para compatibilidad con componentes existentes
   */
  async getAllRoles(activeOnly = false) {
    const response = await api.get(ENDPOINTS.ROLES.BASE, {
      params: { active_only: activeOnly }
    })
    return response.data
  },
}

export default rolesService

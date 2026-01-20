/**
 * Servicio de operaciones
 */
import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const operacionesService = {
  /**
   * Obtener todas las operaciones
   */
  async getAll() {
    const response = await api.get(ENDPOINTS.OPERACIONES.BASE)
    return response.data
  },

  /**
   * Obtener operaciones por mes
   */
  async getByMonth(mes) {
    const response = await api.get(ENDPOINTS.OPERACIONES.BY_MONTH(mes))
    return response.data
  },

  /**
   * Obtener manifiestos disponibles
   */
  async getManifiestosDisponibles() {
    const response = await api.get(ENDPOINTS.OPERACIONES.MANIFIESTOS_DISPONIBLES)
    return response.data
  },
}

export default operacionesService

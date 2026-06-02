/**
 * Servicio API módulo Productividad GTD
 */
import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const productividadService = {
  async getTasks(list = null) {
    const params = list ? { list } : {}
    const res = await api.get(ENDPOINTS.PRODUCTIVIDAD.TASKS, { params })
    return res.data
  },

  async createTask({ title, notes = '', priority = 'medium' }) {
    const res = await api.post(ENDPOINTS.PRODUCTIVIDAD.TASKS, { title, notes, priority })
    return res.data
  },

  async updateTask(taskId, updates) {
    const res = await api.patch(ENDPOINTS.PRODUCTIVIDAD.TASK(taskId), updates)
    return res.data
  },

  async completeTask(taskId) {
    const res = await api.post(ENDPOINTS.PRODUCTIVIDAD.TASK_COMPLETE(taskId))
    return res.data
  },

  async deleteTask(taskId) {
    const res = await api.delete(ENDPOINTS.PRODUCTIVIDAD.TASK(taskId))
    return res.data
  },

  async getDailyStats(date = null) {
    const params = date ? { date } : {}
    const res = await api.get(ENDPOINTS.PRODUCTIVIDAD.STATS_DAILY, { params })
    return res.data
  },

  async getGoogleStatus() {
    const res = await api.get(ENDPOINTS.PRODUCTIVIDAD.GOOGLE_STATUS)
    return res.data
  },

  async getGoogleAuthUrl() {
    try {
      const res = await api.get(ENDPOINTS.PRODUCTIVIDAD.GOOGLE_AUTH_URL)
      return res.data
    } catch (err) {
      const apiError = err?.data?.error || err?.response?.data?.error
      return {
        success: false,
        error: apiError || err?.message || 'Error al conectar con Google',
      }
    }
  },

  async disconnectGoogle() {
    const res = await api.delete(ENDPOINTS.PRODUCTIVIDAD.GOOGLE_DISCONNECT)
    return res.data
  },

  async getCalendarEvents(date = null) {
    const params = date ? { date } : {}
    const res = await api.get(ENDPOINTS.PRODUCTIVIDAD.CALENDAR_EVENTS, { params })
    return res.data
  },
}

/**
 * Servicio para hojas de gasto (plantillas) y aplicación a manifiestos
 */
import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const expenseSheetsService = {
  async list() {
    const response = await api.get(ENDPOINTS.EXPENSE_SHEETS.BASE)
    return response.data
  },

  async create({ name, items }) {
    const response = await api.post(ENDPOINTS.EXPENSE_SHEETS.BASE, { name, items })
    return response.data
  },

  async update(sheetId, data) {
    const response = await api.put(ENDPOINTS.EXPENSE_SHEETS.BY_ID(sheetId), data)
    return response.data
  },

  async remove(sheetId) {
    const response = await api.delete(ENDPOINTS.EXPENSE_SHEETS.BY_ID(sheetId))
    return response.data
  },

  async applyToManifest({ sheetId, manifestId }) {
    const response = await api.post(ENDPOINTS.EXPENSE_SHEETS.APPLY, {
      sheet_id: sheetId,
      manifest_id: manifestId,
    })
    return response.data
  },
}

export default expenseSheetsService


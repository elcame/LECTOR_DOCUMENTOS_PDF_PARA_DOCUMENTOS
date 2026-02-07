/**
 * Servicio para gestión de gastos de viaje y tipos de gastos
 */
import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const expensesService = {
  // ============================================================================
  // TIPOS DE GASTOS
  // ============================================================================

  /**
   * Obtener todos los tipos de gastos
   */
  async getExpenseTypes() {
    const response = await api.get(ENDPOINTS.EXPENSES.TYPES)
    return response.data
  },

  /**
   * Crear un nuevo tipo de gasto
   */
  async createExpenseType(name) {
    const response = await api.post(ENDPOINTS.EXPENSES.TYPES, { name })
    return response.data
  },

  /**
   * Actualizar un tipo de gasto
   */
  async updateExpenseType(typeId, name) {
    const response = await api.put(ENDPOINTS.EXPENSES.TYPE_BY_ID(typeId), { name })
    return response.data
  },

  /**
   * Eliminar un tipo de gasto
   */
  async deleteExpenseType(typeId) {
    const response = await api.delete(ENDPOINTS.EXPENSES.TYPE_BY_ID(typeId))
    return response.data
  },

  /**
   * Inicializar tipos de gastos del sistema
   */
  async initializeExpenseTypes() {
    const response = await api.post(ENDPOINTS.EXPENSES.INITIALIZE_TYPES)
    return response.data
  },

  // ============================================================================
  // GASTOS DE VIAJE
  // ============================================================================

  /**
   * Obtener gastos de viaje
   */
  async getTripExpenses(manifestId = null, startDate = null, endDate = null) {
    const params = {}
    if (manifestId) params.manifest_id = manifestId
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    
    const response = await api.get(ENDPOINTS.EXPENSES.TRIP_EXPENSES, { params })
    return response.data
  },

  /**
   * Crear un nuevo gasto de viaje
   */
  async createTripExpense(manifestId, expenseType, amount) {
    const response = await api.post(ENDPOINTS.EXPENSES.TRIP_EXPENSES, {
      manifest_id: manifestId,
      expense_type: expenseType,
      amount
    })
    return response.data
  },

  /**
   * Actualizar un gasto de viaje
   */
  async updateTripExpense(expenseId, data) {
    const response = await api.put(ENDPOINTS.EXPENSES.TRIP_EXPENSE_BY_ID(expenseId), data)
    return response.data
  },

  /**
   * Eliminar un gasto de viaje
   */
  async deleteTripExpense(expenseId) {
    const response = await api.delete(ENDPOINTS.EXPENSES.TRIP_EXPENSE_BY_ID(expenseId))
    return response.data
  },

  /**
   * Obtener total de gastos de un manifiesto
   */
  async getTotalExpenses(manifestId) {
    const response = await api.get(ENDPOINTS.EXPENSES.TOTAL_EXPENSES(manifestId))
    return response.data
  }
}

export default expensesService

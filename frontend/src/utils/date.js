/**
 * Utilidades para manejo de fechas
 */

/**
 * Obtiene la fecha actual en formato ISO
 */
export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0]
}

/**
 * Obtiene la fecha y hora actual
 */
export const getCurrentDateTime = () => {
  return new Date().toISOString()
}

/**
 * Formatea una fecha para input type="date"
 */
export const formatDateForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

/**
 * Obtiene el primer día del mes
 */
export const getFirstDayOfMonth = (date = new Date()) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  return new Date(year, month, 1)
}

/**
 * Obtiene el último día del mes
 */
export const getLastDayOfMonth = (date = new Date()) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  return new Date(year, month + 1, 0)
}

/**
 * Suma días a una fecha
 */
export const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Resta días a una fecha
 */
export const subtractDays = (date, days) => {
  return addDays(date, -days)
}

/**
 * Compara dos fechas (retorna -1, 0, o 1)
 */
export const compareDates = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  if (d1 < d2) return -1
  if (d1 > d2) return 1
  return 0
}

/**
 * Verifica si una fecha está en un rango
 */
export const isDateInRange = (date, startDate, endDate) => {
  const d = new Date(date)
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return d >= start && d <= end
}

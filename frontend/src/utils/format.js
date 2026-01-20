/**
 * Funciones de formateo de datos
 */

/**
 * Formatea un número como moneda
 */
export const formatCurrency = (value, currency = 'COP') => {
  if (!value && value !== 0) return '-'
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formatea un número con separadores de miles
 */
export const formatNumber = (value, decimals = 0) => {
  if (!value && value !== 0) return '-'
  
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Formatea una fecha
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '-'
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }
  
  return new Intl.DateTimeFormat('es-CO', defaultOptions).format(new Date(date))
}

/**
 * Formatea fecha y hora
 */
export const formatDateTime = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea una fecha corta (DD/MM/YYYY)
 */
export const formatDateShort = (date) => {
  if (!date) return '-'
  
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Trunca un texto a una longitud máxima
 */
export const truncate = (text, maxLength = 50, suffix = '...') => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + suffix
}

/**
 * Capitaliza la primera letra
 */
export const capitalize = (text) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Capitaliza cada palabra
 */
export const capitalizeWords = (text) => {
  if (!text) return ''
  return text
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ')
}

/**
 * Funciones de validación reutilizables
 */

export const validators = {
  /**
   * Valida que el campo sea requerido
   */
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'Este campo es obligatorio'
    }
    return null
  },

  /**
   * Valida formato de email
   */
  email: (value) => {
    if (!value) return null // Si está vacío, required se encargará
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Email inválido'
    }
    return null
  },

  /**
   * Valida longitud mínima
   */
  minLength: (min) => (value) => {
    if (!value) return null
    if (value.length < min) {
      return `Mínimo ${min} caracteres`
    }
    return null
  },

  /**
   * Valida longitud máxima
   */
  maxLength: (max) => (value) => {
    if (!value) return null
    if (value.length > max) {
      return `Máximo ${max} caracteres`
    }
    return null
  },

  /**
   * Valida contraseña
   */
  password: (value) => {
    if (!value) return null
    if (value.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres'
    }
    return null
  },

  /**
   * Valida que dos valores sean iguales
   */
  match: (otherValue, fieldName = 'campo') => (value) => {
    if (value !== otherValue) {
      return `Los valores no coinciden con ${fieldName}`
    }
    return null
  },

  /**
   * Valida número
   */
  number: (value) => {
    if (!value) return null
    if (isNaN(value)) {
      return 'Debe ser un número válido'
    }
    return null
  },

  /**
   * Valida número positivo
   */
  positive: (value) => {
    if (!value) return null
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      return 'Debe ser un número positivo'
    }
    return null
  },
}

/**
 * Valida un formulario completo
 * @param {Object} formData - Datos del formulario
 * @param {Object} rules - Reglas de validación por campo
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateForm = (formData, rules) => {
  const errors = {}
  
  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field]
    const value = formData[field]
    
    // Si el campo no tiene reglas, saltar
    if (!fieldRules || fieldRules.length === 0) {
      return
    }
    
    // Aplicar cada regla hasta encontrar un error
    for (const rule of fieldRules) {
      let error = null
      
      if (typeof rule === 'function') {
        error = rule(value)
      } else if (typeof rule === 'object' && rule.validator) {
        error = rule.validator(value, formData)
      }
      
      if (error) {
        errors[field] = error
        break // Detener en el primer error
      }
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

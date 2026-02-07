/**
 * Manejo centralizado de errores de la API
 * 
 * NOTA: La lógica de redirección por 401 y limpieza de token se maneja 
 * en el interceptor de Axios (api/index.js), NO aquí.
 */
export const errorHandler = (error) => {
  if (error.response) {
    // Error de respuesta del servidor
    const { status, data } = error.response
    
    switch (status) {
      case 401:
        // No autorizado - NO limpiar token ni redirigir aquí
        // El interceptor de Axios y el AuthContext manejan la lógica de sesión
        // Esto evita la cascada: endpoint 401 -> borra token -> recarga -> /me sin token -> 401
        return { 
          message: 'Sesión expirada. Por favor, inicia sesión nuevamente.', 
          status,
          code: 'UNAUTHORIZED'
        }
      
      case 403:
        return { 
          message: 'No tienes permisos para realizar esta acción.', 
          status,
          code: 'FORBIDDEN'
        }
      
      case 404:
        return { 
          message: 'Recurso no encontrado.', 
          status,
          code: 'NOT_FOUND'
        }
      
      case 422:
        // Error de validación
        return { 
          message: data?.message || 'Error de validación', 
          status,
          code: 'VALIDATION_ERROR',
          errors: data?.errors || {}
        }
      
      case 500:
        return { 
          message: data?.message || 'Error del servidor. Por favor, intenta más tarde.', 
          status,
          code: 'SERVER_ERROR'
        }
      
      default:
        return { 
          message: data?.message || 'Error desconocido', 
          status,
          code: 'UNKNOWN_ERROR',
          data: data 
        }
    }
  } else if (error.request) {
    // Petición cancelada (AbortController, navegación, etc.)
    if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.name === 'CanceledError') {
      return { message: 'Petición cancelada', status: 0, code: 'CANCELED' }
    }
    // Timeout de axios
    if (error.code === 'ECONNABORTED') {
      return { message: 'Tiempo de espera agotado.', status: 0, code: 'TIMEOUT' }
    }
    // Error de red
    return { 
      message: 'Error de conexión. Verifica tu conexión a internet.', 
      status: 0,
      code: 'NETWORK_ERROR'
    }
  } else {
    // Petición cancelada antes de enviar (AbortController, ej. message 'canceled')
    if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.name === 'CanceledError' ||
        (error.message && String(error.message).toLowerCase() === 'canceled')) {
      return { message: 'Petición cancelada', status: 0, code: 'CANCELED' }
    }
    // Error al configurar la petición
    return { 
      message: error.message || 'Error desconocido', 
      status: 0,
      code: 'REQUEST_ERROR'
    }
  }
}

/**
 * Extrae el mensaje de error de forma segura
 */
export const getErrorMessage = (error) => {
  // Si es un string, devolverlo directamente
  if (typeof error === 'string') {
    return error
  }
  
  // Si tiene mensaje directo
  if (error?.message) {
    return error.message
  }
  
  // Si es un error de respuesta HTTP
  if (error?.response?.data) {
    const data = error.response.data
    
    // Si tiene mensaje en data
    if (data.message) {
      return data.message
    }
    
    // Si tiene error.message en data
    if (data.error?.message) {
      return data.error.message
    }
    
    // Si tiene detalles de validación
    if (data.error?.details && Array.isArray(data.error.details)) {
      return data.error.details.map(d => d.msg).join(', ')
    }
  }
  
  return 'Ha ocurrido un error inesperado'
}

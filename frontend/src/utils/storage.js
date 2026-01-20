/**
 * Utilidades para LocalStorage y SessionStorage
 */

/**
 * Guarda un valor en localStorage
 */
export const setLocalStorage = (key, value) => {
  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    console.error('Error guardando en localStorage:', error)
    return false
  }
}

/**
 * Obtiene un valor de localStorage
 */
export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    if (item === null) return defaultValue
    return JSON.parse(item)
  } catch (error) {
    console.error('Error leyendo de localStorage:', error)
    return defaultValue
  }
}

/**
 * Elimina un valor de localStorage
 */
export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Error eliminando de localStorage:', error)
    return false
  }
}

/**
 * Limpia todo el localStorage
 */
export const clearLocalStorage = () => {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('Error limpiando localStorage:', error)
    return false
  }
}

/**
 * Guarda un valor en sessionStorage
 */
export const setSessionStorage = (key, value) => {
  try {
    const serialized = JSON.stringify(value)
    sessionStorage.setItem(key, serialized)
    return true
  } catch (error) {
    console.error('Error guardando en sessionStorage:', error)
    return false
  }
}

/**
 * Obtiene un valor de sessionStorage
 */
export const getSessionStorage = (key, defaultValue = null) => {
  try {
    const item = sessionStorage.getItem(key)
    if (item === null) return defaultValue
    return JSON.parse(item)
  } catch (error) {
    console.error('Error leyendo de sessionStorage:', error)
    return defaultValue
  }
}

/**
 * Elimina un valor de sessionStorage
 */
export const removeSessionStorage = (key) => {
  try {
    sessionStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Error eliminando de sessionStorage:', error)
    return false
  }
}

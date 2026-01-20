import { useState, useEffect } from 'react'
import { getLocalStorage, setLocalStorage, removeLocalStorage } from '../utils/storage'

/**
 * Hook para manejar localStorage de forma reactiva
 * @param {string} key - Clave del localStorage
 * @param {*} initialValue - Valor inicial si no existe
 * @returns {Array} - [storedValue, setValue, removeValue]
 */
export const useLocalStorage = (key, initialValue = null) => {
  // Estado para almacenar nuestro valor
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Obtener del localStorage
      const item = getLocalStorage(key, initialValue)
      return item
    } catch (error) {
      console.error(`Error leyendo localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Función para actualizar el valor
  const setValue = (value) => {
    try {
      // Permitir que value sea una función para tener la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Guardar estado
      setStoredValue(valueToStore)
      
      // Guardar en localStorage
      setLocalStorage(key, valueToStore)
    } catch (error) {
      console.error(`Error guardando en localStorage key "${key}":`, error)
    }
  }

  // Función para eliminar el valor
  const removeValue = () => {
    try {
      setStoredValue(initialValue)
      removeLocalStorage(key)
    } catch (error) {
      console.error(`Error eliminando localStorage key "${key}":`, error)
    }
  }

  // Sincronizar con cambios externos (opcional)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Error parseando nuevo valor para key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue, removeValue]
}

import { useState, useCallback } from 'react'
import { getErrorMessage } from '../utils/errorHandler'

/**
 * Hook para manejar llamadas a la API con estado de carga y errores
 * @param {Function} apiFunction - Función que realiza la llamada a la API
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export const useApi = (apiFunction) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await apiFunction(...args)
        setData(result)
        return result
      } catch (err) {
        const errorMessage = getErrorMessage(err)
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiFunction]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}

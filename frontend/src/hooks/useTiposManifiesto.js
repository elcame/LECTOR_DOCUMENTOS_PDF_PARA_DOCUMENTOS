import { useCallback, useEffect, useState } from 'react'
import { tiposManifiestoService } from '../services/tiposManifiestoService'

export default function useTiposManifiesto(activeOnly = true) {
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await tiposManifiestoService.list(activeOnly)
      setTipos(res?.data || [])
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los tipos')
      setTipos([])
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => {
    reload()
  }, [reload])

  return { tipos, loading, error, reload }
}

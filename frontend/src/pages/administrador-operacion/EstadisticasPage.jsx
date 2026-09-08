import { useCallback, useEffect, useState } from 'react'
import { manifiestosService } from '../../services/manifiestosService'
import OperacionStats from '../../components/administrador-operacion/estadisticas/OperacionStats'
import StorageSummary from '../../components/administrador-operacion/estadisticas/StorageSummary'

export default function EstadisticasPage() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await manifiestosService.getOverview()
      if (res?.success) setOverview(res.data)
    } catch (err) {
      setError(err?.message || 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Estadísticas</h1>
          <p className="text-sm text-slate-500 mt-1">Operación de PDFs y carpetas. El almacenamiento va aparte, abajo.</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          Actualizar
        </button>
      </header>
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
      {loading && !overview ? (
        <div className="text-sm text-slate-500">Cargando estadísticas...</div>
      ) : (
        <>
          <OperacionStats overview={overview} />
          <StorageSummary storage={overview?.storage} />
        </>
      )}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { manifiestosService } from '../../services/manifiestosService'
import ConsultarTabs from '../../components/administrador-operacion/consultar/ConsultarTabs'

export default function ConsultarPage() {
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
      setError(err?.message || 'Error al cargar')
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
          <h1 className="text-2xl font-semibold text-slate-900">Consultar</h1>
          <p className="text-sm text-slate-500 mt-1">Manifiestos y PDFs de todas las carpetas.</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          Actualizar
        </button>
      </header>
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
      <ConsultarTabs
        pdfs={overview?.pdfs || []}
        folders={overview?.folders || []}
        loading={loading}
        onRefresh={load}
      />
    </div>
  )
}

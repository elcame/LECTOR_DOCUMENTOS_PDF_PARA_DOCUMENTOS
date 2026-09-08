import { useCallback, useEffect, useState } from 'react'
import { manifiestosService } from '../../services/manifiestosService'
import HubSummary from '../../components/administrador-operacion/hub/HubSummary'
import HubShortcuts from '../../components/administrador-operacion/hub/HubShortcuts'

export default function HubPage() {
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
      setError(err?.message || 'Error al cargar el resumen')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const recent = (overview?.pdfs || [])
    .slice()
    .sort((a, b) => String(b.uploaded_at || '').localeCompare(String(a.uploaded_at || '')))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Administrador de operación</h1>
        <p className="text-sm text-slate-500 mt-1">Resumen y accesos a las herramientas de manifiestos.</p>
      </header>
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
      {loading && !overview ? (
        <div className="text-sm text-slate-500">Cargando resumen...</div>
      ) : (
        <>
          <HubSummary
            totalPdfs={overview?.pdfs?.length || 0}
            totalCarpetas={overview?.folders?.length || 0}
            usedMb={overview?.storage?.total_size_mb || 0}
          />
          <HubShortcuts />
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Actividad reciente</h2>
            <ul className="divide-y divide-slate-100">
              {recent.map((pdf, idx) => (
                <li key={`${pdf.filename}-${idx}`} className="py-2 flex justify-between gap-3 text-sm">
                  <span className="truncate">{pdf.filename}</span>
                  <span className="text-xs text-slate-500">{pdf.folder_name}</span>
                </li>
              ))}
              {recent.length === 0 && <li className="text-sm text-slate-500">Sin actividad reciente</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

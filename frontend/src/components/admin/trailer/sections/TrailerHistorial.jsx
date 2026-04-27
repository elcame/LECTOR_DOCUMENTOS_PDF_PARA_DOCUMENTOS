import { useEffect, useState } from 'react'
import { trailersService } from '../../../../services/trailersService'

export default function TrailerHistorial({ trailerId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  const load = async () => {
    if (!trailerId) return
    try {
      setLoading(true)
      setError('')
      const res = await trailersService.listEvents(trailerId)
      if (res?.success) setItems(res.data || [])
      else setError(res?.error || 'Error al cargar historial')
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailerId])

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Historial</h3>
        <p className="text-sm text-slate-500 mt-1">
          Aquí se mostrará el historial unificado (mantenimientos, ingresos y repuestos) por trailer.
        </p>
      </div>

      {!trailerId ? (
        <div className="rounded-xl border border-slate-200 p-4 text-sm text-amber-700 bg-amber-50">
          Selecciona un trailer primero.
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 p-4 text-sm text-red-700 bg-red-50">
          {error}
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 bg-slate-50">
          Cargando...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 bg-slate-50">
          Sin eventos.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
            Historial ({items.length})
          </div>
          <div className="divide-y divide-slate-200">
            {items.slice(0, 20).map((it) => (
              <div key={it.id} className="p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900">
                    {it.event_type?.toUpperCase()}: {it.title || 'Evento'}
                  </div>
                  <div className="text-xs text-slate-500">{it.date || it.created_at}</div>
                </div>
                {(it.note || it.amount) && (
                  <div className="mt-1 text-xs text-slate-600 flex items-center justify-between gap-3">
                    <span>{it.note || ''}</span>
                    <span className="font-semibold">
                      {Number(it.amount || 0) ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(it.amount || 0)) : ''}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


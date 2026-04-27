import { useEffect, useMemo, useState } from 'react'
import { trailersService } from '../../../../services/trailersService'

export default function TrailerInventarioLlantas({ trailerId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [positions, setPositions] = useState([])
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!trailerId) return
    try {
      setLoading(true)
      setError('')
      const [resItems, resPos] = await Promise.all([
        trailersService.listTireItems(trailerId),
        trailersService.listTires(trailerId),
      ])
      if (resItems?.success) setItems(resItems.data || [])
      else setError(resItems?.error || 'Error al cargar inventario')
      if (resPos?.success) setPositions(resPos.data || [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al cargar inventario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailerId])

  const assignedByTireId = useMemo(() => {
    const map = new Map()
    for (const p of positions || []) {
      const tid = p?.tire_id
      if (tid) map.set(tid, p.position_id)
    }
    return map
  }, [positions])

  const handleCreate = async () => {
    if (!trailerId) return
    try {
      setSaving(true)
      setError('')
      const res = await trailersService.createTireItem(trailerId, { label: newLabel })
      if (!res?.success) {
        setError(res?.error || 'No se pudo crear')
        return
      }
      setNewLabel('')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al crear llanta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Inventario de llantas</h3>
        <p className="text-sm text-slate-500 mt-1">
          Crea y consulta IDs de llantas. Si una llanta está instalada, verás la posición.
        </p>
      </div>

      {!trailerId ? (
        <div className="rounded-xl border border-amber-200 p-4 text-sm text-amber-700 bg-amber-50">
          Selecciona un trailer primero.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Etiqueta (opcional)</label>
                <input
                  className="input w-full"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ej: Michelin 295/80R22.5"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-outline" onClick={load} disabled={loading || saving}>
                  Actualizar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                  {saving ? 'Creando…' : '+ Nueva llanta'}
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
              Llantas ({items.length})
            </div>
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Cargando...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No hay llantas en inventario.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {items.map((it) => {
                  const pos = assignedByTireId.get(it.id) || null
                  return (
                    <div key={it.id} className="p-4 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {it.id}
                          {it.label ? <span className="text-slate-500 font-normal"> · {it.label}</span> : null}
                        </div>
                        <div className="text-xs text-slate-500">
                          {it.created_at ? `Creada: ${it.created_at}` : ''}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {pos ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-semibold">
                            Instalada en {pos}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 text-xs font-semibold">
                            Disponible
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}


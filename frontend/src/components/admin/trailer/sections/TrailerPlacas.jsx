import { useMemo, useState } from 'react'
import { trailersService } from '../../../../services/trailersService'

export default function TrailerPlacas({ trailers = [], selectedTrailerId, onSelectTrailer, onCreated }) {
  const [placa, setPlaca] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selected = useMemo(
    () => trailers.find((t) => t.id === selectedTrailerId) || null,
    [trailers, selectedTrailerId]
  )

  const handleCreate = async () => {
    const plate = (placa || '').trim().toUpperCase()
    if (!plate) return
    try {
      setSaving(true)
      setError('')
      const res = await trailersService.create({ plate })
      if (!res?.success) {
        setError(res?.error || 'No se pudo crear')
        return
      }
      setPlaca('')
      await onCreated?.()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al crear trailer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Placa del trailer</h3>
        <p className="text-sm text-slate-500 mt-1">
          Registra la placa del trailer para asociar mantenimientos, repuestos e ingresos.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 p-4 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Trailer</label>
            <select
              className="input w-full"
              value={selectedTrailerId || ''}
              onChange={(e) => onSelectTrailer?.(e.target.value)}
            >
              <option value="">Selecciona...</option>
              {trailers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.plate}
                </option>
              ))}
            </select>
            {selected && (
              <p className="text-xs text-slate-500 mt-1">
                Seleccionado: <span className="font-semibold">{selected.plate}</span>
              </p>
            )}
          </div>
          <button type="button" className="btn btn-outline" onClick={onCreated} disabled={saving}>
            Actualizar
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-8">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nueva placa</label>
            <input
              className="input w-full"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="Ej: TRL-123"
            />
          </div>
          <div className="sm:col-span-4">
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleCreate}
              disabled={saving || !placa.trim()}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}


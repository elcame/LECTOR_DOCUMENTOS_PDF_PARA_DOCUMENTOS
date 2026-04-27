import { useEffect, useState } from 'react'
import { trailersService } from '../../../../services/trailersService'

export default function TrailerMantenimientos({ trailerId }) {
  const [form, setForm] = useState({
    tipo: '',
    fecha: '',
    odometro: '',
    nota: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const loadItems = async () => {
    if (!trailerId) return
    try {
      setLoading(true)
      const res = await trailersService.listEvents(trailerId, { type: 'maintenance' })
      if (res?.success) setItems(res.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailerId])

  const handleSave = async () => {
    if (!trailerId) return
    try {
      setSaving(true)
      setError('')
      const payload = {
        event_type: 'maintenance',
        date: form.fecha || null,
        amount: 0,
        title: form.tipo,
        note: form.nota,
        meta: { odometro: form.odometro || null },
      }
      const res = await trailersService.createEvent(trailerId, payload)
      if (!res?.success) {
        setError(res?.error || 'No se pudo guardar')
        return
      }
      setForm({ tipo: '', fecha: '', odometro: '', nota: '' })
      await loadItems()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al guardar mantenimiento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Programar mantenimientos</h3>
        <p className="text-sm text-slate-500 mt-1">
          Programa mantenimientos (fecha, tipo, odómetro/horas y notas).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
          <input
            className="input w-full"
            value={form.tipo}
            onChange={(e) => setForm((v) => ({ ...v, tipo: e.target.value }))}
            placeholder="Ej: Cambio de aceite"
          />
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
          <input
            type="date"
            className="input w-full"
            value={form.fecha}
            onChange={(e) => setForm((v) => ({ ...v, fecha: e.target.value }))}
          />
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Odómetro / horas</label>
          <input
            className="input w-full"
            value={form.odometro}
            onChange={(e) => setForm((v) => ({ ...v, odometro: e.target.value }))}
            placeholder="Ej: 120000"
          />
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Nota</label>
          <input
            className="input w-full"
            value={form.nota}
            onChange={(e) => setForm((v) => ({ ...v, nota: e.target.value }))}
            placeholder="Ej: taller, repuestos, observaciones"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!trailerId || saving || !form.tipo.trim()}>
          {saving ? 'Guardando...' : 'Guardar mantenimiento'}
        </button>
        {!trailerId && <span className="text-xs text-amber-600 font-medium">Selecciona un trailer primero</span>}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
          Mantenimientos ({items.length})
        </div>
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">Sin registros.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {items.slice(0, 10).map((it) => (
              <div key={it.id} className="p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900">{it.title || 'Mantenimiento'}</div>
                  <div className="text-xs text-slate-500">{it.date || it.created_at}</div>
                </div>
                {(it.meta?.odometro || it.note) && (
                  <div className="mt-1 text-xs text-slate-600">
                    {it.meta?.odometro ? <>Odómetro/horas: <b>{it.meta.odometro}</b>{it.note ? ' · ' : ''}</> : null}
                    {it.note ? it.note : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


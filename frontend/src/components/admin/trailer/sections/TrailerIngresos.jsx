import { useEffect, useState } from 'react'
import { trailersService } from '../../../../services/trailersService'

export default function TrailerIngresos({ trailerId }) {
  const [form, setForm] = useState({
    fecha: '',
    concepto: '',
    valor: '',
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
      const res = await trailersService.listEvents(trailerId, { type: 'income' })
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
    const amount = Number(String(form.valor || '').replace(/[^\d.]/g, ''))
    if (!form.concepto.trim() || !amount) return
    try {
      setSaving(true)
      setError('')
      const payload = {
        event_type: 'income',
        date: form.fecha || null,
        amount,
        title: form.concepto,
        note: form.nota,
        meta: {},
      }
      const res = await trailersService.createEvent(trailerId, payload)
      if (!res?.success) {
        setError(res?.error || 'No se pudo guardar')
        return
      }
      setForm({ fecha: '', concepto: '', valor: '', nota: '' })
      await loadItems()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al guardar ingreso')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Ingresar ingresos</h3>
        <p className="text-sm text-slate-500 mt-1">
          Registra ingresos asociados al trailer (por viaje, alquiler, servicios, etc.).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
          <input
            className="input w-full"
            value={form.valor}
            onChange={(e) => setForm((v) => ({ ...v, valor: e.target.value }))}
            placeholder="Ej: 350000"
          />
        </div>
        <div className="rounded-xl border border-slate-200 p-4 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Concepto</label>
          <input
            className="input w-full"
            value={form.concepto}
            onChange={(e) => setForm((v) => ({ ...v, concepto: e.target.value }))}
            placeholder="Ej: Alquiler trailer"
          />
        </div>
        <div className="rounded-xl border border-slate-200 p-4 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Nota</label>
          <input
            className="input w-full"
            value={form.nota}
            onChange={(e) => setForm((v) => ({ ...v, nota: e.target.value }))}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!trailerId || saving || !form.concepto.trim() || !String(form.valor || '').trim()}
        >
          {saving ? 'Guardando...' : 'Guardar ingreso'}
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
          Ingresos ({items.length})
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
                  <div className="font-semibold text-slate-900">{it.title || 'Ingreso'}</div>
                  <div className="font-bold text-emerald-700">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(it.amount || 0))}
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-500 flex items-center justify-between gap-3">
                  <span>{it.note || ''}</span>
                  <span>{it.date || it.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


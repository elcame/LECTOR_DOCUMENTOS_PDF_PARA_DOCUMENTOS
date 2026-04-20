import { useEffect, useMemo, useState } from 'react'
import expenseSheetsService from '../../services/expenseSheetsService'
import { expensesService } from '../../services/expensesService'

const EMPTY_ITEM = { expense_type: '', amount: '' }

export default function ExpenseSheetsSection({ selectedManifest }) {
  const [sheets, setSheets] = useState([])
  const [expenseTypes, setExpenseTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])

  const [applySheetId, setApplySheetId] = useState('')

  const totalCurrent = useMemo(() => {
    return items.reduce((acc, it) => acc + (parseFloat(it.amount || 0) || 0), 0)
  }, [items])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const [sheetsRes, typesRes] = await Promise.all([
        expenseSheetsService.list(),
        expensesService.getExpenseTypes(),
      ])
      if (sheetsRes?.success) setSheets(sheetsRes.data || [])
      if (typesRes?.success) setExpenseTypes(typesRes.data || [])
    } catch (e) {
      setError(e?.message || 'Error al cargar hojas de gasto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const addRow = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }])
  const removeRow = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const updateItem = (idx, key, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  }

  const resetForm = () => {
    setName('')
    setItems([{ ...EMPTY_ITEM }])
    setCreating(false)
  }

  const handleCreate = async () => {
    if (!name.trim()) return alert('Nombre requerido')
    const normalized = items
      .map((it) => ({
        expense_type: (it.expense_type || '').trim(),
        amount: parseFloat(it.amount || 0) || 0,
      }))
      .filter((it) => it.expense_type && it.amount > 0)

    if (normalized.length === 0) return alert('Agrega al menos un item válido')

    setSaving(true)
    try {
      const res = await expenseSheetsService.create({ name: name.trim(), items: normalized })
      if (res?.success) {
        await load()
        resetForm()
      } else {
        alert('Error: ' + (res?.error || 'No se pudo crear'))
      }
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sheetId) => {
    if (!confirm('¿Eliminar esta hoja de gasto?')) return
    setSaving(true)
    try {
      const res = await expenseSheetsService.remove(sheetId)
      if (res?.success) await load()
      else alert('Error: ' + (res?.error || 'No se pudo eliminar'))
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleApply = async () => {
    if (!selectedManifest?.id) return alert('Selecciona un manifiesto primero')
    if (!applySheetId) return alert('Selecciona una hoja de gasto')

    setSaving(true)
    try {
      const res = await expenseSheetsService.applyToManifest({
        sheetId: applySheetId,
        manifestId: selectedManifest.id,
      })
      if (res?.success) {
        alert(`Hoja aplicada. Gastos creados: ${res?.data?.created ?? 0}`)
      } else {
        alert('Error: ' + (res?.error || 'No se pudo aplicar'))
      }
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">🧾 Hojas de gasto</h2>
            <p className="text-sm text-slate-500">Crea plantillas y aplícalas a un manifiesto.</p>
          </div>
          <button
            onClick={() => setCreating((v) => !v)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            disabled={saving}
          >
            {creating ? 'Cerrar' : '+ Nueva hoja'}
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-slate-500">Cargando…</div>
        ) : (
          <div className="mt-4 space-y-3">
            {sheets.length === 0 ? (
              <div className="text-slate-500 text-sm">No hay hojas creadas.</div>
            ) : (
              sheets.map((s) => (
                <div key={s.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{(s.items || []).length} item(s)</p>
                    </div>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={saving}
                    >
                      Eliminar
                    </button>
                  </div>
                  {(s.items || []).length > 0 && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {s.items.slice(0, 6).map((it, idx) => (
                        <div key={idx} className="bg-slate-50 rounded px-3 py-2 text-sm flex justify-between">
                          <span className="text-slate-700">{it.expense_type}</span>
                          <span className="font-semibold text-slate-900">${Number(it.amount || 0).toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Aplicar a manifiesto */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Aplicar hoja a manifiesto</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Hoja</label>
            <select
              className="input w-full"
              value={applySheetId}
              onChange={(e) => setApplySheetId(e.target.value)}
              disabled={saving}
            >
              <option value="">Seleccionar…</option>
              {sheets.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm font-medium"
            disabled={saving || !applySheetId}
          >
            Aplicar
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Manifiesto seleccionado: {selectedManifest?.id ? selectedManifest?.id : 'Ninguno'}
        </p>
      </div>

      {/* Crear hoja */}
      {creating && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Nueva hoja</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
            </div>

            <div className="md:col-span-3">
              <p className="text-sm font-medium text-slate-700 mb-2">Items</p>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                    <div className="md:col-span-7">
                      <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                      <select
                        className="input w-full"
                        value={it.expense_type}
                        onChange={(e) => updateItem(idx, 'expense_type', e.target.value)}
                        disabled={saving}
                      >
                        <option value="">Seleccionar…</option>
                        {expenseTypes.map((t) => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs text-slate-500 mb-1">Monto</label>
                      <input
                        className="input w-full"
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.amount}
                        onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                        disabled={saving}
                      />
                    </div>
                    <div className="md:col-span-1 flex md:justify-end">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={saving || items.length === 1}
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={addRow}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  disabled={saving}
                >
                  + Agregar item
                </button>
                <div className="text-sm text-slate-600">
                  Total: <span className="font-semibold text-slate-900">${totalCurrent.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 flex gap-2 pt-2">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                disabled={saving}
              >
                Guardar hoja
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-medium"
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


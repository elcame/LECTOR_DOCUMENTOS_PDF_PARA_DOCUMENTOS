import { useEffect, useState } from 'react'
import { tiposManifiestoService } from '../../services/tiposManifiestoService'

export default function TiposManifiestoPage() {
  const [tipos, setTipos] = useState([])
  const [nombre, setNombre] = useState('')
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await tiposManifiestoService.list(false)
      setTipos(res?.data || [])
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los tipos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setNombre('')
    setEditingId('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const value = nombre.trim()
    if (!value) {
      setError('Escribe un nombre para el tipo.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (editingId) {
        await tiposManifiestoService.rename(editingId, value)
        setSuccess('Tipo actualizado.')
      } else {
        await tiposManifiestoService.create(value)
        setSuccess('Tipo creado.')
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el tipo')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (tipo) => {
    if (!window.confirm(`¿Desactivar el tipo “${tipo.nombre}”? Seguirá en manifiestos ya clasificados.`)) return
    setError('')
    setSuccess('')
    try {
      await tiposManifiestoService.deactivate(tipo.id)
      setSuccess('Tipo desactivado.')
      if (editingId === tipo.id) resetForm()
      await load()
    } catch (err) {
      setError(err?.message || 'No se pudo desactivar')
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Tipos de manifiesto</h1>
        <p className="text-sm text-slate-500 mt-1">
          Crea nombres para clasificar carpetas y PDFs procesados.
        </p>
      </header>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {editingId ? 'Editar nombre' : 'Nuevo tipo'}
          </label>
          <input
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Nacional, Exportación, Urbano"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear tipo'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Cargando tipos...</div>
        ) : tipos.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">Aún no hay tipos. Crea el primero con un nombre.</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tipos.map((tipo) => (
                <tr key={tipo.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{tipo.nombre}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${tipo.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {tipo.active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm space-x-3">
                    {tipo.active !== false && (
                      <>
                        <button type="button" className="text-blue-700 hover:underline" onClick={() => { setEditingId(tipo.id); setNombre(tipo.nombre) }}>
                          Editar
                        </button>
                        <button type="button" className="text-red-600 hover:underline" onClick={() => handleDeactivate(tipo)}>
                          Desactivar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import carrosService from '../../../services/carrosService'
import Loading from '../../common/Loading/Loading'
import Modal from '../../common/Modal/Modal'
import { garageTableTone } from '../../carros/flota/garageTableTone'

export default function PropietariosTable({ tone = 'light' }) {
  const ui = garageTableTone(tone === 'dark', { compact: true })
  const [propietarios, setPropietarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOwner, setEditingOwner] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    email: '',
    direccion: '',
    activo: true,
  })

  const loadOwners = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await carrosService.getPropietarios({})
      setPropietarios(res.propietarios || [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al cargar propietarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOwners()
  }, [])

  const openNew = () => {
    setEditingOwner(null)
    setForm({
      nombre: '',
      documento: '',
      telefono: '',
      email: '',
      direccion: '',
      activo: true,
    })
    setModalOpen(true)
  }

  const openEdit = (owner) => {
    setEditingOwner(owner)
    setForm({
      nombre: owner.nombre || '',
      documento: owner.documento || '',
      telefono: owner.telefono || '',
      email: owner.email || '',
      direccion: owner.direccion || '',
      activo: owner.activo !== false,
    })
    setModalOpen(true)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const saveOwner = async () => {
    try {
      setSaving(true)
      setError('')
      if (!form.nombre.trim()) {
        setError('El nombre es requerido')
        return
      }
      const payload = {
        nombre: form.nombre.trim(),
        documento: form.documento.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        direccion: form.direccion.trim(),
        activo: form.activo !== false,
      }
      if (editingOwner) {
        await carrosService.updateOwner(editingOwner.id, payload)
      } else {
        await carrosService.createOwner(payload)
      }
      setModalOpen(false)
      await loadOwners()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al guardar propietario')
    } finally {
      setSaving(false)
    }
  }

  const deleteOwner = async (owner) => {
    if (!window.confirm(`¿Marcar como inactivo al propietario ${owner.nombre}?`)) return
    try {
      setSaving(true)
      setError('')
      await carrosService.deleteOwner(owner.id)
      await loadOwners()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al eliminar propietario')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <Loading message="Cargando propietarios..." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={ui.title}>Propietarios</h2>
          <p className={ui.subtitle}>
            Registra y administra los propietarios de los vehículos.
          </p>
        </div>
        <button type="button" className={ui.btnPrimary} onClick={openNew}>
          + Nuevo propietario
        </button>
      </div>

      {error && !modalOpen && (
        <div className={ui.error}>{error}</div>
      )}

      <div className={ui.tableWrap}>
        <table className={ui.table}>
          <thead className={ui.thead}>
            <tr>
              <th className={ui.th}>Nombre</th>
              <th className={ui.th}>Documento</th>
              <th className={ui.th}>Teléfono</th>
              <th className={ui.th}>Email</th>
              <th className={ui.th}>Estado</th>
              <th className={ui.thCenter}>Acciones</th>
            </tr>
          </thead>
          <tbody className={ui.tbody}>
            {propietarios.map((owner, index) => {
              const isOdd = index % 2 === 1
              const activo = owner.activo !== false
              return (
                <tr key={owner.id} className={ui.row(isOdd)}>
                  <td className={ui.cellStrong}>{owner.nombre}</td>
                  <td className={ui.cell}>{owner.documento || '-'}</td>
                  <td className={ui.cell}>{owner.telefono || '-'}</td>
                  <td className={ui.cell}>{owner.email || '-'}</td>
                  <td className={ui.cellPad}>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 ${activo ? ui.badgeOn : ui.badgeOff}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className={`${ui.cellPad} text-center text-xs`}>
                    <button type="button" className={ui.iconEdit} onClick={() => openEdit(owner)} title="Editar propietario">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button type="button" className={ui.iconDelete} onClick={() => deleteOwner(owner)} title="Marcar como inactivo">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOwner ? 'Editar propietario' : 'Nuevo propietario'}
        size="md"
      >
        <div className="space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-xs mb-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              className="input input-sm w-full"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Documento
              </label>
              <input
                type="text"
                className="input input-sm w-full"
                value={form.documento}
                onChange={(e) => handleChange('documento', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                className="input input-sm w-full"
                value={form.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="input input-sm w-full"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                className="input input-sm w-full"
                value={form.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              id="owner-activo"
              type="checkbox"
              className="rounded border-slate-300"
              checked={form.activo}
              onChange={(e) => handleChange('activo', e.target.checked)}
            />
            <label htmlFor="owner-activo" className="text-xs text-slate-700">
              Propietario activo
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 text-white hover:bg-blue-700"
              onClick={saveOwner}
              disabled={saving}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


import { useState, useEffect } from 'react'

const EMPTY_FORM = {
  full_name: '',
  username: '',
  email: '',
  password: '',
  role_id: '',
  carro_id: '',
  active: true,
}

export default function UserFormModal({
  visible,
  onClose,
  onSave,
  roles = [],
  carros = [],
  editingUser = null,
  forceRoleId = null,
  saving = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (editingUser) {
      setForm({
        full_name: editingUser.full_name || '',
        username: editingUser.username || '',
        email: editingUser.email || '',
        password: '',
        role_id: editingUser.role_id || '',
        carro_id: editingUser.carro_id || '',
        active: editingUser.active !== false,
      })
    } else {
      setForm({ ...EMPTY_FORM, role_id: forceRoleId || '' })
    }
  }, [editingUser, forceRoleId, visible])

  if (!visible) return null

  const isEditing = !!editingUser
  const isConductor = form.role_id === 'conductor' || forceRoleId === 'conductor'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.full_name || !form.username || (!isEditing && !form.password)) {
      alert('Completa los campos requeridos')
      return
    }
    const payload = { ...form }
    if (isEditing && !payload.password) delete payload.password
    if (!isConductor) delete payload.carro_id
    onSave(payload, isEditing)
  }

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-20">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Editar Usuario' : 'Crear Usuario'}
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
          <input
            type="text"
            className="input w-full"
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
          <input
            type="text"
            className="input w-full"
            value={form.username}
            onChange={(e) => set('username', e.target.value)}
            disabled={saving || isEditing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="input w-full"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isEditing ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
          </label>
          <input
            type="password"
            className="input w-full"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            disabled={saving}
            placeholder={isEditing ? '••••••••' : ''}
          />
        </div>

        {!forceRoleId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
            <select
              className="input w-full"
              value={form.role_id}
              onChange={(e) => set('role_id', e.target.value)}
              disabled={saving}
            >
              <option value="">Seleccionar rol...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.role_name || r.id}>
                  {r.role_name || r.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {isConductor && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carro asignado</label>
            <select
              className="input w-full"
              value={form.carro_id}
              onChange={(e) => set('carro_id', e.target.value)}
              disabled={saving}
            >
              <option value="">Sin asignar</option>
              {carros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.placa} {c.modelo ? `- ${c.modelo}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set('active', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            disabled={saving}
          />
          <label className="ml-2 text-sm text-gray-900">Usuario activo</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

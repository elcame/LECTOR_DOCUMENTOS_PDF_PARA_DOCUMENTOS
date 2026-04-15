import { useState } from 'react'

const ROLE_COLORS = {
  super_admin: 'border-purple-300 bg-purple-50',
  empresarial: 'border-blue-300 bg-blue-50',
  conductor: 'border-green-300 bg-green-50',
}

export default function RolesManager({ roles = [], onUpdatePermissions, isSuperAdmin = false }) {
  const [newPermission, setNewPermission] = useState({})

  const handleAddPermission = (roleName) => {
    const perm = (newPermission[roleName] || '').trim()
    if (!perm) return
    const role = roles.find((r) => (r.role_name || r.id) === roleName)
    if (!role) return
    const updated = [...(role.permissions || []), perm]
    onUpdatePermissions(roleName, updated)
    setNewPermission((prev) => ({ ...prev, [roleName]: '' }))
  }

  const handleRemovePermission = (roleName, perm) => {
    const role = roles.find((r) => (r.role_name || r.id) === roleName)
    if (!role) return
    const updated = (role.permissions || []).filter((p) => p !== perm)
    onUpdatePermissions(roleName, updated)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Roles y Permisos</h2>
        <p className="text-sm text-gray-500 mt-1">{roles.length} rol(es) configurado(s)</p>
      </div>
      <div className="card-body">
        {roles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No hay roles configurados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((rol) => {
              const key = rol.role_name || rol.id
              return (
                <div
                  key={rol.id}
                  className={`border rounded-lg p-4 ${ROLE_COLORS[key] || 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">{key.replace('_', ' ')}</h3>
                  </div>
                  {rol.description && (
                    <p className="text-sm text-gray-600 mb-3">{rol.description}</p>
                  )}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Permisos:</p>
                    <div className="flex flex-wrap gap-1">
                      {(rol.permissions || []).map((p, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-300 text-gray-700"
                        >
                          {p}
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleRemovePermission(key, p)}
                              className="ml-1 text-red-400 hover:text-red-600"
                            >
                              x
                            </button>
                          )}
                        </span>
                      ))}
                      {(!rol.permissions || rol.permissions.length === 0) && (
                        <span className="text-xs text-gray-400">Sin permisos asignados</span>
                      )}
                    </div>

                    {isSuperAdmin && (
                      <div className="flex gap-1 mt-2">
                        <input
                          type="text"
                          className="input text-xs py-1 px-2 flex-1"
                          placeholder="Nuevo permiso"
                          value={newPermission[key] || ''}
                          onChange={(e) =>
                            setNewPermission((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleAddPermission(key)}
                        />
                        <button
                          onClick={() => handleAddPermission(key)}
                          className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

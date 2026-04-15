const ROLE_LABELS = {
  super_admin: 'Super Admin',
  empresarial: 'Empresarial',
  conductor: 'Conductor',
  admin: 'Admin (legacy)',
}

const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-800',
  empresarial: 'bg-blue-100 text-blue-800',
  conductor: 'bg-green-100 text-green-800',
  admin: 'bg-gray-100 text-gray-800',
}

export default function UsersTable({
  usuarios = [],
  roles = [],
  title = 'Usuarios',
  subtitle = '',
  showRoleColumn = true,
  showCarroColumn = false,
  onEdit,
  onToggleStatus,
  onChangeRole,
  onCreate,
}) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {onCreate && (
          <button
            onClick={onCreate}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            + Crear
          </button>
        )}
      </div>
      <div className="card-body">
        {usuarios.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  {showRoleColumn && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  )}
                  {showCarroColumn && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carro</th>
                  )}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((u) => {
                  const roleKey = u.role_id || u.role || 'conductor'
                  return (
                    <tr key={u.id || u.username} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {u.full_name || u.nombre || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email || '-'}</td>
                      {showRoleColumn && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {onChangeRole ? (
                            <select
                              value={roleKey}
                              onChange={(e) => onChangeRole(u, e.target.value)}
                              className="input text-sm py-1 px-2"
                            >
                              {roles.map((r) => (
                                <option key={r.id} value={r.role_name || r.id}>
                                  {ROLE_LABELS[r.role_name || r.id] || r.role_name || r.id}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[roleKey] || 'bg-gray-100 text-gray-800'}`}>
                              {ROLE_LABELS[roleKey] || roleKey}
                            </span>
                          )}
                        </td>
                      )}
                      {showCarroColumn && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.carro ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-50 text-yellow-800 text-xs font-medium">
                              {u.carro.placa}
                            </span>
                          ) : u.carro_id ? (
                            <span className="text-gray-400 text-xs">{u.carro_id}</span>
                          ) : (
                            <span className="text-gray-400 text-xs">Sin asignar</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {u.active !== false ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactivo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(u)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </button>
                        )}
                        {onToggleStatus && (
                          <button
                            onClick={() => onToggleStatus(u)}
                            className={u.active !== false ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                          >
                            {u.active !== false ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

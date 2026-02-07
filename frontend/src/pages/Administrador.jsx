import { useState, useEffect } from 'react'
import adminService from '../services/adminService'
import Button from '../components/common/Button/Button'
import Loading from '../components/common/Loading/Loading'

export default function Administrador() {
  const [activeTab, setActiveTab] = useState('conductores')
  const [conductores, setConductores] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [selectedConductor, setSelectedConductor] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    password: '',
    rol: '',
    activo: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      if (activeTab === 'conductores') {
        const response = await adminService.getConductores()
        if (response.success) {
          setConductores(response.data || [])
        } else {
          setError(response.error || 'Error al cargar conductores')
        }
      } else if (activeTab === 'usuarios') {
        const [usuariosRes, rolesRes] = await Promise.all([
          adminService.getUsuarios(),
          adminService.getRoles()
        ])
        if (usuariosRes.success) {
          setUsuarios(usuariosRes.data || [])
        }
        if (rolesRes.success) {
          setRoles(rolesRes.data || [])
        }
      } else if (activeTab === 'roles') {
        const response = await adminService.getRoles()
        if (response.success) {
          setRoles(response.data || [])
        }
      }
    } catch (err) {
      setError(err.message || 'Error al cargar datos')
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (conductor) => {
    // Cargar roles si no están cargados
    if (roles.length === 0) {
      const rolesRes = await adminService.getRoles()
      if (rolesRes.success) {
        setRoles(rolesRes.data || [])
      }
    }

    setSelectedConductor(conductor)
    setFormData({
      nombre: conductor.nombre,
      username: conductor.nombre.toLowerCase().replace(/\s+/g, '.'),
      password: '',
      rol: 'conductor',
      activo: true
    })
    setShowCreateUserModal(true)
  }

  const handleSaveUser = async () => {
    if (!formData.nombre || !formData.username || !formData.password || !formData.rol) {
      alert('Completa todos los campos requeridos')
      return
    }

    setSaving(true)
    try {
      const response = await adminService.createUsuario(formData)
      if (response.success) {
        alert('Usuario creado exitosamente')
        setShowCreateUserModal(false)
        setSelectedConductor(null)
        setFormData({
          nombre: '',
          username: '',
          password: '',
          rol: '',
          activo: true
        })
        loadData()
      } else {
        alert('Error: ' + response.error)
      }
    } catch (error) {
      console.error('Error al crear usuario:', error)
      alert('Error al crear usuario: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleUserStatus = async (usuario) => {
    if (!confirm(`¿Deseas ${usuario.activo ? 'desactivar' : 'activar'} al usuario ${usuario.nombre}?`)) {
      return
    }

    try {
      const response = await adminService.updateUsuario(usuario.id, {
        activo: !usuario.activo
      })
      if (response.success) {
        loadData()
      } else {
        alert('Error: ' + response.error)
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      alert('Error al actualizar usuario: ' + error.message)
    }
  }

  const handleUpdateUserRole = async (usuario, newRole) => {
    try {
      const response = await adminService.updateUsuario(usuario.id, {
        rol: newRole
      })
      if (response.success) {
        loadData()
      } else {
        alert('Error: ' + response.error)
      }
    } catch (error) {
      console.error('Error al actualizar rol:', error)
      alert('Error al actualizar rol: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">⚙️ Administración</h1>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('conductores')}
                className={`${
                  activeTab === 'conductores'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                🚗 Conductores
              </button>
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`${
                  activeTab === 'usuarios'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                👥 Usuarios
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`${
                  activeTab === 'roles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                🔐 Roles y Permisos
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="card">
            <div className="card-body">
              <Loading message="Cargando datos..." />
            </div>
          </div>
        ) : error ? (
          <div className="card">
            <div className="card-body">
              <div className="alert-error">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Conductores */}
            {activeTab === 'conductores' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Conductores Registrados en Manifiestos</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {conductores.length} conductor(es) encontrado(s)
                  </p>
                </div>
                <div className="card-body">
                  {conductores.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg font-medium">No hay conductores registrados</p>
                      <p className="text-sm mt-2">Los conductores aparecerán cuando se procesen manifiestos</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rol
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {conductores.map((conductor, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {conductor.nombre}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {conductor.tiene_usuario ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Tiene usuario
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    ⚠ Sin usuario
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {conductor.username || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {conductor.rol ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {conductor.rol}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                {!conductor.tiene_usuario ? (
                                  <Button
                                    onClick={() => handleCreateUser(conductor)}
                                    variant="primary"
                                    size="sm"
                                  >
                                    Crear Usuario
                                  </Button>
                                ) : (
                                  <span className="text-gray-400 text-xs">Usuario existente</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Usuarios */}
            {activeTab === 'usuarios' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Gestión de Usuarios</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {usuarios.length} usuario(s) registrado(s)
                  </p>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Username
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rol
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {usuarios.map((usuario) => (
                            <tr key={usuario.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {usuario.nombre}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {usuario.username}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={usuario.rol || ''}
                                  onChange={(e) => handleUpdateUserRole(usuario, e.target.value)}
                                  className="input text-sm py-1 px-2"
                                >
                                  {roles.map((rol) => (
                                    <option key={rol.id} value={rol.nombre}>
                                      {rol.nombre}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {usuario.activo ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Activo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Inactivo
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <Button
                                  onClick={() => handleToggleUserStatus(usuario)}
                                  variant={usuario.activo ? 'outline' : 'primary'}
                                  size="sm"
                                >
                                  {usuario.activo ? 'Desactivar' : 'Activar'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Roles */}
            {activeTab === 'roles' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Roles y Permisos</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {roles.length} rol(es) configurado(s)
                  </p>
                </div>
                <div className="card-body">
                  {roles.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg font-medium">No hay roles configurados</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roles.map((rol) => (
                        <div key={rol.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {rol.nombre}
                            </h3>
                            {rol.is_system && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Sistema
                              </span>
                            )}
                          </div>
                          {rol.descripcion && (
                            <p className="text-sm text-gray-600 mb-3">
                              {rol.descripcion}
                            </p>
                          )}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase">Permisos:</p>
                            <div className="flex flex-wrap gap-1">
                              {rol.permisos && rol.permisos.length > 0 ? (
                                rol.permisos.map((permiso, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                                  >
                                    {permiso}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">Sin permisos asignados</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal Crear Usuario */}
        {showCreateUserModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Crear Usuario para {selectedConductor?.nombre}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="input w-full"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="input w-full"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input w-full"
                      placeholder="Ingresa contraseña"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol *
                    </label>
                    <select
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                      className="input w-full"
                      disabled={saving}
                    >
                      <option value="">Seleccionar rol...</option>
                      {roles.map((rol) => (
                        <option key={rol.id} value={rol.nombre}>
                          {rol.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={saving}
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Usuario activo
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleSaveUser}
                    disabled={saving}
                    variant="primary"
                    className="flex-1"
                  >
                    {saving ? 'Guardando...' : 'Crear Usuario'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreateUserModal(false)
                      setSelectedConductor(null)
                    }}
                    disabled={saving}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

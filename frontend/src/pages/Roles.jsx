import { useState, useEffect } from 'react';
import { rolesService } from '../services/rolesService';

function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    role_name: '',
    description: '',
    permissions: []
  });
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesService.getAllRoles(true);
      if (response.success) {
        setRoles(response.data);
      }
    } catch (err) {
      setError(err.error || 'Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await rolesService.updateRole(editingRole, formData);
      } else {
        await rolesService.createRole(formData);
      }
      setShowForm(false);
      setEditingRole(null);
      setFormData({ role_name: '', description: '', permissions: [] });
      loadRoles();
    } catch (err) {
      setError(err.error || 'Error al guardar rol');
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role.role_name);
    setFormData({
      role_name: role.role_name,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowForm(true);
  };

  const handleDelete = async (roleName) => {
    if (window.confirm('¿Estás seguro de eliminar este rol?')) {
      try {
        await rolesService.deleteRole(roleName);
        loadRoles();
      } catch (err) {
        setError(err.error || 'Error al eliminar rol');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando roles...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Roles</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingRole(null);
            setFormData({ role_name: '', description: '', permissions: [] });
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Cancelar' : 'Nuevo Rol'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Nombre del Rol</label>
              <input
                type="text"
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
                disabled={!!editingRole}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows="3"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                {editingRole ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRole(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permisos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No hay roles disponibles
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{role.role_name}</td>
                  <td className="px-6 py-4">{role.description || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions?.map((perm, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {perm}
                        </span>
                      ))}
                      {(!role.permissions || role.permissions.length === 0) && (
                        <span className="text-gray-400 text-xs">Sin permisos</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      role.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {role.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(role)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(role.role_name)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Roles;

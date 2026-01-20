import { useState, useEffect } from 'react';
import { usuariosFirebaseService } from '../services/usuariosFirebaseService';
import { rolesService } from '../services/rolesService';

function UsuariosFirebase() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role_id: '',
    active: true
  });
  const [editingUsuario, setEditingUsuario] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, rolesRes] = await Promise.all([
        usuariosFirebaseService.getAllUsuarios(true),
        rolesService.getAllRoles(true)
      ]);
      
      if (usuariosRes.success) {
        setUsuarios(usuariosRes.data);
      }
      if (rolesRes.success) {
        setRoles(rolesRes.data);
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUsuario) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await usuariosFirebaseService.updateUsuario(editingUsuario, updateData);
      } else {
        await usuariosFirebaseService.createUsuario(formData);
      }
      setShowForm(false);
      setEditingUsuario(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role_id: '',
        active: true
      });
      loadData();
    } catch (err) {
      setError(err?.message || 'Error al guardar usuario');
    }
  };

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario.username);
    setFormData({
      username: usuario.username,
      email: usuario.email,
      password: '',
      full_name: usuario.full_name || '',
      role_id: usuario.role_id || '',
      active: usuario.active !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (username) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await usuariosFirebaseService.deleteUsuario(username);
        loadData();
      } catch (err) {
        setError(err?.message || 'Error al eliminar usuario');
      }
    }
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.role_name : 'Sin rol';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Usuarios (Firebase)</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingUsuario(null);
            setFormData({
              username: '',
              email: '',
              password: '',
              full_name: '',
              role_id: '',
              active: true
            });
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Cancelar' : 'Nuevo Usuario'}
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
            {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre de Usuario</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                  disabled={!!editingUsuario}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {editingUsuario ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required={!editingUsuario}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rol</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Sin rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="mr-2"
                  />
                  Usuario activo
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                {editingUsuario ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUsuario(null);
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No hay usuarios disponibles
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{usuario.username}</td>
                  <td className="px-6 py-4">{usuario.email}</td>
                  <td className="px-6 py-4">{usuario.full_name || '-'}</td>
                  <td className="px-6 py-4">{getRoleName(usuario.role_id)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      usuario.active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(usuario.username)}
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

export default UsuariosFirebase;

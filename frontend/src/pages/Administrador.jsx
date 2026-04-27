import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import adminService from '../services/adminService'
import Loading from '../components/common/Loading/Loading'
import UsersTable from '../components/admin/UsersTable'
import UserFormModal from '../components/admin/UserFormModal'
import RolesManager from '../components/admin/RolesManager'
import AdminSummary from '../components/admin/AdminSummary'
import TrailerAdminSection from '../components/admin/trailer/TrailerAdminSection'
import ProveedoresSection from '../components/proveedores/ProveedoresSection'

const TABS = {
  RESUMEN: 'resumen',
  EMPRESARIALES: 'empresariales',
  CONDUCTORES: 'conductores',
  ROLES: 'roles',
  TRAILER: 'trailer',
  PROVEEDORES: 'proveedores',
}

export default function Administrador() {
  const { isSuperAdmin, user } = useAuth()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(TABS.RESUMEN)
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [carros, setCarros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [forceRoleId, setForceRoleId] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [usuariosRes, rolesRes, carrosRes] = await Promise.all([
        adminService.getUsuarios(),
        adminService.getRoles(),
        adminService.getCarrosDisponibles(),
      ])
      if (usuariosRes.success) setUsuarios(usuariosRes.data || [])
      if (rolesRes.success) setRoles(rolesRes.data || [])
      if (carrosRes.success) setCarros(carrosRes.carros || [])
    } catch (err) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const tab = (searchParams.get('tab') || '').trim().toLowerCase()
    if (tab === 'trailer') setActiveTab(TABS.TRAILER)
    if (tab === 'proveedores') setActiveTab(TABS.PROVEEDORES)
  }, [searchParams])

  const empresariales = usuarios.filter((u) =>
    u.role_id === 'super_admin' || u.role_id === 'empresarial' || u.role_id === 'admin'
  )
  const conductores = usuarios.filter((u) => u.role_id === 'conductor')

  const openCreateModal = (roleId = null) => {
    setEditingUser(null)
    setForceRoleId(roleId)
    setModalVisible(true)
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    setForceRoleId(null)
    setModalVisible(true)
  }

  const handleSaveUser = async (formData, isEditing) => {
    setSaving(true)
    try {
      let res
      if (isEditing) {
        res = await adminService.updateUsuario(editingUser.username, formData)
      } else {
        const payload = { ...formData }
        if ((payload.role_id || forceRoleId) === 'conductor') {
          payload.parent_username = user?.username
        }
        res = await adminService.createUsuario(payload)
      }
      if (res.success) {
        setModalVisible(false)
        setEditingUser(null)
        await loadData()
      } else {
        alert('Error: ' + (res.error || res.message || 'Error desconocido'))
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (user) => {
    const action = user.active !== false ? 'desactivar' : 'activar'
    if (!confirm(`¿Deseas ${action} al usuario ${user.username}?`)) return
    try {
      const res = await adminService.updateUsuario(user.username, { active: user.active === false })
      if (res.success) await loadData()
      else alert('Error: ' + (res.error || 'No se pudo actualizar'))
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleChangeRole = async (user, newRoleId) => {
    try {
      const res = await adminService.assignRole(user.username, newRoleId)
      if (res.success) await loadData()
      else alert('Error: ' + (res.error || 'No se pudo cambiar el rol'))
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleUpdatePermissions = async (roleName, permissions) => {
    try {
      const res = await adminService.updateRol(roleName, { permissions })
      if (res.success) await loadData()
      else alert('Error: ' + (res.error || 'No se pudo actualizar permisos'))
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const tabItems = [
    { id: TABS.RESUMEN, label: 'Resumen', icon: '📊' },
    ...(isSuperAdmin
      ? [{ id: TABS.EMPRESARIALES, label: 'Empresariales', icon: '🏢' }]
      : []),
    { id: TABS.CONDUCTORES, label: 'Conductores', icon: '🚗' },
    { id: TABS.ROLES, label: 'Roles y Permisos', icon: '🔐' },
    { id: TABS.TRAILER, label: 'Trailer', icon: '🚛' },
    { id: TABS.PROVEEDORES, label: 'Proveedores', icon: '🏪' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Administración</h1>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="card"><div className="card-body"><Loading message="Cargando datos..." /></div></div>
        ) : error ? (
          <div className="card"><div className="card-body">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
              <button onClick={loadData} className="mt-2 text-sm text-red-600 underline">Reintentar</button>
            </div>
          </div></div>
        ) : (
          <>
            {activeTab === TABS.RESUMEN && (
              <AdminSummary usuarios={usuarios} roles={roles} carros={carros} />
            )}

            {activeTab === TABS.EMPRESARIALES && isSuperAdmin && (
              <UsersTable
                usuarios={empresariales}
                roles={roles}
                title="Usuarios Empresariales"
                subtitle={`${empresariales.length} usuario(s) empresarial(es)`}
                showRoleColumn
                onEdit={openEditModal}
                onToggleStatus={handleToggleStatus}
                onChangeRole={handleChangeRole}
                onCreate={() => openCreateModal('empresarial')}
              />
            )}

            {activeTab === TABS.CONDUCTORES && (
              <UsersTable
                usuarios={conductores}
                roles={roles}
                title="Conductores"
                subtitle={`${conductores.length} conductor(es) registrado(s)`}
                showRoleColumn={false}
                showCarroColumn
                onEdit={openEditModal}
                onToggleStatus={handleToggleStatus}
                onCreate={() => openCreateModal('conductor')}
              />
            )}

            {activeTab === TABS.ROLES && (
              <RolesManager
                roles={roles}
                onUpdatePermissions={handleUpdatePermissions}
                isSuperAdmin={isSuperAdmin}
              />
            )}

            {activeTab === TABS.TRAILER && (
              <TrailerAdminSection />
            )}

            {activeTab === TABS.PROVEEDORES && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <ProveedoresSection />
              </div>
            )}
          </>
        )}

        <UserFormModal
          visible={modalVisible}
          onClose={() => { setModalVisible(false); setEditingUser(null) }}
          onSave={handleSaveUser}
          roles={roles}
          carros={carros}
          editingUser={editingUser}
          forceRoleId={forceRoleId}
          saving={saving}
        />
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { expensesService } from '../../services/expensesService'
import Button from '../common/Button/Button'
import Loading from '../common/Loading/Loading'

export default function ExpenseTypesTable() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [editingType, setEditingType] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTypes()
  }, [])

  const loadTypes = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await expensesService.getExpenseTypes()
      
      if (response.success) {
        setTypes(response.data || [])
      } else {
        setError(response.message || 'Error al cargar tipos de gastos')
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar tipos de gastos')
      console.error('Error cargando tipos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInitialize = async () => {
    if (!confirm('¿Deseas inicializar los tipos de gastos del sistema? (Parqueo, Sueldo, Tanqueo, Cargue, Descargue, Otros)')) {
      return
    }

    setSaving(true)
    try {
      const response = await expensesService.initializeExpenseTypes()
      if (response.success) {
        alert('Tipos de gastos inicializados correctamente')
        loadTypes()
      } else {
        alert('Error: ' + response.error)
      }
    } catch (error) {
      console.error('Error al inicializar tipos:', error)
      alert('Error al inicializar tipos: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async () => {
    if (!newTypeName.trim()) {
      alert('Ingresa un nombre para el tipo de gasto')
      return
    }

    setSaving(true)
    try {
      const response = await expensesService.createExpenseType(newTypeName.trim())
      if (response.success) {
        setNewTypeName('')
        setShowAddForm(false)
        loadTypes()
      } else {
        alert('Error: ' + response.error)
      }
    } catch (error) {
      console.error('Error al crear tipo:', error)
      alert('Error al crear tipo: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStartEdit = (type) => {
    setEditingType(type.id)
    setEditValue(type.name)
  }

  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      alert('Ingresa un nombre válido')
      return
    }

    setSaving(true)
    try {
      const response = await expensesService.updateExpenseType(editingType, editValue.trim())
      if (response.success) {
        setEditingType(null)
        setEditValue('')
        loadTypes()
      } else {
        alert('Error: ' + response.error)
      }
    } catch (error) {
      console.error('Error al actualizar tipo:', error)
      alert('Error al actualizar tipo: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingType(null)
    setEditValue('')
  }

  const handleDelete = async (typeId, typeName) => {
    if (!confirm(`¿Estás seguro de eliminar el tipo "${typeName}"?`)) {
      return
    }

    setSaving(true)
    try {
      const response = await expensesService.deleteExpenseType(typeId)
      if (response.success) {
        loadTypes()
      } else {
        alert('Error: ' + response.error)
      }
    } catch (error) {
      console.error('Error al eliminar tipo:', error)
      alert('Error al eliminar tipo: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <Loading message="Cargando tipos de gastos..." />
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="card-title">🏷️ Tipos de Gastos</h2>
          <div className="flex gap-2">
            {types.length === 0 && (
              <Button
                onClick={handleInitialize}
                disabled={saving}
                variant="outline"
                size="sm"
              >
                Inicializar Tipos del Sistema
              </Button>
            )}
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={saving}
              variant="primary"
              size="sm"
            >
              {showAddForm ? 'Cancelar' : '+ Añadir Tipo'}
            </Button>
          </div>
        </div>
      </div>

      <div className="card-body">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Formulario para añadir */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">Añadir Nuevo Tipo de Gasto</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Nombre del tipo de gasto"
                className="input flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') setShowAddForm(false)
                }}
                autoFocus
                disabled={saving}
              />
              <Button
                onClick={handleAdd}
                disabled={saving || !newTypeName.trim()}
                variant="primary"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false)
                  setNewTypeName('')
                }}
                disabled={saving}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Tabla de tipos */}
        {types.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <p className="text-lg font-medium">No hay tipos de gastos</p>
            <p className="text-sm mt-2">Añade tipos de gastos o inicializa los del sistema</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {types.map((type, index) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingType === type.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                            className="input text-sm py-1 px-2"
                            autoFocus
                            disabled={saving}
                          />
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Guardar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Cancelar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{type.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          type.is_system
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {type.is_system ? 'Sistema' : 'Personalizado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {editingType !== type.id && (
                        <div className="flex items-center justify-center gap-2">
                          {!type.is_system && (
                            <>
                              <button
                                onClick={() => handleStartEdit(type)}
                                disabled={saving}
                                className="text-blue-600 hover:text-blue-800"
                                title="Editar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(type.id, type.name)}
                                disabled={saving}
                                className="text-red-600 hover:text-red-800"
                                title="Eliminar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                          {type.is_system && (
                            <span className="text-gray-400 text-xs">No editable</span>
                          )}
                        </div>
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
  )
}

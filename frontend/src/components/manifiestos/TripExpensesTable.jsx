import { useState, useEffect } from 'react'
import { expensesService } from '../../services/expensesService'
import Button from '../common/Button/Button'
import Loading from '../common/Loading/Loading'

export default function TripExpensesTable({ manifest, onRefresh }) {
  const [expenses, setExpenses] = useState([])
  const [expenseTypes, setExpenseTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [expensesByType, setExpensesByType] = useState({})

  // Formulario de nuevo gasto
  const [formData, setFormData] = useState({
    expense_type: '',
    amount: ''
  })

  useEffect(() => {
    loadExpenseTypes()
  }, [])

  useEffect(() => {
    if (manifest?.id) {
      loadExpenses()
      loadTotalExpenses()
    } else {
      setExpenses([])
      setTotalExpenses(0)
      setExpensesByType({})
    }
  }, [manifest])

  const loadExpenseTypes = async () => {
    try {
      const response = await expensesService.getExpenseTypes()
      if (response.success) {
        setExpenseTypes(response.data || [])
      }
    } catch (error) {
      console.error('Error cargando tipos de gastos:', error)
    }
  }

  const loadExpenses = async () => {
    if (!manifest?.id) return

    try {
      setLoading(true)
      setError('')
      const response = await expensesService.getTripExpenses(manifest.id)
      
      if (response.success) {
        setExpenses(response.data || [])
      } else {
        setError(response.message || 'Error al cargar gastos')
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar gastos')
      console.error('Error cargando gastos:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTotalExpenses = async () => {
    if (!manifest?.id) return

    try {
      const response = await expensesService.getTotalExpenses(manifest.id)
      if (response.success) {
        setTotalExpenses(response.data.total || 0)
        setExpensesByType(response.data.by_type || {})
      }
    } catch (error) {
      console.error('Error cargando total de gastos:', error)
    }
  }

  const handleAdd = async () => {
    if (!manifest?.id) {
      alert('Selecciona un manifiesto primero')
      return
    }

    if (!formData.expense_type || !formData.amount) {
      alert('Completa todos los campos requeridos')
      return
    }

    setSaving(true)
    try {
      const response = await expensesService.createTripExpense(
        manifest.id,
        formData.expense_type,
        parseFloat(formData.amount)
      )

      if (response.success) {
        setFormData({
          expense_type: '',
          amount: ''
        })
        setShowAddForm(false)
        loadExpenses()
        loadTotalExpenses()
        if (onRefresh) onRefresh()
      } else {
        alert('Error: ' + response.error)
      }
    } catch (error) {
      console.error('Error al crear gasto:', error)
      alert('Error al crear gasto: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStartEdit = (expense) => {
    setEditingExpense({
      id: expense.id,
      expense_type: expense.expense_type,
      amount: expense.amount
    })
  }

  const handleSaveEdit = async () => {
    if (!editingExpense) return

    setSaving(true)
    try {
      const response = await expensesService.updateTripExpense(editingExpense.id, {
        expense_type: editingExpense.expense_type,
        amount: parseFloat(editingExpense.amount)
      })

      if (response.success) {
        setEditingExpense(null)
        loadExpenses()
        loadTotalExpenses()
        if (onRefresh) onRefresh()
      } else {
        alert('Error: ' + response.error)
      }
    } catch (error) {
      console.error('Error al actualizar gasto:', error)
      alert('Error al actualizar gasto: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingExpense(null)
  }

  const handleDelete = async (expenseId) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) {
      return
    }

    setSaving(true)
    try {
      const response = await expensesService.deleteTripExpense(expenseId)
      if (response.success) {
        loadExpenses()
        loadTotalExpenses()
        if (onRefresh) onRefresh()
      } else {
        alert('Error: ' + response.error)
      }
    } catch (error) {
      console.error('Error al eliminar gasto:', error)
      alert('Error al eliminar gasto: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!manifest) {
    return (
      <div className="card">
        <div className="card-body">
          <p className="text-gray-500 text-center py-8">
            Selecciona un manifiesto para ver y gestionar sus gastos de viaje
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen de gastos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="card-body">
            <h3 className="text-sm font-medium opacity-90">Total de Gastos</h3>
            <p className="text-3xl font-bold">
              ${totalExpenses.toLocaleString('es-CO', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="card-body">
            <h3 className="text-sm font-medium opacity-90">Anticipo</h3>
            <p className="text-3xl font-bold">
              ${parseFloat(manifest.anticipo || 0).toLocaleString('es-CO', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="card-body">
            <h3 className="text-sm font-medium opacity-90">Balance</h3>
            <p className="text-3xl font-bold">
              ${(parseFloat(manifest.anticipo || 0) - totalExpenses).toLocaleString('es-CO', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Gastos por tipo */}
      {Object.keys(expensesByType).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Gastos por Tipo</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(expensesByType).map(([type, amount]) => (
                <div key={type} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">{type}</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${parseFloat(amount).toLocaleString('es-CO', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de gastos */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="card-title">💰 Gastos de Viaje</h2>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={saving}
              variant="primary"
              size="sm"
            >
              {showAddForm ? 'Cancelar' : '+ Añadir Gasto'}
            </Button>
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
              <h3 className="font-semibold text-blue-900 mb-3">Añadir Nuevo Gasto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Gasto *
                  </label>
                  <select
                    value={formData.expense_type}
                    onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                    className="input w-full"
                    disabled={saving}
                  >
                    <option value="">Seleccionar...</option>
                    {expenseTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="input pl-8 w-full"
                      step="0.01"
                      min="0"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleAdd}
                  disabled={saving || !formData.expense_type || !formData.amount}
                  variant="primary"
                >
                  {saving ? 'Guardando...' : 'Guardar Gasto'}
                </Button>
                <Button
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({
                      expense_type: '',
                      amount: ''
                    })
                  }}
                  disabled={saving}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de gastos */}
          {loading ? (
            <Loading message="Cargando gastos..." />
          ) : expenses.length === 0 ? (
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium">No hay gastos registrados</p>
              <p className="text-sm mt-2">Añade gastos de viaje para este manifiesto</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      {editingExpense?.id === expense.id ? (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              value={editingExpense.expense_type}
                              onChange={(e) => setEditingExpense({ ...editingExpense, expense_type: e.target.value })}
                              className="input text-sm py-1 px-2 w-full"
                              disabled={saving}
                            >
                              {expenseTypes.map((type) => (
                                <option key={type.id} value={type.name}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              value={editingExpense.amount}
                              onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                              className="input text-sm py-1 px-2 w-full text-right"
                              step="0.01"
                              min="0"
                              disabled={saving}
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
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
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {expense.expense_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            ${parseFloat(expense.amount).toLocaleString('es-CO', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleStartEdit(expense)}
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
                                onClick={() => handleDelete(expense.id)}
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
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import carrosService from '../../../services/carrosService'
import manifiestosService from '../../../services/manifiestosService'
import Loading from '../../common/Loading/Loading'

export default function CarrosTable() {
  const [carros, setCarros] = useState([])
  const [propietarios, setPropietarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({})
  
  // Estados para importación desde manifiestos
  const [showImportModal, setShowImportModal] = useState(false)
  const [placasFromManifestos, setPlacasFromManifestos] = useState([])
  const [selectedPlacas, setSelectedPlacas] = useState(new Set())
  const [importLoading, setImportLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [carrosRes, ownersRes] = await Promise.all([
        carrosService.getCarros({ include_owner: true }),
        carrosService.getPropietarios({ activo: true }),
      ])
      setCarros(carrosRes.carros || [])
      setPropietarios(ownersRes.propietarios || [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al cargar carros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const startEdit = (car) => {
    setEditingId(car.id)
    setDraft({
      placa: car.placa || '',
      soat_vencimiento: car.soat_vencimiento || '',
      tecnomecanica_vencimiento: car.tecnomecanica_vencimiento || '',
      modelo: car.modelo || '',
      ownerId: car.ownerId || '',
      activo: car.activo !== false,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft({})
  }

  const handleChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const saveCar = async () => {
    if (!editingId) return
    try {
      setSaving(true)
      setError('')
      const payload = {
        placa: (draft.placa || '').toUpperCase(),
        soat_vencimiento: draft.soat_vencimiento || '',
        tecnomecanica_vencimiento: draft.tecnomecanica_vencimiento || '',
        modelo: draft.modelo || '',
        ownerId: draft.ownerId || null,
        activo: draft.activo !== false,
      }
      await carrosService.updateCar(editingId, payload)
      await loadData()
      cancelEdit()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al guardar carro')
    } finally {
      setSaving(false)
    }
  }

  const createCar = async () => {
    try {
      setSaving(true)
      setError('')
      const payload = {
        placa: (draft.placa || '').toUpperCase(),
        soat_vencimiento: draft.soat_vencimiento || '',
        tecnomecanica_vencimiento: draft.tecnomecanica_vencimiento || '',
        modelo: draft.modelo || '',
        ownerId: draft.ownerId || null,
      }
      await carrosService.createCar(payload)
      setDraft({})
      await loadData()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al crear carro')
    } finally {
      setSaving(false)
    }
  }

  const deleteCar = async (car) => {
    if (!window.confirm(`¿Eliminar el carro con placa ${car.placa}?`)) return
    try {
      setSaving(true)
      setError('')
      await carrosService.deleteCar(car.id)
      await loadData()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al eliminar carro')
    } finally {
      setSaving(false)
    }
  }

  const renderOwnerName = (car) => {
    const owner = car.owner || propietarios.find((o) => o.id === car.ownerId)
    return owner?.nombre || 'Sin asignar'
  }

  const loadPlacasFromManifestos = async () => {
    try {
      setImportLoading(true)
      setError('')
      const res = await carrosService.getCarrosFromManifestos()
      setPlacasFromManifestos(res.placas_from_manifestos || [])
      setShowImportModal(true)
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al cargar placas desde manifiestos')
    } finally {
      setImportLoading(false)
    }
  }

  const togglePlacaSelection = (placa) => {
    const newSelected = new Set(selectedPlacas)
    if (newSelected.has(placa)) {
      newSelected.delete(placa)
    } else {
      newSelected.add(placa)
    }
    setSelectedPlacas(newSelected)
  }

  const selectAllPlacas = () => {
    if (selectedPlacas.size === placasFromManifestos.length) {
      setSelectedPlacas(new Set())
    } else {
      setSelectedPlacas(new Set(placasFromManifestos.map(p => p.placa)))
    }
  }

  const importSelectedPlacas = async () => {
    if (selectedPlacas.size === 0) return
    
    try {
      setSaving(true)
      setError('')
      
      const placasToImport = Array.from(selectedPlacas).map(placa => ({
        placa,
        soat_vencimiento: '',
        tecnomecanica_vencimiento: '',
        modelo: '',
        ownerId: null
      }))
      
      const result = await carrosService.createCarrosBatch(placasToImport)
      
      if (result.total_created > 0) {
        await loadData()
        setShowImportModal(false)
        setSelectedPlacas(new Set())
      }
      
      if (result.total_errors > 0) {
        setError(`Se crearon ${result.total_created} carros, pero ${result.total_errors} tuvieron errores`)
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al importar placas')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <Loading message="Cargando carros..." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Carros</h2>
          <p className="text-xs text-slate-500">
            Gestiona vehículos, vencimientos de SOAT / tecnomecánica y propietarios.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
            onClick={loadPlacasFromManifestos}
            disabled={importLoading}
          >
            {importLoading ? 'Cargando...' : 'Importar desde Manifiestos'}
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
            onClick={() => {
              setEditingId('new')
              setDraft({
                placa: '',
                soat_vencimiento: '',
                tecnomecanica_vencimiento: '',
                modelo: '',
                ownerId: '',
                activo: true,
              })
            }}
          >
            + Nuevo carro
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-xs">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Placa
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                SOAT
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Tecnomecánica
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Modelo
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Propietario
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Estado
              </th>
              <th className="px-3 py-2 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {editingId === 'new' && (
              <tr className="bg-blue-50/40">
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    className="input input-sm w-full"
                    value={draft.placa || ''}
                    onChange={(e) => handleChange('placa', e.target.value)}
                    placeholder="ABC123"
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="date"
                    className="input input-sm w-full"
                    value={draft.soat_vencimiento || ''}
                    onChange={(e) => handleChange('soat_vencimiento', e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="date"
                    className="input input-sm w-full"
                    value={draft.tecnomecanica_vencimiento || ''}
                    onChange={(e) =>
                      handleChange('tecnomecanica_vencimiento', e.target.value)
                    }
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    className="input input-sm w-full"
                    value={draft.modelo || ''}
                    onChange={(e) => handleChange('modelo', e.target.value)}
                    placeholder="Modelo"
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <select
                    className="input input-sm w-full"
                    value={draft.ownerId || ''}
                    onChange={(e) => handleChange('ownerId', e.target.value)}
                  >
                    <option value="">Sin propietario</option>
                    {propietarios.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-emerald-700">
                  Activo
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-xs">
                  <button
                    type="button"
                    className="text-emerald-600 hover:text-emerald-800 mr-2"
                    disabled={saving}
                    onClick={createCar}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="text-slate-500 hover:text-slate-700"
                    disabled={saving}
                    onClick={cancelEdit}
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            )}

            {carros.map((car, index) => {
              const isEditing = editingId === car.id
              const isOdd = index % 2 === 1
              const activo = car.activo !== false

              if (isEditing) {
                return (
                  <tr
                    key={car.id}
                    className={`${isOdd ? 'bg-slate-50/40' : 'bg-white'} border-l-2 border-blue-500`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        className="input input-sm w-full"
                        value={draft.placa || ''}
                        onChange={(e) => handleChange('placa', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="date"
                        className="input input-sm w-full"
                        value={draft.soat_vencimiento || ''}
                        onChange={(e) =>
                          handleChange('soat_vencimiento', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="date"
                        className="input input-sm w-full"
                        value={draft.tecnomecanica_vencimiento || ''}
                        onChange={(e) =>
                          handleChange('tecnomecanica_vencimiento', e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        className="input input-sm w-full"
                        value={draft.modelo || ''}
                        onChange={(e) => handleChange('modelo', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <select
                        className="input input-sm w-full"
                        value={draft.ownerId || ''}
                        onChange={(e) => handleChange('ownerId', e.target.value)}
                      >
                        <option value="">Sin propietario</option>
                        {propietarios.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 ${
                          draft.activo !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            draft.activo !== false ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {draft.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-xs">
                      <button
                        type="button"
                        className="text-emerald-600 hover:text-emerald-800 mr-2"
                        disabled={saving}
                        onClick={saveCar}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="text-slate-500 hover:text-slate-700"
                        disabled={saving}
                        onClick={cancelEdit}
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                )
              }

              return (
                <tr
                  key={car.id}
                  className={`${isOdd ? 'bg-slate-50/40' : 'bg-white'} hover:bg-blue-50/40`}
                >
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-900">
                    {car.placa}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700">
                    {car.soat_vencimiento || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700">
                    {car.tecnomecanica_vencimiento || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700">
                    {car.modelo || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700">
                    {renderOwnerName(car)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 ${
                        activo
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          activo ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center text-xs">
                    <button
                      type="button"
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 mr-1"
                      onClick={() => startEdit(car)}
                      title="Editar carro"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500"
                      onClick={() => deleteCar(car)}
                      title="Eliminar carro"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Importación desde Manifiestos */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Importar Placas desde Manifiestos
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Se encontraron {placasFromManifestos.length} placas únicas en tus manifiestos que no están registradas.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600"
                  onClick={() => setShowImportModal(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {placasFromManifestos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-400 text-sm">No hay placas nuevas para importar</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <input
                      type="checkbox"
                      checked={selectedPlacas.size === placasFromManifestos.length}
                      onChange={selectAllPlacas}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Seleccionar todo ({selectedPlacas.size} de {placasFromManifestos.length})
                    </span>
                  </div>

                  {placasFromManifestos.map((placaData) => (
                    <div
                      key={placaData.placa}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlacas.has(placaData.placa)}
                        onChange={() => togglePlacaSelection(placaData.placa)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{placaData.placa}</div>
                        {placaData.manifiesto_info && (
                          <div className="text-xs text-slate-500 mt-1">
                            {placaData.manifiesto_info.conductor && `Conductor: ${placaData.manifiesto_info.conductor}`}
                            {placaData.manifiesto_info.load_id && ` • Load ID: ${placaData.manifiesto_info.load_id}`}
                            {placaData.manifiesto_info.destino && ` • Destino: ${placaData.manifiesto_info.destino}`}
                            {placaData.manifiesto_info.multiple_manifestos && (
                              <span className="text-amber-600 font-medium">
                                • {placaData.manifiesto_info.total_manifiestos} manifiestos
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          De manifiesto
                        </span>
                        {placaData.manifiesto_info?.multiple_manifestos && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            Múltiple
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {selectedPlacas.size > 0 && (
                    <span>Se importarán {selectedPlacas.size} placas como nuevos carros</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    onClick={() => setShowImportModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={importSelectedPlacas}
                    disabled={selectedPlacas.size === 0 || saving}
                  >
                    {saving ? 'Importando...' : `Importar ${selectedPlacas.size} placas`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


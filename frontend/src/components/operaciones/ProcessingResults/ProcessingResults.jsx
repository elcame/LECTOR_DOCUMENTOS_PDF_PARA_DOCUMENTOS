import { useState, useEffect } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'

/**
 * Componente para mostrar los resultados del procesamiento de una carpeta
 * Muestra tablas con manifiestos guardados, duplicados y errores
 */
export default function ProcessingResults({ data, folderName, onClose }) {
  const [activeTab, setActiveTab] = useState('summary') // summary, saved, duplicates, errors
  const [manifiestos, setManifiestos] = useState([])

  if (!data) return null

  // 🔥 DEPURACIÓN: Mostrar qué datos están llegando
  console.log('🔍 ProcessingResults - Datos recibidos:', {
    total_manifiestos: data.total_manifiestos,
    total_procesados: data.total_procesados,
    manifiestos_count: data.manifiestos?.length || 0,
    manifiestos_guardados_count: data.manifiestos_guardados?.length || 0,
    primeros_manifiestos: data.manifiestos?.slice(0, 2)
  })

  const {
    total_manifiestos = 0,
    total_procesados = 0,
    total_duplicados = 0,
    total_errores = 0,
    manifiestos_guardados = [],
    manifiestos_duplicados_firebase = [],
    archivos_duplicados = [],
    manifiestos_errores = [],
    manifiestos: rawManifiestos = []
  } = data

  // Cargar y ordenar manifiestos
  useEffect(() => {
    if (rawManifiestos && rawManifiestos.length > 0) {
      // Ordenar: manifiestos con campos vacíos primero
      const sorted = [...rawManifiestos].sort((a, b) => {
        const aEmpty = hasEmptyFields(a)
        const bEmpty = hasEmptyFields(b)
        if (aEmpty && !bEmpty) return -1
        if (!aEmpty && bEmpty) return 1
        return 0
      })
      setManifiestos(sorted)
    }
  }, [rawManifiestos])

  // Verificar si un manifiesto tiene campos vacíos
  const hasEmptyFields = (manifiesto) => {
    const fieldsToCheck = ['fecha inicio', 'anticipo', 'load_id', 'remesa', 'placa', 'conductor']
    return fieldsToCheck.some(field => {
      const value = manifiesto[field]
      return !value || value === 'No encontrado' || value === 'No encontrada' || value === '' || value === 'NO_ENCONTRADO'
    })
  }

  // Manejar inicio de edición
  const handleStartEdit = (manifestoIndex, field, currentValue) => {
    setEditingCell({ index: manifestoIndex, field })
    setEditValue(currentValue || '')
  }

  // Manejar guardado de edición
  const handleSaveEdit = async () => {
    if (!editingCell) return

    const { index, field } = editingCell
    const manifiesto = manifiestos[index]

    setSaving(true)
    try {
      // Generar manifest_id basado en load_id, remesa o archivo
      let manifestId = manifiesto.id
      if (!manifestId) {
        const loadId = manifiesto.load_id || manifiesto['load_id']
        const remesa = manifiesto.remesa
        const archivo = manifiesto.archivo
        
        if (loadId && loadId !== 'No encontrado') {
          manifestId = `load_id_${loadId}`
        } else if (remesa && remesa !== 'No encontrada') {
          manifestId = `remesa_${remesa}`
        } else {
          // Fallback: usar username_archivo
          const username = 'current_user' // Se obtiene del contexto
          const safeArchivo = archivo.replace(/[/\\\.]/g, '_')
          manifestId = `${username}_${safeArchivo}`
        }
      }

      // Actualizar en el backend
      await manifiestosService.updateField(manifestId, field, editValue)

      // Actualizar localmente
      const updated = [...manifiestos]
      updated[index] = { ...updated[index], [field]: editValue }
      setManifiestos(updated)

      setEditingCell(null)
      setEditValue('')
    } catch (error) {
      console.error('Error al actualizar campo:', error)
      alert('Error al guardar el cambio: ' + (error.response?.data?.error || error.message))
    } finally {
      setSaving(false)
    }
  }

  // Manejar cancelación de edición
  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  // Renderizar celda editable
  const renderEditableCell = (manifiesto, index, field, displayField = null) => {
    const actualField = displayField || field
    const value = manifiesto[actualField]
    const isEmpty = !value || value === 'No encontrado' || value === 'No encontrada' || value === '' || value === 'NO_ENCONTRADO'
    const isEditing = editingCell?.index === index && editingCell?.field === actualField

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit()
              if (e.key === 'Escape') handleCancelEdit()
            }}
            className="input text-sm py-1 px-2 w-full"
            autoFocus
            disabled={saving}
          />
          <button
            onClick={handleSaveEdit}
            disabled={saving}
            className="text-green-600 hover:text-green-800 p-1"
            title="Guardar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={saving}
            className="text-red-600 hover:text-red-800 p-1"
            title="Cancelar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )
    }

    return (
      <div
        onClick={() => handleStartEdit(index, actualField, value)}
        className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded group ${
          isEmpty ? 'bg-red-50 border border-red-200' : ''
        }`}
        title="Click para editar"
      >
        {isEmpty ? (
          <span className="text-red-600 text-xs font-medium">⚠️ Vacío</span>
        ) : (
          <span className="text-sm">{value}</span>
        )}
        <svg className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-100 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </div>
    )
  }

  const tabs = [
    { id: 'summary', label: 'Resumen', count: null },
    { id: 'saved', label: 'Guardados', count: total_manifiestos },
    { id: 'duplicates', label: 'Duplicados', count: total_duplicados },
    { id: 'errors', label: 'Errores', count: total_errores }
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Resultados del Procesamiento</h2>
            <p className="text-sm text-gray-600 mt-1">Carpeta: <span className="font-semibold">{folderName}</span></p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  tab.id === 'saved' ? 'bg-green-100 text-green-700' :
                  tab.id === 'duplicates' ? 'bg-yellow-100 text-yellow-700' :
                  tab.id === 'errors' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Tab: Resumen */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Guardados</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{total_manifiestos}</p>
                  </div>
                  <div className="bg-green-200 rounded-full p-3">
                    <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Procesados</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{total_procesados}</p>
                  </div>
                  <div className="bg-blue-200 rounded-full p-3">
                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700 font-medium">Duplicados</p>
                    <p className="text-2xl font-bold text-yellow-900 mt-1">{total_duplicados}</p>
                  </div>
                  <div className="bg-yellow-200 rounded-full p-3">
                    <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 font-medium">Errores</p>
                    <p className="text-2xl font-bold text-red-900 mt-1">{total_errores}</p>
                  </div>
                  <div className="bg-red-200 rounded-full p-3">
                    <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen de acciones */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de acciones</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>{total_manifiestos}</strong> manifiesto(s) guardado(s) exitosamente en Firebase</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span><strong>{total_duplicados}</strong> archivo(s) duplicado(s) detectado(s) y omitido(s)</span>
                </li>
                {total_errores > 0 && (
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>{total_errores}</strong> error(es) durante el procesamiento</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Tab: Guardados */}
        {activeTab === 'saved' && (
          <div>
            {manifiestos.length > 0 ? (
              <div>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> Click en cualquier celda para editarla. Los campos vacíos aparecen primero con fondo rojo.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50">
                          #
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Archivo
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Load ID
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Remesa
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Placa
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Conductor
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Fecha Inicio
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Anticipo
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Destino
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {manifiestos.map((manifiesto, index) => {
                        const isEmpty = hasEmptyFields(manifiesto)
                        return (
                          <tr key={index} className={`hover:bg-gray-50 ${isEmpty ? 'bg-red-50/30' : ''}`}>
                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 sticky left-0 bg-white">
                              {isEmpty && (
                                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2" title="Tiene campos vacíos"></span>
                              )}
                              {index + 1}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {manifiesto.archivo}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {renderEditableCell(manifiesto, index, 'load_id')}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {renderEditableCell(manifiesto, index, 'remesa')}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {renderEditableCell(manifiesto, index, 'placa')}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {renderEditableCell(manifiesto, index, 'conductor')}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {renderEditableCell(manifiesto, index, 'fecha_inicio', 'fecha inicio')}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {renderEditableCell(manifiesto, index, 'anticipo')}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {renderEditableCell(manifiesto, index, 'destino')}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500">No hay manifiestos guardados</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Duplicados */}
        {activeTab === 'duplicates' && (
          <div>
            {(manifiestos_duplicados_firebase.length > 0 || archivos_duplicados.length > 0) ? (
              <div className="space-y-6">
                {/* Duplicados detectados en Firebase */}
                {manifiestos_duplicados_firebase.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Duplicados detectados en Firebase ({manifiestos_duplicados_firebase.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-yellow-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                              Archivo
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                              Load ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                              Remesa
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                              Razón
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {manifiestos_duplicados_firebase.map((item, index) => (
                            <tr key={index} className="hover:bg-yellow-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.archivo}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {item.load_id !== 'No encontrado' ? (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                    {item.load_id}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {item.remesa !== 'No encontrada' ? (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                    {item.remesa}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-yellow-700">
                                {item.message || 'Duplicado detectado'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Duplicados del procesamiento inicial */}
                {archivos_duplicados.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Duplicados del procesamiento inicial ({archivos_duplicados.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-orange-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                              Archivo
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                              Identificador
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                              Archivo Original
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {archivos_duplicados.map((item, index) => (
                            <tr key={index} className="hover:bg-orange-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.archivo}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                  {item.identificador}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {item.archivo_original}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500">No se detectaron duplicados</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Errores */}
        {activeTab === 'errors' && (
          <div>
            {manifiestos_errores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        Archivo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {manifiestos_errores.map((item, index) => (
                      <tr key={index} className="hover:bg-red-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.archivo}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-700">
                          {item.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500">No se encontraron errores</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

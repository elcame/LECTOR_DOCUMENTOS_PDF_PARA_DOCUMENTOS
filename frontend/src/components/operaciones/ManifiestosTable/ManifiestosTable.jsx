import { useState, useEffect } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import PDFPages from '../PDFPages/PDFPages'
import Button from '../../common/Button/Button'
import Loading from '../../common/Loading/Loading'

/**
 * Tabla para mostrar lista de manifiestos con todos sus datos y edición inline
 */
export default function ManifiestosTable({ folderName = null, refreshTrigger = 0 }) {
  const [manifiestos, setManifiestos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPDF, setSelectedPDF] = useState(null)
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false)
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Cargar manifiestos cuando el componente se monta o cambia el folder
  useEffect(() => {
    loadManifiestos()
  }, [folderName, refreshTrigger])

  const loadManifiestos = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await manifiestosService.getManifiestosData(folderName)
      
      if (response.success) {
        // Ordenar: manifiestos con campos vacíos primero
        const sorted = (response.data || []).sort((a, b) => {
          const aEmpty = hasEmptyFields(a)
          const bEmpty = hasEmptyFields(b)
          if (aEmpty && !bEmpty) return -1
          if (!aEmpty && bEmpty) return 1
          return 0
        })
        setManifiestos(sorted)
      } else {
        setError(response.message || 'Error al cargar manifiestos')
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar manifiestos')
      console.error('Error cargando manifiestos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Verificar si un manifiesto tiene campos vacíos
  const hasEmptyFields = (manifiesto) => {
    const fieldsToCheck = ['fecha_inicio', 'anticipo', 'load_id', 'remesa', 'placa', 'conductor']
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
      // Usar el ID del manifiesto de Firestore
      const manifestId = manifiesto.id
      if (!manifestId) {
        throw new Error('No se encontró el ID del manifiesto')
      }

      await manifiestosService.updateField(manifestId, field, editValue)

      // Actualizar localmente
      const updated = [...manifiestos]
      updated[index] = { ...updated[index], [field]: editValue }
      setManifiestos(updated)

      setEditingCell(null)
      setEditValue('')
    } catch (error) {
      console.error('Error al actualizar campo:', error)
      alert('Error al guardar: ' + (error.response?.data?.error || error.message))
    } finally {
      setSaving(false)
    }
  }

  // Manejar cancelación
  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  // Renderizar celda editable
  const renderEditableCell = (manifiesto, index, field) => {
    const value = manifiesto[field]
    const isEmpty = !value || value === 'No encontrado' || value === 'No encontrada' || value === '' || value === 'NO_ENCONTRADO'
    const isEditing = editingCell?.index === index && editingCell?.field === field

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 min-w-[200px]">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit()
              if (e.key === 'Escape') handleCancelEdit()
            }}
            className="input py-2 px-3 w-full text-base"
            autoFocus
            disabled={saving}
          />
          <button
            onClick={handleSaveEdit}
            disabled={saving}
            className="text-green-600 hover:text-green-800 p-2 flex-shrink-0"
            title="Guardar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={saving}
            className="text-red-600 hover:text-red-800 p-2 flex-shrink-0"
            title="Cancelar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )
    }

    return (
      <div
        onClick={() => handleStartEdit(index, field, value)}
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

  const handleVerManifiesto = (pdf) => {
    setSelectedPDF(pdf)
    setIsPDFModalOpen(true)
  }

  const handleClosePDFModal = () => {
    setIsPDFModalOpen(false)
    setSelectedPDF(null)
  }

  // Loading state
  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <Loading message="Cargando manifiestos..." />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert-error">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (manifiestos.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">No hay manifiestos disponibles</p>
            <p className="text-sm mt-2">
              {folderName 
                ? `No se encontraron manifiestos en la carpeta "${folderName}"`
                : 'Sube una carpeta con manifiestos para comenzar'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            Manifiestos {folderName && `- ${folderName}`}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {manifiestos.length} manifiesto(s) encontrado(s)
          </p>
        </div>

        <div className="card-body p-0">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg mx-6 mt-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Click en cualquier celda para editarla. Los campos vacíos aparecen con fondo rojo.
            </p>
          </div>
          {/* Tabla responsive */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archivo
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Load ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remesa
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conductor
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Inicio
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anticipo
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destino
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {manifiestos.map((manifiesto, index) => {
                  const isEmpty = hasEmptyFields(manifiesto)
                  return (
                    <tr
                      key={manifiesto.id || index}
                      className={`hover:bg-gray-50 transition-colors ${isEmpty ? 'bg-red-50/30' : ''}`}
                    >
                      {/* Número */}
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {isEmpty && (
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2" title="Tiene campos vacíos"></span>
                        )}
                        {index + 1}
                      </td>

                      {/* Nombre del archivo */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 text-red-500 mr-2 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="text-sm font-medium text-gray-900">
                            {manifiesto.archivo}
                          </div>
                        </div>
                      </td>

                      {/* Load ID - Editable */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {renderEditableCell(manifiesto, index, 'load_id')}
                      </td>

                      {/* Remesa - Editable */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {renderEditableCell(manifiesto, index, 'remesa')}
                      </td>

                      {/* Placa - Editable */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {renderEditableCell(manifiesto, index, 'placa')}
                      </td>

                      {/* Conductor - Editable */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {renderEditableCell(manifiesto, index, 'conductor')}
                      </td>

                      {/* Fecha Inicio - Editable */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {renderEditableCell(manifiesto, index, 'fecha_inicio')}
                      </td>

                      {/* Anticipo - Editable */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {renderEditableCell(manifiesto, index, 'anticipo')}
                      </td>

                      {/* Destino - Editable */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {renderEditableCell(manifiesto, index, 'destino')}
                      </td>

                      {/* Acciones */}
                      <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleVerManifiesto({ filename: manifiesto.archivo, folder_name: manifiesto.folder_name })}
                          className="inline-flex items-center"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Ver PDF
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para ver páginas del PDF */}
      <PDFPages
        pdf={selectedPDF}
        isOpen={isPDFModalOpen}
        onClose={handleClosePDFModal}
        onPdfUpdated={loadManifiestos}
      />
    </>
  )
}

/**
 * Formatea el tamaño del archivo a formato legible
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Formatea la fecha a formato legible
 */
function formatDate(dateString) {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch (error) {
    return dateString
  }
}

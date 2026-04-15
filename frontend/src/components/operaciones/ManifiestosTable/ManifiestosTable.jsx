import { useState, useEffect } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import carrosService from '../../../services/carrosService'
import Loading from '../../common/Loading/Loading'
import Modal from '../../common/Modal/Modal'

/**
 * Tabla para mostrar lista de manifiestos con todos sus datos y edición inline
 */
export default function ManifiestosTable({ folderName = null, refreshTrigger = 0 }) {
  const [manifiestos, setManifiestos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [carInfoModal, setCarInfoModal] = useState({ open: false, loading: false, error: '', data: null })

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
        // Normalización: el campo correcto es `valor_manifiesto`.
        // Mantenemos compatibilidad por si llega `valormanifiesto` (legacy).
        const normalized = sorted.map((m) => {
          if (
            (m.valor_manifiesto === undefined || m.valor_manifiesto === null || m.valor_manifiesto === '') &&
            m.valormanifiesto !== undefined &&
            m.valormanifiesto !== null &&
            m.valormanifiesto !== ''
          ) {
            return { ...m, valor_manifiesto: m.valormanifiesto }
          }
          return m
        })

        setManifiestos(normalized)
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
    const fieldsToCheck = ['fecha_inicio', 'valor_manifiesto', 'load_id', 'remesa', 'placa', 'conductor']
    return fieldsToCheck.some(field => {
      const value = manifiesto[field]
      return !value || value === 'No encontrado' || value === 'No encontrada' || value === '' || value === 'NO_ENCONTRADO'
    })
  }

  const getManifestStatus = (manifiesto) => {
    // Por ahora, solo distinguimos completo vs incompleto según campos vacíos.
    const incomplete = hasEmptyFields(manifiesto)
    if (incomplete) {
      return {
        label: 'Incompleto',
        colorClasses:
          'bg-amber-50 text-amber-700 border border-amber-200',
        iconColor: 'text-amber-500',
        iconPath:
          'M12 9v3.75m0 3.75h.007v.008H12V16.5zm0-12a9 9 0 100 18 9 9 0 000-18z',
      }
    }
    return {
      label: 'Completo',
      colorClasses:
        'bg-emerald-50 text-emerald-700 border border-emerald-200',
      iconColor: 'text-emerald-500',
      iconPath:
        'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    }
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

  const openCarInfo = async (manifiesto) => {
    if (!manifiesto?.placa) {
      setCarInfoModal({
        open: true,
        loading: false,
        error: 'El manifiesto no tiene placa asociada',
        data: null,
      })
      return
    }
    try {
      setCarInfoModal({
        open: true,
        loading: true,
        error: '',
        data: null,
      })
      const res = await carrosService.getCarroByPlaca(manifiesto.placa)
      const carros = res.carros || []
      if (!carros.length) {
        setCarInfoModal({
          open: true,
          loading: false,
          error: `No se encontró carro registrado para la placa ${manifiesto.placa}`,
          data: null,
        })
      } else {
        setCarInfoModal({
          open: true,
          loading: false,
          error: '',
          data: { carro: carros[0], placa: manifiesto.placa },
        })
      }
    } catch (e) {
      setCarInfoModal({
        open: true,
        loading: false,
        error: e?.response?.data?.error || e?.message || 'Error al cargar información del carro',
        data: null,
      })
    }
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
      <button
        type="button"
        onClick={() => handleStartEdit(index, field, value)}
        className="w-full text-left px-2 py-1 rounded-md border border-transparent hover:border-slate-200 hover:bg-slate-50 group"
        title="Click para editar"
      >
        {isEmpty ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
            <svg
              className="w-3 h-3 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3.75m0 3.75h.007v.008H12V16.5zm0-12a9 9 0 100 18 9 9 0 000-18z"
              />
            </svg>
            Pendiente
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-slate-800">
            {value}
            <svg
              className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </span>
        )}
      </button>
    )
  }

  const handleVerManifiesto = (manifiesto) => {
    if (!manifiesto?.archivo || !manifiesto?.folder_name) return
    const url = manifiestosService.getPDFViewUrl(
      manifiesto.archivo,
      manifiesto.folder_name
    )
    window.open(url, '_blank', 'noopener,noreferrer')
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
        <div className="card-header flex items-center justify-between">
          <div>
            <h2 className="card-title text-slate-900">
              Manifiestos {folderName && `- ${folderName}`}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {manifiestos.length} manifiesto(s) encontrado(s)
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Completos</span>
            <span className="font-semibold">
              {
                manifiestos.filter((m) => !hasEmptyFields(m))
                  .length
              }
            </span>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg mx-6 mt-4">
            <p className="text-sm text-slate-700">
              <span className="font-medium">Tip:</span>{' '}
              haz clic en cualquier celda para editarla. Los campos
              pendientes se marcan con una insignia amarilla.
            </p>
          </div>
          {/* Tabla responsive */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Archivo
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Load ID
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Remesa
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Placa
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Conductor
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Fecha Inicio
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Valor
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Destino
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-3 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {manifiestos.map((manifiesto, index) => {
                  const status = getManifestStatus(manifiesto)
                  const isOdd = index % 2 === 1
                  return (
                    <tr
                      key={manifiesto.id || index}
                      className={`transition-colors ${
                        isOdd ? 'bg-slate-50/40' : 'bg-white'
                      } hover:bg-blue-50/40`}
                    >
                      {/* Número */}
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-500">
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
                          <div className="text-sm font-medium text-slate-900">
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

                      {/* Valor - Editable */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {renderEditableCell(manifiesto, index, 'valor_manifiesto')}
                      </td>

                      {/* Destino - Editable */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {renderEditableCell(manifiesto, index, 'destino')}
                      </td>

                      {/* Estado */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 ${status.colorClasses}`}
                        >
                          <svg
                            className={`w-3 h-3 ${status.iconColor}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={status.iconPath}
                            />
                          </svg>
                          {status.label}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleVerManifiesto(manifiesto)}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                            title="Abrir PDF"
                          >
                            <svg
                              className="w-4 h-4"
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
                          </button>
                          <button
                            type="button"
                            onClick={() => openCarInfo(manifiesto)}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                            title="Ver carro / propietario"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7h4l2-2h6l2 2h4v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={carInfoModal.open}
        onClose={() => setCarInfoModal({ open: false, loading: false, error: '', data: null })}
        title="Carro y propietario"
        size="md"
      >
        {carInfoModal.loading ? (
          <div className="py-6">
            <Loading message="Buscando información de carro..." />
          </div>
        ) : carInfoModal.error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {carInfoModal.error}
          </div>
        ) : carInfoModal.data ? (
          <div className="space-y-3 text-sm text-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Carro
              </p>
              <p>
                <span className="font-medium">Placa:</span> {carInfoModal.data.carro.placa}
              </p>
              <p>
                <span className="font-medium">Modelo:</span>{' '}
                {carInfoModal.data.carro.modelo || '-'}
              </p>
              <p>
                <span className="font-medium">SOAT:</span>{' '}
                {carInfoModal.data.carro.soat_vencimiento || '-'}
              </p>
              <p>
                <span className="font-medium">Tecnomecánica:</span>{' '}
                {carInfoModal.data.carro.tecnomecanica_vencimiento || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Propietario
              </p>
              {carInfoModal.data.carro.owner ? (
                <>
                  <p>
                    <span className="font-medium">Nombre:</span>{' '}
                    {carInfoModal.data.carro.owner.nombre}
                  </p>
                  <p>
                    <span className="font-medium">Documento:</span>{' '}
                    {carInfoModal.data.carro.owner.documento || '-'}
                  </p>
                  <p>
                    <span className="font-medium">Teléfono:</span>{' '}
                    {carInfoModal.data.carro.owner.telefono || '-'}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{' '}
                    {carInfoModal.data.carro.owner.email || '-'}
                  </p>
                </>
              ) : (
                <p className="text-slate-500">Sin propietario asociado.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-600">Sin información disponible.</div>
        )}
      </Modal>
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

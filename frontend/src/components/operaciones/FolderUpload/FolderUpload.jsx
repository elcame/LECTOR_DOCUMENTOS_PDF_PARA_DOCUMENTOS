import { useState, useRef } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import Button from '../../common/Button/Button'
import ProcessingResults from '../ProcessingResults/ProcessingResults'

/**
 * Componente para subir una carpeta de PDFs y procesarla.
 * Recibe folders y onRefresh del padre (overview con 1 sola lectura Firebase).
 */
export default function FolderUpload({ folders = [], loadingFolders = false, onRefresh, onUploadSuccess, onProcessSuccess, className = '' }) {
  const [folderName, setFolderName] = useState('')
  const [selectedFolderToProcess, setSelectedFolderToProcess] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [lastUploadedFolder, setLastUploadedFolder] = useState(null)
  const [processingResults, setProcessingResults] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef(null)
  const inputFilesRef = useRef(null)

  const availableFolders = folders

  const handleSelectFolder = (e) => {
    const selected = Array.from(e.target.files || [])
    const pdfs = selected.filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    setFiles(pdfs)
    setError('')
    setSuccessMessage('')
    if (pdfs.length !== selected.length) {
      setError(`Se omitieron ${selected.length - pdfs.length} archivo(s) que no son PDF.`)
    }
    // No limpiar el input para permitir seleccionar la misma carpeta de nuevo
  }

  const handleSelectFiles = (e) => {
    const selected = Array.from(e.target.files || [])
    const pdfs = selected.filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    setFiles(pdfs)
    setError('')
    setSuccessMessage('')
    if (pdfs.length !== selected.length) {
      setError(`Se omitieron ${selected.length - pdfs.length} archivo(s) que no son PDF.`)
    }
    // No limpiar el input para permitir seleccionar los mismos archivos de nuevo
  }

  const handleUpload = async () => {
    setError('')
    setSuccessMessage('')
    const name = (folderName || '').trim().replace(/\.\./g, '').replace(/[/\\]/g, '')
    if (!name) {
      setError('Escribe un nombre para la carpeta (solo letras, números y guiones).')
      return
    }
    if (files.length === 0) {
      setError('Selecciona al menos un archivo PDF.')
      return
    }

    setUploading(true)
    try {
      const res = await manifiestosService.uploadFolder(name, files)
      setSuccessMessage(res?.message || `Se subieron ${res?.data?.saved_count ?? files.length} archivo(s).`)
      setLastUploadedFolder(name)
      setFiles([])
      setFolderName('')
      onUploadSuccess?.({ folderName: name, data: res?.data })
    } catch (err) {
      setError(err?.message || err?.response?.data?.error || 'Error al subir la carpeta.')
    } finally {
      setUploading(false)
    }
  }

  const loadAvailableFolders = async () => {
    try {
      setLoadingFolders(true)
      const res = await manifiestosService.getFolders()
      if (res.success) {
        setAvailableFolders(res.folders || [])
      }
    } catch (err) {
      console.error('Error al cargar carpetas:', err)
    } finally {
      setLoadingFolders(false)
    }
  }

  const handleProcess = async () => {
    // Priorizar carpeta seleccionada del selector, luego la última subida, luego el nombre escrito
    const name = selectedFolderToProcess || lastUploadedFolder || (folderName || '').trim().replace(/\.\./g, '').replace(/[/\\]/g, '')
    if (!name) {
      setError('Selecciona una carpeta para procesar.')
      return
    }

    setError('')
    setSuccessMessage('')
    setProcessing(true)
    setProcessingResults(null)
    setShowResults(false)
    try {
      const res = await manifiestosService.processFolder(name)
      const total = res?.data?.total_manifiestos ?? 0
      setSuccessMessage(`Procesados ${total} manifiesto(s) correctamente en "${name}".`)
      setProcessingResults({ ...res.data, folderName: name })
      setShowResults(true)
      setSelectedFolderToProcess('') // Limpiar selección
      onProcessSuccess?.({ folderName: name, data: res?.data })
    } catch (err) {
      setError(err?.message || err?.response?.data?.error || 'Error al procesar la carpeta.')
      setProcessingResults(null)
      setShowResults(false)
    } finally {
      setProcessing(false)
    }
  }

  // El botón se habilita si hay archivos Y nombre de carpeta válido
  const folderNameTrimmed = (folderName || '').trim()
  const folderNameValid = folderNameTrimmed.length > 0
  const hasFiles = Array.isArray(files) && files.length > 0
  const canUpload = hasFiles && folderNameValid && !uploading
  const canProcess = (selectedFolderToProcess || lastUploadedFolder || folderNameValid) && !processing

  // Mensajes de ayuda para el botón
  const getUploadButtonHelp = () => {
    if (uploading) return 'Subiendo archivos...'
    if (!folderNameValid) return '⚠️ Escribe un nombre para la carpeta (requerido)'
    if (!hasFiles) return '⚠️ Selecciona archivos PDF primero'
    return '✅ Listo para subir'
  }

  return (
    <div className={`bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Subir y procesar carpetas</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Sube nuevos PDFs o selecciona una carpeta existente para procesar.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Sección: Procesar carpeta existente */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Procesar carpeta existente
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona una carpeta para procesar
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedFolderToProcess}
                  onChange={(e) => setSelectedFolderToProcess(e.target.value)}
                  className="input flex-1"
                  disabled={loadingFolders}
                >
                  <option value="">Selecciona una carpeta...</option>
                  {availableFolders.map((folder) => (
                    <option key={folder.name} value={folder.name}>
                      {folder.name} ({folder.pdf_count} PDFs)
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onRefresh?.()}
                  className="btn btn-outline btn-sm"
                  disabled={loadingFolders}
                  title="Actualizar lista de carpetas"
                >
                  {loadingFolders ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
              </div>
              {selectedFolderToProcess && (
                <p className="text-xs text-gray-500 mt-1">
                  Carpeta seleccionada: <span className="font-medium">{selectedFolderToProcess}</span>
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={handleProcess}
              disabled={!canProcess}
              loading={processing}
              className="w-full sm:w-auto"
            >
              {processing ? 'Procesando...' : `Procesar carpeta${selectedFolderToProcess ? ` "${selectedFolderToProcess}"` : ''}`}
            </Button>
          </div>
        </div>

        {/* Sección: Subir nueva carpeta */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Subir nueva carpeta
          </h3>
          <div className="space-y-4">
            {/* Nombre de carpeta */}
            <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la carpeta <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Ej: Viaje_2024_01"
            className="input w-full"
          />
              <p className="text-xs text-gray-500 mt-1">Solo letras, números y guiones. Sin / ni \</p>
            </div>

            {/* Selección: carpeta o archivos */}
            <div className="flex flex-wrap gap-3">
          <label className="btn btn-outline btn-md cursor-pointer">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              webkitdirectory=""
              multiple
              className="hidden"
              onChange={handleSelectFolder}
            />
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Seleccionar carpeta
            </span>
          </label>
          <label className="btn btn-outline btn-md cursor-pointer">
            <input
              ref={inputFilesRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={handleSelectFiles}
            />
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Seleccionar archivos PDF
            </span>
          </label>
            </div>

            {/* Lista de archivos */}
            {files.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 max-h-40 overflow-y-auto">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {files.length} archivo(s) seleccionado(s)
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              {files.slice(0, 10).map((f, i) => (
                <li key={i} className="truncate" title={f.name}>
                  {f.name}
                </li>
              ))}
              {files.length > 10 && (
                <li className="text-gray-500">... y {files.length - 10} más</li>
              )}
            </ul>
            </div>
            )}

            {/* Mensajes */}
            {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}
            {successMessage && (
              <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
                {successMessage}
              </div>
            )}

            {/* Tabla de resultados del procesamiento */}
            {showResults && processingResults && (
              <div className="mt-6">
                <ProcessingResults
                  data={processingResults}
                  folderName={processingResults.folderName || selectedFolderToProcess || lastUploadedFolder || (folderName || '').trim()}
                  onClose={() => setShowResults(false)}
                />
              </div>
            )}

            {/* Acciones */}
            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!canUpload}
                loading={uploading}
                className="w-full sm:w-auto"
              >
                {uploading ? 'Subiendo...' : 'Subir carpeta'}
              </Button>
              {!canUpload && !uploading && (
                <p className="text-xs text-amber-600 font-medium">
                  {getUploadButtonHelp()}
                </p>
              )}
              {canUpload && !uploading && (
                <p className="text-xs text-green-600 font-medium">
                  ✅ Listo para subir {files.length} archivo(s) a "{folderNameTrimmed}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

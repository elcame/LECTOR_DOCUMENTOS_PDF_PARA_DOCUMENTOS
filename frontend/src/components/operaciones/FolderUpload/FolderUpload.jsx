import { useState, useRef } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import Button from '../../common/Button/Button'
import ProcessingResults from '../ProcessingResults/ProcessingResults'
import BulkRenamePDFs from '../BulkRenamePDFs/BulkRenamePDFs'
import ProcesarCarpetaSection from '../../../componentes/operaciones/ProcesarCarpetaSection'
import SubirCarpetaSection from '../../../componentes/operaciones/SubirCarpetaSection'

/**
 * Componente para subir una carpeta de PDFs y procesarla.
 * Recibe folders y onRefresh del padre (overview con 1 sola lectura Firebase).
 * visibleSection controla qué parte se muestra: 'procesar' | 'subir' | null.
 */
export default function FolderUpload({
  folders = [],
  loadingFolders = false,
  onRefresh,
  onUploadSuccess,
  onProcessSuccess,
  className = '',
  visibleSection = null,
}) {
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
  const [showBulkRename, setShowBulkRename] = useState(false)
  const inputRef = useRef(null)
  const inputFilesRef = useRef(null)

  const handleSelectFolder = (e) => {
    const selected = Array.from(e.target.files || [])
    const pdfs = selected.filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    setFiles(pdfs)
    setError('')
    setSuccessMessage('')
    
    // Extraer el nombre de la carpeta del primer archivo
    if (pdfs.length > 0 && pdfs[0].webkitRelativePath) {
      const pathParts = pdfs[0].webkitRelativePath.split('/')
      if (pathParts.length > 1) {
        const extractedFolderName = pathParts[0].trim().replace(/\.\./g, '').replace(/[/\\]/g, '')
        setFolderName(extractedFolderName)
      }
    }
    
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

  // Si no hay sección activa, no mostramos el bloque completo
  if (!visibleSection) {
    return null
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-wide">
            Subir y procesar carpetas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sube nuevos PDFs o selecciona una carpeta existente para procesar.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
          {lastUploadedFolder && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Última carpeta subida:
              <span className="font-semibold">{lastUploadedFolder}</span>
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {visibleSection === 'procesar' && (
          <div id="section-procesar-carpeta">
            <ProcesarCarpetaSection
              folders={folders}
              selectedFolderToProcess={selectedFolderToProcess}
              loadingFolders={loadingFolders}
              canProcess={canProcess}
              processing={processing}
              onChangeSelectedFolder={setSelectedFolderToProcess}
              onClickProcess={handleProcess}
              onClickRefresh={() => onRefresh?.()}
              onClickRename={() => setShowBulkRename(true)}
            />
          </div>
        )}

        {/* Modal de renombrado masivo */}
        <BulkRenamePDFs
          folderName={selectedFolderToProcess}
          isOpen={showBulkRename}
          onClose={() => setShowBulkRename(false)}
          onSuccess={() => {
            onRefresh?.()
            setShowBulkRename(false)
          }}
        />

        {visibleSection === 'subir' && (
          <div id="section-subir-carpeta">
            <SubirCarpetaSection
              folderName={folderName}
              onChangeFolderName={setFolderName}
              files={files}
              error={error}
              successMessage={successMessage}
              showResults={showResults}
              processingResults={processingResults}
              uploading={uploading}
              canUpload={canUpload}
              folderNameTrimmed={folderNameTrimmed}
              onSelectFolder={handleSelectFolder}
              onSelectFiles={handleSelectFiles}
              onUpload={handleUpload}
              onCloseResults={() => setShowResults(false)}
              getUploadButtonHelp={getUploadButtonHelp}
              ProcessingResultsComponent={ProcessingResults}
            />
          </div>
        )}
      </div>
    </div>
  )
}

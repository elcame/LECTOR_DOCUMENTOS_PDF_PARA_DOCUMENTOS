import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { manifiestosService } from '../../services/manifiestosService'
import { tiposManifiestoService } from '../../services/tiposManifiestoService'
import useTiposManifiesto from '../../hooks/useTiposManifiesto'
import FolderPicker from '../../components/administrador-operacion/carpetas/FolderPicker'
import FolderContents from '../../components/administrador-operacion/carpetas/FolderContents'
import BulkRenamePDFs from '../../components/operaciones/BulkRenamePDFs/BulkRenamePDFs'
import useProcessProgress from '../../hooks/useProcessProgress'

export default function CarpetasProcesadasPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = searchParams.get('folder') || ''
  const [folders, setFolders] = useState([])
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [downloadingExcel, setDownloadingExcel] = useState(false)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [savingTipo, setSavingTipo] = useState(false)
  const [pendingTipoId, setPendingTipoId] = useState(null)
  const [tableRefresh, setTableRefresh] = useState(0)
  const [showRename, setShowRename] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [purgingAll, setPurgingAll] = useState(false)
  const [confirmOneOpen, setConfirmOneOpen] = useState(false)
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)
  const progress = useProcessProgress()
  const { tipos, loading: loadingTipos } = useTiposManifiesto(true)
  const selectedFolder = folders.find((folder) => folder.name === selected)
  const selectedTipoId = pendingTipoId ?? (selectedFolder?.tipo_id || '')

  const loadList = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await manifiestosService.getOverview()
      if (res?.success) setFolders(res.data?.folders || [])
    } catch (err) {
      setError(err?.message || 'Error al cargar carpetas')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadFolder = useCallback(async (name) => {
    if (!name) {
      setPdfs([])
      return
    }
    try {
      setLoading(true)
      const res = await manifiestosService.getOverview(name)
      if (res?.success) setPdfs(res.data?.pdfs || [])
    } catch (err) {
      setError(err?.message || 'Error al cargar la carpeta')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    loadFolder(selected)
  }, [selected, loadFolder])

  const handleSelect = (name) => {
    if (name) setSearchParams({ folder: name })
    else setSearchParams({})
  }

  const handleChangeTipo = async (tipoId) => {
    if (!selected || tipoId === (selectedFolder?.tipo_id || '')) return
    const apply = window.confirm(
      '¿Aplicar este tipo también a los manifiestos de la carpeta?\n\nAceptar: actualizar manifiestos.\nCancelar: solo cambiar el tipo de la carpeta.'
    )
    setError('')
    setSuccess('')
    setPendingTipoId(tipoId)
    setSavingTipo(true)
    try {
      await tiposManifiestoService.setFolderTipo(selected, tipoId, apply)
      await loadList()
      setTableRefresh((n) => n + 1)
      setSuccess(apply ? 'Tipo aplicado a la carpeta y a sus manifiestos.' : 'Tipo actualizado solo en la carpeta.')
    } catch (err) {
      setError(err?.message || 'No se pudo cambiar el tipo de la carpeta')
    } finally {
      setPendingTipoId(null)
      setSavingTipo(false)
    }
  }

  const handleDownloadExcel = async () => {
    if (!selected) return
    setError('')
    setSuccess('')
    setDownloadingExcel(true)
    progress.start('Generando Excel...', 20000)
    try {
      await manifiestosService.downloadExcel(selected, {
        onProgress: ({ percent }) => progress.update(Math.max(percent, 40), 'Descargando Excel...'),
      })
      progress.finish('Excel listo')
      setSuccess(`Excel de “${selected}” descargado.`)
    } catch (err) {
      progress.reset()
      setError(err?.message || 'No se pudo descargar el Excel. Procesa la carpeta primero.')
    } finally {
      setDownloadingExcel(false)
    }
  }

  const handleDownloadZip = async () => {
    if (!selected) return
    setError('')
    setSuccess('')
    setDownloadingZip(true)
    const pdfCount = selectedFolder?.pdf_count || pdfs.length || 10
    progress.start(`Preparando ZIP de ${pdfCount} PDF(s)...`, Math.max(20000, pdfCount * 1800))
    try {
      await manifiestosService.downloadFolderZip(selected, {
        onProgress: ({ percent }) => progress.update(Math.max(percent, 50), 'Descargando carpeta...'),
      })
      progress.finish('Carpeta lista')
      setSuccess(`Carpeta “${selected}” descargada.`)
    } catch (err) {
      progress.reset()
      setError(err?.message || 'No se pudo descargar la carpeta.')
    } finally {
      setDownloadingZip(false)
    }
  }

  const handleDeleteFolder = async () => {
    if (!selected) return
    setError('')
    setSuccess('')
    setConfirmOneOpen(false)
    setDeleting(true)
    const pdfCount = selectedFolder?.pdf_count || pdfs.length || 5
    progress.start(`Eliminando carpeta “${selected}”...`, Math.max(15000, pdfCount * 1200))
    try {
      const res = await manifiestosService.deleteFolder(selected)
      if (!res?.success) throw new Error(res?.error || 'No se pudo eliminar la carpeta')
      progress.finish('Carpeta eliminada')
      setSuccess(`Carpeta “${selected}” eliminada (PDFs, manifiestos y Storage).`)
      handleSelect('')
      await loadList()
    } catch (err) {
      progress.reset()
      setError(err?.response?.data?.error || err?.message || 'No se pudo eliminar la carpeta')
    } finally {
      setDeleting(false)
    }
  }

  const handlePurgeAll = async () => {
    setError('')
    setSuccess('')
    setConfirmAllOpen(false)
    setPurgingAll(true)
    const n = Math.max(1, folders.length)
    progress.start(`Eliminando ${n} carpeta(s)... espera, no cierres la página`, Math.max(25000, n * 8000))
    try {
      const res = await manifiestosService.purgeAllFolders()
      if (!res?.success) throw new Error(res?.error || 'No se pudo eliminar todo')
      progress.finish('Limpieza completada')
      setSuccess(`Se eliminaron ${res.folders?.length || 0} carpeta(s).`)
      handleSelect('')
      setPdfs([])
      await loadList()
    } catch (err) {
      progress.reset()
      setError(err?.response?.data?.error || err?.message || 'No se pudo eliminar todas las carpetas')
    } finally {
      setPurgingAll(false)
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Carpetas procesadas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Elige una carpeta para ver su contenido, o descargar el Excel y los PDFs.
          Para limpiar data huérfana usa Eliminar carpeta / Eliminar todas (puede tardar unos segundos).
        </p>
      </header>
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">{success}</div>}
      <FolderPicker
        folders={folders}
        selected={selected}
        loading={loading && folders.length === 0}
        downloadingExcel={downloadingExcel}
        downloadingZip={downloadingZip}
        onSelect={handleSelect}
        onDownloadExcel={handleDownloadExcel}
        onDownloadZip={handleDownloadZip}
        onRenamePdfs={() => setShowRename(true)}
        onRefresh={loadList}
        tipos={tipos}
        loadingTipos={loadingTipos}
        selectedTipoId={selectedTipoId}
        savingTipo={savingTipo}
        onChangeTipo={handleChangeTipo}
        progress={progress}
        deleting={deleting}
        purgingAll={purgingAll}
        confirmOneOpen={confirmOneOpen}
        confirmAllOpen={confirmAllOpen}
        onAskDeleteOne={() => { setConfirmAllOpen(false); setConfirmOneOpen(true) }}
        onAskPurgeAll={() => { setConfirmOneOpen(false); setConfirmAllOpen(true) }}
        onCloseConfirm={() => { setConfirmOneOpen(false); setConfirmAllOpen(false) }}
        onConfirmDeleteOne={handleDeleteFolder}
        onConfirmPurgeAll={handlePurgeAll}
      />
      {selected ? (
        <FolderContents
          folderName={selected}
          pdfs={pdfs}
          loading={loading}
          onRefresh={() => loadFolder(selected)}
          tableRefresh={tableRefresh}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Selecciona una carpeta para ver sus PDFs y manifiestos.
        </div>
      )}
      <BulkRenamePDFs
        folderName={selected}
        isOpen={showRename && Boolean(selected)}
        onClose={() => setShowRename(false)}
        onSuccess={() => {
          setShowRename(false)
          loadFolder(selected)
          loadList()
        }}
      />
    </div>
  )
}

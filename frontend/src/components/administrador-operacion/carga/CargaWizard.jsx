import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { manifiestosService } from '../../../services/manifiestosService'
import { tiposManifiestoService } from '../../../services/tiposManifiestoService'
import { ROUTES } from '../../../config/constants'
import useTiposManifiesto from '../../../hooks/useTiposManifiesto'
import ProcessingResults from '../../operaciones/ProcessingResults/ProcessingResults'
import BulkRenamePDFs from '../../operaciones/BulkRenamePDFs/BulkRenamePDFs'
import TipoSelect from '../tipos/TipoSelect'
import ResultActions from '../resultados/ResultActions'
import WizardSteps from './WizardSteps'
import CargaModeToggle from './CargaModeToggle'
import CargaFilePickers from './CargaFilePickers'
import ProcessProgress from '../../common/ProcessProgress/ProcessProgress'
import useProcessProgress from '../../../hooks/useProcessProgress'

function sanitizeFolderName(raw) {
  return (raw || '').trim().replace(/\.\./g, '').replace(/[/\\]/g, '')
}

export default function CargaWizard() {
  const [step, setStep] = useState(1)
  const [folders, setFolders] = useState([])
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [folderName, setFolderName] = useState('')
  const [mode, setMode] = useState('nueva')
  const [files, setFiles] = useState([])
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [tipoId, setTipoId] = useState('')
  const [showRename, setShowRename] = useState(false)
  const { tipos, loading: loadingTipos } = useTiposManifiesto(true)
  const progress = useProcessProgress()

  const loadFolders = async () => {
    try {
      setLoadingFolders(true)
      const res = await manifiestosService.getOverview()
      if (res?.success) setFolders(res.data?.folders || [])
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar las carpetas')
    } finally {
      setLoadingFolders(false)
    }
  }

  useEffect(() => {
    loadFolders()
  }, [])

  useEffect(() => {
    if (mode !== 'existente') return
    const folder = folders.find((f) => f.name === folderName)
    setTipoId(folder?.tipo_id || '')
  }, [mode, folderName, folders])

  const collectPdfs = (selected) => {
    const pdfs = selected.filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    setFiles(pdfs)
    setError(pdfs.length !== selected.length ? `Se omitieron ${selected.length - pdfs.length} archivo(s) que no son PDF.` : '')
    if (pdfs.length > 0 && pdfs[0].webkitRelativePath) {
      const parts = pdfs[0].webkitRelativePath.split('/')
      if (parts.length > 1) {
        setFolderName(sanitizeFolderName(parts[0]))
      }
    }
  }

  const handleSubmit = async () => {
    const name = sanitizeFolderName(folderName)
    if (!name) {
      setError('Elige o escribe un nombre de carpeta.')
      return
    }
    if (mode === 'nueva' && files.length === 0) {
      setError('Selecciona al menos un PDF.')
      return
    }
    if (mode === 'existente' && files.length === 0 && !folders.some((f) => f.name === name)) {
      setError('Selecciona una carpeta existente o sube PDFs.')
      return
    }

    setWorking(true)
    setError('')
    try {
      if (files.length > 0) {
        progress.start(`Subiendo 1 de ${files.length}...`, files.length * 4000)
        await manifiestosService.uploadFolder(name, files, {
          onProgress: ({ current, total, percent }) => {
            progress.update(Math.round(percent * 0.55), `Subiendo ${current} de ${total}...`)
          },
        })
      }
      if (tipoId) {
        await tiposManifiestoService.setFolderTipo(name, tipoId, false)
      }
      progress.start('Procesando manifiestos...', Math.max(25000, (files.length || 12) * 2500))
      const res = await manifiestosService.processFolder(name, tipoId)
      if (!res?.success) {
        progress.reset()
        setError(res?.error || res?.message || 'No se pudo procesar la carpeta.')
        return
      }
      progress.finish('Procesado')
      setResult({ ...res.data, folderName: name })
      setStep(2)
    } catch (err) {
      progress.reset()
      setError(err?.message || err?.response?.data?.error || 'Error al subir o procesar la carpeta.')
    } finally {
      setWorking(false)
    }
  }

  const reset = () => {
    setStep(1)
    setFolderName('')
    setMode('nueva')
    setTipoId('')
    setFiles([])
    setError('')
    setResult(null)
    setShowRename(false)
    loadFolders()
  }

  const canSubmit =
    sanitizeFolderName(folderName) &&
    (files.length > 0 || mode === 'existente') &&
    !working

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 py-4 sm:px-6">
        <WizardSteps current={step} />
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Origen
              </h2>
              <CargaModeToggle mode={mode} onChange={setMode} />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {mode === 'nueva' ? 'Nombre de la carpeta' : 'Carpeta'}
                </label>
                {mode === 'nueva' ? (
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Ej. 26-08-2026"
                  />
                ) : (
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    disabled={loadingFolders}
                  >
                    <option value="">Selecciona una carpeta...</option>
                    {folders.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name} ({f.pdf_count} PDFs){f.tipo_nombre ? ` — ${f.tipo_nombre}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tipo de manifiesto</label>
                <TipoSelect
                  value={tipoId}
                  onChange={setTipoId}
                  tipos={tipos}
                  loading={loadingTipos}
                  emptyLabel="Sin tipo"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
                />
                <p className="text-xs text-slate-500">
                  Se aplica a la carpeta y a los manifiestos procesados.{' '}
                  <Link to={ROUTES.ADMIN_OPERACION_TIPOS} className="font-medium text-slate-800 underline-offset-2 hover:underline">
                    Administrar tipos
                  </Link>
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Archivos
              </h2>
              <CargaFilePickers onFiles={collectPdfs} />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                {files.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/80">
                    {files.length} PDF listo{files.length === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Aún no hay archivos seleccionados.</span>
                )}
                {folderName ? (
                  <span className="text-xs text-slate-500">
                    Se procesará: <span className="font-medium text-slate-800">{sanitizeFolderName(folderName)}</span>
                  </span>
                ) : null}
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Sube los PDFs y luego se extraen los manifiestos automáticamente.
              </p>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {working
                  ? 'Subiendo y procesando...'
                  : files.length > 0
                    ? 'Subir y procesar'
                    : 'Procesar carpeta'}
              </button>
            </div>
            <ProcessProgress active={progress.active} percent={progress.percent} label={progress.label} />
          </div>
        )}

        {step === 2 && result && (
          <div className="space-y-6">
            <ResultActions
              folderName={result.folderName}
              onRename={() => setShowRename(true)}
            />
            <ProcessingResults data={result} folderName={result.folderName} />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={reset}
            >
              Procesar otra carpeta
            </button>
            <BulkRenamePDFs
              folderName={result.folderName}
              isOpen={showRename}
              onClose={() => setShowRename(false)}
              onSuccess={() => setShowRename(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

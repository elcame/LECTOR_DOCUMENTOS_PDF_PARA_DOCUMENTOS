import { useState } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import ProcessProgress from '../../common/ProcessProgress/ProcessProgress'
import useProcessProgress from '../../../hooks/useProcessProgress'

export default function ResultActions({ folderName, onRename }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const progress = useProcessProgress()
  const name = (folderName || '').trim()
  const disabled = !name || Boolean(busy)

  const run = async (key, action, startLabel, okMessage, estimatedMs) => {
    if (!name) return
    setError('')
    setSuccess('')
    setBusy(key)
    progress.start(startLabel, estimatedMs)
    try {
      await action(name, {
        onProgress: ({ percent }) => progress.update(Math.max(percent, 40), startLabel),
      })
      progress.finish('Listo')
      setSuccess(okMessage)
    } catch (err) {
      progress.reset()
      setError(err?.message || 'No se pudo completar la descarga.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-outline"
          disabled={disabled}
          onClick={() => run('zip', (n, opts) => manifiestosService.downloadFolderZip(n, opts), 'Preparando ZIP...', `Carpeta “${name}” descargada.`, 45000)}
        >
          {busy === 'zip' ? 'Descargando...' : 'Descargar carpeta'}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          disabled={disabled}
          onClick={() => run('excel', (n, opts) => manifiestosService.downloadExcel(n, opts), 'Generando Excel...', `Excel de “${name}” descargado.`, 20000)}
        >
          {busy === 'excel' ? 'Descargando...' : 'Descargar Excel'}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          disabled={!name}
          onClick={() => onRename?.(name)}
        >
          Renombrar PDFs
        </button>
      </div>
      <ProcessProgress active={progress.active} percent={progress.percent} label={progress.label} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}
    </div>
  )
}

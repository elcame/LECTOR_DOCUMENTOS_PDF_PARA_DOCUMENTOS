import { useEffect, useMemo, useState } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import Modal from '../../common/Modal/Modal'
import ProcessProgress from '../../common/ProcessProgress/ProcessProgress'
import useProcessProgress from '../../../hooks/useProcessProgress'
import { BUILTIN_RENAME_PATTERNS, RENAME_VARIABLES } from './builtinPatterns'
import {
  addCustomRenamePattern,
  getCustomRenamePatterns,
  removeCustomRenamePattern,
} from './customPatternsStorage'

const DEFAULT_PATTERN = '{load_id}_{remesa}'

export default function BulkRenamePDFs({ folderName, isOpen, onClose, onSuccess }) {
  const [pattern, setPattern] = useState(DEFAULT_PATTERN)
  const [customPatterns, setCustomPatterns] = useState([])
  const [renaming, setRenaming] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [result, setResult] = useState(null)
  const progress = useProcessProgress()

  useEffect(() => {
    if (!isOpen) return
    setCustomPatterns(getCustomRenamePatterns())
    setError('')
    setSuccess('')
    setResult(null)
    setRenaming(false)
    progress.reset()
  }, [isOpen])

  const builtinValues = useMemo(() => new Set(BUILTIN_RENAME_PATTERNS.map((p) => p.value)), [])
  const customValues = useMemo(() => new Set(customPatterns.map((p) => p.value)), [customPatterns])
  const canSavePattern = Boolean(pattern.trim()) && !builtinValues.has(pattern.trim()) && !customValues.has(pattern.trim())
  const canRemovePattern = customValues.has(pattern)

  const handleSavePattern = () => {
    const next = addCustomRenamePattern(pattern)
    setCustomPatterns(next)
    setError('')
    setSuccess('Patrón guardado. Ya aparece en el selector.')
  }

  const handleRemovePattern = () => {
    const next = removeCustomRenamePattern(pattern)
    setCustomPatterns(next)
    setPattern(DEFAULT_PATTERN)
    setSuccess('Patrón eliminado del selector.')
  }

  const handleRename = async () => {
    const value = pattern.trim()
    if (!value) {
      setError('Escribe o elige un patrón de renombrado.')
      return
    }
    setRenaming(true)
    setError('')
    setSuccess('')
    setResult(null)
    progress.start('Renombrando PDFs...', 25000)
    try {
      const response = await manifiestosService.bulkRenamePDFs(folderName, value)
      if (response.success) {
        if (canSavePattern) setCustomPatterns(addCustomRenamePattern(value))
        progress.finish('Renombrado')
        setResult(response.data)
      } else {
        progress.reset()
        setError(response.error || 'Error al renombrar archivos')
      }
    } catch (err) {
      progress.reset()
      setError(err?.message || 'Error al renombrar archivos')
    } finally {
      setRenaming(false)
    }
  }

  const startFresh = () => {
    setResult(null)
    setError('')
    setSuccess('')
    setRenaming(false)
    progress.reset()
  }

  const handleClose = () => {
    const hadResults = result !== null
    startFresh()
    onClose()
    if (hadResults && onSuccess) {
      onSuccess()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Renombrar PDFs · ${folderName || ''}`} size="lg">
      <div className="px-6 py-5 space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Solo se renombran PDFs con manifiesto procesado. Si el nombre ya existe, se omite.
        </div>

        <div>
          <label htmlFor="rename-pattern-select" className="block text-sm font-medium text-slate-700 mb-1">
            Patrón de renombrado
          </label>
          <select
            id="rename-pattern-select"
            name="rename-pattern"
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value)
              setSuccess('')
            }}
            disabled={renaming}
            className="input w-full"
          >
            <optgroup label="Predeterminados">
              {BUILTIN_RENAME_PATTERNS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} — {p.example}
                </option>
              ))}
            </optgroup>
            {customPatterns.length > 0 && (
              <optgroup label="Guardados">
                {customPatterns.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            )}
            {!builtinValues.has(pattern) && !customValues.has(pattern) && pattern.trim() && (
              <optgroup label="Actual">
                <option value={pattern}>Sin guardar — {pattern}</option>
              </optgroup>
            )}
          </select>
        </div>

        <div>
          <label htmlFor="rename-pattern-custom" className="block text-sm font-medium text-slate-700 mb-1">
            Patrón personalizado
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="rename-pattern-custom"
              name="rename-pattern-custom"
              type="text"
              value={pattern}
              onChange={(e) => {
                setPattern(e.target.value)
                setSuccess('')
              }}
              disabled={renaming}
              placeholder="{placa}_{load_id}_{remesa}"
              className="input w-full font-mono text-sm"
            />
            <button
              type="button"
              className="btn btn-outline btn-sm whitespace-nowrap"
              disabled={renaming || !canSavePattern}
              onClick={handleSavePattern}
            >
              Guardar patrón
            </button>
          </div>
          {canRemovePattern && (
            <button
              type="button"
              className="mt-2 text-xs text-slate-500 hover:text-red-700"
              onClick={handleRemovePattern}
              disabled={renaming}
            >
              Quitar este patrón guardado
            </button>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {RENAME_VARIABLES.map((variable) => (
              <button
                key={variable}
                type="button"
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
                disabled={renaming}
                onClick={() => {
                  setPattern((prev) => {
                    const current = (prev || '').trim()
                    if (!current) return variable
                    if (current.endsWith('_')) return `${current}${variable}`
                    return `${current}_${variable}`
                  })
                }}
              >
                {variable}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Guárdalo para que vuelva a salir en el selector la próxima vez.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}
        {success && !result && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">{success}</div>
        )}

        <ProcessProgress active={progress.active} percent={progress.percent} label={progress.label} />

        {result && (
          <div className="space-y-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
              <p className="font-medium text-emerald-900">{result.message}</p>
              <p className="mt-1">Renombrados: {result.renamed_count} de {result.total_count}</p>
            </div>
            {result.renamed_files?.length > 0 && (
              <div className="rounded-xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Antes</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Después</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.renamed_files.map((file, index) => (
                      <tr key={`${file.old_name}-${index}`}>
                        <td className="px-3 py-2 text-slate-500 break-all">{file.old_name}</td>
                        <td className="px-3 py-2 text-slate-800 font-medium break-all">{file.new_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {result.errors?.length > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {result.errors.map((err, index) => (
                  <p key={index}>{err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button type="button" onClick={handleClose} disabled={renaming} className="btn btn-outline btn-sm">
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
          {result && (
            <button type="button" onClick={startFresh} className="btn btn-primary btn-sm">
              Renombrar de nuevo
            </button>
          )}
          {!result && (
            <button
              type="button"
              onClick={handleRename}
              disabled={renaming || !pattern.trim()}
              className="btn btn-primary btn-sm"
            >
              {renaming ? 'Renombrando...' : 'Renombrar archivos'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

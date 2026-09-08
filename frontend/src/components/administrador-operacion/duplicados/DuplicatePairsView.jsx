import { useState } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import { groupDuplicatePairs } from './groupDuplicatePairs'
import DuplicateResolveActions from './DuplicateResolveActions'

function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    orange: 'bg-orange-100 text-orange-800',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

function dupKey(pairKey, archivo) {
  return `${pairKey}::${archivo}`
}

export default function DuplicatePairsView({ data, folderName }) {
  const [resolvingKey, setResolvingKey] = useState('')
  const [resolved, setResolved] = useState({})
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  if (!data) return null

  const pairs = groupDuplicatePairs({
    archivosDuplicados: data.archivos_duplicados || [],
    duplicadosFirebase: data.manifiestos_duplicados_firebase || [],
  })

  if (pairs.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        No se detectaron duplicados
      </div>
    )
  }

  const handleResolve = async (pair, dup, action) => {
    const key = dupKey(pair.key, dup.archivo)
    setError('')
    setInfo('')
    setResolvingKey(key)
    try {
      const res = await manifiestosService.resolveDuplicate({
        action,
        folder_name: folderName,
        duplicate_archivo: dup.archivo,
        original_archivo: pair.original?.archivo || dup.archivo_original || '',
        original_folder: pair.original?.folder || dup.folder_original || folderName,
        load_id: dup.load_id || pair.original?.load_id,
        remesa: dup.remesa || pair.original?.remesa,
        source: dup.source,
      })
      if (!res?.success) throw new Error(res?.error || 'No se pudo aplicar la decisión')
      setResolved((prev) => ({ ...prev, [key]: action }))
      setInfo(res.message || 'Decisión aplicada')
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Error al resolver el duplicado')
    } finally {
      setResolvingKey('')
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {pairs.length} grupo(s) de duplicados en{folderName ? ` “${folderName}”` : ' este procesamiento'}.
        Elige por cada copia: conservar el original, esta copia, o ambas si pueden ser distintas.
      </p>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}
      {info && !error && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{info}</div>
      )}
      {pairs.map((pair) => (
        <div key={pair.key} className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40">
          <div className="border-b border-amber-100 px-4 py-2 text-xs font-medium text-amber-800">
            {pair.identificador}
          </div>
          <div className="grid grid-cols-1 divide-y divide-amber-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="bg-white p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Original</div>
              {pair.original ? (
                <div>
                  <div className="break-all text-sm font-medium text-slate-900">{pair.original.archivo}</div>
                  {pair.original.folder && (
                    <div className="mt-1 text-xs text-slate-500">Carpeta: {pair.original.folder}</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-400">No se identificó el archivo original</div>
              )}
            </div>
            <div className="bg-white p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">Duplicados</div>
              <ul className="space-y-4">
                {pair.duplicates.map((dup, idx) => {
                  const key = dupKey(pair.key, dup.archivo)
                  return (
                    <li key={`${dup.archivo}-${idx}`} className="text-sm">
                      <div className="break-all font-medium text-slate-900">{dup.archivo}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge tone={dup.source === 'firebase' ? 'blue' : 'orange'}>
                          {dup.source === 'firebase' ? 'Ya existía' : 'En este lote'}
                        </Badge>
                        {dup.load_id && dup.load_id !== 'No encontrado' && <Badge tone="blue">{dup.load_id}</Badge>}
                        {dup.remesa && dup.remesa !== 'No encontrada' && <Badge>{dup.remesa}</Badge>}
                      </div>
                      {folderName ? (
                        <DuplicateResolveActions
                          resolving={resolvingKey === key}
                          resolvedAction={resolved[key] || null}
                          disabled={Boolean(resolvingKey) && resolvingKey !== key}
                          onResolve={(action) => handleResolve(pair, dup, action)}
                        />
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

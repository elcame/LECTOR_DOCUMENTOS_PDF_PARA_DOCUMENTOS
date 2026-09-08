import { useEffect, useMemo, useState } from 'react'
import PiezaPanel from '../../piezas/PiezaPanel'
import PiezasDrawerTab from './PiezasDrawerTab'
import PiezasGroupList from './PiezasGroupList'
import { groupPiezas } from './groupPiezas'

export default function PiezasDrawer({
  open,
  onToggle,
  onClose,
  catalog,
  selectedId,
  colors,
  onSelect,
  activa,
  history,
  saving,
  error,
  onPlace,
  onChange,
}) {
  const [query, setQuery] = useState('')
  const groups = useMemo(() => groupPiezas(catalog, query), [catalog, query])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <PiezasDrawerTab open={open} onClick={onToggle} />
      <aside
        id="piezas-drawer"
        aria-hidden={!open}
        className={`absolute inset-y-0 right-0 z-20 flex w-80 max-w-[calc(100%-2.75rem)] flex-col border-l border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Inventario</p>
            <h2 className="text-sm font-semibold text-slate-50">Piezas de la mula</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
          >
            Cerrar
          </button>
        </div>

        <div className="border-b border-white/10 px-3 py-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pieza…"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-400/50"
          />
          <p className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1"><i className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> reciente</span>
            <span className="inline-flex items-center gap-1"><i className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> con tiempo</span>
            <span className="inline-flex items-center gap-1"><i className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" /> lleva mucho</span>
          </p>
        </div>

        {selectedId && (
          <div className="max-h-[42%] overflow-y-auto border-b border-white/10 p-3">
            <PiezaPanel
              variant="hud"
              positionId={selectedId}
              catalog={catalog}
              activa={activa}
              history={history}
              saving={saving}
              error={error}
              onPlace={onPlace}
              onChange={onChange}
            />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {groups.length === 0 ? (
            <p className="px-1 text-xs text-slate-400">No hay piezas con ese nombre.</p>
          ) : (
            <PiezasGroupList
              groups={groups}
              selectedId={selectedId}
              colors={colors}
              onSelect={onSelect}
            />
          )}
        </div>
      </aside>
    </>
  )
}

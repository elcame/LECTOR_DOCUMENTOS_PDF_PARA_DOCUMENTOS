import { useEffect, useMemo, useState } from 'react'
import VehiculosMenuTab from './VehiculosMenuTab'
import { normalizePaintColor } from '../../tractomula-3d/paint/paintColor'

export default function VehiculosMenu({
  open,
  onToggle,
  onClose,
  vehiculos = [],
  currentId,
  onSelect,
}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return vehiculos
    return vehiculos.filter((car) => {
      const placa = String(car.placa || '').toLowerCase()
      const modelo = String(car.modelo || '').toLowerCase()
      return placa.includes(q) || modelo.includes(q)
    })
  }, [vehiculos, query])

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
      <VehiculosMenuTab open={open} onClick={onToggle} />
      <aside
        id="vehiculos-drawer"
        aria-hidden={!open}
        className={`absolute inset-y-0 left-0 z-40 flex w-72 max-w-[calc(100%-2.75rem)] flex-col border-r border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Flota</p>
            <h2 className="text-sm font-semibold text-slate-50">Vehículos</h2>
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
            placeholder="Buscar placa…"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-400/50"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-xs text-slate-400">No hay vehículos con esa placa.</p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((car) => {
                const active = currentId === car.id
                const paint = normalizePaintColor(car.paint_color)
                return (
                  <li key={car.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(car.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-200 transition ${
                        active
                          ? 'bg-white/15 text-slate-50 shadow-[inset_2px_0_0_#38bdf8]'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <span
                        className={`h-4 w-4 shrink-0 rounded-full border ${paint ? 'border-white/30' : 'border-dashed border-white/40 bg-white/5'}`}
                        style={paint ? { background: paint } : undefined}
                        aria-hidden
                      />
                      <span className="min-w-0 font-semibold tracking-wide">
                        {car.placa || 'Sin placa'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}

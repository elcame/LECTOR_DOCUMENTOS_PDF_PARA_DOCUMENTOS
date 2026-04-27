import { useEffect, useMemo, useState } from 'react'
import { trailersService } from '../../../services/trailersService'

import TrailerPlacas from './sections/TrailerPlacas'
import TrailerMantenimientos from './sections/TrailerMantenimientos'
import TrailerIngresos from './sections/TrailerIngresos'
import TrailerRepuestos from './sections/TrailerRepuestos'
import TrailerHistorial from './sections/TrailerHistorial'
import TrailerGananciasGastos from './sections/TrailerGananciasGastos'
import TrailerLlantas from './sections/TrailerLlantas'
import TrailerInventarioLlantas from './sections/TrailerInventarioLlantas'
import TrailerProveedores from './sections/TrailerProveedores'

const SECTIONS = {
  PLACAS: 'placas',
  MANTENIMIENTOS: 'mantenimientos',
  INGRESOS: 'ingresos',
  REPUESTOS: 'repuestos',
  HISTORIAL: 'historial',
  GANANCIAS_GASTOS: 'ganancias_gastos',
  LLANTAS: 'llantas',
  INVENTARIO_LLANTAS: 'inventario_llantas',
  PROVEEDORES: 'proveedores',
}

export default function TrailerAdminSection() {
  const [active, setActive] = useState(SECTIONS.PLACAS)
  const [trailers, setTrailers] = useState([])
  const [selectedTrailerId, setSelectedTrailerId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const nav = useMemo(
    () => [
      { id: SECTIONS.PLACAS, label: 'Placa del trailer', icon: '🪪' },
      { id: SECTIONS.MANTENIMIENTOS, label: 'Programar mantenimientos', icon: '🛠️' },
      { id: SECTIONS.INGRESOS, label: 'Ingresar ingresos', icon: '💵' },
      { id: SECTIONS.REPUESTOS, label: 'Repuestos', icon: '🔩' },
      {
        id: SECTIONS.LLANTAS,
        label: 'Llantas',
        icon: (
          <svg
            className="w-4 h-4 text-black"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2.2a7.8 7.8 0 110 15.6 7.8 7.8 0 010-15.6zm0 2.6a5.2 5.2 0 100 10.4 5.2 5.2 0 000-10.4zm0 2.2a3 3 0 110 6 3 3 0 010-6z" />
          </svg>
        ),
      },
      { id: SECTIONS.INVENTARIO_LLANTAS, label: 'Inventario de llantas', icon: '📦' },
      { id: SECTIONS.PROVEEDORES, label: 'Proveedores', icon: '🏪' },
      { id: SECTIONS.HISTORIAL, label: 'Historial', icon: '🗂️' },
      { id: SECTIONS.GANANCIAS_GASTOS, label: 'Ganancias - Gastos', icon: '📈' },
    ],
    []
  )

  const loadTrailers = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await trailersService.list()
      if (res?.success) {
        const list = res.data || []
        setTrailers(list)
        if (!selectedTrailerId && list.length > 0) setSelectedTrailerId(list[0].id)
      } else {
        setError(res?.error || 'Error al cargar trailers')
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al cargar trailers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrailers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-900">Trailer</h2>
        <p className="text-sm text-slate-500 mt-1">
          Administra placas, mantenimientos, ingresos, repuestos, historial y reportes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 p-3">
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Trailer activo
              </div>
              <button
                type="button"
                onClick={loadTrailers}
                className="text-xs text-slate-600 hover:text-slate-900 underline"
              >
                Actualizar
              </button>
            </div>
            <select
              className="input w-full"
              value={selectedTrailerId}
              onChange={(e) => setSelectedTrailerId(e.target.value)}
              disabled={loading}
            >
              <option value="">{loading ? 'Cargando...' : 'Selecciona...'}</option>
              {trailers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.plate}
                </option>
              ))}
            </select>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                {error}
              </div>
            )}
          </div>

          <nav className="space-y-2">
            {nav.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setActive(it.id)}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active === it.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">{it.icon}</span>
                <span className="truncate">{it.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="lg:col-span-8 xl:col-span-9 p-6">
          {active === SECTIONS.PLACAS && (
            <TrailerPlacas
              trailers={trailers}
              selectedTrailerId={selectedTrailerId}
              onSelectTrailer={setSelectedTrailerId}
              onCreated={loadTrailers}
            />
          )}
          {active === SECTIONS.MANTENIMIENTOS && (
            <TrailerMantenimientos trailerId={selectedTrailerId} />
          )}
          {active === SECTIONS.INGRESOS && (
            <TrailerIngresos trailerId={selectedTrailerId} />
          )}
          {active === SECTIONS.REPUESTOS && (
            <TrailerRepuestos trailerId={selectedTrailerId} />
          )}
          {active === SECTIONS.LLANTAS && (
            <TrailerLlantas trailerId={selectedTrailerId} />
          )}
          {active === SECTIONS.INVENTARIO_LLANTAS && (
            <TrailerInventarioLlantas trailerId={selectedTrailerId} />
          )}
          {active === SECTIONS.PROVEEDORES && (
            <TrailerProveedores />
          )}
          {active === SECTIONS.HISTORIAL && (
            <TrailerHistorial trailerId={selectedTrailerId} />
          )}
          {active === SECTIONS.GANANCIAS_GASTOS && (
            <TrailerGananciasGastos trailerId={selectedTrailerId} />
          )}
        </section>
      </div>
    </div>
  )
}


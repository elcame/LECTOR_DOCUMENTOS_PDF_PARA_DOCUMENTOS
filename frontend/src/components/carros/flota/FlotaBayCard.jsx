import { Link } from 'react-router-dom'
import { ROUTES } from '../../../config/constants'
import { normalizePaintColor } from '../tractomula-3d/paint/paintColor'

export default function FlotaBayCard({ car }) {
  const paint = normalizePaintColor(car.paint_color)

  return (
    <Link
      to={ROUTES.CARRO_ESTADO(car.id)}
      className="group relative flex min-h-[168px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.07]"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 opacity-90 transition group-hover:opacity-100"
        style={{ background: paint || 'rgba(148,163,184,0.35)' }}
      />
      <div className="flex items-start justify-between gap-3">
        <span
          className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full border ${
            paint ? 'border-white/25 shadow-[0_0_12px_rgba(255,255,255,0.12)]' : 'border-dashed border-white/30 bg-white/5'
          }`}
          style={paint ? { background: paint } : undefined}
          title={paint ? 'Color guardado' : 'Sin color'}
        />
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 opacity-0 transition group-hover:opacity-100">
          Abrir
        </span>
      </div>
      <div className="mt-auto pt-8">
        <div className="text-2xl font-semibold tracking-[0.12em] text-slate-50">
          {car.placa || 'Sin placa'}
        </div>
        <div className="mt-2 text-xs font-medium text-sky-400/90 transition group-hover:text-sky-300">
          Ver estado 3D →
        </div>
      </div>
    </Link>
  )
}

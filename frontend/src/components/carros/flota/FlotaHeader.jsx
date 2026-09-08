export default function FlotaHeader({ count }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.08] pb-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Hangar</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">Flota</h1>
        <p className="mt-1.5 max-w-md text-sm text-slate-400">
          Elige una tractomula para ver su estado en 3D.
        </p>
      </div>
      <p className="text-sm tabular-nums text-slate-400">
        <span className="text-lg font-semibold text-slate-100">{count}</span>
        {' '}{count === 1 ? 'vehículo' : 'vehículos'}
      </p>
    </header>
  )
}

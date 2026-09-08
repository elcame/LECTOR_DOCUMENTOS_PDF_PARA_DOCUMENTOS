import FlotaBayCard from './FlotaBayCard'

export default function FlotaBayGrid({ carros = [] }) {
  if (!carros.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-14 text-center text-sm text-slate-400">
        Aún no hay vehículos. Ábrelos en Administrar → Carros.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {carros.map((car) => (
        <FlotaBayCard key={car.id} car={car} />
      ))}
    </div>
  )
}

export default function DailyProgress({ stats, loading }) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-sm text-slate-500">Cargando progreso...</div>
      </div>
    )
  }
  if (!stats) return null

  const { planned = 0, completed = 0, completion_rate = 0, date } = stats

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Progreso del día {date ? `(${date})` : ''}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <StatBox label="Planificadas" value={planned} />
          <StatBox label="Completadas" value={completed} />
          <StatBox label="Cumplimiento" value={`${completion_rate}%`} highlight />
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(100, completion_rate)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, highlight }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${highlight ? 'text-blue-600' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}


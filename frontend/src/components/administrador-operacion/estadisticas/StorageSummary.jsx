const LIMIT_GB = 5

export default function StorageSummary({ storage }) {
  const usedMb = storage?.total_size_mb ?? 0
  const usedBytes = storage?.total_size_bytes ?? usedMb * 1024 * 1024
  const limitBytes = LIMIT_GB * 1024 * 1024 * 1024
  const pct = Math.min(100, (usedBytes / limitBytes) * 100)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Almacenamiento</h3>
      <p className="text-xs text-slate-500 mt-1">Uso aproximado en Firebase Storage</p>
      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }} />
      </div>
      <div className="mt-2 text-sm text-slate-600">
        {usedMb.toFixed(2)} MB de {LIMIT_GB}.00 GB · {storage?.total_files ?? 0} archivo(s)
      </div>
    </div>
  )
}

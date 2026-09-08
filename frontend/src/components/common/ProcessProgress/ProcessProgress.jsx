export default function ProcessProgress({ active, percent = 0, label = '', tone = 'light' }) {
  if (!active) return null
  const safe = Math.max(0, Math.min(100, Number(percent) || 0))
  const dark = tone === 'dark'

  return (
    <div
      className={`mt-3 rounded-xl px-3 py-2.5 ${
        dark
          ? 'border border-white/10 bg-white/[0.04]'
          : 'border border-slate-200 bg-slate-50'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className={`truncate font-medium ${dark ? 'text-slate-200' : 'text-slate-700'}`}>
          {label || 'Procesando...'}
        </span>
        <span className={`tabular-nums ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{safe}%</span>
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${dark ? 'bg-white/10' : 'bg-slate-200'}`}>
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${
            dark ? 'bg-sky-400' : 'bg-blue-600'
          }`}
          style={{ width: `${safe}%` }}
        />
      </div>
      {safe < 100 ? (
        <p className={`mt-1.5 text-[11px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Esto puede tardar: la barra avanza mientras espera la respuesta del servidor.
        </p>
      ) : null}
    </div>
  )
}

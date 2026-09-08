const ACTIONS = [
  {
    id: 'keep_original',
    label: 'Conservar original',
    hint: 'Se elimina el PDF duplicado',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
  },
  {
    id: 'keep_duplicate',
    label: 'Conservar este',
    hint: 'El duplicado queda como el activo',
    className: 'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100',
  },
  {
    id: 'keep_both',
    label: 'Conservar ambos',
    hint: 'Si pueden ser distintos, guarda los dos',
    className: 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100',
  },
]

export default function DuplicateResolveActions({
  onResolve,
  resolving = false,
  resolvedAction = null,
  disabled = false,
}) {
  if (resolvedAction) {
    const done = ACTIONS.find((a) => a.id === resolvedAction)
    return (
      <p className="mt-2 text-xs font-medium text-emerald-700">
        Decisión aplicada: {done?.label || resolvedAction}
      </p>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">¿Qué quieres hacer?</p>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            title={action.hint}
            disabled={disabled || resolving}
            onClick={() => onResolve(action.id)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${action.className}`}
          >
            {resolving ? 'Aplicando...' : action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

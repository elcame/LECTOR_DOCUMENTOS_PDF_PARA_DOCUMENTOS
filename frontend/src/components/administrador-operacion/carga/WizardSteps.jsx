const STEPS = [
  { id: 1, label: 'Subir carpeta' },
  { id: 2, label: 'Resultados' },
]

export default function WizardSteps({ current }) {
  return (
    <ol className="mb-8 flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const active = current === step.id
        const done = step.id < current
        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition',
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400',
                ].join(' ')}
              >
                {done ? '✓' : step.id}
              </span>
              <span
                className={[
                  'truncate text-sm font-medium',
                  active ? 'text-slate-900' : done ? 'text-emerald-700' : 'text-slate-400',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 ? (
              <div
                className={`mx-3 h-px min-w-[2rem] flex-1 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`}
                aria-hidden
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

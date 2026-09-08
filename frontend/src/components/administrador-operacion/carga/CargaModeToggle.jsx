export default function CargaModeToggle({ mode, onChange }) {
  const options = [
    {
      id: 'nueva',
      title: 'Carpeta nueva',
      hint: 'Nombra la carpeta y sube los PDFs.',
    },
    {
      id: 'existente',
      title: 'Carpeta existente',
      hint: 'Agrega PDFs o reprocesa una carpeta ya cargada.',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((opt) => {
        const active = mode === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={[
              'rounded-2xl border px-4 py-4 text-left transition',
              active
                ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
            ].join(' ')}
          >
            <div className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-900'}`}>
              {opt.title}
            </div>
            <div className={`mt-1 text-xs leading-relaxed ${active ? 'text-slate-300' : 'text-slate-500'}`}>
              {opt.hint}
            </div>
          </button>
        )
      })}
    </div>
  )
}

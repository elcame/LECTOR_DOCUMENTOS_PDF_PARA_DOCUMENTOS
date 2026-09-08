export const PAINT_PRESETS = [
  { id: 'white', label: 'Blanco', hex: '#f4f6f8' },
  { id: 'red', label: 'Rojo', hex: '#b91c1c' },
  { id: 'blue', label: 'Azul', hex: '#1d4ed8' },
  { id: 'black', label: 'Negro', hex: '#111827' },
  { id: 'yellow', label: 'Amarillo', hex: '#eab308' },
  { id: 'green', label: 'Verde', hex: '#15803d' },
]

export default function PaintColorPicker({ value, onChange }) {
  return (
    <div className="rounded-xl bg-slate-900/80 px-3 py-2 text-slate-100 shadow">      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-300">Color de la mula</p>
      <div className="flex items-center gap-1.5">
        {PAINT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={preset.label}
            aria-label={preset.label}
            onClick={() => onChange(preset.hex)}
            className={`h-6 w-6 rounded-full border ${
              value.toLowerCase() === preset.hex.toLowerCase() ? 'border-sky-400 ring-2 ring-sky-400/60' : 'border-white/40'
            }`}
            style={{ background: preset.hex }}
          />
        ))}
        <label className="ml-1 flex h-6 w-6 cursor-pointer items-center overflow-hidden rounded-full border border-white/40" title="Elegir otro color">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-10 -translate-x-1 -translate-y-1 cursor-pointer border-0 p-0"
          />
        </label>
      </div>
    </div>
  )
}

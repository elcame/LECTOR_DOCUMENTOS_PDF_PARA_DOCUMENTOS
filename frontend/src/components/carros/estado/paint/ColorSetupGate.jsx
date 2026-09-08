import { PAINT_PRESETS } from '../../tractomula-3d/paint/PaintColorPicker'
import { DEFAULT_PAINT_COLOR } from '../../tractomula-3d/paint/paintColor'

export default function ColorSetupGate({ placa, value, onChange, onSave, saving }) {
  const color = value || DEFAULT_PAINT_COLOR

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-[2px] pointer-events-none sm:items-center">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/90 p-5 text-slate-100 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-50">Color de la tractomula</h2>
        <p className="mt-1 text-sm text-slate-300">
          {placa
            ? `Elige el color de ${placa}. Quedará guardado y se mostrará cada vez que abras este vehículo.`
            : 'Elige el color de esta tractomula. Quedará guardado y se mostrará cada vez que la abras.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {PAINT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              aria-label={preset.label}
              onClick={() => onChange(preset.hex)}
              className={`h-9 w-9 rounded-full border ${
                color.toLowerCase() === preset.hex.toLowerCase()
                  ? 'border-sky-400 ring-2 ring-sky-400/60'
                  : 'border-white/40'
              }`}
              style={{ background: preset.hex }}
            />
          ))}
          <label className="flex h-9 w-9 cursor-pointer items-center overflow-hidden rounded-full border border-white/40" title="Elegir otro color">
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="h-12 w-12 -translate-x-1 -translate-y-1 cursor-pointer border-0 p-0"
            />
          </label>
        </div>
        <button
          type="button"
          className="btn btn-primary mt-5 w-full"
          disabled={saving}
          onClick={() => onSave(color)}
        >
          {saving ? 'Guardando...' : 'Guardar color'}
        </button>
      </div>
    </div>
  )
}

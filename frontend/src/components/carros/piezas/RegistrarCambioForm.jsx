import { useState } from 'react'

import { HUD } from './hudStyles'

export default function RegistrarCambioForm({
  hasActive,
  saving,
  onSubmit,
  showLlantaFields = false,
  initialMarca = '',
  initialNumeracion = '',
  tone = 'page',
}) {
  const isHud = tone === 'hud'
  const labelClass = isHud ? HUD.label : 'mb-1 block text-xs font-medium text-slate-600'
  const inputClass = isHud ? HUD.input : 'input w-full'
  const [installedAt, setInstalledAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [kmInstalled, setKmInstalled] = useState('')
  const [marca, setMarca] = useState(initialMarca)
  const [numeracion, setNumeracion] = useState(initialNumeracion)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.({
      installed_at: installedAt,
      km_installed: kmInstalled,
      km_removed: kmInstalled,
      marca: marca.trim(),
      numeracion: numeracion.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" style={isHud ? { colorScheme: 'dark' } : undefined}>
      <div>
        <label className={labelClass}>Fecha</label>
        <input
          type="date"
          className={inputClass}
          value={installedAt}
          onChange={(e) => setInstalledAt(e.target.value)}
          required
        />
      </div>
      {showLlantaFields && (
        <>
          <div>
            <label className={labelClass}>Marca</label>
            <input
              type="text"
              className={inputClass}
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Ej. Michelin"
            />
          </div>
          <div>
            <label className={labelClass}>Numeración (opcional)</label>
            <input
              type="text"
              className={inputClass}
              value={numeracion}
              onChange={(e) => setNumeracion(e.target.value)}
              placeholder="Ej. 295/75R22.5"
            />
          </div>
        </>
      )}
      <div>
        <label className={labelClass}>Kilometraje (opcional)</label>
        <input
          type="number"
          min="0"
          className={inputClass}
          value={kmInstalled}
          onChange={(e) => setKmInstalled(e.target.value)}
          placeholder="Ej. 420000"
        />
      </div>
      <button type="submit" className="btn btn-primary btn-sm w-full" disabled={saving}>
        {saving ? 'Guardando...' : hasActive ? 'Registrar cambio' : 'Colocar pieza'}
      </button>
    </form>
  )
}

import { formatTiempo, piezaAgeStatus } from './piezaAge'
import { getPiezaLabel } from './piezasCatalog'
import RegistrarCambioForm from './RegistrarCambioForm'
import { HUD } from './hudStyles'

const STATUS_LABEL = {
  empty: 'Sin pieza',
  ok: 'Reciente',
  warn: 'Con tiempo',
  alert: 'Lleva mucho',
}

export default function LlantaModal({
  positionId,
  catalog = [],
  activa,
  saving,
  error,
  onPlace,
  onChange,
  onClose,
}) {
  const meta = catalog.find((p) => p.position_id === positionId)
  const status = piezaAgeStatus(activa?.installed_at)
  const hasActive = Boolean(activa)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/90 p-5 text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">{meta?.label || getPiezaLabel(positionId)}</h2>
            <p className={`mt-1 ${HUD.muted}`}>{STATUS_LABEL[status]}</p>
          </div>
          <button type="button" className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {error && <div className={`mb-3 ${HUD.error}`}>{error}</div>}

        {hasActive ? (
          <div className={`mb-4 ${HUD.body}`}>
            <p><span className="font-medium">Tiempo instalada:</span> {formatTiempo(activa.installed_at)}</p>
            <p><span className="font-medium">Fecha:</span> {activa.installed_at || '—'}</p>
            <p><span className="font-medium">Marca:</span> {activa.marca || '—'}</p>
            <p><span className="font-medium">Numeración:</span> {activa.numeracion || '—'}</p>
            <p><span className="font-medium">Km al instalar:</span> {activa.km_installed || '—'}</p>
          </div>
        ) : (
          <p className={`mb-4 ${HUD.muted}`}>Esta llanta no tiene registro. Coloca la primera.</p>
        )}

        <RegistrarCambioForm
          hasActive={hasActive}
          saving={saving}
          showLlantaFields
          tone="hud"
          initialMarca={activa?.marca || ''}
          initialNumeracion={activa?.numeracion || ''}
          onSubmit={hasActive ? onChange : onPlace}
        />
      </div>
    </div>
  )
}

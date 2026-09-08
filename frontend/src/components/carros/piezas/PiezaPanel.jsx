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

export default function PiezaPanel({
  positionId,
  catalog = [],
  activa,
  history = [],
  saving,
  error,
  onPlace,
  onChange,
  variant = 'page',
}) {
  const isHud = variant === 'hud'
  const shell = isHud ? HUD.panel : 'rounded-2xl border border-slate-200 bg-white p-5 space-y-4'

  if (!positionId) {
    return (
      <div className={isHud ? 'rounded-xl bg-white/5 px-3 py-4 text-xs text-slate-300' : 'rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500'}>
        Haz clic en una pieza del modelo o elige una de la lista.
      </div>
    )
  }

  const meta = catalog.find((p) => p.position_id === positionId)
  const status = piezaAgeStatus(activa?.installed_at)
  const hasActive = Boolean(activa)

  return (
    <div className={shell}>
      <header>
        <h2 className={isHud ? HUD.title : 'text-lg font-semibold text-slate-900'}>{meta?.label || getPiezaLabel(positionId)}</h2>
        <p className={`mt-1 ${isHud ? HUD.muted : 'text-xs text-slate-500'}`}>{STATUS_LABEL[status]}</p>
      </header>

      {error && (
        <div className={isHud ? HUD.error : 'rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm'}>{error}</div>
      )}

      {hasActive ? (
        <div className={isHud ? HUD.body : 'text-sm text-slate-700 space-y-1'}>
          <p><span className="font-medium">Tiempo:</span> {formatTiempo(activa.installed_at)}</p>
          <p><span className="font-medium">Instalada:</span> {activa.installed_at}</p>
          {activa.marca ? <p><span className="font-medium">Marca:</span> {activa.marca}</p> : null}
          {activa.numeracion ? <p><span className="font-medium">Numeración:</span> {activa.numeracion}</p> : null}
          <p><span className="font-medium">Km al instalar:</span> {activa.km_installed || '—'}</p>
        </div>
      ) : (
        <p className={isHud ? HUD.muted : 'text-sm text-slate-500'}>Esta posición está vacía. Coloca la primera pieza.</p>
      )}

      <RegistrarCambioForm
        hasActive={hasActive}
        saving={saving}
        tone={isHud ? 'hud' : 'page'}
        onSubmit={hasActive ? onChange : onPlace}
      />

      {history.length > 0 && (
        <div>
          <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${isHud ? 'text-slate-400' : 'text-slate-500'}`}>Historial</h3>
          <ul className={`space-y-2 overflow-y-auto ${isHud ? 'max-h-24' : 'max-h-48'}`}>
            {history.map((item) => (
              <li key={item.id} className={isHud ? HUD.history : 'text-xs text-slate-600 border-b border-slate-100 pb-2'}>
                {item.installed_at}
                {item.removed_at ? ` → ${item.removed_at}` : ' (actual)'}
                {item.km_installed ? ` · ${item.km_installed} km` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

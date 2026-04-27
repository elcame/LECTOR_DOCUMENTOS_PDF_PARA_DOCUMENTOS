import { useEffect, useMemo, useState } from 'react'
import { trailersService } from '../../../../services/trailersService'

// 3 ejes, llanta doble por lado (2 por lado)
const POSITIONS = [
  // Llanta de repuesto (arriba, acostada)
  { id: 'SPARE', label: 'Repuesto', x: 150, y: 38 },
  // Eje 1
  { id: 'L1A', label: 'Izq 1A', x: 58, y: 90 },
  { id: 'L1B', label: 'Izq 1B', x: 92, y: 90 },
  { id: 'R1A', label: 'Der 1A', x: 208, y: 90 },
  { id: 'R1B', label: 'Der 1B', x: 242, y: 90 },
  // Eje 2
  { id: 'L2A', label: 'Izq 2A', x: 58, y: 160 },
  { id: 'L2B', label: 'Izq 2B', x: 92, y: 160 },
  { id: 'R2A', label: 'Der 2A', x: 208, y: 160 },
  { id: 'R2B', label: 'Der 2B', x: 242, y: 160 },
  // Eje 3
  { id: 'L3A', label: 'Izq 3A', x: 58, y: 230 },
  { id: 'L3B', label: 'Izq 3B', x: 92, y: 230 },
  { id: 'R3A', label: 'Der 3A', x: 208, y: 230 },
  { id: 'R3B', label: 'Der 3B', x: 242, y: 230 },
]

export default function TrailerLlantas({ trailerId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tires, setTires] = useState([])
  const [activePos, setActivePos] = useState('L1A')
  const [tireItems, setTireItems] = useState([])
  const [selectedTireId, setSelectedTireId] = useState('')
  const [newTireLabel, setNewTireLabel] = useState('')

  const [saving, setSaving] = useState(false)
  const [installedAt, setInstalledAt] = useState('')
  const [saveError, setSaveError] = useState('')

  const tiresByPos = useMemo(() => {
    const map = new Map()
    for (const t of tires || []) {
      map.set(String(t.position_id || '').toUpperCase(), t)
    }
    return map
  }, [tires])

  const tireItemById = useMemo(() => {
    const map = new Map()
    for (const it of tireItems || []) {
      map.set(String(it.id), it)
    }
    return map
  }, [tireItems])

  const current = tiresByPos.get(activePos) || null
  const currentTireItem = current?.tire_id ? (tireItemById.get(String(current.tire_id)) || null) : null

  const load = async () => {
    if (!trailerId) return
    try {
      setLoading(true)
      setError('')
      const [resPos, resItems] = await Promise.all([
        trailersService.listTires(trailerId),
        trailersService.listTireItems(trailerId),
      ])
      if (resPos?.success) setTires(resPos.data || [])
      else setError(resPos?.error || 'Error al cargar posiciones de llantas')
      if (resItems?.success) setTireItems(resItems.data || [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al cargar llantas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailerId])

  useEffect(() => {
    setInstalledAt(current?.installed_at || '')
    setSaveError('')
    setSelectedTireId(current?.tire_id || '')
  }, [activePos, current?.installed_at, current?.tire_id])

  useEffect(() => {
    // Si se selecciona una llanta y no hay fecha, sugerir hoy
    if (selectedTireId && !(installedAt || '').trim()) {
      const today = new Date()
      const todayIso = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        .toISOString()
        .slice(0, 10)
      setInstalledAt(todayIso)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTireId])

  const rendimientoInfo = useMemo(() => {
    const d = (installedAt || '').trim()
    if (!d) return { days: null, text: '—' }
    const installed = new Date(`${d}T00:00:00`)
    if (Number.isNaN(installed.getTime())) return { days: null, text: '—' }
    const today = new Date()
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const diffMs = todayMid.getTime() - installed.getTime()
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
    const months = (days / 30.44)
    const monthsText = months >= 1 ? `${months.toFixed(1)} mes(es)` : null
    return { days, text: monthsText ? `${days} día(s) · ${monthsText}` : `${days} día(s)` }
  }, [installedAt])

  const handleSave = async () => {
    if (!trailerId) return
    try {
      setSaving(true)
      setSaveError('')
      const payload = {
        installed_at: installedAt || null,
        tire_id: selectedTireId || null,
      }
      const res = await trailersService.upsertTire(trailerId, activePos, payload)
      if (!res?.success) {
        setSaveError(res?.error || 'No se pudo guardar')
        return
      }
      await load()
    } catch (e) {
      setSaveError(e?.response?.data?.error || e?.message || 'Error al guardar llanta')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateNewTire = async () => {
    if (!trailerId) return
    try {
      setSaving(true)
      setSaveError('')
      const res = await trailersService.createTireItem(trailerId, { label: newTireLabel })
      if (!res?.success) {
        setSaveError(res?.error || 'No se pudo crear la llanta')
        return
      }
      const id = res?.data?.id
      setNewTireLabel('')
      if (id) setSelectedTireId(id)
      await load()
    } catch (e) {
      setSaveError(e?.response?.data?.error || e?.message || 'Error al crear llanta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Llantas</h3>
        <p className="text-sm text-slate-500 mt-1">
          Presiona una posición para ver fecha de instalación y rendimiento.
        </p>
      </div>

      {!trailerId ? (
        <div className="rounded-xl border border-amber-200 p-4 text-sm text-amber-700 bg-amber-50">
          Selecciona un trailer primero.
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 p-4 text-sm text-red-700 bg-red-50">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900 mb-3">Posiciones</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <svg viewBox="0 0 300 320" className="w-full h-auto" aria-label="Diagrama de llantas del trailer">
                <rect x="110" y="60" width="80" height="220" rx="14" fill="#e2e8f0" stroke="#cbd5e1" />
                <text x="150" y="84" textAnchor="middle" fontSize="11" fill="#475569">
                  TRAILER
                </text>

                {/* líneas de ejes */}
                <line x1="40" y1="90" x2="260" y2="90" stroke="#cbd5e1" strokeDasharray="4 4" />
                <line x1="40" y1="160" x2="260" y2="160" stroke="#cbd5e1" strokeDasharray="4 4" />
                <line x1="40" y1="230" x2="260" y2="230" stroke="#cbd5e1" strokeDasharray="4 4" />

                {/* helper para dibujar una llanta */}
                {(() => {
                  const Tire = ({ x, y, fill, selected, hasData, id }) => (
                    <g onClick={() => setActivePos(id)} style={{ cursor: 'pointer' }}>
                      {id === 'SPARE' ? (
                        <>
                          {/* llanta de repuesto: círculo (acostada) */}
                          <circle cx={x} cy={y + 2} r="18" fill="#0f172a" opacity="0.10" />
                          <circle cx={x} cy={y} r="18" fill={fill} opacity={selected ? 1 : 0.97} />
                          <circle
                            cx={x}
                            cy={y}
                            r="18"
                            fill="none"
                            stroke={selected ? '#e5e7eb' : hasData ? '#94a3b8' : '#64748b'}
                            strokeOpacity={selected ? 0.95 : 0.55}
                          />
                          <circle cx={x} cy={y} r="10" fill="none" stroke="#cbd5e1" strokeOpacity={selected ? 0.8 : 0.35} />
                          <circle cx={x} cy={y} r="5.5" fill="#111827" opacity="0.9" />
                          <circle cx={x} cy={y} r="5.5" fill="none" stroke="#94a3b8" strokeOpacity={selected ? 0.9 : 0.5} />
                          {/* tacos */}
                          {Array.from({ length: 8 }).map((_, i) => (
                            <rect
                              key={i}
                              x={x - 1.5}
                              y={y - 16 + i * 4}
                              width="3"
                              height="2"
                              rx="1"
                              fill="#ffffff"
                              opacity="0.10"
                            />
                          ))}
                          {hasData && !selected && (
                            <circle cx={x + 12} cy={y - 12} r="3" fill="#cbd5e1" stroke="#0f172a" strokeOpacity="0.25" />
                          )}
                          {selected && (
                            <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">
                              SP
                            </text>
                          )}
                        </>
                      ) : (
                        <>
                          {/* sombra suave */}
                          <rect x={x - 14} y={y - 22 + 2} width="28" height="44" rx="9" fill="#0f172a" opacity="0.10" />

                          {/* llanta (vista superior, rectangular redondeada) */}
                          <rect x={x - 14} y={y - 22} width="28" height="44" rx="9" fill={fill} opacity={selected ? 1 : 0.97} />
                          <rect
                            x={x - 14}
                            y={y - 22}
                            width="28"
                            height="44"
                            rx="9"
                            fill="none"
                            stroke={selected ? '#e5e7eb' : hasData ? '#94a3b8' : '#64748b'}
                            strokeOpacity={selected ? 0.95 : 0.55}
                          />

                          {/* borde interior */}
                          <rect
                            x={x - 9}
                            y={y - 15}
                            width="18"
                            height="30"
                            rx="7"
                            fill="none"
                            stroke="#cbd5e1"
                            strokeOpacity={selected ? 0.8 : 0.35}
                          />

                          {/* rin */}
                          <circle cx={x} cy={y} r="6.2" fill="#111827" opacity="0.9" />
                          <circle cx={x} cy={y} r="6.2" fill="none" stroke="#94a3b8" strokeOpacity={selected ? 0.9 : 0.5} />

                          {/* “tacos”/textura arriba */}
                          {Array.from({ length: 4 }).map((_, i) => (
                            <rect
                              key={i}
                              x={x - 12}
                              y={y - 18 + i * 9}
                              width="3.2"
                              height="6"
                              rx="1"
                              fill="#ffffff"
                              opacity="0.12"
                            />
                          ))}
                          {Array.from({ length: 4 }).map((_, i) => (
                            <rect
                              key={`b-${i}`}
                              x={x + 9}
                              y={y - 18 + i * 9}
                              width="3.2"
                              height="6"
                              rx="1"
                              fill="#ffffff"
                              opacity="0.10"
                            />
                          ))}

                          {/* brillo */}
                          <path
                            d={`M ${x - 6} ${y - 19} Q ${x - 13} ${y - 8} ${x - 12} ${y + 4}`}
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeOpacity="0.10"
                            fill="none"
                            strokeLinecap="round"
                          />

                          {/* indicador de datos */}
                          {hasData && !selected && (
                            <circle cx={x + 10} cy={y - 16} r="3" fill="#cbd5e1" stroke="#0f172a" strokeOpacity="0.25" />
                          )}
                          {/* etiqueta */}
                          {selected && (
                            <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">
                              {id}
                            </text>
                          )}
                        </>
                      )}
                    </g>
                  )
                  return (
                    <>
                      {POSITIONS.map((p) => {
                        const selected = p.id === activePos
                        const hasData = tiresByPos.has(p.id)
                        // Todas negras (el estado se indica con borde / puntito)
                        const fill = '#111827'
                        return (
                          <Tire
                            key={p.id}
                            x={p.x}
                            y={p.y}
                            fill={fill}
                            selected={selected}
                            hasData={hasData}
                            id={p.id}
                          />
                        )
                      })}
                    </>
                  )
                })()}
              </svg>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> con datos
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> sin datos
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> seleccionada
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Llanta {activePos}
                  {currentTireItem?.label ? (
                    <span className="font-normal text-slate-500"> · {currentTireItem.label}</span>
                  ) : null}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {loading ? 'Cargando…' : current ? 'Datos encontrados' : 'Sin datos registrados'}
                </div>
                {current?.tire_id && (
                  <div className="mt-1 text-[11px] text-slate-500">
                    ID: <span className="font-semibold text-slate-700">{current.tire_id}</span>
                  </div>
                )}
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
                Actualizar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de instalación</label>
                <input
                  type="date"
                  className="input w-full"
                  value={installedAt || ''}
                  onChange={(e) => setInstalledAt(e.target.value)}
                />
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Rendimiento (tiempo)</label>
                <div className="input w-full flex items-center justify-between">
                  <span className="text-slate-900 font-semibold">{rendimientoInfo.text}</span>
                  <span className="text-xs text-slate-500">desde instalación</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Se calcula automáticamente desde la fecha de instalación hasta hoy.
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 p-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">ID de llanta</label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-7">
                  <select
                    className="input w-full"
                    value={selectedTireId || ''}
                    onChange={(e) => setSelectedTireId(e.target.value)}
                  >
                    <option value="">(Vacía / sin llanta)</option>
                    {tireItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.id}{it.label ? ` · ${it.label}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Puedes seleccionar una llanta existente para moverla a esta posición.
                  </div>
                </div>
                <div className="sm:col-span-5">
                  <div className="flex gap-2">
                    <input
                      className="input w-full"
                      value={newTireLabel}
                      onChange={(e) => setNewTireLabel(e.target.value)}
                      placeholder="Etiqueta nueva (opcional)"
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCreateNewTire}
                      disabled={saving}
                      title="Crear nueva llanta"
                    >
                      + Nueva
                    </button>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Crea una llanta nueva (se genera un ID).
                  </div>
                </div>
              </div>
            </div>

            {saveError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                {saveError}
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <div className="text-xs text-slate-500">
                Fecha: <b>{installedAt || '—'}</b> · Rendimiento: <b>{rendimientoInfo.text}</b>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import manifiestosService from '../../services/manifiestosService'
import Loading from '../common/Loading/Loading'

const formatCurrency = (value) => {
  const n = Number(value || 0)
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export default function CarrosProducidoSection() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ingresosCarro, setIngresosCarro] = useState([])

  const [placaSelected, setPlacaSelected] = useState('')
  const [gastosLoading, setGastosLoading] = useState(false)
  const [gastosError, setGastosError] = useState('')
  const [totalGastos, setTotalGastos] = useState(0)
  const [byTypeLoading, setByTypeLoading] = useState(false)
  const [byTypeError, setByTypeError] = useState('')
  const [gastosByType, setGastosByType] = useState([])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

  const placas = useMemo(() => {
    return (ingresosCarro || [])
      .map((c) => (c?.placa ? String(c.placa).trim().toUpperCase() : ''))
      .filter(Boolean)
      .sort()
  }, [ingresosCarro])

  const selectedRow = useMemo(() => {
    const placa = (placaSelected || '').trim().toUpperCase()
    return (ingresosCarro || []).find(
      (c) => String(c?.placa || '').trim().toUpperCase() === placa
    )
  }, [ingresosCarro, placaSelected])

  const totalIngresos = Number(selectedRow?.total_ingresos || 0)
  const neto = totalIngresos - Number(totalGastos || 0)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await manifiestosService.getIngresosByCarro('daily', 30)
        if (res?.success) {
          setIngresosCarro(res?.data || [])
        } else {
          setError(res?.error || 'Error al cargar ingresos por carro')
        }
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || 'Error al cargar ingresos por carro')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const placa = (placaSelected || '').trim().toUpperCase()
    if (!placa) {
      setTotalGastos(0)
      setGastosError('')
      setGastosByType([])
      setByTypeError('')
      return
    }

    let cancelled = false
    const loadGastos = async () => {
      try {
        setGastosLoading(true)
        setByTypeLoading(true)
        setGastosError('')
        setByTypeError('')

        const [resTotal, resByType] = await Promise.all([
          manifiestosService.getTotalGastosByPlaca(placa),
          manifiestosService.getGastosByTipoByPlaca(placa),
        ])
        if (cancelled) return

        if (resTotal?.success) {
          setTotalGastos(Number(resTotal?.data?.total_gastos || 0))
        } else {
          setGastosError(resTotal?.error || 'Error al cargar gastos por placa')
          setTotalGastos(0)
        }

        if (resByType?.success) {
          const items = Array.isArray(resByType?.data?.by_type) ? resByType.data.by_type : []
          setGastosByType(items)
        } else {
          setByTypeError(resByType?.error || 'Error al cargar gastos por tipo')
          setGastosByType([])
        }
      } catch (e) {
        if (cancelled) return
        setGastosError(e?.response?.data?.error || e?.message || 'Error al cargar gastos por placa')
        setByTypeError(e?.response?.data?.error || e?.message || 'Error al cargar gastos por tipo')
        setTotalGastos(0)
        setGastosByType([])
      } finally {
        if (!cancelled) {
          setGastosLoading(false)
          setByTypeLoading(false)
        }
      }
    }
    loadGastos()
    return () => {
      cancelled = true
    }
  }, [placaSelected])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <Loading message="Cargando carros producido..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, sub, tone = 'slate' }) => {
    const tones = {
      slate: 'text-slate-900',
      emerald: 'text-emerald-700',
      rose: 'text-rose-700',
    }
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-xs text-slate-500">{title}</div>
        <div className={`mt-1 text-xl font-bold ${tones[tone] || tones.slate}`}>{value}</div>
        {sub ? <div className="mt-1 text-[11px] text-slate-500">{sub}</div> : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Carros producido</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Selecciona una placa para ver ingresos y gastos.
              </div>
            </div>
            <div className="shrink-0 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Placas <span className="font-semibold">{placas.length}</span>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">Placa</label>
            <select
              className="input w-full"
              value={placaSelected}
              onChange={(e) => setPlacaSelected(e.target.value)}
            >
              <option value="">Selecciona...</option>
              {placas.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {gastosError && (
            <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 text-sm">
              {gastosError}
            </div>
          )}

          {byTypeError && (
            <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 text-sm">
              {byTypeError}
            </div>
          )}
        </div>

        {placaSelected ? (
          <>
            <StatCard title="Total ingresos" value={formatCurrency(totalIngresos)} sub={`Placa: ${placaSelected}`} />
            <StatCard
              title="Total gastos"
              value={gastosLoading ? 'Cargando…' : formatCurrency(totalGastos)}
              sub="Sumatoria de gastos registrados"
            />
            <StatCard
              title="Neto"
              value={gastosLoading ? '—' : formatCurrency(neto)}
              tone={neto >= 0 ? 'emerald' : 'rose'}
              sub="Ingresos − gastos"
            />
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-center text-sm text-slate-500">
              Selecciona una placa
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-center text-sm text-slate-500">
              para ver totales
            </div>
          </>
        )}
      </div>

      {/* Gráfica: porcentajes por tipo de gasto */}
      {placaSelected && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Porcentaje por tipo de gasto</div>
              <div className="text-xs text-slate-500 mt-0.5">Placa: {placaSelected}</div>
            </div>
            <div className="text-xs text-slate-500">
              Total gastos: <span className="font-semibold text-slate-900">{gastosLoading ? '…' : formatCurrency(totalGastos)}</span>
            </div>
          </div>

          {byTypeLoading ? (
            <div className="py-8">
              <Loading message="Cargando distribución de gastos..." />
            </div>
          ) : gastosByType.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No hay gastos registrados para esta placa.
            </div>
          ) : (
            (() => {
              const total = gastosByType.reduce((acc, it) => acc + Number(it?.total || 0), 0) || 1
              const chartData = gastosByType.map((it) => ({
                name: it.expense_type || 'Otros',
                value: Number(it.total || 0),
                percent: (Number(it.total || 0) / total) * 100,
              }))

              const CustomTooltip = ({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const p = payload[0]?.payload
                if (!p) return null
                return (
                  <div className="bg-white p-2 border border-slate-200 rounded shadow-lg">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-slate-600">{formatCurrency(p.value)}</div>
                    <div className="text-xs text-slate-600">{p.percent.toFixed(1)}%</div>
                  </div>
                )
              }

              return (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">
                      <div className="col-span-6">Tipo</div>
                      <div className="col-span-3 text-right">Valor</div>
                      <div className="col-span-3 text-right">%</div>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {chartData.map((it, idx) => (
                        <div key={`${it.name}-${idx}`} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm">
                          <div className="col-span-6 flex items-center gap-2 text-slate-700">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[idx % COLORS.length] }} />
                            <span className="truncate" title={it.name}>{it.name}</span>
                          </div>
                          <div className="col-span-3 text-right font-semibold text-slate-900">{formatCurrency(it.value)}</div>
                          <div className="col-span-3 text-right text-slate-600">{it.percent.toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()
          )}
        </div>
      )}
    </div>
  )
}


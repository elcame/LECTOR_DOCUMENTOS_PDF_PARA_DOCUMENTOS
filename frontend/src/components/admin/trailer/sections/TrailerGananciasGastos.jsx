import { useEffect, useState } from 'react'
import { trailersService } from '../../../../services/trailersService'

const formatCurrency = (value) => {
  const n = Number(value || 0)
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function TrailerGananciasGastos({ trailerId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({ income: 0, expense: 0, net: 0 })

  const load = async () => {
    if (!trailerId) return
    try {
      setLoading(true)
      setError('')
      const res = await trailersService.getSummary(trailerId)
      if (res?.success) setData(res.data || { income: 0, expense: 0, net: 0 })
      else setError(res?.error || 'Error al cargar resumen')
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al cargar resumen')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailerId])

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Ganancias - Gastos</h3>
        <p className="text-sm text-slate-500 mt-1">
          Resumen financiero del trailer: ingresos, gastos y neto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 p-4 bg-white">
          <div className="text-xs text-slate-500">Ingresos</div>
          <div className="text-xl font-bold text-slate-900">
            {loading ? '…' : formatCurrency(data.income)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 bg-white">
          <div className="text-xs text-slate-500">Gastos</div>
          <div className="text-xl font-bold text-slate-900">
            {loading ? '…' : formatCurrency(data.expense)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 bg-white">
          <div className="text-xs text-slate-500">Neto</div>
          <div className={`text-xl font-bold ${Number(data.net || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {loading ? '…' : formatCurrency(data.net)}
          </div>
        </div>
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
        <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 bg-slate-50">
          Calculado con eventos: ingresos vs (mantenimientos + repuestos).
        </div>
      )}
    </div>
  )
}


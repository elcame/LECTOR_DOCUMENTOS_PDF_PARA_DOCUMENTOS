import { useCallback, useEffect, useState } from 'react'
import carrosService from '../../services/carrosService'
import { AdministrarPanel, FlotaBayGrid, FlotaHeader } from '../../components/carros/flota'
import { FLOTA_SURFACE } from '../../components/carros/flota/flotaTokens'

export default function CarrosPage() {
  const [carros, setCarros] = useState([])
  const [error, setError] = useState('')

  const loadFleet = useCallback(async () => {
    try {
      setError('')
      const res = await carrosService.getCarros({ include_owner: true })
      setCarros(res.carros || [])
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los vehículos')
    }
  }, [])

  useEffect(() => {
    loadFleet()
  }, [loadFleet])

  return (
    <div
      className="min-h-[calc(100dvh-3.5rem)] text-slate-100 md:min-h-screen"
      style={{ background: FLOTA_SURFACE.base }}
    >
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <FlotaHeader count={carros.length} />
        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        <FlotaBayGrid carros={carros} />
        <AdministrarPanel onRefreshFleet={loadFleet} />
      </div>
    </div>
  )
}

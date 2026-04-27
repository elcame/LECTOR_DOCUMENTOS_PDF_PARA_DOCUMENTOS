import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { manifiestosService } from '../services/manifiestosService'
import { useAuth } from '../context/AuthContext'
import ExpenseTypesTable from '../components/manifiestos/ExpenseTypesTable'
import TripExpensesTable from '../components/manifiestos/TripExpensesTable'
import ManifestSelector from '../components/manifiestos/ManifestSelector'
import AdvancePayment from '../components/manifiestos/AdvancePayment'
import Loading from '../components/common/Loading/Loading'
import ExpenseSheetsSection from '../components/manifiestos/ExpenseSheetsSection'
import ManifiestosCharts from '../components/charts/ManifiestosCharts'
import CarrosProducidoSection from '../components/manifiestos/CarrosProducidoSection'

export default function Manifiestos() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [activeSection, setActiveSection] = useState('gastos') // gastos | anticipo | tipos | hojas | graficas | carros_producido
  const [selectedManifest, setSelectedManifest] = useState(null)
  const [manifests, setManifests] = useState([])
  const [placas, setPlacas] = useState([])
  const [placaFilter, setPlacaFilter] = useState('')
  const [placaForzada, setPlacaForzada] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // sidebar ahora es global (AppShell)

  useEffect(() => {
    loadManifests()
  }, [])

  useEffect(() => {
    const section = (searchParams.get('section') || '').trim().toLowerCase()
    if (!section) return
    setActiveSection(section)
  }, [searchParams])

  const loadManifests = async () => {
    try {
      setLoading(true)
      setError('')
      const isConductor = user?.role === 'conductor'

      const response = isConductor
        ? await manifiestosService.getManifiestosData()
        : await manifiestosService.getManifiestosDataByPlaca({ placa: placaFilter || null })
      
      if (response.success) {
        setManifests(response.data || [])
        setPlacaForzada(response.placa_forzada || null)
      } else {
        setError(response.message || 'Error al cargar manifiestos')
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar manifiestos')
      console.error('Error cargando manifiestos:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPlacas = async () => {
    try {
      const res = await manifiestosService.getPlacas()
      if (res?.success) setPlacas(res.placas || [])
    } catch {
      // silencioso: el filtro es opcional
    }
  }

  useEffect(() => {
    // cargar placas solo para admins/empresarial (no conductor)
    if (user?.role !== 'conductor') loadPlacas()
  }, [user?.role])

  useEffect(() => {
    // cuando cambia el filtro, recargar manifiestos (solo no-conductor)
    if (user?.role !== 'conductor') loadManifests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placaFilter])

  const handleManifestSelect = (manifest) => {
    setSelectedManifest(manifest)
  }

  return (
    <div className="space-y-6">
        <header className="mb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
              Gestión de Manifiestos
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Gastos, anticipo, tipos y hojas de gasto para aplicar a manifiestos.
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {user?.role === 'conductor' && placaForzada && (
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 text-sm">
            Mostrando solo manifiestos de tu carro: <b>{placaForzada}</b>
          </div>
        )}

        {user?.role !== 'conductor' && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por placa</label>
                <select
                  className="input w-full"
                  value={placaFilter}
                  onChange={(e) => setPlacaFilter(e.target.value)}
                >
                  <option value="">Todas</option>
                  {placas.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => loadManifests()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Aplicar
              </button>
              <button
                onClick={() => setPlacaFilter('')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        {/* Selector de Manifiesto */}
        <div>
          <ManifestSelector
            manifests={manifests}
            selectedManifest={selectedManifest}
            onSelect={handleManifestSelect}
            loading={loading}
          />
        </div>

        {/* Contenido */}
        <div className="space-y-6">
          {loading ? (
            <div className="card">
              <div className="card-body">
                <Loading message="Cargando datos..." />
              </div>
            </div>
          ) : (
            <>
              {activeSection === 'gastos' && (
                <TripExpensesTable
                  manifest={selectedManifest}
                  onRefresh={loadManifests}
                />
              )}

              {activeSection === 'anticipo' && selectedManifest && (
                <AdvancePayment
                  manifest={selectedManifest}
                  onUpdate={loadManifests}
                />
              )}

              {activeSection === 'tipos' && (
                <ExpenseTypesTable />
              )}

              {activeSection === 'hojas' && (
                <ExpenseSheetsSection selectedManifest={selectedManifest} />
              )}

              {activeSection === 'graficas' && user?.role !== 'conductor' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <ManifiestosCharts />
                </div>
              )}

              {activeSection === 'carros_producido' && user?.role !== 'conductor' && (
                <CarrosProducidoSection />
              )}
            </>
          )}
        </div>
    </div>
  )
}

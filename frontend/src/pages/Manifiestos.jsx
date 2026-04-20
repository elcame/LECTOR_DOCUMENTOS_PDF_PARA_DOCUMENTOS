import { useState, useEffect } from 'react'
import { manifiestosService } from '../services/manifiestosService'
import { useAuth } from '../context/AuthContext'
import ExpenseTypesTable from '../components/manifiestos/ExpenseTypesTable'
import TripExpensesTable from '../components/manifiestos/TripExpensesTable'
import ManifestSelector from '../components/manifiestos/ManifestSelector'
import AdvancePayment from '../components/manifiestos/AdvancePayment'
import ManifiestosCharts from '../components/charts/ManifiestosCharts'
import Loading from '../components/common/Loading/Loading'

export default function Manifiestos() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('stats') // 'stats', 'expenses', 'types', 'advance'
  const [selectedManifest, setSelectedManifest] = useState(null)
  const [manifests, setManifests] = useState([])
  const [placas, setPlacas] = useState([])
  const [placaFilter, setPlacaFilter] = useState('')
  const [placaForzada, setPlacaForzada] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadManifests()
  }, [])

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
    if (activeTab === 'types') {
      setActiveTab('expenses')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">📄 Gestión de Manifiestos</h1>
        </div>

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
        <div className="mb-6">
          <ManifestSelector
            manifests={manifests}
            selectedManifest={selectedManifest}
            onSelect={handleManifestSelect}
            loading={loading}
          />
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('stats')}
                className={`${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                📊 Estadísticas
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`${
                  activeTab === 'expenses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                💰 Gastos de Viaje
              </button>
              <button
                onClick={() => setActiveTab('advance')}
                className={`${
                  activeTab === 'advance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                disabled={!selectedManifest}
              >
                💵 Anticipo
              </button>
              <button
                onClick={() => setActiveTab('types')}
                className={`${
                  activeTab === 'types'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                🏷️ Tipos de Gastos
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de tabs */}
        <div className="space-y-6">
          {loading ? (
            <div className="card">
              <div className="card-body">
                <Loading message="Cargando datos..." />
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'stats' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <ManifiestosCharts />
                </div>
              )}

              {activeTab === 'expenses' && (
                <TripExpensesTable
                  manifest={selectedManifest}
                  onRefresh={loadManifests}
                />
              )}

              {activeTab === 'advance' && selectedManifest && (
                <AdvancePayment
                  manifest={selectedManifest}
                  onUpdate={loadManifests}
                />
              )}

              {activeTab === 'types' && (
                <ExpenseTypesTable />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

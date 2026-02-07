import { useState, useEffect } from 'react'
import { manifiestosService } from '../services/manifiestosService'
import ExpenseTypesTable from '../components/manifiestos/ExpenseTypesTable'
import TripExpensesTable from '../components/manifiestos/TripExpensesTable'
import ManifestSelector from '../components/manifiestos/ManifestSelector'
import AdvancePayment from '../components/manifiestos/AdvancePayment'
import Loading from '../components/common/Loading/Loading'

export default function Manifiestos() {
  const [activeTab, setActiveTab] = useState('expenses') // 'expenses', 'types', 'advance'
  const [selectedManifest, setSelectedManifest] = useState(null)
  const [manifests, setManifests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadManifests()
  }, [])

  const loadManifests = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await manifiestosService.getManifiestosData()
      
      if (response.success) {
        setManifests(response.data || [])
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

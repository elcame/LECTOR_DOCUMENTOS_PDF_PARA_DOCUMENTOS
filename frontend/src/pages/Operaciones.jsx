import { useState, useEffect, useCallback } from 'react'
import { manifiestosService } from '../services/manifiestosService'
import FolderUpload from '../components/operaciones/FolderUpload'
import PDFList from '../components/operaciones/PDFList'
import StorageStats from '../components/operaciones/StorageStats'
import ManifiestosTable from '../components/operaciones/ManifiestosTable'

export default function Operaciones() {
  const [currentFolder, setCurrentFolder] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' o 'table'
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const loadOverview = useCallback(async (folderOverride) => {
    const folder = folderOverride !== undefined ? folderOverride : currentFolder
    try {
      setLoading(true)
      setError('')
      const res = await manifiestosService.getOverview(folder)
      if (res?.success && res?.data) {
        setOverview(res.data)
      } else {
        setError(res?.error || 'Error al cargar')
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [currentFolder])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const handleUploadSuccess = ({ folderName }) => {
    setCurrentFolder(folderName)
  }

  const handleProcessSuccess = () => {
    loadOverview()
  }

  const handleRefresh = () => {
    loadOverview()
    setRefreshTrigger(prev => prev + 1)
  }

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'table' : 'grid')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Operaciones</h1>
          <div className="flex items-center gap-3">
            {/* Botón Ver Tabla */}
            <button
              onClick={() => setViewMode('table')}
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              title="Ver tabla de manifiestos"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Ver Tabla
            </button>

            {/* Botón Ver PDFs */}
            <button
              onClick={() => setViewMode('grid')}
              className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              title="Ver lista de PDFs"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Ver PDFs
            </button>

            {/* Botón estadísticas */}
            <button
              onClick={() => setShowStats(!showStats)}
              className={`btn ${showStats ? 'btn-primary' : 'btn-outline'} btn-sm`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {showStats ? 'Ocultar' : 'Ver'} Estadísticas
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {showStats && (
            loading
              ? <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">Cargando estadísticas...</div>
              : overview
                ? <StorageStats storage={overview.storage} fromParent={true} onRefresh={handleRefresh} />
                : null
          )}

          <FolderUpload
            folders={overview?.folders ?? []}
            loadingFolders={loading}
            onRefresh={handleRefresh}
            onUploadSuccess={handleUploadSuccess}
            onProcessSuccess={handleProcessSuccess}
          />
          
          {/* Vista de Grid (original) o Tabla */}
          {viewMode === 'grid' ? (
            <PDFList
              pdfs={overview?.pdfs ?? []}
              folderName={currentFolder}
              loading={loading}
              onRefresh={handleRefresh}
            />
          ) : (
            <ManifiestosTable
              folderName={currentFolder}
              refreshTrigger={refreshTrigger}
            />
          )}
        </div>
      </div>
    </div>
  )
}

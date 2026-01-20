import { useState, useEffect, useCallback } from 'react'
import { manifiestosService } from '../services/manifiestosService'
import FolderUpload from '../components/operaciones/FolderUpload'
import PDFList from '../components/operaciones/PDFList'
import StorageStats from '../components/operaciones/StorageStats'

export default function Operaciones() {
  const [currentFolder, setCurrentFolder] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Operaciones</h1>
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
          <PDFList
            pdfs={overview?.pdfs ?? []}
            folderName={currentFolder}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  )
}

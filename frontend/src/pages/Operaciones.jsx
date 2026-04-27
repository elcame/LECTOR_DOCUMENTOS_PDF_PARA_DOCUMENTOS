import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { manifiestosService } from '../services/manifiestosService'
import FolderUpload from '../components/operaciones/FolderUpload'
import PDFList from '../components/operaciones/PDFList'
import StorageStats from '../components/operaciones/StorageStats'
import ManifiestosTable from '../components/operaciones/ManifiestosTable'

export default function Operaciones() {
  const [searchParams] = useSearchParams()
  const [currentFolder, setCurrentFolder] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' o 'table'
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeFolderSection, setActiveFolderSection] = useState(null) // 'procesar' | 'subir' | null

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

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  useEffect(() => {
    const section = (searchParams.get('section') || '').trim().toLowerCase()
    if (!section) return
    if (section === 'stats') {
      setShowStats(true)
      requestAnimationFrame(() => scrollToSection('section-operaciones-stats'))
    }
    if (section === 'pdfs') {
      setViewMode('grid')
      requestAnimationFrame(() => scrollToSection('section-operaciones-pdfs'))
    }
    if (section === 'tabla') {
      setViewMode('table')
      requestAnimationFrame(() => scrollToSection('section-operaciones-tabla'))
    }
    if (section === 'procesar') {
      setActiveFolderSection('procesar')
      requestAnimationFrame(() => scrollToSection('section-procesar-carpeta'))
    }
    if (section === 'subir') {
      setActiveFolderSection('subir')
      requestAnimationFrame(() => scrollToSection('section-subir-carpeta'))
    }
  }, [searchParams])

  return (
    <div className="space-y-6">
      <header id="section-operaciones-inicio" className="mb-2 scroll-mt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                    Operaciones de manifiestos
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Procesa, valida y corrige manifiestos generados desde tus PDFs.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Total PDFs</span>
                    <span className="font-semibold">
                      {overview?.pdfs?.length ?? 0}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Carpetas</span>
                    <span className="font-semibold">
                      {overview?.folders?.length ?? 0}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Carpeta activa</span>
                    <span className="font-semibold">
                      {currentFolder || 'Todas'}
                    </span>
                  </div>
                </div>
              </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {showStats && (
        loading ? (
          <div id="section-operaciones-stats" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500 scroll-mt-6">
            Cargando estadísticas...
          </div>
        ) : overview ? (
          <div id="section-operaciones-stats" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 scroll-mt-6">
            <StorageStats storage={overview.storage} fromParent={true} onRefresh={handleRefresh} />
          </div>
        ) : null
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <FolderUpload
          visibleSection={activeFolderSection}
          folders={overview?.folders ?? []}
          loadingFolders={loading}
          onRefresh={handleRefresh}
          onUploadSuccess={handleUploadSuccess}
          onProcessSuccess={handleProcessSuccess}
        />
      </div>
              
      {/* Vista de Grid (original) o Tabla */}
      {viewMode === 'grid' ? (
        <div id="section-operaciones-pdfs" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 scroll-mt-6">
          <PDFList pdfs={overview?.pdfs ?? []} folderName={currentFolder} loading={loading} onRefresh={handleRefresh} />
        </div>
      ) : (
        <div id="section-operaciones-tabla" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 scroll-mt-6">
          <ManifiestosTable folderName={currentFolder} refreshTrigger={refreshTrigger} />
        </div>
      )}
    </div>
  )
}

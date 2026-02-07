import { useState, useEffect } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import ConfirmModal from '../../common/ConfirmModal'

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return 'N/A'
  }
}

const ProgressBar = ({ value, max, color = 'blue' }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600'
  }
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

const StatCard = ({ title, value, subtitle, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`${colorClasses[color]} rounded-full p-3`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StorageStats({ storage: storageFromParent, fromParent = false, onRefresh }) {
  const [stats, setStats] = useState(storageFromParent ?? null)
  const [loading, setLoading] = useState(!fromParent)
  const [error, setError] = useState('')
  const [selectedTab, setSelectedTab] = useState('overview')
  const [expandedFolder, setExpandedFolder] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, file: null, folder: null })
  const [deleting, setDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [downloadingFolder, setDownloadingFolder] = useState(null)
  const [downloadingExcel, setDownloadingExcel] = useState(null)

  useEffect(() => {
    // Siempre cargar los datos completos desde el endpoint
    loadStats()
  }, [])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await manifiestosService.getStorageStats()
      
      if (res.success) {
        setStats(res.data)
      } else {
        setError(res.error || 'Error al cargar estadísticas')
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFolderZip = async (folderName) => {
    try {
      setDownloadingFolder(folderName)
      await manifiestosService.downloadFolderZip(folderName)
      setSuccessMessage(`Carpeta "${folderName}" descargada exitosamente`)
    } catch (err) {
      setError(err?.message || 'Error al descargar carpeta')
    } finally {
      setDownloadingFolder(null)
    }
  }

  const handleDownloadExcel = async (folderName) => {
    try {
      setDownloadingExcel(folderName)
      await manifiestosService.downloadExcel(folderName)
      setSuccessMessage(`Excel de "${folderName}" descargado exitosamente`)
    } catch (err) {
      setError(err?.message || 'Error al descargar Excel. Asegúrate de que la carpeta haya sido procesada.')
    } finally {
      setDownloadingExcel(null)
    }
  }

  const handleDeleteClick = (file) => {
    setDeleteModal({ isOpen: true, file, folder: null })
  }

  const handleDeleteFolderClick = (folder) => {
    setDeleteModal({ isOpen: true, file: null, folder })
  }

  const handleDeleteConfirm = async () => {
    if (deleteModal.folder) {
      // Eliminar carpeta
      try {
        setDeleting(true)
        const res = await manifiestosService.deleteFolder(deleteModal.folder.folder_name)
        
        if (res.success) {
          setSuccessMessage(`✓ Carpeta "${deleteModal.folder.folder_name}" eliminada correctamente`)
          setDeleteModal({ isOpen: false, file: null, folder: null })
          if (fromParent && onRefresh) await onRefresh()
          else await loadStats()
        } else {
          setError(res.error || 'Error al eliminar carpeta')
        }
      } catch (err) {
        setError(err?.message || 'Error al eliminar carpeta')
      } finally {
        setDeleting(false)
      }
    } else if (deleteModal.file) {
      // Eliminar archivo
      try {
        setDeleting(true)
        const res = await manifiestosService.deletePDF(
          deleteModal.file.folder_name,
          deleteModal.file.filename
        )
        
        if (res.success) {
          setSuccessMessage(`✓ ${deleteModal.file.filename} eliminado correctamente`)
          setDeleteModal({ isOpen: false, file: null, folder: null })
          if (fromParent && onRefresh) await onRefresh()
          else await loadStats()
        } else {
          setError(res.error || 'Error al eliminar archivo')
        }
      } catch (err) {
        setError(err?.message || 'Error al eliminar archivo')
      } finally {
        setDeleting(false)
      }
    }
  }

  const handleDeleteCancel = () => {
    if (!deleting) {
      setDeleteModal({ isOpen: false, file: null, folder: null })
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
          <button 
            onClick={loadStats}
            className="mt-4 btn btn-primary btn-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const maxSize = 5 * 1024 * 1024 * 1024 // 5 GB límite estimado
  const totalSize = stats.total_size_bytes || stats.total_size || 0
  const usagePercentage = (totalSize / maxSize) * 100
  
  let usageColor = 'green'
  if (usagePercentage > 80) usageColor = 'red'
  else if (usagePercentage > 50) usageColor = 'yellow'

  return (
    <div className="space-y-6">
      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-900">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Almacenamiento de PDFs</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona y monitorea tu uso de almacenamiento en Firebase Storage
          </p>
        </div>
        <button 
          onClick={loadStats}
          className="btn btn-outline btn-sm"
          title="Actualizar estadísticas"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Archivos"
          value={stats?.total_files || 0}
          subtitle="PDFs almacenados"
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
        
        <StatCard
          title="Espacio Usado"
          value={formatFileSize(totalSize)}
          subtitle={`de ${formatFileSize(maxSize)}`}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
        />
        
        <StatCard
          title="Carpetas"
          value={stats?.folders?.length || 0}
          subtitle="Organizadas"
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
        />
        
        <StatCard
          title="Espacio Disponible"
          value={formatFileSize(maxSize - totalSize)}
          subtitle={`${(100 - usagePercentage).toFixed(1)}% libre`}
          color="orange"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      {/* Barra de progreso de uso */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Uso de Almacenamiento</h3>
          <span className={`text-sm font-medium ${
            usageColor === 'red' ? 'text-red-600' : 
            usageColor === 'yellow' ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {usagePercentage.toFixed(1)}%
          </span>
        </div>
        <ProgressBar 
          value={totalSize} 
          max={maxSize} 
          color={usageColor}
        />
        <p className="text-xs text-gray-500 mt-2">
          {formatFileSize(totalSize)} de {formatFileSize(maxSize)} utilizados
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vista General
            </button>
            <button
              onClick={() => setSelectedTab('folders')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'folders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Por Carpetas
            </button>
            <button
              onClick={() => setSelectedTab('files')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Archivos Grandes
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Vista General */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Top 5 Carpetas por Tamaño</h4>
                <div className="space-y-3">
                  {(stats?.folders || []).slice(0, 5).map((folder, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{folder.folder_name}</p>
                          <p className="text-xs text-gray-500">{folder.count} archivos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatFileSize(folder.size)}</p>
                        <p className="text-xs text-gray-500">
                          {totalSize > 0 ? ((folder.size / totalSize) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Archivos Recientes</h4>
                <div className="space-y-2">
                  {(stats?.recent_files || []).slice(0, 5).map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate" title={file.filename}>
                            {file.filename}
                          </p>
                          <p className="text-xs text-gray-500">{file.folder_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="text-xs text-gray-900">{formatFileSize(file.size)}</p>
                          <p className="text-xs text-gray-400">{formatDate(file.uploaded_at)}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteClick(file)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar archivo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Por Carpetas */}
          {selectedTab === 'folders' && (
            <div className="space-y-3">
              {(stats?.folders || []).map((folder, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => setExpandedFolder(expandedFolder === index ? null : index)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{folder.folder_name}</p>
                        <p className="text-xs text-gray-500">{folder.count} archivos</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatFileSize(folder.size)}</p>
                        <p className="text-xs text-gray-500">
                          {totalSize > 0 ? ((folder.size / totalSize) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadFolderZip(folder.folder_name)
                        }}
                        disabled={downloadingFolder === folder.folder_name}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Descargar PDFs como ZIP"
                      >
                        {downloadingFolder === folder.folder_name ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadExcel(folder.folder_name)
                        }}
                        disabled={downloadingExcel === folder.folder_name}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Descargar Excel"
                      >
                        {downloadingExcel === folder.folder_name ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFolderClick(folder)
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar carpeta"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform cursor-pointer ${
                          expandedFolder === index ? 'transform rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {expandedFolder === index && folder.files && folder.files.length > 0 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Archivos más grandes:</p>
                      <div className="space-y-2">
                        {folder.files.map((file, fileIndex) => (
                          <div key={fileIndex} className="flex items-center justify-between text-sm">
                            <p className="text-gray-700 truncate flex-1 mr-4" title={file.filename}>
                              {file.filename}
                            </p>
                            <span className="text-gray-600 flex-shrink-0">{formatFileSize(file.size)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab: Archivos Grandes */}
          {selectedTab === 'files' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-4">
                Los 10 archivos más grandes en tu almacenamiento
              </p>
              {(stats?.largest_files || []).map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-sm font-bold text-red-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
                        {file.filename}
                      </p>
                      <p className="text-xs text-gray-500">{file.folder_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{formatFileSize(file.size)}</p>
                      <p className="text-xs text-gray-500">{formatDate(file.uploaded_at)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(file)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar archivo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info de Firebase Storage */}
      {stats?.storage_info?.available && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Firebase Storage Conectado
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Bucket: {stats?.storage_info?.bucket_name || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={deleteModal.folder ? "¿Eliminar carpeta?" : "¿Eliminar archivo?"}
        type="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={deleting}
      >
        {deleteModal.folder && (
          <div className="text-sm text-gray-600 space-y-2">
            <p>Estás a punto de eliminar la siguiente carpeta y todo su contenido:</p>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="font-medium text-gray-900">
                {deleteModal.folder.folder_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {deleteModal.folder.count} archivo(s) • {formatFileSize(deleteModal.folder.size)}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-800 font-medium text-sm">
                ⚠️ Advertencia: Esta acción eliminará:
              </p>
              <ul className="text-xs text-red-700 mt-2 list-disc list-inside space-y-1">
                <li>Todos los archivos PDF de la carpeta</li>
                <li>Los datos asociados en la base de datos</li>
                <li>Los archivos en Firebase Storage</li>
                <li>El archivo Excel asociado (si existe)</li>
              </ul>
            </div>
            <p className="text-red-600 font-medium">
              Esta acción no se puede deshacer. Todos los datos serán eliminados permanentemente.
            </p>
          </div>
        )}
        {deleteModal.file && (
          <div className="text-sm text-gray-600 space-y-2">
            <p>Estás a punto de eliminar el siguiente archivo:</p>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="font-medium text-gray-900 truncate" title={deleteModal.file.filename}>
                {deleteModal.file.filename}
              </p>
              <p className="text-xs text-gray-500 mt-1">Carpeta: {deleteModal.file.folder_name}</p>
              <p className="text-xs text-gray-500">Tamaño: {formatFileSize(deleteModal.file.size)}</p>
            </div>
            <p className="text-red-600 font-medium">
              Esta acción no se puede deshacer. El archivo será eliminado permanentemente.
            </p>
          </div>
        )}
      </ConfirmModal>
    </div>
  )
}

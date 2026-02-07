import { useState, useEffect } from 'react'
import PDFItem from '../PDFItem/PDFItem'
import PDFMerger from '../PDFMerger/PDFMerger'
import PDFPages from '../PDFPages/PDFPages'

export default function PDFList({ pdfs = [], folderName = null, loading = false, onRefresh }) {
  const [filteredPdfs, setFilteredPdfs] = useState([])
  const [selectedPdf, setSelectedPdf] = useState(null)
  const [showMerger, setShowMerger] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('')
  const [availableFolders, setAvailableFolders] = useState([])

  // Extraer carpetas únicas
  useEffect(() => {
    const folders = [...new Set(pdfs.map(pdf => pdf.folder_name).filter(Boolean))]
    setAvailableFolders(folders.sort())
  }, [pdfs])

  // Filtrar PDFs según la búsqueda y carpeta seleccionada
  useEffect(() => {
    let filtered = pdfs
    
    // Filtrar por carpeta
    if (selectedFolder) {
      filtered = filtered.filter(pdf => pdf.folder_name === selectedFolder)
    }
    
    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(pdf =>
        pdf.filename?.toLowerCase().includes(query) ||
        pdf.folder_name?.toLowerCase().includes(query)
      )
    }
    
    setFilteredPdfs(filtered)
  }, [searchQuery, selectedFolder, pdfs])

  const handleSelectPdf = (pdf) => {
    setSelectedPdf(pdf)
  }

  const handleMergeSuccess = () => {
    onRefresh?.()
    setShowMerger(false)
    setSelectedPdf(null)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Cargando PDFs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-800">
            PDFs {folderName ? `en "${folderName}"` : 'disponibles'}
            {filteredPdfs.length !== pdfs.length && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredPdfs.length} de {pdfs.length})
              </span>
            )}
          </h3>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowMerger(!showMerger)}
              className="btn btn-primary btn-sm"
            >
              {showMerger ? 'Cancelar' : 'Fusionar PDFs'}
            </button>
            <button
              onClick={() => onRefresh?.()}
              className="btn btn-outline btn-sm"
              disabled={loading}
            >
              Actualizar
            </button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Selector de carpeta */}
          <div className="flex-1">
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="input w-full"
            >
              <option value="">Todas las carpetas ({pdfs.length} PDFs)</option>
              {availableFolders.map((folder) => {
                const count = pdfs.filter(pdf => pdf.folder_name === folder).length
                return (
                  <option key={folder} value={folder}>
                    {folder} ({count} PDFs)
                  </option>
                )
              })}
            </select>
          </div>
          
          {/* Buscador */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar PDFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10 pr-4"
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Limpiar búsqueda"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {showMerger && (
        <PDFMerger
          pdfs={pdfs}
          onSuccess={handleMergeSuccess}
          onCancel={() => setShowMerger(false)}
        />
      )}

      {pdfs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay PDFs disponibles
        </div>
      ) : filteredPdfs.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500">No se encontraron PDFs que coincidan con "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-blue-600 hover:text-blue-700 text-sm mt-2"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre del archivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carpeta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamaño
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Páginas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPdfs.map((pdf) => (
                <tr 
                  key={pdf.id || `${pdf.filename}_${pdf.folder_name || ''}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs" title={pdf.filename}>
                        {pdf.filename}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {pdf.folder_name || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {formatFileSize(pdf.size)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {pdf.page_count || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleSelectPdf(pdf)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de páginas del PDF */}
      <PDFPages
        pdf={selectedPdf}
        isOpen={selectedPdf !== null && !showMerger}
        onClose={() => setSelectedPdf(null)}
        onPdfUpdated={onRefresh}
      />
    </div>
  )
}

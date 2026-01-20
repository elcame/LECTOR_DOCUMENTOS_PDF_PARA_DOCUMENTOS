import { useState, useEffect } from 'react'
import PDFItem from '../PDFItem/PDFItem'
import PDFMerger from '../PDFMerger/PDFMerger'
import PDFPages from '../PDFPages/PDFPages'

export default function PDFList({ pdfs = [], folderName = null, loading = false, onRefresh }) {
  const [filteredPdfs, setFilteredPdfs] = useState([])
  const [selectedPdf, setSelectedPdf] = useState(null)
  const [showMerger, setShowMerger] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrar PDFs según la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPdfs(pdfs)
    } else {
      const query = searchQuery.toLowerCase().trim()
      const filtered = pdfs.filter(pdf =>
        pdf.filename?.toLowerCase().includes(query) ||
        pdf.folder_name?.toLowerCase().includes(query)
      )
      setFilteredPdfs(filtered)
    }
  }, [searchQuery, pdfs])

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
          {/* Buscador */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPdfs.map((pdf) => (
            <PDFItem
              key={pdf.id || `${pdf.filename}_${pdf.folder_name || ''}`}
              pdf={pdf}
              isSelected={selectedPdf?.id === pdf.id}
              onSelect={() => handleSelectPdf(pdf)}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      )}

      {/* Modal de páginas del PDF */}
      <PDFPages
        pdf={selectedPdf}
        isOpen={selectedPdf !== null && !showMerger}
        onClose={() => setSelectedPdf(null)}
      />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import Button from '../../common/Button/Button'
import PDFPageModal from '../PDFPageModal/PDFPageModal'

// Componente para miniatura de página con mejor manejo de errores
function PageThumbnail({ page, pdf, isSelected, onSelect, onViewFull }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const thumbnailUrl = manifiestosService.getPDFThumbnailUrl(
    pdf.filename,
    pdf.folder_name,
    page.page_number - 1
  )

  const handleImageLoad = () => {
    setImageError(false)
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  return (
    <div
      className={`
        relative rounded-lg border-2 transition-all cursor-pointer overflow-hidden
        ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
        }
      `}
      onClick={onSelect}
      onDoubleClick={onViewFull}
      title="Clic para seleccionar, doble clic para ver completa"
    >
      {/* Contenedor de imagen */}
      <div className="w-full h-24 bg-gray-50 flex items-center justify-center relative">
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {!imageError ? (
          <img
            src={thumbnailUrl}
            alt={`Página ${page.page_number}`}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-center">
            <svg className="w-8 h-8 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-gray-400">Pág. {page.page_number}</span>
          </div>
        )}
      </div>

      {/* Badge de número de página */}
      <div className={`
        absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-semibold
        ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'}
      `}>
        {page.page_number}
      </div>

      {/* Indicador de selección */}
      {isSelected && (
        <div className="absolute top-1 left-1">
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  )
}

export default function PDFMerger({ pdfs, onSuccess, onCancel }) {
  const [sourcePdf, setSourcePdf] = useState(null)
  const [targetPdf, setTargetPdf] = useState(null)
  const [sourcePages, setSourcePages] = useState([])
  const [targetPages, setTargetPages] = useState([])
  const [selectedPages, setSelectedPages] = useState([])
  const [insertPosition, setInsertPosition] = useState(null)
  const [loadingPages, setLoadingPages] = useState(false)
  const [loadingTargetPages, setLoadingTargetPages] = useState(false)
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [modalPage, setModalPage] = useState({ isOpen: false, pdf: null, pageNumber: null })

  useEffect(() => {
    if (sourcePdf) {
      loadSourcePages()
    } else {
      setSourcePages([])
      setSelectedPages([])
    }
  }, [sourcePdf])

  useEffect(() => {
    if (targetPdf) {
      loadTargetPages()
      setInsertPosition(null)
    } else {
      setTargetPages([])
      setInsertPosition(null)
    }
  }, [targetPdf])

  const loadSourcePages = async () => {
    if (!sourcePdf) return
    
    setLoadingPages(true)
    setError('')
    try {
      const res = await manifiestosService.getPDFPages(sourcePdf.filename, sourcePdf.folder_name)
      if (res.success) {
        const pages = res.data?.pages || []
        setSourcePages(pages)
        if (pages.length === 1) {
          setSelectedPages([1])
        }
      } else {
        setError(res.error || 'Error al cargar páginas')
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar páginas')
    } finally {
      setLoadingPages(false)
    }
  }

  const loadTargetPages = async () => {
    if (!targetPdf) return
    
    setLoadingTargetPages(true)
    setError('')
    try {
      const res = await manifiestosService.getPDFPages(targetPdf.filename, targetPdf.folder_name)
      if (res.success) {
        const pages = res.data?.pages || []
        setTargetPages(pages)
      } else {
        setError(res.error || 'Error al cargar páginas del destino')
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar páginas del destino')
    } finally {
      setLoadingTargetPages(false)
    }
  }

  const togglePage = (pageNumber) => {
    setSelectedPages(prev => {
      if (prev.includes(pageNumber)) {
        return prev.filter(p => p !== pageNumber)
      } else {
        return [...prev, pageNumber].sort((a, b) => a - b)
      }
    })
  }

  const selectAllPages = () => {
    setSelectedPages(sourcePages.map(p => p.page_number))
  }

  const deselectAllPages = () => {
    setSelectedPages([])
  }

  const handleMerge = async () => {
    if (!sourcePdf || !targetPdf) {
      setError('Selecciona ambos PDFs (origen y destino)')
      return
    }

    if (selectedPages.length === 0) {
      setError('Selecciona al menos una página para mover')
      return
    }

    if (sourcePdf.id === targetPdf.id) {
      setError('El PDF origen y destino no pueden ser el mismo')
      return
    }

    setMerging(true)
    setError('')
    setSuccessMessage('')

    try {
      const mergeData = {
        source_folder: sourcePdf.folder_name,
        source_filename: sourcePdf.filename,
        target_folder: targetPdf.folder_name,
        target_filename: targetPdf.filename,
        pages: selectedPages,
        insert_position: insertPosition
      }

      const res = await manifiestosService.mergePDFPages(mergeData)
      
      if (res.success) {
        setSuccessMessage(res.message || 'PDFs fusionados correctamente')
        setTimeout(() => {
          onSuccess?.()
        }, 1500)
      } else {
        setError(res.error || 'Error al fusionar PDFs')
      }
    } catch (err) {
      setError(err?.message || err?.response?.data?.error || 'Error al fusionar PDFs')
    } finally {
      setMerging(false)
    }
  }

  const canMerge = sourcePdf && targetPdf && selectedPages.length > 0 && sourcePdf.id !== targetPdf.id

  const handlePageClick = (pdf, pageNumber) => {
    setModalPage({ isOpen: true, pdf, pageNumber })
  }

  const handlePositionSelect = (position) => {
    setInsertPosition(position)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Fusionar PDFs</h3>
            <p className="text-sm text-blue-100 mt-1">Mueve páginas entre documentos</p>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:text-blue-100 transition-colors"
            title="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Paso 1: Selección de PDFs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PDF Origen */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              <span className="inline-flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                PDF Origen
              </span>
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={sourcePdf?.id || ''}
              onChange={(e) => {
                const pdf = pdfs.find(p => p.id === e.target.value)
                setSourcePdf(pdf || null)
              }}
              className="input w-full border-2 focus:border-blue-500"
            >
              <option value="">Selecciona un PDF...</option>
              {pdfs.map((pdf) => (
                <option key={pdf.id} value={pdf.id}>
                  {pdf.filename} ({pdf.folder_name})
                </option>
              ))}
            </select>
            {sourcePdf && (
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate">{sourcePdf.filename}</span>
              </div>
            )}
          </div>

          {/* PDF Destino */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              <span className="inline-flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">2</span>
                PDF Destino
              </span>
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={targetPdf?.id || ''}
              onChange={(e) => {
                const pdf = pdfs.find(p => p.id === e.target.value)
                setTargetPdf(pdf || null)
              }}
              className="input w-full border-2 focus:border-green-500"
            >
              <option value="">Selecciona un PDF...</option>
              {pdfs.map((pdf) => (
                <option key={pdf.id} value={pdf.id}>
                  {pdf.filename} ({pdf.folder_name})
                </option>
              ))}
            </select>
            {targetPdf && (
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate">{targetPdf.filename}</span>
              </div>
            )}
          </div>
        </div>

        {/* Paso 2: Selección de páginas origen */}
        {sourcePdf && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                <span className="inline-flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">3</span>
                  Selecciona las páginas a mover
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllPages}
                  className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  disabled={loadingPages || sourcePages.length === 0}
                >
                  Todas
                </button>
                <button
                  onClick={deselectAllPages}
                  className="text-xs px-3 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                  disabled={loadingPages || selectedPages.length === 0}
                >
                  Ninguna
                </button>
              </div>
            </div>

            {loadingPages ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Cargando páginas...</p>
              </div>
            ) : sourcePages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron páginas
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {sourcePages.map((page) => (
                    <PageThumbnail
                      key={page.page_number}
                      page={page}
                      pdf={sourcePdf}
                      isSelected={selectedPages.includes(page.page_number)}
                      onSelect={() => togglePage(page.page_number)}
                      onViewFull={() => handlePageClick(sourcePdf, page.page_number)}
                    />
                  ))}
                </div>
                {selectedPages.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{selectedPages.length} página(s) seleccionada(s)</span>
                    </div>
                    <span className="text-gray-500 text-xs">({selectedPages.join(', ')})</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Paso 3: Selección de posición en destino */}
        {targetPdf && targetPages.length > 0 && selectedPages.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              <span className="inline-flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">4</span>
                Dónde insertar en "{targetPdf.filename}"
              </span>
            </label>
            
            {loadingTargetPages ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Cargando páginas del destino...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {/* Grid de columnas similar al de arriba */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Primera fila: Nombres/Etiquetas */}
                  <div className="contents">
                    {/* Columna: Al inicio */}
                    <button
                      onClick={() => handlePositionSelect(0)}
                      className={`
                        rounded-lg border-2 p-3 transition-all cursor-pointer flex flex-col items-center justify-start
                        ${insertPosition === 0
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                        }
                      `}
                      title="Insertar al inicio del documento"
                    >
                      <div className={`
                        w-5 h-5 rounded-full flex items-center justify-center mb-2
                        ${insertPosition === 0 ? 'bg-orange-500' : 'bg-gray-300'}
                      `}>
                        {insertPosition === 0 && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-700 text-center mb-2">Inicio</p>
                      <div className="w-full h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </div>
                    </button>

                    {/* Columnas: Después de cada página */}
                    {targetPages.map((page, index) => {
                      const position = index + 1
                      const isSelected = insertPosition === position
                      const thumbnailUrl = manifiestosService.getPDFThumbnailUrl(
                        targetPdf.filename,
                        targetPdf.folder_name,
                        page.page_number - 1
                      )
                      
                      return (
                        <button
                          key={page.page_number}
                          onClick={() => handlePositionSelect(position)}
                          onDoubleClick={() => handlePageClick(targetPdf, page.page_number)}
                          className={`
                            rounded-lg border-2 p-3 transition-all cursor-pointer flex flex-col items-center justify-start relative
                            ${isSelected
                              ? 'border-orange-500 bg-orange-50 shadow-md scale-105'
                              : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                            }
                          `}
                          title={`Insertar después de la página ${page.page_number}. Doble clic para ver completa.`}
                        >
                          {/* Indicador de selección */}
                          {isSelected && (
                            <div className="absolute top-1 left-1">
                              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Radio button */}
                          <div className={`
                            w-5 h-5 rounded-full flex items-center justify-center mb-2
                            ${isSelected ? 'bg-orange-500' : 'bg-gray-300'}
                          `}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          
                          {/* Nombre/Etiqueta */}
                          <p className="text-xs font-semibold text-gray-700 text-center mb-2">
                            Después Pág. {page.page_number}
                          </p>
                          
                          {/* Miniatura */}
                          <div className="w-full h-20 bg-gray-100 rounded border border-gray-200 overflow-hidden relative">
                            <img
                              src={thumbnailUrl}
                              alt={`Página ${page.page_number}`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                            <div className="w-full h-full items-center justify-center text-gray-400 text-xs hidden">
                              Pág. {page.page_number}
                            </div>
                            {/* Badge de número */}
                            <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black bg-opacity-60 text-white text-[9px] rounded">
                              {page.page_number}
                            </div>
                          </div>
                        </button>
                      )
                    })}

                    {/* Columna: Al final */}
                    <button
                      onClick={() => handlePositionSelect(null)}
                      className={`
                        rounded-lg border-2 p-3 transition-all cursor-pointer flex flex-col items-center justify-start
                        ${insertPosition === null
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                        }
                      `}
                      title="Insertar al final del documento"
                    >
                      <div className={`
                        w-5 h-5 rounded-full flex items-center justify-center mb-2
                        ${insertPosition === null ? 'bg-orange-500' : 'bg-gray-300'}
                      `}>
                        {insertPosition === null && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-700 text-center mb-2">Final</p>
                      <div className="w-full h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* Información adicional */}
                {insertPosition !== null && (
                  <div className="mt-3 text-xs text-gray-600 text-center">
                    {insertPosition === 0 ? (
                      <p>Las páginas se insertarán <span className="font-semibold">al inicio</span> del documento</p>
                    ) : (
                      <p>Las páginas se insertarán <span className="font-semibold">después de la página {insertPosition}</span></p>
                    )}
                  </div>
                )}
                {insertPosition === null && (
                  <div className="mt-3 text-xs text-gray-600 text-center">
                    <p>Las páginas se insertarán <span className="font-semibold">al final</span> del documento</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mensajes */}
        {error && (
          <div className="rounded-lg bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="rounded-lg bg-green-50 border-2 border-green-200 text-green-800 px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">¡Éxito!</p>
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={merging}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleMerge}
            disabled={!canMerge || merging}
            loading={merging}
          >
            {merging ? 'Fusionando...' : `Fusionar ${selectedPages.length} página(s)`}
          </Button>
        </div>
      </div>

      {/* Modal para ver páginas completas */}
      <PDFPageModal
        isOpen={modalPage.isOpen}
        onClose={() => setModalPage({ isOpen: false, pdf: null, pageNumber: null })}
        pdf={modalPage.pdf}
        pageNumber={modalPage.pageNumber}
      />
    </div>
  )
}

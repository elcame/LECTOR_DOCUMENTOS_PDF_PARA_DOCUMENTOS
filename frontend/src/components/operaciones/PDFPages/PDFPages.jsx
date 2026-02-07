import { useState, useEffect } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import Modal from '../../common/Modal/Modal'
import PDFPageModal from '../PDFPageModal/PDFPageModal'

export default function PDFPages({ pdf, isOpen, onClose, onPdfUpdated }) {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalPage, setModalPage] = useState({ isOpen: false, pageNumber: null })
  const [selectedPages, setSelectedPages] = useState([])
  const [deletingPages, setDeletingPages] = useState(false)
  const [deleteMode, setDeleteMode] = useState(false)
  const [splitMode, setSplitMode] = useState(false)
  const [splitPage, setSplitPage] = useState(null)
  const [splittingPDF, setSplittingPDF] = useState(false)
  const [keepOriginal, setKeepOriginal] = useState(false)

  useEffect(() => {
    if (isOpen && pdf) {
      loadPages()
    } else {
      // Reset cuando se cierra
      setPages([])
      setLoading(true)
      setError('')
      setSelectedPages([])
      setDeleteMode(false)
      setSplitMode(false)
      setSplitPage(null)
    }
  }, [isOpen, pdf])

  const loadPages = async () => {
    if (!pdf) return
    
    try {
      setLoading(true)
      setError('')
      const res = await manifiestosService.getPDFPages(pdf.filename, pdf.folder_name)
      if (res.success) {
        setPages(res.data?.pages || [])
      } else {
        setError(res.error || 'Error al cargar p?ginas')
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar p?ginas')
    } finally {
      setLoading(false)
    }
  }

  const handlePageClick = (pageNumber) => {
    if (deleteMode) {
      // En modo eliminar, seleccionar/deseleccionar p?gina
      togglePageSelection(pageNumber)
    } else if (splitMode) {
      // En modo dividir, seleccionar p?gina de divisi?n
      setSplitPage(pageNumber)
    } else {
      // En modo normal, abrir modal
      setModalPage({ isOpen: true, pageNumber })
    }
  }

  const togglePageSelection = (pageNumber) => {
    setSelectedPages(prev => {
      if (prev.includes(pageNumber)) {
        return prev.filter(p => p !== pageNumber)
      } else {
        return [...prev, pageNumber]
      }
    })
  }

  const handleDeletePages = async () => {
    if (selectedPages.length === 0) {
      alert('Selecciona al menos una p?gina para eliminar')
      return
    }

    if (selectedPages.length >= pages.length) {
      alert('No puedes eliminar todas las p?ginas del PDF')
      return
    }

    const confirmMessage = `?Est?s seguro de que deseas eliminar ${selectedPages.length} p?gina(s)?\n\nP?ginas a eliminar: ${selectedPages.sort((a, b) => a - b).join(', ')}\n\nEsta acci?n no se puede deshacer.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setDeletingPages(true)
      setError('')
      
      const response = await manifiestosService.deletePDFPages(
        pdf.folder_name,
        pdf.filename,
        selectedPages
      )

      if (response.success) {
        alert(`? ${response.message}`)
        
        // Recargar p?ginas
        await loadPages()
        
        // Resetear selecci?n
        setSelectedPages([])
        setDeleteMode(false)
        
        // Notificar al componente padre si existe
        if (onPdfUpdated) {
          onPdfUpdated()
        }
      } else {
        setError(response.error || 'Error al eliminar p?ginas')
      }
    } catch (err) {
      console.error('Error al eliminar p?ginas:', err)
      setError(err?.message || 'Error al eliminar p?ginas')
    } finally {
      setDeletingPages(false)
    }
  }

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode)
    setSelectedPages([])
    setSplitMode(false)
    setSplitPage(null)
  }

  const toggleSplitMode = () => {
    setSplitMode(!splitMode)
    setSplitPage(null)
    setDeleteMode(false)
    setSelectedPages([])
  }

  const handleSplitPDF = async () => {
    if (!splitPage) {
      alert('Selecciona una p?gina para dividir el PDF')
      return
    }

    if (splitPage < 1 || splitPage >= pages.length) {
      alert(`La p?gina de divisi?n debe estar entre 1 y ${pages.length - 1}`)
      return
    }

    const confirmMessage = `?Est?s seguro de que deseas dividir el PDF en la p?gina ${splitPage}?\n\nSe crear?:\n- Parte 1: P?ginas 1-${splitPage}\n- Parte 2: P?ginas ${splitPage + 1}-${pages.length}\n\n${keepOriginal ? 'El PDF original se mantendr?.' : 'El PDF original ser? eliminado.'}`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setSplittingPDF(true)
      setError('')
      
      const response = await manifiestosService.splitPDF(
        pdf.folder_name,
        pdf.filename,
        splitPage,
        { keep_original: keepOriginal }
      )

      if (response.success) {
        alert(`? ${response.message}\n\nParte 1: ${response.data.part1.filename} (${response.data.part1.pages} p?ginas)\nParte 2: ${response.data.part2.filename} (${response.data.part2.pages} p?ginas)`)
        
        // Cerrar modal y notificar al padre
        setSplitMode(false)
        setSplitPage(null)
        
        if (onPdfUpdated) {
          onPdfUpdated()
        }
        
        if (onClose) {
          onClose()
        }
      } else {
        setError(response.error || 'Error al dividir PDF')
      }
    } catch (err) {
      console.error('Error al dividir PDF:', err)
      setError(err?.message || 'Error al dividir PDF')
    } finally {
      setSplittingPDF(false)
    }
  }

  if (!pdf) return null

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`P?ginas de: ${pdf.filename}`}
        size="xl"
        closeOnOverlayClick={true}
      >
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Cargando p?ginas...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
              {error}
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron p?ginas
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    {pages.length} página(s) encontrada(s)
                    {deleteMode && ` - ${selectedPages.length} seleccionada(s)`}
                    {splitMode && splitPage && ` - Dividir en página ${splitPage}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {deleteMode 
                      ? 'Selecciona las páginas que deseas eliminar'
                      : splitMode
                        ? 'Selecciona la página donde dividir el PDF (se dividirá después de esa página)'
                        : 'Haz clic en una página para verla completa'
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {splitMode ? (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          id="keepOriginal"
                          checked={keepOriginal}
                          onChange={(e) => setKeepOriginal(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="keepOriginal" className="text-gray-700 cursor-pointer">
                          Mantener PDF original
                        </label>
                      </div>
                      <button
                        onClick={handleSplitPDF}
                        disabled={splittingPDF || !splitPage}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          flex items-center gap-2
                          ${splittingPDF || !splitPage
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                          }
                        `}
                      >
                        {splittingPDF ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Dividiendo...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Dividir PDF{splitPage ? ` en pág. ${splitPage}` : ''}</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={toggleSplitMode}
                        disabled={splittingPDF}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : deleteMode ? (
                    <>
                      <button
                        onClick={handleDeletePages}
                        disabled={deletingPages || selectedPages.length === 0}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          flex items-center gap-2
                          ${deletingPages || selectedPages.length === 0
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                          }
                        `}
                      >
                        {deletingPages ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Eliminando...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Eliminar ({selectedPages.length})</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={toggleDeleteMode}
                        disabled={deletingPages}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={toggleSplitMode}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>Dividir PDF</span>
                      </button>
                      <button
                        onClick={toggleDeleteMode}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Eliminar Páginas</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[70vh] overflow-y-auto">
                {pages.map((page) => {
                  const thumbnailUrl = manifiestosService.getPDFThumbnailUrl(
                    pdf.filename,
                    pdf.folder_name,
                    page.page_number - 1
                  )
                  const isSelected = selectedPages.includes(page.page_number)
                  
                  return (
                    <div
                      key={page.page_number}
                      onClick={() => handlePageClick(page.page_number)}
                      className={`
                        rounded-lg border-2 p-3 hover:shadow-md transition-all cursor-pointer relative
                        ${deleteMode
                          ? isSelected
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 bg-gray-50 hover:border-red-300'
                          : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                        }
                      `}
                      title={deleteMode ? 'Clic para seleccionar' : 'Clic para ver p?gina completa'}
                    >
                      {splitMode && isSplitPage && (
                        <div className="absolute top-1 right-1 z-10">
                          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Dividir
                          </div>
                        </div>
                      )}
                      {deleteMode && (
                        <div className="absolute top-1 right-1 z-10">
                          <div className={`
                            w-6 h-6 rounded-full border-2 flex items-center justify-center
                            ${isSelected
                              ? 'bg-red-600 border-red-600'
                              : 'bg-white border-gray-300'
                            }
                          `}>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="w-full h-32 bg-white border border-gray-200 rounded mb-2 overflow-hidden">
                          <img
                            src={thumbnailUrl}
                            alt={`P?gina ${page.page_number}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className="w-full h-full items-center justify-center text-gray-400 text-xs hidden">
                            P?gina {page.page_number}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          <div className="font-medium">P?gina {page.page_number}</div>
                          {page.width && page.height && (
                            <div className="text-gray-400 mt-1">
                              {Math.round(page.width)} ? {Math.round(page.height)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal para ver p?gina completa */}
      <PDFPageModal
        isOpen={modalPage.isOpen}
        onClose={() => setModalPage({ isOpen: false, pageNumber: null })}
        pdf={pdf}
        pageNumber={modalPage.pageNumber}
      />
    </>
  )
}

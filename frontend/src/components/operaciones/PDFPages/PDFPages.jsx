import { useState, useEffect } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import Modal from '../../common/Modal/Modal'
import PDFPageModal from '../PDFPageModal/PDFPageModal'

export default function PDFPages({ pdf, isOpen, onClose }) {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalPage, setModalPage] = useState({ isOpen: false, pageNumber: null })

  useEffect(() => {
    if (isOpen && pdf) {
      loadPages()
    } else {
      // Reset cuando se cierra
      setPages([])
      setLoading(true)
      setError('')
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
        setError(res.error || 'Error al cargar páginas')
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar páginas')
    } finally {
      setLoading(false)
    }
  }

  const handlePageClick = (pageNumber) => {
    setModalPage({ isOpen: true, pageNumber })
  }

  if (!pdf) return null

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Páginas de: ${pdf.filename}`}
        size="xl"
        closeOnOverlayClick={true}
      >
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Cargando páginas...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
              {error}
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron páginas
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {pages.length} página(s) encontrada(s) - Haz clic en una página para verla completa
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[70vh] overflow-y-auto">
                {pages.map((page) => {
                  const thumbnailUrl = manifiestosService.getPDFThumbnailUrl(
                    pdf.filename,
                    pdf.folder_name,
                    page.page_number - 1
                  )
                  return (
                    <div
                      key={page.page_number}
                      onClick={() => handlePageClick(page.page_number)}
                      className="rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-gray-50"
                      title="Clic para ver página completa"
                    >
                      <div className="text-center">
                        <div className="w-full h-32 bg-white border border-gray-200 rounded mb-2 overflow-hidden">
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
                            Página {page.page_number}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          <div className="font-medium">Página {page.page_number}</div>
                          {page.width && page.height && (
                            <div className="text-gray-400 mt-1">
                              {Math.round(page.width)} × {Math.round(page.height)}
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

      {/* Modal para ver página completa */}
      <PDFPageModal
        isOpen={modalPage.isOpen}
        onClose={() => setModalPage({ isOpen: false, pageNumber: null })}
        pdf={pdf}
        pageNumber={modalPage.pageNumber}
      />
    </>
  )
}

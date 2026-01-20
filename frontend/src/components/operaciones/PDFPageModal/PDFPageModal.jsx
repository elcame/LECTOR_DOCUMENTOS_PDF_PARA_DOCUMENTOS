import { useState, useEffect } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import Modal from '../../common/Modal/Modal'

/**
 * Modal para ver una página completa de PDF a tamaño completo
 */
export default function PDFPageModal({ isOpen, onClose, pdf, pageNumber }) {
  const [thumbnailUrl, setThumbnailUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && pdf && pageNumber) {
      loadPageThumbnail()
    } else {
      setThumbnailUrl(null)
      setError('')
    }
  }, [isOpen, pdf, pageNumber])

  const loadPageThumbnail = async () => {
    if (!pdf || !pageNumber) return

    setLoading(true)
    setError('')
    try {
      // Obtener URL de la miniatura (usar página completa)
      // Para el modal, usamos una miniatura más grande
      const baseURL = window.location.origin
      const params = new URLSearchParams({ 
        folder_name: pdf.folder_name,
        page: pageNumber - 1, // 0-indexed
        size: 'large' // Solicitar tamaño grande para el modal
      })
      const url = `${baseURL}/api/manifiestos/pdf/${encodeURIComponent(pdf.filename)}/thumbnail?${params.toString()}`
      setThumbnailUrl(url)
    } catch (err) {
      setError(err?.message || 'Error al cargar la página')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !pdf || !pageNumber) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Página ${pageNumber} - ${pdf.filename}`}
      size="full"
      closeOnOverlayClick={true}
    >
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando página...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            {error}
          </div>
        ) : thumbnailUrl ? (
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4 min-h-[600px]">
            <img
              src={thumbnailUrl}
              alt={`Página ${pageNumber} de ${pdf.filename}`}
              className="max-w-full max-h-[80vh] object-contain shadow-lg rounded"
              style={{ imageRendering: 'high-quality' }}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

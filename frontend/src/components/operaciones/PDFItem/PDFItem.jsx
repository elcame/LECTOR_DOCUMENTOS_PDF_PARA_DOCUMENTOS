import { useState, useEffect, useRef } from 'react'
import { manifiestosService } from '../../../services/manifiestosService'
import api from '../../../api'
import { ENDPOINTS } from '../../../api/endpoints'

// Utilidades de caché
const CACHE_PREFIX = 'thumb_'
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000 // 7 días en ms

const getCacheKey = (filename, folderName, pageNum) => {
  return `${CACHE_PREFIX}${filename}_${folderName}_${pageNum}`
}

const getCachedThumbnail = (cacheKey) => {
  try {
    const cached = sessionStorage.getItem(cacheKey)
    if (!cached) return null
    
    const data = JSON.parse(cached)
    // Verificar si no está muy antiguo
    if (Date.now() - data.timestamp > MAX_CACHE_AGE) {
      sessionStorage.removeItem(cacheKey)
      return null
    }
    
    // Si es un blob URL, no confiar en el caché porque puede haber sido revocado
    // Solo usar caché si es una URL base64 o data URL
    if (data.url && (data.url.startsWith('data:') || data.url.startsWith('http'))) {
      return data.url
    }
    
    // Para blob URLs, no usar caché directamente
    return null
  } catch (err) {
    return null
  }
}

const setCachedThumbnail = (cacheKey, url) => {
  try {
    // Solo guardar en caché si NO es un blob URL (los blob URLs se revocan)
    // Los blob URLs son temporales y no deben guardarse en caché
    if (url && !url.startsWith('blob:')) {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        url,
        timestamp: Date.now()
      }))
    }
    // Para blob URLs, no guardar en caché - se recargarán desde el servidor si es necesario
  } catch (err) {
    // SessionStorage lleno, limpiar algunas entradas antiguas
    cleanOldCache()
  }
}

const cleanOldCache = () => {
  try {
    const keys = Object.keys(sessionStorage)
    const thumbKeys = keys.filter(k => k.startsWith(CACHE_PREFIX))
    
    // Limpiar blob URLs del caché (son temporales y no deberían estar ahí)
    thumbKeys.forEach(key => {
      try {
        const data = JSON.parse(sessionStorage.getItem(key) || '{}')
        if (data.url && data.url.startsWith('blob:')) {
          sessionStorage.removeItem(key)
        }
      } catch (err) {
        // Si hay error al parsear, eliminar la entrada
        sessionStorage.removeItem(key)
      }
    })
    
    // Ordenar por antigüedad y eliminar las más antiguas
    const remainingKeys = keys.filter(k => k.startsWith(CACHE_PREFIX))
    const entries = remainingKeys.map(key => {
      try {
        const data = JSON.parse(sessionStorage.getItem(key) || '{}')
        return { key, timestamp: data.timestamp || 0 }
      } catch (err) {
        return { key, timestamp: 0 }
      }
    }).sort((a, b) => a.timestamp - b.timestamp)
    
    // Eliminar el 25% más antiguo
    const toRemove = Math.ceil(entries.length * 0.25)
    for (let i = 0; i < toRemove; i++) {
      sessionStorage.removeItem(entries[i].key)
    }
  } catch (err) {
    console.error('Error limpiando caché:', err)
  }
}

// Limpiar blob URLs del caché al cargar el módulo
if (typeof window !== 'undefined' && window.sessionStorage) {
  try {
    const keys = Object.keys(sessionStorage)
    keys.filter(k => k.startsWith(CACHE_PREFIX)).forEach(key => {
      try {
        const data = JSON.parse(sessionStorage.getItem(key) || '{}')
        if (data.url && data.url.startsWith('blob:')) {
          sessionStorage.removeItem(key)
        }
      } catch (err) {
        // Ignorar errores
      }
    })
  } catch (err) {
    // Ignorar errores
  }
}

// Componente para cada miniatura con mejor manejo de errores
function ThumbnailItem({ thumb, pdf, onRetry }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const handleImageError = (e) => {
    // Prevenir que el error se propague
    e.preventDefault()
    e.stopPropagation()
    
    console.warn(`Error al cargar imagen de página ${thumb.pageNumber}:`, {
      url: thumb.url,
      fromCache: thumb.fromCache,
      retryCount
    })
    
    // Si es un blob URL que falla, probablemente fue revocado
    // Intentar recargar desde el servidor
    if (thumb.url && thumb.url.startsWith('blob:') && retryCount < 2) {
      setRetryCount(prev => prev + 1)
      setImageLoading(true)
      setImageError(false)
      
      // Limpiar el blob URL inválido
      try {
        URL.revokeObjectURL(thumb.url)
      } catch (err) {
        // Ignorar errores al revocar
      }
      
      // Solicitar recarga desde el servidor
      if (onRetry) {
        setTimeout(() => {
          onRetry()
        }, 300)
      } else {
        setImageError(true)
        setImageLoading(false)
      }
    } else {
      // Si no es blob o ya se intentó varias veces, marcar como error
      setImageError(true)
      setImageLoading(false)
    }
  }

  const handleImageLoad = () => {
    setImageError(false)
    setImageLoading(false)
  }

  return (
    <div
      className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center relative group"
      title={`Página ${thumb.pageNumber}${thumb.fromCache ? ' (caché)' : ''}`}
    >
      {imageLoading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {!imageError && thumb.url ? (
        <img
          src={thumb.url}
          alt={`Página ${thumb.pageNumber} de ${pdf.filename}`}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-1 text-center">
          <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[8px] text-gray-500 leading-tight">
            Pág. {thumb.pageNumber}
          </span>
          {retryCount >= 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setRetryCount(0)
                setImageError(false)
                setImageLoading(true)
                onRetry()
              }}
              className="mt-1 text-[8px] text-blue-600 hover:text-blue-700 underline"
              title="Reintentar"
            >
              Reintentar
            </button>
          )}
        </div>
      )}
      
      {/* Indicador de caché (opcional, solo en desarrollo) */}
      {thumb.fromCache && process.env.NODE_ENV === 'development' && !imageError && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-[8px] px-1 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity">
          C
        </div>
      )}
    </div>
  )
}

export default function PDFItem({ pdf, isSelected, onSelect, formatFileSize }) {
  const [pdfInfo, setPdfInfo] = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [thumbnails, setThumbnails] = useState([])
  const [loadingThumbnails, setLoadingThumbnails] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const abortControllerRef = useRef(null)
  const pagesAbortRef = useRef(null)
  const mountedRef = useRef(true)
  const thumbnailsRef = useRef([])
  thumbnailsRef.current = thumbnails

  // Si el PDF ya trae total_pages (desde Firebase/overview), no llamar getPDFPages
  useEffect(() => {
    mountedRef.current = true
    if (pagesAbortRef.current) pagesAbortRef.current.abort()
    pagesAbortRef.current = new AbortController()

    if (typeof pdf.total_pages === 'number') {
      setPdfInfo({ total_pages: pdf.total_pages, filename: pdf.filename, pages: [] })
      setLoadingInfo(false)
    } else {
      loadPDFInfo(pagesAbortRef.current.signal)
    }
    return () => {
      mountedRef.current = false
      if (pagesAbortRef.current) pagesAbortRef.current.abort()
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [pdf.filename, pdf.folder_name, pdf.total_pages])

  // Depender de primitivos para no re-ejecutar cuando pdfInfo es nuevo pero con los mismos valores
  useEffect(() => {
    if (pdfInfo?.total_pages) {
      loadAllThumbnails()
    } else if (pdfInfo) {
      setLoadingThumbnails(false)
    }
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [pdfInfo?.total_pages, pdf.filename, pdf.folder_name])

  const loadPDFInfo = async (signal) => {
    try {
      setLoadingInfo(true)
      const res = await manifiestosService.getPDFPages(pdf.filename, pdf.folder_name, { signal })
      if (res.success && res.data && mountedRef.current) {
        setPdfInfo(res.data)
      }
    } catch (err) {
      if (err?.code === 'CANCELED' || (err?.message && String(err.message).toLowerCase() === 'canceled')) return
      console.error('Error al cargar información del PDF:', err)
      if (mountedRef.current) {
        setPdfInfo({ total_pages: 0, filename: pdf.filename, pages: [] })
      }
    } finally {
      if (mountedRef.current) setLoadingInfo(false)
    }
  }

  const loadAllThumbnails = async () => {
    if (!pdfInfo || !mountedRef.current) {
      if (mountedRef.current) setLoadingThumbnails(false)
      return
    }
    if (!pdfInfo.total_pages) {
      if (mountedRef.current) setLoadingThumbnails(false)
      return
    }

    try {
      setLoadingThumbnails(true)
      setLoadingProgress(0)
      
      const totalPages = pdfInfo.total_pages
      const maxThumbnails = Math.min(totalPages, 10)
      const batchSize = 3 // Cargar 3 a la vez
      const thumbnailsArray = []
      
      // Cancelar requests anteriores si existen
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Crear nuevo controller
      abortControllerRef.current = new AbortController()
      
      // Cargar en lotes
      for (let i = 0; i < maxThumbnails; i += batchSize) {
        if (!mountedRef.current) break
        
        const batchPromises = []
        const end = Math.min(i + batchSize, maxThumbnails)
        
        for (let j = i; j < end; j++) {
          const pageNum = j
          const cacheKey = getCacheKey(pdf.filename, pdf.folder_name, pageNum)
          
          // Verificar caché primero
          const cached = getCachedThumbnail(cacheKey)
          
          if (cached && !cached.startsWith('blob:')) {
            // Usar desde caché solo si NO es un blob URL
            // Los blob URLs del caché pueden haber sido revocados
            batchPromises.push(
              Promise.resolve({ pageNumber: pageNum + 1, url: cached, fromCache: true })
            )
          } else {
            // Cargar desde servidor
            batchPromises.push(
              api.get(
                ENDPOINTS.MANIFIESTOS.PDF_THUMBNAIL(pdf.filename),
                {
                  params: { folder_name: pdf.folder_name, page: pageNum },
                  responseType: 'blob',
                  signal: abortControllerRef.current.signal,
                  timeout: 15000
                }
              ).then(response => {
                // Verificar que la respuesta sea una imagen válida
                if (!response || !response.data) {
                  console.warn(`Respuesta inválida para página ${pageNum + 1}`)
                  return null
                }
                
                // Verificar tamaño del blob
                if (response.data.size === 0) {
                  console.warn(`Respuesta vacía para página ${pageNum + 1}`)
                  return null
                }
                
                // Verificar que sea realmente una imagen
                const contentType = response.headers['content-type'] || response.data.type || ''
                if (!contentType.startsWith('image/')) {
                  console.warn(`Respuesta no es una imagen para página ${pageNum + 1}, tipo: ${contentType}`)
                  return null
                }
                
                try {
                  // Crear blob URL
                  const blobUrl = URL.createObjectURL(response.data)
                  
                  // Verificar que el blob URL sea válido
                  if (!blobUrl || !blobUrl.startsWith('blob:')) {
                    console.warn(`Error al crear blob URL para página ${pageNum + 1}`)
                    return null
                  }
                  
                  return { pageNumber: pageNum + 1, url: blobUrl, fromCache: false }
                } catch (blobError) {
                  console.error(`Error al crear blob URL para página ${pageNum + 1}:`, blobError)
                  return null
                }
              }).catch(err => {
                const isCancel = err?.code === 'CANCELED' || err?.name === 'AbortError' || err?.name === 'CanceledError'
                if (!isCancel) {
                  if (err?.code === 'NETWORK_ERROR' || err?.code === 'TIMEOUT') {
                    console.warn(`Miniatura pág. ${pageNum + 1}: ${err?.message || 'error de red'}`)
                  } else if (err?.status === 404 || err?.status === 500) {
                    console.warn(`Miniatura pág. ${pageNum + 1}: error ${err.status}`)
                  } else {
                    console.warn(`Error al cargar miniatura de página ${pageNum + 1}:`, err?.message || err)
                  }
                }
                return null
              })
            )
          }
        }
        
        // Esperar el lote actual
        const batchResults = await Promise.all(batchPromises)
        const validThumbs = batchResults.filter(t => t !== null)
        
        thumbnailsArray.push(...validThumbs)
        
        if (mountedRef.current) {
          setThumbnails([...thumbnailsArray])
          setLoadingProgress(Math.round((thumbnailsArray.length / maxThumbnails) * 100))
        }
        
        // Pequeña pausa entre lotes para no saturar
        if (i + batchSize < maxThumbnails && mountedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 150))
        }
      }
    } catch (err) {
      const isCancel = err?.code === 'CANCELED' || err?.name === 'AbortError' || err?.name === 'CanceledError'
      if (!isCancel) {
        console.warn('Error al cargar miniaturas:', err?.message || err)
      }
    } finally {
      if (mountedRef.current) {
        setLoadingThumbnails(false)
        setLoadingProgress(100)
      }
    }
  }

  // Revocar blob URLs solo al desmontar (no al cambiar thumbnails: los lotes
  // reutilizan las miniaturas anteriores; revocarlas antes rompe las <img>).
  useEffect(() => {
    return () => {
      thumbnailsRef.current.forEach(thumb => {
        if (thumb?.url?.startsWith('blob:')) {
          try { URL.revokeObjectURL(thumb.url) } catch (_) {}
        }
      })
    }
  }, [])

  const handleDownload = async (e) => {
    e.stopPropagation() // Evitar que se active el onSelect del contenedor
    
    try {
      setDownloading(true)
      const blob = await manifiestosService.downloadPDF(pdf.filename, pdf.folder_name)
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = pdf.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al descargar PDF:', error)
      alert('Error al descargar el PDF. Por favor, intenta nuevamente.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      onClick={onSelect}
      className={`
        rounded-lg border-2 p-4 cursor-pointer transition-all
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate mb-2" title={pdf.filename}>
              {pdf.filename}
            </h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Carpeta:</span>
                <span className="font-medium">{pdf.folder_name}</span>
              </div>
              {pdf.processed && (
                <div className="flex items-center gap-1 text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Procesado</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                flex items-center gap-1.5
                ${downloading 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }
              `}
              title="Descargar PDF"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Descargar PDF</span>
                </>
              )}
            </button>
            {isSelected && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        
        {/* Miniaturas de las páginas */}
        <div className="mt-2">
          {loadingThumbnails || loadingInfo ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <div className="text-xs text-gray-400 text-center">
                  Cargando miniaturas... {loadingProgress > 0 && `${loadingProgress}%`}
                </div>
              </div>
              {loadingProgress > 0 && loadingProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              )}
              {/* Placeholder mientras cargan */}
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded border border-gray-200 animate-pulse flex items-center justify-center"
                  >
                    <div className="text-[8px] text-gray-300">...</div>
                  </div>
                ))}
              </div>
            </div>
          ) : thumbnails.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {thumbnails.map((thumb) => (
                <ThumbnailItem
                  key={thumb.pageNumber}
                  thumb={thumb}
                  pdf={pdf}
                  onRetry={() => {
                    // Reintentar carga de esta miniatura
                    const pageNum = thumb.pageNumber - 1
                    const cacheKey = getCacheKey(pdf.filename, pdf.folder_name, pageNum)
                    sessionStorage.removeItem(cacheKey)
                    loadAllThumbnails()
                  }}
                />
              ))}
              {pdfInfo && pdfInfo.total_pages > 10 && (
                <div className="flex-shrink-0 w-16 h-20 bg-gray-50 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                  +{pdfInfo.total_pages - 10}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 py-4 text-center">
              No se pudieron cargar las miniaturas
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

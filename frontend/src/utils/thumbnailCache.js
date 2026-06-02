/**
 * Caché global de miniaturas con throttle de concurrencia.
 *
 * - Persiste blob URLs entre montajes/desmontajes de componentes para evitar
 *   re-descargar PDFs al hacer scroll o navegar.
 * - Limita el número de requests concurrentes hacia el backend (default 4).
 * - Deduplica requests en vuelo: si dos componentes piden la misma miniatura
 *   al mismo tiempo, solo se hace una petición.
 * - Aplica LRU eviction cuando el caché supera MAX_CACHE_ENTRIES, revocando
 *   las blob URLs liberadas para no filtrar memoria.
 */
import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

const MAX_CONCURRENT = 4
const MAX_CACHE_ENTRIES = 200
const REQUEST_TIMEOUT_MS = 15000

/** key -> { blobUrl: string, lastUsed: number } */
const cache = new Map()
/** key -> Promise<string|null> */
const inflight = new Map()
/** cola de resolvers esperando un slot libre */
const waitQueue = []
let activeRequests = 0

const buildKey = (filename, folderName, pageNum) =>
  `${filename}__${folderName}__${pageNum}`

const evictOldest = () => {
  if (cache.size < MAX_CACHE_ENTRIES) return
  let oldestKey = null
  let oldestTime = Infinity
  for (const [key, entry] of cache.entries()) {
    if (entry.lastUsed < oldestTime) {
      oldestTime = entry.lastUsed
      oldestKey = key
    }
  }
  if (oldestKey) {
    const entry = cache.get(oldestKey)
    if (entry?.blobUrl?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(entry.blobUrl)
      } catch (_) {}
    }
    cache.delete(oldestKey)
  }
}

const acquireSlot = (signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const tryAcquire = () => {
      if (activeRequests < MAX_CONCURRENT) {
        activeRequests++
        resolve()
        return true
      }
      return false
    }
    if (tryAcquire()) return

    const onAbort = () => {
      const idx = waitQueue.indexOf(waiter)
      if (idx >= 0) waitQueue.splice(idx, 1)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const waiter = () => {
      signal?.removeEventListener?.('abort', onAbort)
      if (tryAcquire()) resolve()
      else waitQueue.unshift(waiter)
    }
    signal?.addEventListener?.('abort', onAbort, { once: true })
    waitQueue.push(waiter)
  })

const releaseSlot = () => {
  activeRequests = Math.max(0, activeRequests - 1)
  const next = waitQueue.shift()
  if (next) next()
}

const fetchThumbnailBlob = async (filename, folderName, pageNum, signal) => {
  const response = await api.get(ENDPOINTS.MANIFIESTOS.PDF_THUMBNAIL(filename), {
    params: { folder_name: folderName, page: pageNum },
    responseType: 'blob',
    signal,
    timeout: REQUEST_TIMEOUT_MS,
  })
  if (!response?.data || response.data.size === 0) return null
  const contentType = response.headers?.['content-type'] || response.data.type || ''
  if (!contentType.startsWith('image/')) return null
  const blobUrl = URL.createObjectURL(response.data)
  if (!blobUrl?.startsWith('blob:')) return null
  return blobUrl
}

/**
 * Devuelve un blob URL listo para usar en <img src>. Si la miniatura ya fue
 * descargada antes (en este o en otro componente), la sirve desde memoria.
 *
 * @param {string} filename
 * @param {string} folderName
 * @param {number} pageNum  Página 0-indexed (igual que el backend)
 * @param {{ signal?: AbortSignal }} options
 * @returns {Promise<string|null>}
 */
export async function loadThumbnail(filename, folderName, pageNum, { signal } = {}) {
  const key = buildKey(filename, folderName, pageNum)

  const cached = cache.get(key)
  if (cached) {
    cached.lastUsed = Date.now()
    return cached.blobUrl
  }

  if (inflight.has(key)) {
    return inflight.get(key)
  }

  const promise = (async () => {
    await acquireSlot(signal)
    try {
      if (signal?.aborted) return null
      const blobUrl = await fetchThumbnailBlob(filename, folderName, pageNum, signal)
      if (!blobUrl) return null
      evictOldest()
      cache.set(key, { blobUrl, lastUsed: Date.now() })
      return blobUrl
    } catch (err) {
      const isCancel =
        err?.code === 'CANCELED' ||
        err?.name === 'AbortError' ||
        err?.name === 'CanceledError'
      if (!isCancel) {
        console.warn(`Miniatura pág. ${pageNum + 1} falló:`, err?.message || err)
      }
      return null
    } finally {
      releaseSlot()
    }
  })()

  inflight.set(key, promise)
  try {
    return await promise
  } finally {
    inflight.delete(key)
  }
}

/** Limpia todas las miniaturas en caché (útil para logout). */
export function clearThumbnailCache() {
  for (const entry of cache.values()) {
    if (entry?.blobUrl?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(entry.blobUrl)
      } catch (_) {}
    }
  }
  cache.clear()
}

/** Stats para debugging. */
export function getThumbnailCacheStats() {
  return {
    cached: cache.size,
    inflight: inflight.size,
    activeRequests,
    queued: waitQueue.length,
  }
}

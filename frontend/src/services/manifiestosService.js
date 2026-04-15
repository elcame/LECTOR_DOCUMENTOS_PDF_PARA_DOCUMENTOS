/**
 * Servicio de manifiestos
 */
import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const manifiestosService = {
  /**
   * Obtener carpetas de manifiestos
   */
  async getFolders() {
    const response = await api.get(ENDPOINTS.MANIFIESTOS.FOLDERS)
    return response.data
  },

  /**
   * Overview: PDFs + carpetas + storage en 1 sola lectura Firebase.
   * @param {string|null} folderName - Filtrar PDFs por carpeta (opcional)
   */
  async getOverview(folderName = null) {
    const params = folderName ? { folder_name: folderName } : {}
    // Agregar timestamp para evitar caché del navegador
    params._t = Date.now()
    const response = await api.get(ENDPOINTS.MANIFIESTOS.OVERVIEW, { params })
    return response.data
  },

  /**
   * Subir archivos PDF a una carpeta en el servidor
   * @param {string} folderName - Nombre de la carpeta de destino
   * @param {File[]} files - Archivos PDF
   */
  async uploadFile(folderName, file) {
    const formData = new FormData()
    formData.append('folder_name', folderName)
    formData.append('file', file)
    const response = await api.post(ENDPOINTS.MANIFIESTOS.UPLOAD_FILE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async uploadFolder(folderName, files) {
    const results = []
    let saved = 0
    let skipped = 0

    for (const f of files) {
      try {
        const res = await this.uploadFile(folderName, f)
        if (res?.success) {
          saved += 1
          results.push(res?.data)
        } else {
          skipped += 1
        }
      } catch (e) {
        skipped += 1
      }
    }

    return {
      success: true,
      message: `Se subieron ${saved} archivo(s) a la carpeta "${folderName}".`,
      data: {
        folder_name: folderName,
        saved_count: saved,
        skipped_count: skipped,
        files: results,
      },
    }
  },

  /**
   * Procesar carpeta de manifiestos (por nombre de carpeta)
   */
  async processFolder(folderName) {
    const response = await api.post(ENDPOINTS.MANIFIESTOS.PROCESS_FOLDER, { folder_name: folderName })
    return response.data
  },

  /**
   * Actualizar campo de manifiesto
   */
  async updateField(manifestId, field, value) {
    const response = await api.post(ENDPOINTS.MANIFIESTOS.UPDATE_FIELD, {
      manifest_id: manifestId,
      field,
      value,
    })
    return response.data
  },

  /**
   * Obtener archivos con QR
   */
  async getArchivosQR() {
    const response = await api.get(ENDPOINTS.MANIFIESTOS.ARCHIVOS_QR)
    return response.data
  },

  /**
   * Actualizar campo QR
   */
  async updateQRField(archivoId, field, value) {
    const response = await api.post(ENDPOINTS.MANIFIESTOS.UPDATE_QR_FIELD, {
      archivo_id: archivoId,
      field,
      value,
    })
    return response.data
  },

  /**
   * Procesar carpeta QR (por nombre de carpeta)
   */
  async processFolderQR(folderName) {
    const response = await api.post(ENDPOINTS.MANIFIESTOS.PROCESS_FOLDER_QR, { folder_name: folderName })
    return response.data
  },

  /**
   * Obtener PDFs guardados del usuario
   * @param {string} folderName - Opcional: filtrar por nombre de carpeta
   */
  async getPDFs(folderName = null) {
    const params = folderName ? { folder_name: folderName } : {}
    // Agregar timestamp para evitar caché del navegador
    params._t = Date.now()
    const response = await api.get(ENDPOINTS.MANIFIESTOS.PDFS, { params })
    return response.data
  },

  /**
   * Obtener información de páginas de un PDF
   * @param {string} filename - Nombre del archivo PDF
   * @param {string} folderName - Nombre de la carpeta
   * @param {{ signal?: AbortSignal }} options - Opciones (signal para cancelar)
   */
  async getPDFPages(filename, folderName, options = {}) {
    const config = { params: { folder_name: folderName } }
    if (options.signal) config.signal = options.signal
    const response = await api.get(ENDPOINTS.MANIFIESTOS.PDF_PAGES(filename), config)
    return response.data
  },

  /**
   * Obtener URL de la miniatura de una página del PDF
   * @param {string} filename - Nombre del archivo PDF
   * @param {string} folderName - Nombre de la carpeta
   * @param {number} pageNumber - Número de página (0-indexed, opcional, por defecto 0)
   * @returns {string} URL de la miniatura
   */
  getPDFThumbnailUrl(filename, folderName, pageNumber = 0) {
    const baseURL = api.defaults.baseURL || window.location.origin
    const params = new URLSearchParams({ 
      folder_name: folderName,
      page: pageNumber
    })
    // La autenticación se maneja mediante cookies (withCredentials: true)
    return `${baseURL}${ENDPOINTS.MANIFIESTOS.PDF_THUMBNAIL(filename)}?${params.toString()}`
  },

  /**
   * Obtener URL para abrir/ver un PDF completo en el navegador.
   * Se apoya en el endpoint de descarga, pasando el folder_name como query.
   */
  getPDFViewUrl(filename, folderName) {
    const baseURL = api.defaults.baseURL || window.location.origin
    const params = new URLSearchParams({ folder_name: folderName })
    return `${baseURL}${ENDPOINTS.MANIFIESTOS.PDF_DOWNLOAD(filename)}?${params.toString()}`
  },

  /**
   * Descargar un PDF completo
   * @param {string} filename - Nombre del archivo PDF
   * @param {string} folderName - Nombre de la carpeta
   * @returns {Promise<Blob>} Blob del PDF para descargar
   */
  async downloadPDF(filename, folderName) {
    const response = await api.get(ENDPOINTS.MANIFIESTOS.PDF_DOWNLOAD(filename), {
      params: { folder_name: folderName },
      responseType: 'blob'
    })
    return response.data
  },

  /**
   * Descargar todos los PDFs de una carpeta como archivo ZIP
   * @param {string} folderName - Nombre de la carpeta
   * @returns {Promise<void>} Descarga el archivo ZIP
   */
  async downloadFolderZip(folderName) {
    const response = await api.get(ENDPOINTS.MANIFIESTOS.DOWNLOAD_FOLDER_ZIP, {
      params: { folder_name: folderName },
      responseType: 'blob'
    })
    
    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${folderName}.zip`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  /**
   * Descargar Excel de una carpeta procesada
   * @param {string} folderName - Nombre de la carpeta
   * @returns {Promise<void>} Descarga el archivo Excel
   */
  async downloadExcel(folderName) {
    const response = await api.get(ENDPOINTS.MANIFIESTOS.DOWNLOAD_EXCEL, {
      params: { folder_name: folderName },
      responseType: 'blob'
    })
    
    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `manifiestos_${folderName}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  /**
   * Fusionar páginas de un PDF en otro PDF
   * @param {object} mergeData - { source_folder, source_filename, target_folder, target_filename, pages }
   */
  async mergePDFPages(mergeData) {
    const response = await api.post(ENDPOINTS.MANIFIESTOS.PDF_MERGE, mergeData)
    return response.data
  },

  /**
   * Eliminar páginas específicas de un PDF
   * @param {string} folderName - Nombre de la carpeta
   * @param {string} filename - Nombre del archivo
   * @param {number[]} pages - Array de números de página a eliminar (1-indexed)
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deletePDFPages(folderName, filename, pages) {
    const response = await api.post(ENDPOINTS.MANIFIESTOS.PDF_DELETE_PAGES, {
      folder_name: folderName,
      filename: filename,
      pages: pages
    })
    return response.data
  },

  /**
   * Dividir un PDF en dos partes
   * @param {string} folderName - Nombre de la carpeta
   * @param {string} filename - Nombre del archivo
   * @param {number} splitAtPage - Página donde dividir (1-indexed)
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} Resultado de la división
   */
  async splitPDF(folderName, filename, splitAtPage, options = {}) {
    const response = await api.post(ENDPOINTS.MANIFIESTOS.PDF_SPLIT, {
      folder_name: folderName,
      filename: filename,
      split_at_page: splitAtPage,
      part1_name: options.part1_name,
      part2_name: options.part2_name,
      keep_original: options.keep_original || false
    })
    return response.data
  },

  /**
   * Renombrar un PDF
   * @param {string} folderName - Nombre de la carpeta
   * @param {string} oldFilename - Nombre actual del archivo
   * @param {string} newFilename - Nuevo nombre del archivo
   * @returns {Promise<Object>} Resultado del renombrado
   */
  async renamePDF(folderName, oldFilename, newFilename) {
    const response = await api.post(ENDPOINTS.MANIFIESTOS.PDF_RENAME, {
      folder_name: folderName,
      old_filename: oldFilename,
      new_filename: newFilename
    })
    return response.data
  },

  /**
   * Renombrar múltiples PDFs usando un patrón
   * @param {string} folderName - Nombre de la carpeta
   * @param {string} pattern - Patrón de renombrado (ej: '{load_id}_{remesa}')
   * @returns {Promise<Object>} Resultado del renombrado masivo
   */
  async bulkRenamePDFs(folderName, pattern) {
    const response = await api.post(ENDPOINTS.MANIFIESTOS.PDF_BULK_RENAME, {
      folder_name: folderName,
      pattern: pattern
    })
    return response.data
  },

  /**
   * Obtener estadísticas de almacenamiento del usuario
   * @returns {Promise<Object>} Estadísticas de almacenamiento
   */
  async getStorageStats() {
    const response = await api.get(ENDPOINTS.MANIFIESTOS.STORAGE_STATS)
    return response.data
  },

  /**
   * Eliminar un PDF del sistema
   * @param {string} folderName - Nombre de la carpeta
   * @param {string} filename - Nombre del archivo
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deletePDF(folderName, filename) {
    const response = await api.delete(ENDPOINTS.MANIFIESTOS.PDF_DELETE, {
      data: {
        folder_name: folderName,
        filename: filename
      }
    })
    return response.data
  },

  /**
   * Eliminar una carpeta completa del sistema
   * @param {string} folderName - Nombre de la carpeta a eliminar
   * @param {string} folderType - Tipo de carpeta ('Manifiesto' o 'ManifiestoQRinfo'), por defecto 'Manifiesto'
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteFolder(folderName, folderType = 'Manifiesto') {
    const response = await api.delete(ENDPOINTS.MANIFIESTOS.FOLDER_DELETE(folderName), {
      params: {
        type: folderType
      }
    })
    return response.data
  },

  /**
   * Obtener manifiestos con todos sus datos desde Firestore
   * @param {string} folderName - Opcional: filtrar por nombre de carpeta
   * @returns {Promise<Object>} Manifiestos con datos completos
   */
  async getManifiestosData(folderName = null) {
    const params = folderName ? { folder_name: folderName } : {}
    // Agregar timestamp para evitar caché del navegador
    params._t = Date.now()
    const response = await api.get(ENDPOINTS.MANIFIESTOS.MANIFIESTOS_DATA, { params })
    return response.data
  },

  /**
   * Obtener lista única de conductores de los manifiestos
   * @returns {Promise<Object>} Lista de conductores únicos
   */
  async getConductores() {
    const response = await api.get('/manifiestos/conductores')
    return response.data
  },

  /**
   * Obtener lista única de placas de los manifiestos
   * @returns {Promise<Object>} Lista de placas únicas
   */
  async getPlacas() {
    const response = await api.get('/manifiestos/placas')
    return response.data
  },

  /**
   * Obtener estadísticas de manifiestos para gráficos de rendimiento
   * @param {string} period - Período: 'daily', 'weekly', 'monthly'
   * @param {number} days - Días a considerar (default: 30)
   * @returns {Promise<Object>} Estadísticas de ingresos y tiempos
   */
  async getManifiestosStats(period = 'daily', days = 30) {
    const params = { period, days }
    const response = await api.get('/manifiestos/stats', { params })
    return response.data
  },

  /**
   * 🔥 NUEVO: Obtener ingresos detallados por conductor con fechas específicas
   * @param {string} period - Período: 'daily', 'weekly', 'monthly'
   * @param {number} days - Días a considerar (default: 30)
   * @returns {Promise<Object>} Ingresos por conductor con detalles
   */
  async getIngresosByConductor(period = 'daily', days = 30) {
    const params = { period, days }
    const response = await api.get('/ingresos/conductor', { params })
    return response.data
  },

  /**
   * 🔥 NUEVO: Obtener ingresos detallados por carro (placa) con fechas específicas
   * @param {string} period - Período: 'daily', 'weekly', 'monthly'
   * @param {number} days - Días a considerar (default: 30)
   * @returns {Promise<Object>} Ingresos por carro con detalles
   */
  async getIngresosByCarro(period = 'daily', days = 30) {
    const params = { period, days }
    const response = await api.get('/ingresos/carro', { params })
    return response.data
  },
}

export default manifiestosService

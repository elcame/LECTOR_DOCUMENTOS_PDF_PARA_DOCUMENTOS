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
    const response = await api.get(ENDPOINTS.MANIFIESTOS.OVERVIEW, { params })
    return response.data
  },

  /**
   * Subir archivos PDF a una carpeta en el servidor
   * @param {string} folderName - Nombre de la carpeta de destino
   * @param {File[]} files - Archivos PDF
   */
  async uploadFolder(folderName, files) {
    const formData = new FormData()
    formData.append('folder_name', folderName)
    files.forEach((f) => formData.append('files', f))
    const response = await api.post(ENDPOINTS.MANIFIESTOS.UPLOAD_FOLDER, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
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
   * Fusionar páginas de un PDF en otro PDF
   * @param {object} mergeData - { source_folder, source_filename, target_folder, target_filename, pages }
   */
  async mergePDFPages(mergeData) {
    const response = await api.post(ENDPOINTS.MANIFIESTOS.PDF_MERGE, mergeData)
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
}

export default manifiestosService

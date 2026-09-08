import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const tiposManifiestoService = {
  async list(activeOnly = true) {
    const response = await api.get(ENDPOINTS.TIPOS_MANIFIESTO.BASE, {
      params: { active_only: activeOnly },
    })
    return response.data
  },

  async create(nombre) {
    const response = await api.post(ENDPOINTS.TIPOS_MANIFIESTO.BASE, { nombre })
    return response.data
  },

  async rename(id, nombre) {
    const response = await api.put(ENDPOINTS.TIPOS_MANIFIESTO.BY_ID(id), { nombre })
    return response.data
  },

  async deactivate(id) {
    const response = await api.delete(ENDPOINTS.TIPOS_MANIFIESTO.BY_ID(id))
    return response.data
  },

  async setFolderTipo(folderName, tipoId, applyToManifiestos = true) {
    const response = await api.post(ENDPOINTS.MANIFIESTOS.FOLDER_TIPO, {
      folder_name: folderName,
      tipo_id: tipoId,
      apply_to_manifiestos: applyToManifiestos,
    })
    return response.data
  },
}

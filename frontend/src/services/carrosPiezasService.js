import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const carrosPiezasService = {
  async list(carroId) {
    const response = await api.get(ENDPOINTS.CARROS.PIEZAS(carroId))
    return response.data
  },

  async history(carroId, positionId) {
    const response = await api.get(ENDPOINTS.CARROS.PIEZAS(carroId), {
      params: { history: true, position_id: positionId },
    })
    return response.data
  },

  async place(carroId, payload) {
    const response = await api.post(ENDPOINTS.CARROS.PIEZAS(carroId), payload)
    return response.data
  },

  async change(carroId, payload) {
    const response = await api.post(ENDPOINTS.CARROS.PIEZAS_CAMBIO(carroId), payload)
    return response.data
  },
}

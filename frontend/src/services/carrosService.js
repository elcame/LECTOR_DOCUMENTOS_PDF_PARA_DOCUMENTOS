import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const carrosService = {
  // Carros
  async getCarros(params = {}) {
    const response = await api.get(ENDPOINTS.CARROS.BASE, { params })
    return response.data
  },

  async createCar(data) {
    const response = await api.post(ENDPOINTS.CARROS.BASE, data)
    return response.data
  },

  async updateCar(id, data) {
    const response = await api.put(ENDPOINTS.CARROS.BY_ID(id), data)
    return response.data
  },

  async deleteCar(id) {
    const response = await api.delete(ENDPOINTS.CARROS.BY_ID(id))
    return response.data
  },

  async getCarroByPlaca(placa, options = {}) {
    const params = { placa, include_owner: true, ...options }
    const response = await api.get(ENDPOINTS.CARROS.BASE, { params })
    return response.data
  },

  async getCarrosFromManifestos() {
    const params = { include_owner: true, from_manifestos: true }
    const response = await api.get(ENDPOINTS.CARROS.BASE, { params })
    return response.data
  },

  async createCarrosBatch(placas) {
    const response = await api.post('/carros/batch', { placas })
    return response.data
  },

  // Propietarios
  async getPropietarios(params = {}) {
    const response = await api.get(ENDPOINTS.PROPIETARIOS.BASE, { params })
    return response.data
  },

  async createOwner(data) {
    const response = await api.post(ENDPOINTS.PROPIETARIOS.BASE, data)
    return response.data
  },

  async updateOwner(id, data) {
    const response = await api.put(ENDPOINTS.PROPIETARIOS.BY_ID(id), data)
    return response.data
  },

  async deleteOwner(id) {
    const response = await api.delete(ENDPOINTS.PROPIETARIOS.BY_ID(id))
    return response.data
  },
}

export default carrosService


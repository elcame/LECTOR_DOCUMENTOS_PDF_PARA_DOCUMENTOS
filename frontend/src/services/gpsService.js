import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const gpsService = {
  // Dispositivos
  async getDevices() {
    const response = await api.get(ENDPOINTS.GPS.DEVICES)
    return response.data
  },

  async registerDevice(data) {
    const response = await api.post(ENDPOINTS.GPS.DEVICES, data)
    return response.data
  },

  async getDevice(imei) {
    const response = await api.get(ENDPOINTS.GPS.DEVICE_BY_IMEI(imei))
    return response.data
  },

  async updateDevice(imei, data) {
    const response = await api.put(ENDPOINTS.GPS.DEVICE_BY_IMEI(imei), data)
    return response.data
  },

  // Ubicaciones
  async getLatestLocation(imei) {
    const response = await api.get(ENDPOINTS.GPS.LOCATION(imei))
    return response.data
  },

  async getAllLatestLocations() {
    const response = await api.get(ENDPOINTS.GPS.LOCATION_ALL)
    return response.data
  },

  async getHistory(imei, hours = 24, limit = 500) {
    const response = await api.get(ENDPOINTS.GPS.HISTORY(imei), {
      params: { hours, limit },
    })
    return response.data
  },

  // Servidor TCP
  async getServerStatus() {
    const response = await api.get(ENDPOINTS.GPS.SERVER_STATUS)
    return response.data
  },

  async startServer(port = 5001) {
    const response = await api.post(ENDPOINTS.GPS.SERVER_START, { port })
    return response.data
  },

  async stopServer() {
    const response = await api.post(ENDPOINTS.GPS.SERVER_STOP)
    return response.data
  },

  // Limpieza
  async cleanup(days = 30) {
    const response = await api.post(ENDPOINTS.GPS.CLEANUP, { days })
    return response.data
  },
}

export default gpsService

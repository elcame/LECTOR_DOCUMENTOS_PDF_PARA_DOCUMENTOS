import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const trailersService = {
  async list() {
    const res = await api.get(ENDPOINTS.TRAILERS.BASE)
    return res.data
  },
  async create({ plate }) {
    const res = await api.post(ENDPOINTS.TRAILERS.BASE, { plate })
    return res.data
  },
  async update(trailerId, { plate }) {
    const res = await api.put(ENDPOINTS.TRAILERS.BY_ID(trailerId), { plate })
    return res.data
  },
  async remove(trailerId) {
    const res = await api.delete(ENDPOINTS.TRAILERS.BY_ID(trailerId))
    return res.data
  },
  async listEvents(trailerId, { type } = {}) {
    const params = {}
    if (type) params.type = type
    const res = await api.get(ENDPOINTS.TRAILERS.EVENTS(trailerId), { params })
    return res.data
  },
  async createEvent(trailerId, payload) {
    const res = await api.post(ENDPOINTS.TRAILERS.EVENTS(trailerId), payload)
    return res.data
  },
  async getSummary(trailerId) {
    const res = await api.get(ENDPOINTS.TRAILERS.SUMMARY(trailerId))
    return res.data
  },
  async listTires(trailerId) {
    const res = await api.get(ENDPOINTS.TRAILERS.TIRES(trailerId))
    return res.data
  },
  async upsertTire(trailerId, positionId, payload) {
    const res = await api.put(ENDPOINTS.TRAILERS.TIRE_BY_POSITION(trailerId, positionId), payload)
    return res.data
  },
  async listTireItems(trailerId) {
    const res = await api.get(ENDPOINTS.TRAILERS.TIRE_ITEMS(trailerId))
    return res.data
  },
  async createTireItem(trailerId, { label } = {}) {
    const res = await api.post(ENDPOINTS.TRAILERS.TIRE_ITEMS(trailerId), { label })
    return res.data
  },
}


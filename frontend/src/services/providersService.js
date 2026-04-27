import api from '../api'
import { ENDPOINTS } from '../api/endpoints'

export const providersService = {
  async list() {
    const res = await api.get(ENDPOINTS.PROVIDERS.BASE)
    return res.data
  },
  async create({ name, phone, notes }) {
    const res = await api.post(ENDPOINTS.PROVIDERS.BASE, { name, phone, notes })
    return res.data
  },
  async listItems(providerId) {
    const res = await api.get(ENDPOINTS.PROVIDERS.ITEMS(providerId))
    return res.data
  },
  async createItem(providerId, { item_type, name, price }) {
    const res = await api.post(ENDPOINTS.PROVIDERS.ITEMS(providerId), { item_type, name, price })
    return res.data
  },
}


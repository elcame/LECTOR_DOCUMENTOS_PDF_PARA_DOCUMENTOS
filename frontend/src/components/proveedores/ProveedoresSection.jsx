import { useEffect, useMemo, useState } from 'react'
import { providersService } from '../../services/providersService'

const formatCurrency = (value) => {
  const n = Number(value || 0)
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function ProveedoresSection() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [providers, setProviders] = useState([])

  const [selectedProviderId, setSelectedProviderId] = useState('')
  const selectedProvider = useMemo(
    () => providers.find((p) => p.id === selectedProviderId) || null,
    [providers, selectedProviderId]
  )

  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsError, setItemsError] = useState('')

  const [newProvider, setNewProvider] = useState({ name: '', phone: '', notes: '' })
  const [savingProvider, setSavingProvider] = useState(false)

  const [newItem, setNewItem] = useState({ item_type: 'product', name: '', price: '' })
  const [savingItem, setSavingItem] = useState(false)

  const loadProviders = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await providersService.list()
      if (res?.success) {
        const list = res.data || []
        setProviders(list)
        if (!selectedProviderId && list.length > 0) setSelectedProviderId(list[0].id)
      } else {
        setError(res?.error || 'Error al cargar proveedores')
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  const loadItems = async (providerId) => {
    if (!providerId) return
    try {
      setItemsLoading(true)
      setItemsError('')
      const res = await providersService.listItems(providerId)
      if (res?.success) setItems(res.data || [])
      else setItemsError(res?.error || 'Error al cargar items')
    } catch (e) {
      setItemsError(e?.response?.data?.error || e?.message || 'Error al cargar items')
    } finally {
      setItemsLoading(false)
    }
  }

  useEffect(() => {
    loadProviders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedProviderId) loadItems(selectedProviderId)
    else setItems([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProviderId])

  const handleCreateProvider = async () => {
    const name = (newProvider.name || '').trim()
    if (!name) return
    try {
      setSavingProvider(true)
      setError('')
      const res = await providersService.create({
        name,
        phone: newProvider.phone,
        notes: newProvider.notes,
      })
      if (!res?.success) {
        setError(res?.error || 'No se pudo crear proveedor')
        return
      }
      setNewProvider({ name: '', phone: '', notes: '' })
      await loadProviders()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Error al crear proveedor')
    } finally {
      setSavingProvider(false)
    }
  }

  const handleCreateItem = async () => {
    if (!selectedProviderId) return
    const name = (newItem.name || '').trim()
    if (!name) return
    const price = Number(String(newItem.price || '').replace(/[^\d.]/g, '')) || 0
    try {
      setSavingItem(true)
      setItemsError('')
      const res = await providersService.createItem(selectedProviderId, {
        item_type: newItem.item_type,
        name,
        price,
      })
      if (!res?.success) {
        setItemsError(res?.error || 'No se pudo crear item')
        return
      }
      setNewItem({ item_type: newItem.item_type, name: '', price: '' })
      await loadItems(selectedProviderId)
    } catch (e) {
      setItemsError(e?.response?.data?.error || e?.message || 'Error al crear item')
    } finally {
      setSavingItem(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Nuevo proveedor</div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <input
                className="input w-full"
                placeholder="Nombre (requerido)"
                value={newProvider.name}
                onChange={(e) => setNewProvider((v) => ({ ...v, name: e.target.value }))}
              />
              <input
                className="input w-full"
                placeholder="Teléfono (opcional)"
                value={newProvider.phone}
                onChange={(e) => setNewProvider((v) => ({ ...v, phone: e.target.value }))}
              />
              <input
                className="input w-full"
                placeholder="Notas (opcional)"
                value={newProvider.notes}
                onChange={(e) => setNewProvider((v) => ({ ...v, notes: e.target.value }))}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateProvider}
                  disabled={savingProvider || !newProvider.name.trim()}
                >
                  {savingProvider ? 'Guardando…' : 'Guardar proveedor'}
                </button>
                <button type="button" className="btn btn-outline" onClick={loadProviders} disabled={loading || savingProvider}>
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
              Proveedores ({providers.length})
            </div>
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Cargando…</div>
            ) : providers.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No hay proveedores.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProviderId(p.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 ${
                      selectedProviderId === p.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      {p.phone ? p.phone : '—'} {p.notes ? `· ${p.notes}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {selectedProvider ? selectedProvider.name : 'Selecciona un proveedor'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Agrega productos o servicios del proveedor.
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                <select
                  className="input w-full"
                  value={newItem.item_type}
                  onChange={(e) => setNewItem((v) => ({ ...v, item_type: e.target.value }))}
                  disabled={!selectedProviderId}
                >
                  <option value="product">Producto (repuesto)</option>
                  <option value="service">Servicio (mantenimiento)</option>
                </select>
              </div>
              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                <input
                  className="input w-full"
                  value={newItem.name}
                  onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))}
                  disabled={!selectedProviderId}
                  placeholder="Ej: Pastillas de freno / Cambio de aceite"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Precio (opcional)</label>
                <input
                  className="input w-full"
                  value={newItem.price}
                  onChange={(e) => setNewItem((v) => ({ ...v, price: e.target.value }))}
                  disabled={!selectedProviderId}
                  placeholder="Ej: 350000"
                />
              </div>
              <div className="md:col-span-12 flex gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateItem}
                  disabled={!selectedProviderId || savingItem || !newItem.name.trim()}
                >
                  {savingItem ? 'Guardando…' : 'Agregar'}
                </button>
              </div>
            </div>

            {itemsError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                {itemsError}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
              Productos / Servicios ({items.length})
            </div>
            {itemsLoading ? (
              <div className="p-4 text-sm text-slate-500">Cargando…</div>
            ) : !selectedProviderId ? (
              <div className="p-4 text-sm text-slate-500">Selecciona un proveedor.</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">Sin items.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {items.map((it) => (
                  <div key={it.id} className="px-4 py-3 text-sm flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{it.name}</div>
                      <div className="text-xs text-slate-500">
                        {it.item_type === 'service' ? 'Servicio' : 'Producto'} · ID: {it.id}
                      </div>
                    </div>
                    <div className="shrink-0 font-semibold text-slate-900">
                      {Number(it.price || 0) ? formatCurrency(it.price) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


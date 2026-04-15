import { useState, useEffect, useRef, useCallback } from 'react'
import { gpsService } from '../services/gpsService'

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

// Colombia centro como default
const DEFAULT_CENTER = [4.570868, -74.297333]
const DEFAULT_ZOOM = 6

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L)

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = LEAFLET_CSS
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = LEAFLET_JS
    script.onload = () => resolve(window.L)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function GPSTracking() {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef({})
  const polylineRef = useRef(null)

  const [devices, setDevices] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [history, setHistory] = useState([])
  const [serverStatus, setServerStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyHours, setHistoryHours] = useState(24)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [newDevice, setNewDevice] = useState({ imei: '', name: '', placa: '', conductor: '' })

  // Inicializar mapa
  useEffect(() => {
    let cancelled = false
    loadLeaflet().then((L) => {
      if (cancelled || mapInstance.current) return
      const map = L.map(mapRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)
      mapInstance.current = map
    })
    return () => {
      cancelled = true
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  // Cargar datos
  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [devRes, locRes, statusRes] = await Promise.allSettled([
        gpsService.getDevices(),
        gpsService.getAllLatestLocations(),
        gpsService.getServerStatus(),
      ])

      if (devRes.status === 'fulfilled' && devRes.value.success) {
        setDevices(devRes.value.devices || [])
      }
      if (locRes.status === 'fulfilled' && locRes.value.success) {
        setLocations(locRes.value.locations || [])
      }
      if (statusRes.status === 'fulfilled') {
        setServerStatus(statusRes.value)
      }
    } catch (err) {
      setError('Error cargando datos GPS')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh cada 15 segundos
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  // Actualizar marcadores en el mapa
  useEffect(() => {
    if (!mapInstance.current || !window.L) return
    const L = window.L

    // Limpiar marcadores existentes
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    if (locations.length === 0) return

    const bounds = []
    locations.forEach((loc) => {
      if (!loc.latitude || !loc.longitude) return

      const latlng = [loc.latitude, loc.longitude]
      bounds.push(latlng)

      const isSelected = selectedDevice && loc.imei === selectedDevice
      const color = isSelected ? '#ef4444' : '#3b82f6'

      const icon = L.divIcon({
        className: 'gps-marker',
        html: `<div style="
          background:${color};width:14px;height:14px;border-radius:50%;
          border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const name = loc.device_name || loc.placa || loc.imei || 'Desconocido'
      const popup = `
        <div style="min-width:180px;font-family:system-ui">
          <strong>${name}</strong><br/>
          <span style="color:#666;font-size:12px">IMEI: ${loc.imei}</span><br/>
          ${loc.placa ? `<span>Placa: <b>${loc.placa}</b></span><br/>` : ''}
          ${loc.conductor ? `<span>Conductor: ${loc.conductor}</span><br/>` : ''}
          <hr style="margin:4px 0"/>
          <span>Vel: <b>${loc.speed || 0} km/h</b></span><br/>
          <span>Sat: ${loc.satellites || '?'}</span><br/>
          <span style="font-size:11px;color:#888">${loc.server_timestamp || ''}</span>
        </div>
      `

      const marker = L.marker(latlng, { icon }).addTo(mapInstance.current).bindPopup(popup)
      markersRef.current[loc.imei] = marker

      if (isSelected) marker.openPopup()
    })

    if (bounds.length > 0 && !selectedDevice) {
      mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [locations, selectedDevice])

  // Mostrar historial en el mapa
  useEffect(() => {
    if (!mapInstance.current || !window.L) return
    const L = window.L

    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    if (!showHistory || history.length < 2) return

    const coords = history
      .filter((h) => h.latitude && h.longitude)
      .map((h) => [h.latitude, h.longitude])

    if (coords.length < 2) return

    polylineRef.current = L.polyline(coords, {
      color: '#8b5cf6',
      weight: 3,
      opacity: 0.8,
      dashArray: '8, 6',
    }).addTo(mapInstance.current)

    mapInstance.current.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] })
  }, [history, showHistory])

  const handleSelectDevice = async (imei) => {
    setSelectedDevice(imei)
    setShowHistory(false)
    setHistory([])

    const loc = locations.find((l) => l.imei === imei)
    if (loc && mapInstance.current) {
      mapInstance.current.setView([loc.latitude, loc.longitude], 15)
    }
  }

  const handleShowHistory = async () => {
    if (!selectedDevice) return
    try {
      const res = await gpsService.getHistory(selectedDevice, historyHours)
      if (res.success) {
        setHistory(res.history || [])
        setShowHistory(true)
      }
    } catch (err) {
      console.error('Error cargando historial:', err)
    }
  }

  const handleToggleServer = async () => {
    try {
      if (serverStatus?.running) {
        await gpsService.stopServer()
      } else {
        await gpsService.startServer()
      }
      const res = await gpsService.getServerStatus()
      setServerStatus(res)
    } catch (err) {
      console.error('Error controlando servidor:', err)
    }
  }

  const handleRegisterDevice = async (e) => {
    e.preventDefault()
    try {
      const res = await gpsService.registerDevice(newDevice)
      if (res.success) {
        setShowRegisterModal(false)
        setNewDevice({ imei: '', name: '', placa: '', conductor: '' })
        fetchData()
      }
    } catch (err) {
      alert('Error registrando dispositivo: ' + (err.message || err))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-lg">
            📍
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">GPS Tracking</h1>
            <p className="text-sm text-gray-500">Rastreo en tiempo real de vehículos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Estado del servidor */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              serverStatus?.running
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus?.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            TCP {serverStatus?.running ? `Activo (:${serverStatus.port})` : 'Inactivo'}
          </div>
          <button
            onClick={handleToggleServer}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
              serverStatus?.running
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {serverStatus?.running ? 'Detener' : 'Iniciar'} Servidor
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            + Dispositivo
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Panel lateral */}
        <div className="w-80 bg-white border-r overflow-y-auto flex-shrink-0">
          {/* Dispositivos conectados */}
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-700 mb-2">
              Dispositivos ({devices.length})
            </h2>
            {loading ? (
              <p className="text-sm text-gray-400">Cargando...</p>
            ) : devices.length === 0 ? (
              <p className="text-sm text-gray-400">No hay dispositivos registrados</p>
            ) : (
              <div className="space-y-2">
                {devices.map((dev) => {
                  const loc = locations.find((l) => l.imei === dev.imei)
                  const isSelected = selectedDevice === dev.imei
                  return (
                    <button
                      key={dev.imei}
                      onClick={() => handleSelectDevice(dev.imei)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {dev.name || `GPS-${dev.imei.slice(-4)}`}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            loc ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                      </div>
                      {dev.placa && (
                        <span className="text-xs text-blue-600 font-mono">{dev.placa}</span>
                      )}
                      {loc && (
                        <div className="mt-1 text-xs text-gray-500">
                          {loc.speed || 0} km/h &middot; {loc.satellites || '?'} sat
                        </div>
                      )}
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        {dev.imei}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Panel de historial */}
          {selectedDevice && (
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-700 mb-2">Historial de ruta</h3>
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={historyHours}
                  onChange={(e) => setHistoryHours(Number(e.target.value))}
                  className="flex-1 text-sm border rounded-lg px-2 py-1.5"
                >
                  <option value={1}>Última hora</option>
                  <option value={6}>Últimas 6 horas</option>
                  <option value={12}>Últimas 12 horas</option>
                  <option value={24}>Últimas 24 horas</option>
                  <option value={48}>Últimas 48 horas</option>
                  <option value={168}>Última semana</option>
                </select>
                <button
                  onClick={handleShowHistory}
                  className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                >
                  Ver
                </button>
              </div>
              {showHistory && (
                <div className="text-sm text-gray-600">
                  <span className="text-purple-600 font-medium">
                    {history.length} puntos
                  </span>{' '}
                  en ruta
                  <button
                    onClick={() => {
                      setShowHistory(false)
                      setHistory([])
                    }}
                    className="ml-2 text-xs text-red-500 hover:underline"
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Info del servidor */}
          {serverStatus && (
            <div className="p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Servidor TCP</h3>
              <div className="text-sm space-y-1 text-gray-600">
                <p>
                  Estado:{' '}
                  <span className={serverStatus.running ? 'text-green-600' : 'text-red-600'}>
                    {serverStatus.running ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
                {serverStatus.running && (
                  <>
                    <p>Puerto: {serverStatus.port}</p>
                    <p>Conectados: {serverStatus.connected_count || 0}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mapa */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded-lg shadow text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Modal registrar dispositivo */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Registrar Dispositivo GPS</h2>
            <form onSubmit={handleRegisterDevice} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IMEI (15 dígitos) *
                </label>
                <input
                  type="text"
                  maxLength={15}
                  required
                  value={newDevice.imei}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, imei: e.target.value.replace(/\D/g, '') })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="123456789012345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Camión 01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                <input
                  type="text"
                  value={newDevice.placa}
                  onChange={(e) => setNewDevice({ ...newDevice, placa: e.target.value.toUpperCase() })}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="ABC123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conductor</label>
                <input
                  type="text"
                  value={newDevice.conductor}
                  onChange={(e) => setNewDevice({ ...newDevice, conductor: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Registrar
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

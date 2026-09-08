import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import carrosService from '../../services/carrosService'
import { carrosPiezasService } from '../../services/carrosPiezasService'
import { ROUTES } from '../../config/constants'
import EstadoStage from '../../components/carros/estado/EstadoStage'
import LlantaModal from '../../components/carros/piezas/LlantaModal'
import { PIEZAS_CATALOG, isLlanta } from '../../components/carros/piezas/piezasCatalog'
import { piezaAgeColor } from '../../components/carros/piezas/piezaAge'
import { DEFAULT_PAINT_COLOR, normalizePaintColor } from '../../components/carros/tractomula-3d/paint/paintColor'

export default function CarroEstadoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [carro, setCarro] = useState(null)
  const [vehiculos, setVehiculos] = useState([])
  const [catalog, setCatalog] = useState(PIEZAS_CATALOG)
  const [activas, setActivas] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [llantaOpen, setLlantaOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingColor, setSavingColor] = useState(false)
  const [paintColor, setPaintColor] = useState(DEFAULT_PAINT_COLOR)
  const [needsColorSetup, setNeedsColorSetup] = useState(false)
  const [error, setError] = useState('')
  const paintSaveTimer = useRef(null)

  const activaMap = useMemo(() => {
    const map = {}
    for (const item of activas) map[item.position_id] = item
    return map
  }, [activas])

  const colors = useMemo(() => {
    const map = {}
    for (const item of catalog) {
      map[item.position_id] = piezaAgeColor(activaMap[item.position_id]?.installed_at)
    }
    return map
  }, [catalog, activaMap])

  const applyPaintToFleet = useCallback((carId, color) => {
    setVehiculos((prev) => prev.map((car) => (
      car.id === carId ? { ...car, paint_color: color } : car
    )))
  }, [])

  const persistPaintColor = useCallback(async (hex) => {
    const color = normalizePaintColor(hex) || DEFAULT_PAINT_COLOR
    setSavingColor(true)
    setError('')
    try {
      await carrosService.updateCar(id, { paint_color: color })
      setPaintColor(color)
      setCarro((prev) => (prev ? { ...prev, paint_color: color } : prev))
      applyPaintToFleet(id, color)
      setNeedsColorSetup(false)
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el color')
    } finally {
      setSavingColor(false)
    }
  }, [id, applyPaintToFleet])

  const load = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError('')
      const [carRes, piezasRes, fleetRes] = await Promise.all([
        carrosService.getCarro(id, { include_owner: true }),
        carrosPiezasService.list(id),
        carrosService.getCarros({ include_owner: true }),
      ])
      const nextCar = carRes.data || carRes.carro || null
      const savedColor = normalizePaintColor(nextCar?.paint_color)
      setCarro(nextCar)
      setVehiculos(fleetRes.carros || [])
      setCatalog(piezasRes?.data?.catalog || PIEZAS_CATALOG)
      setActivas(piezasRes?.data?.activas || [])
      setPaintColor(savedColor || DEFAULT_PAINT_COLOR)
      setNeedsColorSetup(!savedColor)
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el vehículo')
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadHistory = useCallback(async (positionId) => {
    if (!id || !positionId) {
      setHistory([])
      return
    }
    try {
      const res = await carrosPiezasService.history(id, positionId)
      setHistory(res?.data || [])
    } catch {
      setHistory([])
    }
  }, [id])

  useEffect(() => {
    setSelectedId(null)
    setLlantaOpen(false)
    setCarro(null)
    setNeedsColorSetup(false)
    load()
  }, [load])

  useEffect(() => {
    loadHistory(selectedId)
  }, [selectedId, loadHistory, activas])

  useEffect(() => () => {
    if (paintSaveTimer.current) clearTimeout(paintSaveTimer.current)
  }, [id])

  const handleSelect = (positionId) => {
    setSelectedId(positionId)
    setLlantaOpen(isLlanta(positionId))
  }

  const handlePaintColorChange = (hex) => {
    setPaintColor(hex)
    if (needsColorSetup) return
    if (paintSaveTimer.current) clearTimeout(paintSaveTimer.current)
    paintSaveTimer.current = setTimeout(() => {
      persistPaintColor(hex)
    }, 400)
  }

  const handlePlace = async (payload) => {
    setSaving(true)
    setError('')
    try {
      await carrosPiezasService.place(id, { position_id: selectedId, ...payload })
      const piezasRes = await carrosPiezasService.list(id)
      setCatalog(piezasRes?.data?.catalog || PIEZAS_CATALOG)
      setActivas(piezasRes?.data?.activas || [])
    } catch (err) {
      setError(err?.message || 'No se pudo colocar la pieza')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = async (payload) => {
    setSaving(true)
    setError('')
    try {
      await carrosPiezasService.change(id, { position_id: selectedId, ...payload })
      const piezasRes = await carrosPiezasService.list(id)
      setCatalog(piezasRes?.data?.catalog || PIEZAS_CATALOG)
      setActivas(piezasRes?.data?.activas || [])
    } catch (err) {
      setError(err?.message || 'No se pudo registrar el cambio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col md:h-screen">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.08] bg-[#0b1220] px-4 py-2.5 sm:px-5">
        <Link to={ROUTES.CARROS} className="text-sm text-sky-400 hover:text-sky-300">← Volver</Link>
        <h1 className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">
          {carro?.placa || 'Vehículo'}{carro?.modelo ? ` · ${carro.modelo}` : ''}
        </h1>
      </div>
      <div className="min-h-0 flex-1 p-2 sm:p-3 [&>*]:h-full">
        {loading && !carro ? (
          <p className="px-2 text-sm text-slate-400">Cargando tractomula...</p>
        ) : (
          <EstadoStage
            key={id}
            colors={colors}
            selectedId={selectedId}
            onSelect={handleSelect}
            catalog={catalog}
            activa={activaMap[selectedId]}
            history={history}
            saving={saving}
            error={error}
            onPlace={handlePlace}
            onChange={handleChange}
            vehiculos={vehiculos}
            currentId={id}
            onSelectVehiculo={(carId) => {
              if (carId !== id) navigate(ROUTES.CARRO_ESTADO(carId))
            }}
            placa={carro?.placa}
            paintColor={paintColor}
            onPaintColorChange={handlePaintColorChange}
            needsColorSetup={needsColorSetup}
            onSavePaintColor={persistPaintColor}
            savingColor={savingColor}
          />
        )}
      </div>
      {llantaOpen && selectedId && (
        <LlantaModal
          positionId={selectedId}
          catalog={catalog}
          activa={activaMap[selectedId]}
          saving={saving}
          error={error}
          onPlace={handlePlace}
          onChange={handleChange}
          onClose={() => setLlantaOpen(false)}
        />
      )}
    </div>
  )
}

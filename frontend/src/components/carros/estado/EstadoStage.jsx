import { useCallback, useState } from 'react'
import TractomulaViewport from '../tractomula-3d/TractomulaViewport'
import PiezasDrawer from './drawer/PiezasDrawer'
import ColorSetupGate from './paint/ColorSetupGate'
import VehiculosMenu from './vehiculos/VehiculosMenu'

export default function EstadoStage({
  colors,
  selectedId,
  onSelect,
  catalog,
  activa,
  history,
  saving,
  error,
  onPlace,
  onChange,
  vehiculos,
  currentId,
  onSelectVehiculo,
  placa,
  paintColor,
  onPaintColorChange,
  needsColorSetup,
  onSavePaintColor,
  savingColor,
}) {
  const [piezasOpen, setPiezasOpen] = useState(false)
  const [vehiculosOpen, setVehiculosOpen] = useState(false)

  const handleSelect = useCallback(
    (positionId) => {
      setVehiculosOpen(false)
      setPiezasOpen(true)
      onSelect(positionId)
    },
    [onSelect],
  )

  const handleTogglePiezas = () => {
    setPiezasOpen((value) => {
      const next = !value
      if (next) setVehiculosOpen(false)
      return next
    })
  }

  const handleToggleVehiculos = () => {
    setVehiculosOpen((value) => {
      const next = !value
      if (next) setPiezasOpen(false)
      return next
    })
  }

  return (
    <TractomulaViewport
      colors={colors}
      selectedId={selectedId}
      onSelect={handleSelect}
      paintColor={paintColor}
      onPaintColorChange={onPaintColorChange}
      showPaintPicker={!needsColorSetup}
      controlsOffsetLeft={vehiculosOpen ? 300 : 12}
      controlsOffsetRight={piezasOpen ? 336 : 12}
    >
      <VehiculosMenu
        open={vehiculosOpen}
        onToggle={handleToggleVehiculos}
        onClose={() => setVehiculosOpen(false)}
        vehiculos={vehiculos}
        currentId={currentId}
        onSelect={(carId) => {
          setVehiculosOpen(false)
          onSelectVehiculo(carId)
        }}
      />
      <PiezasDrawer
        open={piezasOpen}
        onToggle={handleTogglePiezas}
        onClose={() => setPiezasOpen(false)}
        catalog={catalog}
        selectedId={selectedId}
        colors={colors}
        onSelect={handleSelect}
        activa={activa}
        history={history}
        saving={saving}
        error={error}
        onPlace={onPlace}
        onChange={onChange}
      />
      {needsColorSetup ? (
        <ColorSetupGate
          placa={placa}
          value={paintColor}
          onChange={onPaintColorChange}
          onSave={onSavePaintColor}
          saving={savingColor}
        />
      ) : null}
    </TractomulaViewport>
  )
}

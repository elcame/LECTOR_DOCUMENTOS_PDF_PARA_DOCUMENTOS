import ClickablePart from './parts/ClickablePart'
import DualWheels from './parts/DualWheels'
import SideBandas from './parts/SideBandas'
import Wheel from './parts/Wheel'
import TractomulaBody from './TractomulaBody'

export default function TractomulaModel({ colors = {}, selectedId, onSelect }) {
  return (
    <group>
      <TractomulaBody />

      <ClickablePart positionId="LIGHT_L" selectedId={selectedId} color={colors.LIGHT_L || '#fde68a'} onSelect={onSelect} position={[-4.05, 0.78, 0.62]}>
        <boxGeometry args={[0.08, 0.16, 0.26]} />
      </ClickablePart>
      <ClickablePart positionId="LIGHT_R" selectedId={selectedId} color={colors.LIGHT_R || '#fde68a'} onSelect={onSelect} position={[-4.05, 0.78, -0.62]}>
        <boxGeometry args={[0.08, 0.16, 0.26]} />
      </ClickablePart>

      <ClickablePart positionId="MIRROR_L" selectedId={selectedId} color={colors.MIRROR_L || '#d7dde4'} onSelect={onSelect} position={[-1.12, 1.78, 1.18]} visual="chrome">
        <boxGeometry args={[0.07, 0.48, 0.2]} />
      </ClickablePart>
      <ClickablePart positionId="MIRROR_R" selectedId={selectedId} color={colors.MIRROR_R || '#d7dde4'} onSelect={onSelect} position={[-1.12, 1.78, -1.18]} visual="chrome">
        <boxGeometry args={[0.07, 0.48, 0.2]} />
      </ClickablePart>

      <ClickablePart
        positionId="TANK"
        selectedId={selectedId}
        color={colors.TANK || '#d7dde4'}
        onSelect={onSelect}
        position={[0.85, 0.7, 1.15]}
        rotation={[0, 0, Math.PI / 2]}
        visual="chrome"
      >
        <cylinderGeometry args={[0.3, 0.3, 1.3, 32]} />
      </ClickablePart>

      <ClickablePart positionId="EXHAUST" selectedId={selectedId} color={colors.EXHAUST || '#d7dde4'} onSelect={onSelect} position={[0.35, 1.85, -1.05]} visual="chrome">
        <cylinderGeometry args={[0.09, 0.09, 2.55, 20]} />
      </ClickablePart>

      <ClickablePart positionId="BATTERY_1" selectedId={selectedId} color={colors.BATTERY_1 || '#27272a'} onSelect={onSelect} position={[0.55, 0.52, -0.92]}>
        <boxGeometry args={[0.36, 0.24, 0.26]} />
      </ClickablePart>
      <ClickablePart positionId="BATTERY_2" selectedId={selectedId} color={colors.BATTERY_2 || '#27272a'} onSelect={onSelect} position={[0.95, 0.52, -0.92]}>
        <boxGeometry args={[0.36, 0.24, 0.26]} />
      </ClickablePart>

      <ClickablePart positionId="OIL_FILTER" selectedId={selectedId} color={colors.OIL_FILTER || '#b45309'} onSelect={onSelect} position={[-2.35, 0.52, 0.52]}>
        <cylinderGeometry args={[0.11, 0.11, 0.26, 16]} />
      </ClickablePart>

      <SideBandas x={2.15} z={0.55} axle="D1" side="L" colors={colors} selectedId={selectedId} onSelect={onSelect} />
      <SideBandas x={2.15} z={-0.55} axle="D1" side="R" colors={colors} selectedId={selectedId} onSelect={onSelect} />
      <SideBandas x={3.25} z={0.55} axle="D2" side="L" colors={colors} selectedId={selectedId} onSelect={onSelect} />
      <SideBandas x={3.25} z={-0.55} axle="D2" side="R" colors={colors} selectedId={selectedId} onSelect={onSelect} />

      <ClickablePart positionId="RODAJA_1" selectedId={selectedId} color={colors.RODAJA_1 || '#d7dde4'} onSelect={onSelect} position={[2.15, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} visual="chrome">
        <cylinderGeometry args={[0.2, 0.2, 0.07, 28]} />
      </ClickablePart>
      <ClickablePart positionId="RODAJA_2" selectedId={selectedId} color={colors.RODAJA_2 || '#d7dde4'} onSelect={onSelect} position={[3.2, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} visual="chrome">
        <cylinderGeometry args={[0.2, 0.2, 0.07, 28]} />
      </ClickablePart>

      <Wheel x={-3.15} z={0.95} tireId="TIRE_L_STEER" rimId="RIM_L_STEER" colors={colors} selectedId={selectedId} onSelect={onSelect} radius={0.55} />
      <Wheel x={-3.15} z={-0.95} tireId="TIRE_R_STEER" rimId="RIM_R_STEER" colors={colors} selectedId={selectedId} onSelect={onSelect} radius={0.55} />

      <DualWheels x={2.15} outerZ={1.18} axle="D1" side="L" colors={colors} selectedId={selectedId} onSelect={onSelect} />
      <DualWheels x={2.15} outerZ={-1.18} axle="D1" side="R" colors={colors} selectedId={selectedId} onSelect={onSelect} />
      <DualWheels x={3.25} outerZ={1.18} axle="D2" side="L" colors={colors} selectedId={selectedId} onSelect={onSelect} />
      <DualWheels x={3.25} outerZ={-1.18} axle="D2" side="R" colors={colors} selectedId={selectedId} onSelect={onSelect} />

      <group position={[1.15, 1.38, 0]} rotation={[0, 0, Math.PI / 2]}>
        <ClickablePart positionId="TIRE_SPARE" selectedId={selectedId} color={colors.TIRE_SPARE || '#1a1d21'} onSelect={onSelect} visual="rubber">
          <torusGeometry args={[0.34, 0.1, 12, 28]} />
        </ClickablePart>
      </group>
    </group>
  )
}

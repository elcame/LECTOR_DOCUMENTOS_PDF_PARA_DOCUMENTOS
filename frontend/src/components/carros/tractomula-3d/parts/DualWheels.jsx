import Wheel from './Wheel'

export default function DualWheels({ x, outerZ, axle, side, colors, selectedId, onSelect }) {
  const sign = outerZ > 0 ? 1 : -1
  const innerZ = outerZ - sign * 0.38
  return (
    <group>
      <mesh position={[x, 0.52, (outerZ + innerZ) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, Math.abs(outerZ - innerZ) + 0.12, 12]} />
        <meshStandardMaterial color="#3f3f46" metalness={0.4} roughness={0.45} />
      </mesh>
      <Wheel
        x={x}
        z={outerZ}
        tireId={`TIRE_${side}_${axle}_O`}
        rimId={`RIM_${side}_${axle}_O`}
        colors={colors}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <Wheel
        x={x}
        z={innerZ}
        tireId={`TIRE_${side}_${axle}_I`}
        rimId={`RIM_${side}_${axle}_I`}
        colors={colors}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </group>
  )
}

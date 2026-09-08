import { AGE_COLORS } from '../../piezas/piezaAge'
import ClickablePart from './ClickablePart'
import StatusRing from './StatusRing'
import useWheelTextures from './useWheelTextures'

const FACE = [Math.PI / 2, 0, 0]

export default function Wheel({
  x,
  z,
  radius = 0.56,
  width = 0.36,
  tireId,
  rimId,
  colors,
  selectedId,
  onSelect,
}) {
  const { tread, rim } = useWheelTextures()
  const tireColor = colors[tireId] || AGE_COLORS.empty
  const rimColor = colors[rimId] || AGE_COLORS.empty
  const tireHas = tireColor !== AGE_COLORS.empty
  const rimHas = rimColor !== AGE_COLORS.empty
  const outward = z >= 0 ? 1 : -1

  return (
    <group position={[x, radius, z]}>
      <ClickablePart
        positionId={tireId}
        selectedId={selectedId}
        color={tireColor}
        onSelect={onSelect}
        visual="rubber"
        map={tread}
      >
        <torusGeometry args={[radius * 0.78, width * 0.48, 22, 64]} />
      </ClickablePart>
      {[0.92, 1, 1.08].map((scale) => (
        <mesh key={scale} scale={[scale, scale, 1]}>
          <torusGeometry args={[radius * 0.78, width * 0.06, 8, 64]} />
          <meshStandardMaterial color="#0a0b0d" roughness={0.95} />
        </mesh>
      ))}
      <ClickablePart
        positionId={rimId}
        selectedId={selectedId}
        color={rimColor}
        onSelect={onSelect}
        visual="chrome"
        rotation={FACE}
      >
        <cylinderGeometry args={[radius * 0.5, radius * 0.5, width * 0.22, 48]} />
      </ClickablePart>
      <mesh position={[0, 0, outward * width * 0.14]} rotation={[0, z < 0 ? Math.PI : 0, 0]}>
        <circleGeometry args={[radius * 0.5, 48]} />
        <meshPhysicalMaterial
          map={rim}
          metalness={0.85}
          roughness={0.18}
          envMapIntensity={1.4}
        />
      </mesh>
      <mesh position={[0, 0, outward * width * 0.16]}>
        <circleGeometry args={[radius * 0.17, 32]} />
        <meshPhysicalMaterial color="#b91c1c" metalness={0.55} roughness={0.22} clearcoat={0.4} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2
        const r = radius * 0.28
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, Math.sin(angle) * r, outward * width * 0.17]}
            rotation={FACE}
          >
            <cylinderGeometry args={[0.025, 0.025, 0.04, 10]} />
            <meshPhysicalMaterial color="#d7dde4" metalness={1} roughness={0.12} />
          </mesh>
        )
      })}
      <StatusRing
        show={tireHas || rimHas}
        color={tireHas ? tireColor : rimColor}
        radius={radius * 0.98}
        selected={selectedId === tireId || selectedId === rimId}
      />
    </group>
  )
}

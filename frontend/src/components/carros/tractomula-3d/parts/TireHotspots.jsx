import { tireHotspotsFromSize } from '../muleModels'

export default function TireHotspots({ size, selectedId, onSelect }) {
  if (!size) return null
  const spots = tireHotspotsFromSize(size)

  return (
    <group>
      {spots.map((spot) => (
        <mesh
          key={spot.id}
          position={spot.position}
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(spot.id)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          <sphereGeometry args={[spot.radius, 16, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

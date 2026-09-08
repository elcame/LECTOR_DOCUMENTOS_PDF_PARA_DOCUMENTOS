import { ChromeMaterial, RubberMaterial } from '../materials'

export default function ClickablePart({
  positionId,
  selectedId,
  color,
  onSelect,
  children,
  position,
  rotation,
  visual = 'status',
  map,
}) {
  const isSelected = selectedId === positionId
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(positionId)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      {children}
      {visual === 'chrome' ? (
        <ChromeMaterial color={isSelected ? color : '#d7dde4'} />
      ) : visual === 'rubber' ? (
        <RubberMaterial map={map} />
      ) : (
        <meshStandardMaterial
          color={color}
          metalness={0.35}
          roughness={0.4}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.28 : 0}
        />
      )}
    </mesh>
  )
}

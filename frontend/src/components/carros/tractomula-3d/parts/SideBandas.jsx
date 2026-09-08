import ClickablePart from './ClickablePart'

export default function SideBandas({ x, z, axle, side, colors, selectedId, onSelect }) {
  const up = `BANDA_${axle}_${side}_UP`
  const down = `BANDA_${axle}_${side}_DOWN`
  const springUp = `BANDA_SPRING_${axle}_${side}_UP`
  const springDown = `BANDA_SPRING_${axle}_${side}_DOWN`
  return (
    <group position={[x, 0, z]}>
      <ClickablePart positionId={up} selectedId={selectedId} color={colors[up] || '#3f3f46'} onSelect={onSelect} position={[0, 0.86, 0]}>
        <boxGeometry args={[0.36, 0.08, 0.22]} />
      </ClickablePart>
      <ClickablePart positionId={down} selectedId={selectedId} color={colors[down] || '#3f3f46'} onSelect={onSelect} position={[0, 0.3, 0]}>
        <boxGeometry args={[0.36, 0.08, 0.22]} />
      </ClickablePart>
      <ClickablePart positionId={springUp} selectedId={selectedId} color={colors[springUp] || '#a1a1aa'} onSelect={onSelect} position={[0, 0.64, 0]} visual="chrome">
        <cylinderGeometry args={[0.04, 0.04, 0.2, 10]} />
      </ClickablePart>
      <ClickablePart positionId={springDown} selectedId={selectedId} color={colors[springDown] || '#a1a1aa'} onSelect={onSelect} position={[0, 0.46, 0]} visual="chrome">
        <cylinderGeometry args={[0.04, 0.04, 0.16, 10]} />
      </ClickablePart>
    </group>
  )
}

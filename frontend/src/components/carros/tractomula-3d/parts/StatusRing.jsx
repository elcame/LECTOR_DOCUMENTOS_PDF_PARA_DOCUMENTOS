export default function StatusRing({ show, color, radius, selected }) {
  if (!show && !selected) return null
  return (
    <mesh>
      <torusGeometry args={[radius + 0.045, selected ? 0.03 : 0.018, 10, 48]} />
      <meshStandardMaterial
        color={selected ? '#38bdf8' : color}
        emissive={selected ? '#38bdf8' : color}
        emissiveIntensity={selected ? 0.75 : 0.35}
      />
    </mesh>
  )
}

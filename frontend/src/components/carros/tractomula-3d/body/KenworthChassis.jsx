import { ChromeMaterial, PaintMaterial } from '../materials'

export default function KenworthChassis() {
  return (
    <group>
      <mesh position={[1.55, 0.46, 0.28]} receiveShadow>
        <boxGeometry args={[5.1, 0.16, 0.16]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.5} roughness={0.38} />
      </mesh>
      <mesh position={[1.55, 0.46, -0.28]} receiveShadow>
        <boxGeometry args={[5.1, 0.16, 0.16]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.5} roughness={0.38} />
      </mesh>
      <mesh position={[2.7, 0.92, 0]} castShadow>
        <boxGeometry args={[2.4, 0.12, 1.15]} />
        <meshStandardMaterial color="#111827" roughness={0.7} />
      </mesh>
      <mesh position={[2.75, 1.02, 0]} rotation={[-0.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 28]} />
        <meshStandardMaterial color="#0b0f16" roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh position={[0.85, 0.7, -1.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 1.3, 36]} />
        <ChromeMaterial />
      </mesh>
      <mesh position={[0.35, 1.85, 1.05]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 2.55, 22]} />
        <ChromeMaterial />
      </mesh>
      <mesh position={[0.35, 3.18, 1.05]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.28, 16]} />
        <ChromeMaterial />
      </mesh>
      <mesh position={[0.35, 3.18, -1.05]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.28, 16]} />
        <ChromeMaterial />
      </mesh>
      <mesh position={[3.55, 0.72, 1.22]} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.42]} />
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
      <mesh position={[3.55, 0.72, -1.22]} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.42]} />
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
      <mesh position={[2.7, 1.05, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.07, 10, 22, Math.PI]} />
        <PaintMaterial color="#1e3a8a" />
      </mesh>
      <mesh position={[2.7, 1.05, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.07, 10, 22, Math.PI]} />
        <PaintMaterial color="#1e3a8a" />
      </mesh>
    </group>
  )
}

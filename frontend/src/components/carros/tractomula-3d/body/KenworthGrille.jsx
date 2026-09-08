import { RoundedBox } from '@react-three/drei'
import { ChromeMaterial } from '../materials'

export default function KenworthGrille() {
  const slats = Array.from({ length: 11 }, (_, i) => -0.55 + i * 0.11)
  return (
    <group>
      <RoundedBox args={[0.14, 0.95, 1.58]} radius={0.03} smoothness={3} position={[-4.12, 1.02, 0]} castShadow>
        <ChromeMaterial />
      </RoundedBox>
      <mesh position={[-4.16, 1.02, 0]}>
        <boxGeometry args={[0.05, 0.78, 1.28]} />
        <meshStandardMaterial color="#1f2937" metalness={0.55} roughness={0.35} />
      </mesh>
      {slats.map((z) => (
        <mesh key={z} position={[-4.19, 1.02, z]}>
          <boxGeometry args={[0.03, 0.72, 0.035]} />
          <ChromeMaterial color="#e8eef3" />
        </mesh>
      ))}
      <mesh position={[-4.2, 1.48, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.42]} />
        <meshStandardMaterial color="#b91c1c" metalness={0.35} roughness={0.3} />
      </mesh>
      <RoundedBox args={[0.32, 0.3, 2.05]} radius={0.05} smoothness={4} position={[-4.08, 0.4, 0]} castShadow>
        <ChromeMaterial />
      </RoundedBox>
      <mesh position={[-4.22, 0.4, 0.72]}>
        <boxGeometry args={[0.08, 0.16, 0.18]} />
        <ChromeMaterial />
      </mesh>
      <mesh position={[-4.22, 0.4, -0.72]}>
        <boxGeometry args={[0.08, 0.16, 0.18]} />
        <ChromeMaterial />
      </mesh>
    </group>
  )
}

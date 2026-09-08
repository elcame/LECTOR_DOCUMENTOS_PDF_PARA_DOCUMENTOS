import { RoundedBox } from '@react-three/drei'
import { ChromeMaterial, GlassMaterial, PaintMaterial } from '../materials'

export default function KenworthCab() {
  return (
    <group>
      <RoundedBox args={[1.48, 1.78, 1.95]} radius={0.08} smoothness={5} position={[-0.42, 1.68, 0]} castShadow>
        <PaintMaterial />
      </RoundedBox>
      <RoundedBox args={[1.35, 1.55, 1.95]} radius={0.08} smoothness={5} position={[0.85, 1.58, 0]} castShadow>
        <PaintMaterial />
      </RoundedBox>
      <mesh position={[-0.92, 2.02, 0]} rotation={[0, 0, -0.28]}>
        <boxGeometry args={[0.07, 0.92, 1.68]} />
        <GlassMaterial />
      </mesh>
      <mesh position={[-0.22, 2.02, 0.99]}>
        <boxGeometry args={[1.05, 0.78, 0.05]} />
        <GlassMaterial />
      </mesh>
      <mesh position={[-0.22, 2.02, -0.99]}>
        <boxGeometry args={[1.05, 0.78, 0.05]} />
        <GlassMaterial />
      </mesh>
      <mesh position={[0.85, 2.05, 0.99]}>
        <boxGeometry args={[0.7, 0.55, 0.05]} />
        <GlassMaterial />
      </mesh>
      <mesh position={[0.85, 2.05, -0.99]}>
        <boxGeometry args={[0.7, 0.55, 0.05]} />
        <GlassMaterial />
      </mesh>
      <RoundedBox args={[2.55, 0.1, 1.72]} radius={0.03} smoothness={3} position={[0.22, 2.55, 0]}>
        <PaintMaterial />
      </RoundedBox>
      {[ -0.7, 0, 0.7].map((z) => (
        <mesh key={z} position={[-0.55, 2.62, z]}>
          <boxGeometry args={[0.12, 0.06, 0.18]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.35} />
        </mesh>
      ))}

      <mesh position={[-1.12, 0.58, 1.02]} castShadow>
        <boxGeometry args={[0.58, 0.07, 0.32]} />
        <ChromeMaterial color="#b8c0c8" />
      </mesh>
      <mesh position={[-1.12, 0.4, 1.02]} castShadow>
        <boxGeometry args={[0.48, 0.07, 0.32]} />
        <ChromeMaterial color="#b8c0c8" />
      </mesh>
      <mesh position={[-1.12, 0.58, -1.02]} castShadow>
        <boxGeometry args={[0.58, 0.07, 0.32]} />
        <ChromeMaterial color="#b8c0c8" />
      </mesh>
      <mesh position={[-1.12, 0.4, -1.02]} castShadow>
        <boxGeometry args={[0.48, 0.07, 0.32]} />
        <ChromeMaterial color="#b8c0c8" />
      </mesh>
    </group>
  )
}

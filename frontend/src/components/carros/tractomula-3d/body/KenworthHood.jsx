import { RoundedBox } from '@react-three/drei'
import { ChromeMaterial, PaintMaterial } from '../materials'

function Stripe({ z }) {
  return (
    <mesh position={[-2.35, 0.78, z]}>
      <boxGeometry args={[2.7, 0.03, 0.025]} />
      <meshStandardMaterial color="#b91c1c" metalness={0.35} roughness={0.3} />
    </mesh>
  )
}

export default function KenworthHood() {
  return (
    <group>
      <RoundedBox args={[2.7, 0.88, 1.72]} radius={0.1} smoothness={5} position={[-2.38, 1.18, 0]} castShadow>
        <PaintMaterial />
      </RoundedBox>
      <mesh position={[-3.62, 1.02, 0]} rotation={[0, 0, -0.22]} castShadow>
        <boxGeometry args={[0.95, 0.58, 1.58]} />
        <PaintMaterial />
      </mesh>
      <RoundedBox args={[2.15, 0.08, 1.42]} radius={0.03} smoothness={3} position={[-2.28, 1.64, 0]} castShadow>
        <PaintMaterial />
      </RoundedBox>
      <Stripe z={0.87} />
      <Stripe z={-0.87} />

      <mesh position={[-3.15, 0.92, 0.98]} scale={[1.45, 0.78, 0.52]} castShadow>
        <sphereGeometry args={[0.62, 22, 16]} />
        <PaintMaterial />
      </mesh>
      <mesh position={[-3.15, 0.92, -0.98]} scale={[1.45, 0.78, 0.52]} castShadow>
        <sphereGeometry args={[0.62, 22, 16]} />
        <PaintMaterial />
      </mesh>

      <mesh position={[-1.85, 1.42, 0.82]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.38, 24]} />
        <ChromeMaterial />
      </mesh>
      <mesh position={[-1.85, 1.42, -0.82]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.38, 24]} />
        <ChromeMaterial />
      </mesh>
    </group>
  )
}

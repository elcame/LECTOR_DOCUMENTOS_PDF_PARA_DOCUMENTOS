import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, MeshReflectorMaterial, OrbitControls } from '@react-three/drei'
import CameraRig from './CameraRig'
import MeshyMula from './MeshyMula'
import MulaLoader from './MulaLoader'

export default function TractomulaScene({ modelSrc, colors, selectedId, onSelect, view, viewTick }) {
  const controlsRef = useRef(null)
  const animatingRef = useRef(false)

  return (
    <Canvas
      shadows
      camera={{ position: [-5.4, 2.7, 6.2], fov: 38, near: 0.1, far: 80 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0b1220']} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[-6, 8, 4]}
        intensity={1.55}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[6, 5, -5]} intensity={0.65} />
      <directionalLight position={[0, 6, 8]} intensity={0.35} />
      <Suspense fallback={<MulaLoader />}>
        <Environment preset="city" />
        <MeshyMula src={modelSrc} colors={colors} selectedId={selectedId} onSelect={onSelect} />
        <ContactShadows position={[0, 0.02, 0]} opacity={0.35} scale={18} blur={2.6} far={8} />
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 28]} />
        <MeshReflectorMaterial
          blur={[350, 120]}
          resolution={1024}
          mixBlur={0.9}
          mixStrength={0.55}
          roughness={0.35}
          depthScale={0.5}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.35}
          color="#141820"
          metalness={0.5}
        />
      </mesh>
      <CameraRig view={view} viewTick={viewTick} controlsRef={controlsRef} animatingRef={animatingRef} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.85}
        minDistance={5.2}
        maxDistance={14}
        minPolarAngle={0.85}
        maxPolarAngle={1.45}
        target={[0.1, 1.05, 0]}
        onStart={() => {
          animatingRef.current = false
        }}
      />
    </Canvas>
  )
}

import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import { usePaintColor } from './paint/PaintColorContext'
import { attachRedPaint } from './paint/attachRedPaint'
import TireHotspots from './parts/TireHotspots'

const TARGET_LENGTH = 8.4

export default function MeshyMula({ src, colors, selectedId, onSelect }) {
  const gltf = useGLTF(src)
  const paintColor = usePaintColor()
  const scene = gltf.scene

  const layout = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const scale = size.x > 0.001 ? TARGET_LENGTH / size.x : 1
    return { size, center, scale }
  }, [scene])

  useEffect(() => {
    scene.traverse((node) => {
      if (!node.isMesh) return
      node.castShadow = false
      node.receiveShadow = true
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) {
        if (!material) continue
        material.color?.set('#ffffff')
        material.metalness = Math.min(material.metalness ?? 1, 0.35)
        material.roughness = Math.max(material.roughness ?? 1, 0.42)
        attachRedPaint(material, paintColor || '#b91c1c')
      }
    })
  }, [paintColor, scene])

  return (
    <group scale={layout.scale}>
      <group position={[-layout.center.x, -layout.center.y + layout.size.y / 2, -layout.center.z]}>
        <primitive object={scene} />
        <TireHotspots size={layout.size} colors={colors} selectedId={selectedId} onSelect={onSelect} />
      </group>
    </group>
  )
}

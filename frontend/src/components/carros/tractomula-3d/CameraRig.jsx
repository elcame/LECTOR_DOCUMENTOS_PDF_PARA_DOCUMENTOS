import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { CAMERA_PRESETS } from './cameraPresets'

export default function CameraRig({ view, viewTick, controlsRef, animatingRef }) {
  const { camera } = useThree()
  const goalPos = useRef(new Vector3(...CAMERA_PRESETS.threeQuarter.pos))
  const goalTarget = useRef(new Vector3(...CAMERA_PRESETS.threeQuarter.target))

  useEffect(() => {
    const preset = CAMERA_PRESETS[view]
    if (!preset) return
    goalPos.current.set(...preset.pos)
    goalTarget.current.set(...preset.target)
    animatingRef.current = true
  }, [view, viewTick, animatingRef])

  useFrame(() => {
    const controls = controlsRef.current
    if (!animatingRef.current || !controls) return
    camera.position.lerp(goalPos.current, 0.1)
    controls.target.lerp(goalTarget.current, 0.1)
    controls.update()
    if (camera.position.distanceTo(goalPos.current) < 0.06) {
      animatingRef.current = false
    }
  })

  return null
}

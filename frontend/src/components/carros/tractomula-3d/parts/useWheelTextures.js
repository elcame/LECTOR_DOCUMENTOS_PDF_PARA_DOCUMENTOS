import { useTexture } from '@react-three/drei'
import { RepeatWrapping } from 'three'

export default function useWheelTextures() {
  const [tread, rim] = useTexture([
    '/tractomula/textures/tire-tread.png',
    '/tractomula/textures/rim-face.png',
  ])
  tread.wrapS = RepeatWrapping
  tread.wrapT = RepeatWrapping
  tread.repeat.set(8, 2)
  return { tread, rim }
}

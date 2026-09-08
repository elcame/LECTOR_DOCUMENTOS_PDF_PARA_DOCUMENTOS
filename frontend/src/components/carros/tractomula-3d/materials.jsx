import { usePaintColor } from './paint/PaintColorContext'

export function PaintMaterial({ color }) {
  const contextColor = usePaintColor()
  const paint = color || contextColor || '#f4f6f8'
  return (
    <meshPhysicalMaterial
      color={paint}
      roughness={0.16}
      metalness={0.12}
      clearcoat={1}
      clearcoatRoughness={0.08}
      envMapIntensity={1.35}
    />
  )
}

export function ChromeMaterial({ color = '#d7dde4' }) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={1}
      roughness={0.08}
      envMapIntensity={1.6}
    />
  )
}

export function RubberMaterial({ color = '#1a1d21', map }) {
  return (
    <meshStandardMaterial
      color={map ? '#ffffff' : color}
      map={map}
      roughness={0.88}
      metalness={0.02}
    />
  )
}

export function GlassMaterial() {
  return (
    <meshPhysicalMaterial
      color="#8ecae6"
      transmission={0.55}
      transparent
      opacity={0.72}
      roughness={0.05}
      metalness={0.1}
      thickness={0.2}
    />
  )
}

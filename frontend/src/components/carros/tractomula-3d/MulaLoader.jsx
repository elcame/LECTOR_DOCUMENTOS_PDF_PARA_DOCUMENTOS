import { Html, useProgress } from '@react-three/drei'

export default function MulaLoader() {
  const { progress, active } = useProgress()
  if (!active && progress >= 100) return null
  return (
    <Html center>
      <div className="rounded-xl bg-slate-900/90 px-4 py-3 text-center text-sm text-slate-100 shadow">
        Cargando mula 3D…
        <div className="mt-1 text-xs text-slate-300">{Math.round(progress)}%</div>
      </div>
    </Html>
  )
}

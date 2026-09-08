export const MULE_MODELS = [
  {
    id: 'mula-1',
    label: 'Modelo 1',
    src: '/tractomula/mulas/Meshy_AI_Blue_Highway_Hauler_0814035146_texture.glb',
  },
]

export const TIRE_HOTSPOT_IDS = [
  'TIRE_L_STEER',
  'TIRE_R_STEER',
  'TIRE_L_D1_O',
  'TIRE_L_D1_I',
  'TIRE_R_D1_O',
  'TIRE_R_D1_I',
  'TIRE_L_D2_O',
  'TIRE_L_D2_I',
  'TIRE_R_D2_O',
  'TIRE_R_D2_I',
]

export function isLlanta(positionId) {
  return String(positionId || '').startsWith('TIRE_')
}

export function tireHotspotsFromSize(size) {
  const hx = size.x / 2
  const hy = size.y / 2
  const hz = size.z / 2
  const y = -hy + size.y * 0.2
  const zO = hz * 0.78
  const zI = hz * 0.42
  const xSteer = -hx + size.x * 0.2
  const xD1 = -hx + size.x * 0.7
  const xD2 = -hx + size.x * 0.84
  const radius = Math.max(size.y * 0.09, 0.18)
  return [
    { id: 'TIRE_L_STEER', position: [xSteer, y, zO], radius },
    { id: 'TIRE_R_STEER', position: [xSteer, y, -zO], radius },
    { id: 'TIRE_L_D1_O', position: [xD1, y, zO], radius },
    { id: 'TIRE_L_D1_I', position: [xD1, y, zI], radius },
    { id: 'TIRE_R_D1_O', position: [xD1, y, -zO], radius },
    { id: 'TIRE_R_D1_I', position: [xD1, y, -zI], radius },
    { id: 'TIRE_L_D2_O', position: [xD2, y, zO], radius },
    { id: 'TIRE_L_D2_I', position: [xD2, y, zI], radius },
    { id: 'TIRE_R_D2_O', position: [xD2, y, -zO], radius },
    { id: 'TIRE_R_D2_I', position: [xD2, y, -zI], radius },
  ]
}

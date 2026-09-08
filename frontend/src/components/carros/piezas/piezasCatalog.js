const AXLES = [
  ['D1', 'tracción 1'],
  ['D2', 'tracción 2'],
]
const SIDES = [
  ['L', 'izquierda'],
  ['R', 'derecha'],
]
const HEIGHTS = [
  ['UP', 'arriba'],
  ['DOWN', 'abajo'],
]

function bandaPositions() {
  const items = []
  for (const [axleId, axleLabel] of AXLES) {
    for (const [sideId, sideLabel] of SIDES) {
      for (const [heightId, heightLabel] of HEIGHTS) {
        items.push({
          position_id: `BANDA_${axleId}_${sideId}_${heightId}`,
          label: `Banda ${axleLabel} ${sideLabel} ${heightLabel}`,
          part_kind: 'banda',
          in_model: true,
        })
        items.push({
          position_id: `BANDA_SPRING_${axleId}_${sideId}_${heightId}`,
          label: `Resorte banda ${axleLabel} ${sideLabel} ${heightLabel}`,
          part_kind: 'resorte_banda',
          in_model: true,
        })
      }
    }
  }
  return items
}

export const PIEZAS_CATALOG = [
  { position_id: 'TIRE_L_STEER', label: 'Llanta dirección izquierda', part_kind: 'llanta', in_model: true },
  { position_id: 'TIRE_R_STEER', label: 'Llanta dirección derecha', part_kind: 'llanta', in_model: true },
  { position_id: 'RIM_L_STEER', label: 'Rin dirección izquierda', part_kind: 'rin', in_model: true },
  { position_id: 'RIM_R_STEER', label: 'Rin dirección derecha', part_kind: 'rin', in_model: true },
  { position_id: 'TIRE_L_D1_O', label: 'Llanta tracción 1 izquierda externa', part_kind: 'llanta', in_model: true },
  { position_id: 'TIRE_L_D1_I', label: 'Llanta tracción 1 izquierda interna', part_kind: 'llanta', in_model: true },
  { position_id: 'TIRE_R_D1_O', label: 'Llanta tracción 1 derecha externa', part_kind: 'llanta', in_model: true },
  { position_id: 'TIRE_R_D1_I', label: 'Llanta tracción 1 derecha interna', part_kind: 'llanta', in_model: true },
  { position_id: 'RIM_L_D1_O', label: 'Rin tracción 1 izquierda externa', part_kind: 'rin', in_model: true },
  { position_id: 'RIM_L_D1_I', label: 'Rin tracción 1 izquierda interna', part_kind: 'rin', in_model: true },
  { position_id: 'RIM_R_D1_O', label: 'Rin tracción 1 derecha externa', part_kind: 'rin', in_model: true },
  { position_id: 'RIM_R_D1_I', label: 'Rin tracción 1 derecha interna', part_kind: 'rin', in_model: true },
  { position_id: 'TIRE_L_D2_O', label: 'Llanta tracción 2 izquierda externa', part_kind: 'llanta', in_model: true },
  { position_id: 'TIRE_L_D2_I', label: 'Llanta tracción 2 izquierda interna', part_kind: 'llanta', in_model: true },
  { position_id: 'TIRE_R_D2_O', label: 'Llanta tracción 2 derecha externa', part_kind: 'llanta', in_model: true },
  { position_id: 'TIRE_R_D2_I', label: 'Llanta tracción 2 derecha interna', part_kind: 'llanta', in_model: true },
  { position_id: 'RIM_L_D2_O', label: 'Rin tracción 2 izquierda externa', part_kind: 'rin', in_model: true },
  { position_id: 'RIM_L_D2_I', label: 'Rin tracción 2 izquierda interna', part_kind: 'rin', in_model: true },
  { position_id: 'RIM_R_D2_O', label: 'Rin tracción 2 derecha externa', part_kind: 'rin', in_model: true },
  { position_id: 'RIM_R_D2_I', label: 'Rin tracción 2 derecha interna', part_kind: 'rin', in_model: true },
  { position_id: 'TANK', label: 'Tanque de combustible', part_kind: 'tanque', in_model: true },
  { position_id: 'LIGHT_L', label: 'Luz delantera izquierda', part_kind: 'luz', in_model: true },
  { position_id: 'LIGHT_R', label: 'Luz delantera derecha', part_kind: 'luz', in_model: true },
  { position_id: 'EXHAUST', label: 'Escape', part_kind: 'escape', in_model: true },
  { position_id: 'MIRROR_L', label: 'Espejo izquierdo', part_kind: 'espejo', in_model: true },
  { position_id: 'MIRROR_R', label: 'Espejo derecho', part_kind: 'espejo', in_model: true },
  { position_id: 'BATTERY_1', label: 'Batería 1', part_kind: 'bateria', in_model: true },
  { position_id: 'BATTERY_2', label: 'Batería 2', part_kind: 'bateria', in_model: true },
  { position_id: 'OIL_FILTER', label: 'Filtro de aceite', part_kind: 'filtro_aceite', in_model: true },
  ...bandaPositions(),
  { position_id: 'RODAJA_1', label: 'Rodaja 1', part_kind: 'rodaja', in_model: true },
  { position_id: 'RODAJA_2', label: 'Rodaja 2', part_kind: 'rodaja', in_model: true },
  { position_id: 'TIRE_SPARE', label: 'Llanta de repuesto', part_kind: 'llanta', in_model: true },
]

export function getPiezaLabel(positionId) {
  return PIEZAS_CATALOG.find((p) => p.position_id === positionId)?.label || positionId
}

export function isLlanta(positionId) {
  return String(positionId || '').startsWith('TIRE_')
}

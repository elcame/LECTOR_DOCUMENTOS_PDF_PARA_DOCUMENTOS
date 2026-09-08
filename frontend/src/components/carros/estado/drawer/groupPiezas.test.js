import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupPiezas } from './groupPiezas.js'

test('agrupa por tipo y deja el resto en Otras', () => {
  const groups = groupPiezas([
    { position_id: 'TIRE_L_STEER', label: 'Llanta dirección izquierda', part_kind: 'llanta' },
    { position_id: 'RIM_L_STEER', label: 'Rin dirección izquierda', part_kind: 'rin' },
    { position_id: 'TANK', label: 'Tanque', part_kind: 'tanque' },
  ])
  assert.deepEqual(groups.map((g) => g.id), ['llanta', 'rin', 'otros'])
  assert.equal(groups.find((g) => g.id === 'otros').items[0].position_id, 'TANK')
})

test('filtra por texto en la etiqueta', () => {
  const groups = groupPiezas([
    { position_id: 'TIRE_L_STEER', label: 'Llanta dirección izquierda', part_kind: 'llanta' },
    { position_id: 'TANK', label: 'Tanque', part_kind: 'tanque' },
  ], 'tanque')
  assert.equal(groups.length, 1)
  assert.equal(groups[0].id, 'otros')
})

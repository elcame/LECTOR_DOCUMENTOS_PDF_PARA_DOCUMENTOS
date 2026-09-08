import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizePaintColor } from './paintColor.js'

test('acepta hex de 6 dígitos', () => {
  assert.equal(normalizePaintColor('#B91C1C'), '#b91c1c')
})

test('rechaza valores inválidos', () => {
  assert.equal(normalizePaintColor('rojo'), null)
  assert.equal(normalizePaintColor('#fff'), null)
  assert.equal(normalizePaintColor(''), null)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupDuplicatePairs } from './groupDuplicatePairs.js'

test('agrupa copia con su original por load_id', () => {
  const pairs = groupDuplicatePairs({
    archivosDuplicados: [
      {
        archivo: 'copia.pdf',
        archivo_original: 'original.pdf',
        load_id: 'L1',
        remesa: null,
        identificador: 'load_id: L1',
      },
    ],
    duplicadosFirebase: [],
  })
  assert.equal(pairs.length, 1)
  assert.equal(pairs[0].original.archivo, 'original.pdf')
  assert.equal(pairs[0].duplicates[0].archivo, 'copia.pdf')
})

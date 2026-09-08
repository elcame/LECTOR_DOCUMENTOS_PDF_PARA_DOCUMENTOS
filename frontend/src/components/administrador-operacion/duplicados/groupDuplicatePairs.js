function pairKey(item) {
  if (item?.load_id && item.load_id !== 'No encontrado') return `load:${item.load_id}`
  if (item?.remesa && item.remesa !== 'No encontrada') return `remesa:${item.remesa}`
  return `archivo:${item?.archivo_original || item?.archivo || 'desconocido'}`
}

export function groupDuplicatePairs({ archivosDuplicados = [], duplicadosFirebase = [] } = {}) {
  const groups = new Map()

  const add = (item, source) => {
    const key = pairKey(item)
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        identificador: item.identificador || item.message || key,
        original: item.archivo_original
          ? { archivo: item.archivo_original, load_id: item.load_id, remesa: item.remesa, folder: item.folder_original }
          : null,
        duplicates: [],
      })
    }
    const g = groups.get(key)
    if (!g.original && item.archivo_original) {
      g.original = {
        archivo: item.archivo_original,
        load_id: item.load_id,
        remesa: item.remesa,
        folder: item.folder_original,
      }
    }
    g.duplicates.push({ ...item, source })
  }

  archivosDuplicados.forEach((item) => add(item, 'lote'))
  duplicadosFirebase.forEach((item) => add(item, 'firebase'))
  return Array.from(groups.values())
}

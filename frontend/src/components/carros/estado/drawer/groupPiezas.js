export const PIEZA_GROUPS = [
  { id: 'llanta', label: 'Llantas', kinds: ['llanta'] },
  { id: 'rin', label: 'Rines', kinds: ['rin'] },
  { id: 'banda', label: 'Bandas', kinds: ['banda'] },
  { id: 'resorte', label: 'Resortes', kinds: ['resorte_banda'] },
]

export function groupPiezas(catalog = [], query = '') {
  const q = query.trim().toLowerCase()
  const filtered = q
    ? catalog.filter((item) => {
        const label = String(item.label || '').toLowerCase()
        const id = String(item.position_id || '').toLowerCase()
        return label.includes(q) || id.includes(q)
      })
    : catalog

  const used = new Set()
  const groups = PIEZA_GROUPS.map((group) => {
    const items = filtered.filter((item) => group.kinds.includes(item.part_kind))
    items.forEach((item) => used.add(item.position_id))
    return { id: group.id, label: group.label, items }
  })

  const others = filtered.filter((item) => !used.has(item.position_id))
  groups.push({ id: 'otros', label: 'Otras', items: others })

  return groups.filter((group) => group.items.length > 0)
}

export const DEFAULT_PAINT_COLOR = '#b91c1c'

export function normalizePaintColor(value) {
  const hex = String(value || '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase()
  return null
}

import { STORAGE_KEYS } from '../../../config/constants'
import { getLocalStorage, setLocalStorage } from '../../../utils/storage'
import { BUILTIN_RENAME_PATTERNS } from './builtinPatterns'

function normalize(item) {
  if (typeof item === 'string') {
    const value = item.trim()
    return value ? { value, label: value } : null
  }
  const value = String(item?.value || '').trim()
  if (!value) return null
  return { value, label: String(item.label || value).trim() || value }
}

export function getCustomRenamePatterns() {
  const raw = getLocalStorage(STORAGE_KEYS.PDF_RENAME_PATTERNS, [])
  if (!Array.isArray(raw)) return []
  const builtin = new Set(BUILTIN_RENAME_PATTERNS.map((p) => p.value))
  const seen = new Set()
  return raw
    .map(normalize)
    .filter(Boolean)
    .filter((p) => !builtin.has(p.value) && !seen.has(p.value) && seen.add(p.value))
}

export function addCustomRenamePattern(pattern) {
  const value = String(pattern || '').trim()
  const current = getCustomRenamePatterns()
  if (!value) return current
  if (BUILTIN_RENAME_PATTERNS.some((p) => p.value === value)) return current
  if (current.some((p) => p.value === value)) return current
  const next = [...current, { value, label: value }]
  setLocalStorage(STORAGE_KEYS.PDF_RENAME_PATTERNS, next)
  return next
}

export function removeCustomRenamePattern(pattern) {
  const next = getCustomRenamePatterns().filter((p) => p.value !== pattern)
  setLocalStorage(STORAGE_KEYS.PDF_RENAME_PATTERNS, next)
  return next
}

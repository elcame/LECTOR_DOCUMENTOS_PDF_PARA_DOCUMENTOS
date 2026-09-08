export const AGE_COLORS = {
  empty: '#94a3b8',
  ok: '#22c55e',
  warn: '#f59e0b',
  alert: '#ef4444',
}

export function monthsSince(isoDate, now = new Date()) {
  if (!isoDate) return null
  const start = new Date(isoDate)
  if (Number.isNaN(start.getTime())) return null
  const days = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  return days / 30.437
}

export function piezaAgeStatus(isoDate, now = new Date()) {
  const months = monthsSince(isoDate, now)
  if (months == null) return 'empty'
  if (months < 6) return 'ok'
  if (months <= 18) return 'warn'
  return 'alert'
}

export function piezaAgeColor(isoDate, now = new Date()) {
  return AGE_COLORS[piezaAgeStatus(isoDate, now)]
}

export function formatTiempo(isoDate, now = new Date()) {
  const months = monthsSince(isoDate, now)
  if (months == null) return 'Sin registro'
  const totalDays = Math.max(0, Math.floor(months * 30.437))
  const yrs = Math.floor(totalDays / 365)
  const mos = Math.floor((totalDays % 365) / 30)
  const days = totalDays % 30
  if (yrs > 0) return `${yrs} año(s) y ${mos} mes(es)`
  if (mos > 0) return `${mos} mes(es) y ${days} día(s)`
  return `${days} día(s)`
}

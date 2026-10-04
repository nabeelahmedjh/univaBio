/** Formatting helpers. All dates are rendered in the user's locale timezone. */

const LOCALE = 'en-GB'

export function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

/** "SATURDAY, 3 OCTOBER" */
export function formatEyebrowDate(d: Date = new Date()): string {
  return d
    .toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/,?\s(\d)/, ', $1')
    .toUpperCase()
}

/** "Good morning" | "Good afternoon" | "Good evening" */
export function greeting(d: Date = new Date()): string {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** "Sat, 3 Oct" */
export function formatShortDate(value: string | Date): string {
  const d = toDate(value)
  const wd = d.toLocaleDateString(LOCALE, { weekday: 'short' })
  const dm = d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
  return `${wd}, ${dm}`
}

/** "3 Oct 2026" */
export function formatDate(value: string | Date): string {
  return toDate(value).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** "Saturday, 3 October 2026" */
export function formatLongDate(value: string | Date): string {
  return toDate(value).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** "14:30" */
export function formatTime(value: string | Date): string {
  return toDate(value).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

/** "October 2026" */
export function formatMonthYear(value: string | Date): string {
  return toDate(value).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
}

/** Relative day label used in lists: "Today", "Yesterday", "3 Oct". */
export function formatRelativeDay(value: string | Date | null): string {
  if (!value) return '—'
  const d = toDate(value)
  const today = startOfDay(new Date())
  const that = startOfDay(d)
  const diff = Math.round((today.getTime() - that.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return d.toLocaleDateString(LOCALE, { weekday: 'long' })
  return formatDate(d)
}

export function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

/** Monday 00:00 of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const c = startOfDay(d)
  const day = (c.getDay() + 6) % 7 // 0 = Monday
  c.setDate(c.getDate() - day)
  return c
}

/** 125 → "02:05", 3725 → "1:02:05" */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** 1520 → "25 min" */
export function formatDuration(totalSec: number): string {
  const m = Math.round(totalSec / 60)
  if (m < 1) return `${Math.round(totalSec)} sec`
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm ? `${h} h ${rm} min` : `${h} h`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

/** "Amara Whitfield" → "AW" */
export function initials(name: string): string {
  const parts = name
    .replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** "Dr. Amara Whitfield" → "Whitfield" */
export function lastName(name: string): string {
  const parts = name.replace(/^dr\.?\s+/i, '').trim().split(/\s+/)
  return parts[parts.length - 1] ?? name
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

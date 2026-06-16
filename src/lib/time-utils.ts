/**
 * Format milliseconds as HH:MM:SS string.
 */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}

/**
 * Get start of today (midnight local time) as ISO string.
 */
export function getStartOfDay(date: Date = new Date()): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * Get end of today (23:59:59.999 local time) as ISO string.
 */
export function getEndOfDay(date: Date = new Date()): string {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

/**
 * Get start of the current week (Monday midnight local time) as ISO string.
 */
export function getStartOfWeek(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * Get end of the current week (Sunday 23:59:59.999 local time) as ISO string.
 */
export function getEndOfWeek(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + diff)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

/**
 * Get start of the month (1st day, midnight local time) as ISO string.
 */
export function getStartOfMonth(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * Get end of the month (last day, 23:59:59.999 local time) as ISO string.
 */
export function getEndOfMonth(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export type PeriodPreset = "this-week" | "this-month" | "last-month"

/**
 * Strip milliseconds from an ISO string.
 * Converts "2024-06-15T00:00:00.000Z" → "2024-06-15T00:00:00Z"
 */
function stripMs(iso: string): string {
  return iso.replace(/\.\d{3}Z$/, "Z")
}

/**
 * Get a date range (from/to ISO strings) for a given period preset.
 * Output format: YYYY-MM-DDTHH:mm:ssZ (no milliseconds, as required by API).
 */
export function getDateRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date()
  switch (preset) {
    case "this-week":
      return { from: stripMs(getStartOfWeek(now)), to: stripMs(getEndOfWeek(now)) }
    case "this-month":
      return { from: stripMs(getStartOfMonth(now)), to: stripMs(getEndOfMonth(now)) }
    case "last-month": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return { from: stripMs(getStartOfMonth(prev)), to: stripMs(getEndOfMonth(prev)) }
    }
  }
}

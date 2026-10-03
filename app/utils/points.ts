import type { Hours } from '#shared/types/api'

export const KRAKOW: [number, number] = [50.0617, 19.9373] // Rynek Główny

/** Day index (0 = Sunday) and "HH:MM" in Warsaw time. */
function warsawNow(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')), time: `${get('hour')}:${get('minute')}` }
}

export function isOpenNow(hours: Hours, now = new Date()): boolean {
  const { day, time } = warsawNow(now)
  const h = hours[day]
  return !!h && time >= h[0] && time < h[1] // "24:00" works as end-of-day
}

export function closesAt(hours: Hours, now = new Date()): string | null {
  return hours[warsawNow(now).day]?.[1] ?? null
}

export function distanceM(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const rad = (d: number) => d * Math.PI / 180
  const dLat = rad(b[0] - a[0])
  const dLng = rad(b[1] - a[1])
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export const formatDistance = (m: number) =>
  m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`

const fmtRange = (h: [string, string] | null) =>
  !h ? 'zamknięte' : h[0] === '00:00' && h[1] === '24:00' ? 'całą dobę' : `${h[0]} – ${h[1]}` // 'całą dobę' = (new copy)

/** Rows as in Punkt.html; weekdays use Monday's hours (seed data has equal weekdays). */
export const hoursRows = (hours: Hours) => [
  { label: 'Pon – Pt', value: fmtRange(hours[1] ?? null) },
  { label: 'Sobota', value: fmtRange(hours[6] ?? null) },
  { label: 'Niedziela', value: fmtRange(hours[0] ?? null) },
]

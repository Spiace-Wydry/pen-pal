const TZ = 'Europe/Warsaw'
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pl-PL', { timeZone: TZ, ...o })
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const ageLabel = (a: string) => a.replace('-', '–')
export const channelLabel = (c: 'PAPER' | 'APP') => c === 'PAPER' ? 'pisze ręcznie' : 'pisze w aplikacji'
/** Display label for a stored language value: 'polski' → 'Polski'. Stored values stay lowercase. */
export const languageLabel = (l: string) => l.charAt(0).toUpperCase() + l.slice(1)
export const initial = (name: string) => name.trim().charAt(0).toUpperCase()

/** "Sobota, 3 października" */
export const formatLongDay = (iso: string) => cap(fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso)))
/** "1 października" */
export const formatDate = (iso: string) => fmt({ day: 'numeric', month: 'long' }).format(new Date(iso))
/** "5 paź" */
export const formatShortDay = (iso: string) => fmt({ day: 'numeric', month: 'short' }).format(new Date(iso))
/** "Sobota, 3 paź, 16:20" */
export const formatStepTime = (iso: string) => {
  const d = new Date(iso)
  return `${cap(fmt({ weekday: 'long' }).format(d))}, ${formatShortDay(iso)}, ${fmt({ hour: '2-digit', minute: '2-digit' }).format(d)}`
}
const ON_DAY = ['w niedzielę', 'w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę']
const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** "w poniedziałek, 5 października" */
export const onDay = (iso: string) => {
  const i = EN_DAYS.indexOf(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(new Date(iso)))
  return `${ON_DAY[i]}, ${formatDate(iso)}`
}

export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one
  const d = n % 10
  const h = n % 100
  return d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many
}

// ponytail: heuristic first-name declension; covers common Polish names. Add a per-profile override if a real name comes out wrong.
export function decline(name: string, c: 'gen' | 'dat' | 'acc'): string {
  if (name.endsWith('ia')) return name.slice(0, -1) + (c === 'acc' ? 'ę' : 'i') // Zofia → Zofii, Zofię
  if (name.endsWith('a')) {
    const stem = name.slice(0, -1)
    const last = stem.slice(-1)
    if (c === 'acc') return stem + 'ę' // Halinę
    if (c === 'gen') return stem + ('kglj'.includes(last) ? 'i' : 'y') // Haliny, Oli, Kingi
    if ('lj'.includes(last)) return stem + 'i' // Oli
    const soft: Record<string, string> = { k: 'ce', g: 'dze', r: 'rze', d: 'dzie', t: 'cie', ł: 'le' }
    return soft[last] ? stem.slice(0, -1) + soft[last] : stem + 'ie' // Barbarze, Halinie, Kubie
  }
  const stem = name.endsWith('ek') ? name.slice(0, -2) + 'k' : name // Marek → Mark-
  return stem + (c === 'dat' ? 'owi' : 'a') // Tadeusza, Tadeuszowi
}

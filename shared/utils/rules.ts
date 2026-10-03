export const AGE_RANGES = ['18-25', '26-40', '41-60', '60-75', '75+'] as const
export type AgeRange = typeof AGE_RANGES[number]
export const CHANNELS = ['PAPER', 'APP'] as const
export type Channel = typeof CHANNELS[number]
export const INTERESTS = ['Książki', 'Ogród', 'Gotowanie', 'Historia', 'Podróże', 'Muzyka', 'Sport', 'Zwierzęta', 'Film', 'Rękodzieło', 'Technologia', 'Języki obce', 'Fotografia', 'Przyroda', 'Szachy i gry'] as const
export const LANGUAGES = ['polski', 'angielski', 'niemiecki', 'ukraiński'] as const

export const pairLimit = (isPremium: boolean) => isPremium ? 5 : 3

/** Different generations = age ranges at least two steps apart (e.g. 26–40 ↔ 60–75, 18–25 ↔ 41–60). */
export const isOtherGeneration = (a: AgeRange, b: AgeRange) =>
  Math.abs(AGE_RANGES.indexOf(a) - AGE_RANGES.indexOf(b)) >= 2

export const sharesLanguage = (a: readonly string[], b: readonly string[]) => a.some(l => b.includes(l))
export const sharedInterests = (a: readonly string[], b: readonly string[]) => a.filter(i => b.includes(i))

export interface MatchInput { interests: string[], channel: Channel, city: string | null }
/** +2 per shared interest, +1 same region (city), +1 same channel. */
export const matchScore = (me: MatchInput, other: MatchInput) =>
  2 * sharedInterests(me.interests, other.interests).length
  + (me.city && me.city === other.city ? 1 : 0)
  + (me.channel === other.channel ? 1 : 0)

const PALKOD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I
export const PALKOD_RE = /^PP-[A-HJ-NP-Z2-9]{4}$/
export function generatePiszuKod(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return 'PP-' + Array.from(bytes, b => PALKOD_ALPHABET[b % PALKOD_ALPHABET.length]).join('')
}

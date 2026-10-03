import type { H3Event } from 'h3'
import type { MatchView } from '#shared/types/api'
import { generatePalKod, isOtherGeneration, matchScore, pairLimit, sharedInterests, sharesLanguage } from '#shared/utils/rules'

export async function activeCount(event: H3Event, userId: string): Promise<number> {
  const { count } = await db(event).from('pairings').select('id', { count: 'exact', head: true })
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`).eq('status', 'ACTIVE')
  return count ?? 0
}

// ponytail: loads every profile and pairing per request; fine for a city pilot, move to a SQL view/RPC past a few thousand users.
export async function findMatches(event: H3Event, me: string): Promise<MatchView[]> {
  const client = db(event)
  const [{ data: profiles }, { data: privs }, { data: pairings }] = await Promise.all([
    client.from('profiles').select('*').not('channel', 'is', null).not('age_range', 'is', null),
    client.from('private_profiles').select('id, city'),
    client.from('pairings').select('user_a_id, user_b_id, status'),
  ])
  const cityOf = new Map((privs ?? []).map(p => [p.id, p.city]))
  const all = pairings ?? []
  const self = (profiles ?? []).find(p => p.id === me)
  if (!self?.age_range || !self.channel) return []

  const pairedWithMe = new Set(all.flatMap(p =>
    p.user_a_id === me ? [p.user_b_id] : p.user_b_id === me ? [p.user_a_id] : []))
  const active = new Map<string, number>()
  for (const p of all.filter(p => p.status === 'ACTIVE'))
    for (const id of [p.user_a_id, p.user_b_id]) active.set(id, (active.get(id) ?? 0) + 1)

  const meInput = { interests: self.interests, channel: self.channel, city: cityOf.get(me) ?? null }
  return (profiles ?? [])
    .filter(p => p.id !== me
      && p.interests.length >= 3
      && isOtherGeneration(self.age_range!, p.age_range!)
      && sharesLanguage(self.languages, p.languages)
      && !pairedWithMe.has(p.id)
      && (active.get(p.id) ?? 0) < pairLimit(p.is_premium))
    .map(p => ({
      profile: toPublicProfile(p),
      sharedInterests: sharedInterests(self.interests, p.interests),
      score: matchScore(meInput, { interests: p.interests, channel: p.channel!, city: cityOf.get(p.id) ?? null }),
    }))
    .sort((a, b) => b.score - a.score || a.profile.name.localeCompare(b.profile.name, 'pl'))
}

export async function createPairing(event: H3Event, inviterId: string, inviteeId: string, status: 'ACTIVE' | 'INVITED'): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await db(event).from('pairings')
      .insert({ user_a_id: inviterId, user_b_id: inviteeId, pal_kod: generatePalKod(), status })
      .select('id').single()
    if (data) return data.id
    // 23505 = unique violation: retry only if the PalKod clashed, not the pair itself
    if (error?.code !== '23505' || !error.message.includes('pal_kod')) break
  }
  throw fail(409, 'Ta osoba nie jest już dostępna.') // (new copy)
}

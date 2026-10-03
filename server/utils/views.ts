import type { H3Event } from 'h3'
import type { Tables } from '~~/types/database'
import type { LetterView, Me, PairingView, PublicProfile } from '#shared/types/api'
import { pairLimit, sharedInterests } from '#shared/utils/rules'
import { canWrite, deliverySteps } from '#shared/utils/letters'

export const toPublicProfile = (p: Tables<'profiles'>): PublicProfile => ({
  id: p.id,
  name: p.name ?? '',
  ageRange: p.age_range!,
  channel: p.channel!,
  bio: p.bio,
  languages: p.languages,
  interests: p.interests,
})

const onboardingStep = (p: Tables<'profiles'>) =>
  !p.name || !p.age_range ? '/profil/o-mnie'
    : p.interests.length < 3 ? '/profil/zainteresowania'
      : !p.channel ? '/profil/kanal'
        : null

export async function loadMe(event: H3Event, id: string): Promise<Me> {
  const client = db(event)
  const [{ data: p }, { data: priv }] = await Promise.all([
    client.from('profiles').select('*').eq('id', id).single(),
    client.from('private_profiles').select('*').eq('id', id).maybeSingle(),
  ])
  if (!p) throw fail(404, 'Nie znaleziono profilu.')
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    ageRange: p.age_range,
    channel: p.channel,
    bio: p.bio,
    languages: p.languages,
    interests: p.interests,
    isPremium: p.is_premium,
    notifyNewLetter: p.notify_new_letter,
    notifyDelivered: p.notify_delivered,
    city: priv?.city ?? null,
    postalAddress: priv?.postal_address ?? null,
    onboardingStep: onboardingStep(p),
    limit: pairLimit(p.is_premium),
  }
}

export async function requirePairing(event: H3Event, id: string, me: string) {
  const { data } = await db(event).from('pairings').select('*').eq('id', id).maybeSingle()
  if (!data || (data.user_a_id !== me && data.user_b_id !== me)) throw fail(404, 'Nie znaleziono korespondencji.')
  return data
}

export function toLetterView(l: Tables<'letters'>, me: string, imageUrls: string[] = [], now = Date.now()): LetterView {
  return {
    id: l.id,
    pairingId: l.pairing_id,
    mine: l.sender_id === me,
    kind: l.kind,
    body: l.body,
    imageUrls,
    deliveryChannel: l.delivery_channel,
    sentAt: l.sent_at,
    deliverAt: l.deliver_at,
    readAt: l.read_at,
    delivered: Date.parse(l.deliver_at) <= now,
    steps: deliverySteps(l.kind, l.delivery_channel, l.sent_at, l.deliver_at, now),
  }
}

export async function loadPairingView(event: H3Event, p: Tables<'pairings'>, me: string): Promise<PairingView> {
  const client = db(event)
  const partnerId = p.user_a_id === me ? p.user_b_id : p.user_a_id
  const [{ data: partner }, { data: mine }, { data: letters }] = await Promise.all([
    client.from('profiles').select('*').eq('id', partnerId).single(),
    client.from('profiles').select('interests').eq('id', me).single(),
    client.from('letters').select('*').eq('pairing_id', p.id).order('sent_at', { ascending: false }),
  ])
  if (!partner || !mine) throw fail(404, 'Nie znaleziono korespondencji.')
  const now = Date.now()
  const all = letters ?? []
  const lastVisible = all.find(l => l.sender_id === me || Date.parse(l.deliver_at) <= now)
  return {
    id: p.id,
    palKod: p.pal_kod,
    status: p.status,
    createdAt: p.created_at,
    inviterId: p.user_a_id,
    partner: toPublicProfile(partner),
    sharedInterests: sharedInterests(mine.interests, partner.interests),
    lastLetter: lastVisible ? toLetterView(lastVisible, me, [], now) : null,
    // canWrite must see letters still in transit, so it gets ALL letters.
    canWrite: p.status === 'ACTIVE' && canWrite(all.map(l => ({ senderId: l.sender_id, sentAt: l.sent_at, deliverAt: l.deliver_at })), me, now),
  }
}

export async function signUrls(event: H3Event, paths: string[]): Promise<string[]> {
  if (!paths.length) return []
  const { data, error } = await db(event).storage.from('letters').createSignedUrls(paths, 3600)
  if (error || !data) throw fail(500, 'Nie udało się wczytać skanu.')
  return data.map(d => d.signedUrl ?? '')
}

// Demo helper (hackathon): after onboarding, the best-matching seeded user "invites" the new user,
// so the Zaproszenie screen is part of the journey. Idempotent: one pending invite at most.
export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const { data: pending } = await db(event).from('pairings').select('id')
    .eq('user_b_id', me).eq('status', 'INVITED').limit(1).maybeSingle()
  if (pending) return { id: pending.id }
  const [best] = await findMatches(event, me)
  if (!best) return { id: null }
  return { id: await createPairing(event, best.profile.id, me, 'INVITED') }
})

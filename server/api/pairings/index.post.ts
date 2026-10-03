export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const { userId } = (await readBody<{ userId?: string }>(event)) ?? {}
  const { limit } = await loadMe(event, me)
  if (await activeCount(event, me) >= limit)
    throw fail(409, `Masz już ${limit} korespondentów. Zakończ jedną znajomość, aby poznać kogoś nowego.`)
  const candidates = await findMatches(event, me)
  if (!userId || !candidates.some(c => c.profile.id === userId)) throw fail(400, 'Ta osoba nie jest już dostępna.')
  // ponytail: invitation is auto-accepted (demo; seniors "accept at the PiszuPunkt"). Real flow = status 'INVITED'.
  return { id: await createPairing(event, me, userId, 'ACTIVE') }
})

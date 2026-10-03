export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const p = await requirePairing(event, getRouterParam(event, 'id')!, me)
  if (p.status !== 'INVITED' || p.user_b_id !== me) throw fail(400, 'To zaproszenie jest już nieaktualne.') // (new copy)
  const { limit } = await loadMe(event, me)
  if (await activeCount(event, me) >= limit)
    throw fail(409, `Masz już ${limit} korespondentów. Zakończ jedną znajomość, aby poznać kogoś nowego.`)
  const { error } = await db(event).from('pairings').update({ status: 'ACTIVE' }).eq('id', p.id)
  if (error) throw fail(500, 'Nie udało się przyjąć zaproszenia.') // (new copy)
  return { id: p.id }
})

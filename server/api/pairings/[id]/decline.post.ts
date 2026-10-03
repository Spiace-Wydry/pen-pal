export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const p = await requirePairing(event, getRouterParam(event, 'id')!, me)
  if (p.status !== 'INVITED' || p.user_b_id !== me) throw fail(400, 'To zaproszenie jest już nieaktualne.')
  await db(event).from('pairings').update({ status: 'ENDED' }).eq('id', p.id)
  return { ok: true }
})

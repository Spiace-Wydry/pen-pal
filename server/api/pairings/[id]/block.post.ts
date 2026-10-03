export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const p = await requirePairing(event, getRouterParam(event, 'id')!, me)
  // BLOCKED: hidden from lists, frees a slot, the pair can never be matched again.
  const { error } = await db(event).from('pairings').update({ status: 'BLOCKED' }).eq('id', p.id)
  if (error) throw fail(500, 'Nie udało się zablokować.') // (new copy)
  return { ok: true }
})

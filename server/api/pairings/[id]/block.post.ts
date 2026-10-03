export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const p = await requirePairing(event, getRouterParam(event, 'id')!, me)
  // BLOCKED: hidden from lists, frees a slot, the pair can never be matched again.
  const { error } = await db(event).from('pairings').update({ status: 'BLOCKED' }).eq('id', p.id)
  if (error) throw fail(500, 'Nie udało się zablokować.') // (new copy)
  // Letters the partner already sent but that are still in transit would otherwise arrive later,
  // contradicting "you won't get letters from them anymore" - drop them (and their images).
  const { data: transit } = await db(event).from('letters').select('id, image_paths')
    .eq('pairing_id', p.id).neq('sender_id', me).gt('deliver_at', new Date().toISOString())
  if (transit?.length) {
    const paths = transit.flatMap(l => l.image_paths ?? [])
    if (paths.length) await db(event).storage.from('letters').remove(paths) // errors ignored: orphaned files are harmless
    const { error: delError } = await db(event).from('letters').delete().in('id', transit.map(l => l.id))
    if (delError) throw fail(500, 'Nie udało się zablokować.')
  }
  return { ok: true }
})

import type { LetterResponse } from '#shared/types/api'

export default defineEventHandler(async (event): Promise<LetterResponse> => {
  const me = await requireUserId(event)
  const client = db(event)
  const { data: l } = await client.from('letters').select('*').eq('id', getRouterParam(event, 'id')!).maybeSingle()
  if (!l) throw fail(404, 'Nie znaleziono listu.') // (new copy)
  const pairing = await requirePairing(event, l.pairing_id, me)
  const mine = l.sender_id === me
  if (!mine && Date.parse(l.deliver_at) > Date.now()) throw fail(404, 'Nie znaleziono listu.')
  if (!mine && !l.read_at) {
    l.read_at = new Date().toISOString()
    await client.from('letters').update({ read_at: l.read_at }).eq('id', l.id)
  }
  return {
    letter: toLetterView(l, me, await signUrls(event, l.image_paths)),
    pairing: await loadPairingView(event, pairing, me),
  }
})

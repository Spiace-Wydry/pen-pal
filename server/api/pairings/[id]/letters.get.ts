export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const p = await requirePairing(event, getRouterParam(event, 'id')!, me)
  const { data } = await db(event).from('letters').select('*').eq('pairing_id', p.id).order('sent_at', { ascending: false })
  const now = Date.now()
  return (data ?? [])
    .filter(l => l.sender_id === me || Date.parse(l.deliver_at) <= now) // slow mail: hidden until delivered
    .map(l => toLetterView(l, me, [], now))
})

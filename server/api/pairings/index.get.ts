export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const { data } = await db(event).from('pairings').select('*')
    .or(`user_a_id.eq.${me},user_b_id.eq.${me}`)
    .in('status', ['ACTIVE', 'INVITED'])
    .order('created_at')
  return Promise.all((data ?? []).map(p => loadPairingView(event, p, me)))
})

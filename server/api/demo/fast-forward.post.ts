// Demo helper (hackathon): lets judges see delivery without waiting 2 days.
export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const { data, error } = await db(event).rpc('fast_forward_letters', { p_user: me })
  if (error) throw fail(500, 'Nie udało się przewinąć czasu.') // (new copy)
  return { moved: data ?? 0 }
})

export default defineEventHandler(async (event) => {
  const { data } = await db(event).from('points').select('*').eq('id', getRouterParam(event, 'id')!).maybeSingle()
  if (!data) throw fail(404, 'Nie znaleziono punktu.') // (new copy)
  return toPointView(data)
})

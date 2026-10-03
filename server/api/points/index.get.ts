export default defineEventHandler(async (event) => {
  const { data } = await db(event).from('points').select('*').order('name')
  return (data ?? []).map(toPointView)
})

export default defineEventHandler(async (event) => {
  const { data } = await db(event).from('points').select('*')
    .eq('type', 'PALPOINT') // PiszuBoxes hidden on the map for now; drop this line to show them again
    .order('name')
  return (data ?? []).map(toPointView)
})

export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const pairing = await requirePairing(event, getRouterParam(event, 'id')!, me)
  return loadPairingView(event, pairing, me)
})

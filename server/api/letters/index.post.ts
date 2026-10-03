import { decline } from '#shared/utils/polish'

export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const form = await readLetterForm(event)
  const channel = form.field('deliveryChannel')
  if (channel !== 'APP' && channel !== 'PAPER') throw fail(400, 'Wybierz, jak dostarczyć list.') // (new copy)
  const pairing = await requirePairing(event, form.field('pairingId'), me)
  const view = await loadPairingView(event, pairing, me)
  if (!view.canWrite) throw fail(409, `Odpiszesz, gdy przyjdzie list od ${decline(view.partner.name, 'gen')}.`) // (new copy)
  const body = form.field('body').trim()
  if (!form.files.length && (!body || body.length > 5000)) throw fail(400, 'Napisz treść listu (do 5000 znaków).') // (new copy)
  const id = await insertLetter(event, {
    pairingId: pairing.id,
    senderId: me,
    channel,
    body: form.files.length ? null : body,
    files: form.files,
  })
  return { id }
})

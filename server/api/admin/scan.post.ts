// Demo helper: simulates a PiszuPoint scanning a paper letter. The PiszuKod routes the letter;
// the sender's first name is the cross-check (SPEC "How matching works at scan time").
export default defineEventHandler(async (event) => {
  const form = await readLetterForm(event)
  const code = useRuntimeConfig(event).adminCode
  if (!code || form.field('code') !== code) throw fail(403, 'Nieprawidłowy kod.') // (new copy)
  if (!form.files.length) throw fail(400, 'Dodaj zdjęcie listu.') // (new copy)
  const palKod = form.field('palKod').trim().toUpperCase()
  const from = form.field('from').trim().toLocaleLowerCase('pl')

  const client = db(event)
  const { data: p } = await client.from('pairings').select('*').eq('pal_kod', palKod).eq('status', 'ACTIVE').maybeSingle()
  if (!p) throw fail(404, 'Nie znaleziono aktywnego PiszuKodu.') // (new copy)
  const { data: people } = await client.from('profiles').select('id, name, channel').in('id', [p.user_a_id, p.user_b_id])
  const sender = people?.find(x => x.name?.toLocaleLowerCase('pl') === from)
  const recipient = people?.find(x => x.id !== sender?.id)
  if (!sender || !recipient) throw fail(400, 'Imię nadawcy nie pasuje do PiszuKodu.') // (new copy)

  const id = await insertLetter(event, {
    pairingId: p.id,
    senderId: sender.id,
    channel: recipient.channel ?? 'APP',
    body: null,
    files: form.files,
  })
  return { id, to: recipient.name }
})

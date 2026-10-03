import type { H3Event } from 'h3'
import type { DeliveryChannel } from '#shared/utils/letters'

const MAX_PAGES = 10
const MAX_BYTES = 8 * 1024 * 1024
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png' }

export interface PageFile { data: Uint8Array, type: string }

export async function readLetterForm(event: H3Event) {
  const parts = (await readMultipartFormData(event)) ?? []
  const field = (name: string) => parts.find(p => p.name === name && !p.filename)?.data.toString('utf8') ?? ''
  const files = parts.filter(p => p.name === 'pages' && p.filename)
  if (files.length > MAX_PAGES) throw fail(400, `Możesz dodać najwyżej ${MAX_PAGES} stron.`) // (new copy)
  for (const f of files)
    if (!f.type || !EXT[f.type] || f.data.length > MAX_BYTES) throw fail(400, 'Dodaj zdjęcia JPG lub PNG do 8 MB.') // (new copy)
  return { field, files: files.map(f => ({ data: f.data, type: f.type! })) }
}

export async function insertLetter(event: H3Event, l: {
  pairingId: string
  senderId: string
  channel: DeliveryChannel
  body: string | null
  files: PageFile[]
}): Promise<string> {
  const bucket = db(event).storage.from('letters')
  const id = crypto.randomUUID()
  const paths = l.files.map((f, i) => `${l.pairingId}/${id}/${i + 1}.${EXT[f.type]}`)
  for (const [i, f] of l.files.entries()) {
    const { error } = await bucket.upload(paths[i]!, f.data, { contentType: f.type })
    if (error) {
      if (i) await bucket.remove(paths.slice(0, i))
      throw fail(500, 'Nie udało się zapisać zdjęcia.') // (new copy)
    }
  }
  // sent_at / deliver_at come from DB defaults: now() and now() + 2 days.
  const { error } = await db(event).from('letters').insert({
    id,
    pairing_id: l.pairingId,
    sender_id: l.senderId,
    kind: l.files.length ? 'SCAN' : 'TYPED',
    body: l.body,
    image_paths: paths,
    delivery_channel: l.channel,
  })
  if (error) {
    if (paths.length) await bucket.remove(paths)
    throw fail(500, 'Nie udało się wysłać listu.') // (new copy)
  }
  return id
}

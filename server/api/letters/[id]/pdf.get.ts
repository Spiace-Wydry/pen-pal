import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { formatDate } from '#shared/utils/polish'

const A4: [number, number] = [595.28, 841.89]
const M = 60 // margin
const INK = rgb(0.12, 0.16, 0.27)
const STAMP = rgb(0.66, 0.26, 0.16)

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word
      if (line && font.widthOfTextAtSize(next, size) > width) { out.push(line); line = word }
      else line = next
    }
    out.push(line)
  }
  return out
}

export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const client = db(event)
  const { data: l } = await client.from('letters').select('*').eq('id', getRouterParam(event, 'id')!).maybeSingle()
  if (!l) throw fail(404, 'Nie znaleziono listu.')
  const p = await requirePairing(event, l.pairing_id, me)
  if (l.sender_id !== me && Date.parse(l.deliver_at) > Date.now()) throw fail(404, 'Nie znaleziono listu.')

  const { data: people } = await client.from('profiles').select('id, name').in('id', [p.user_a_id, p.user_b_id])
  const nameOf = (id: string) => people?.find(x => x.id === id)?.name ?? ''
  const senderName = nameOf(l.sender_id)
  const recipientName = nameOf(l.sender_id === p.user_a_id ? p.user_b_id : p.user_a_id)

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const fontBytes = await useStorage('assets:server').getItemRaw('fonts/AtkinsonHyperlegible-Regular.ttf')
  const font = await doc.embedFont(fontBytes as Uint8Array, { subset: true })
  const footer = `Odpowiadając, napisz na kopercie: Do: ${senderName}, PalKod: ${p.pal_kod}`

  const newPage = (): PDFPage => {
    const page = doc.addPage(A4)
    page.drawText('PenPal', { x: M, y: A4[1] - M, size: 22, font, color: STAMP })
    // Sender is always PenPal, never a home address.
    page.drawText(`Nadawca: PenPal · Do: ${recipientName}`, { x: M, y: A4[1] - M - 20, size: 11, font, color: INK })
    page.drawLine({ start: { x: M, y: M + 26 }, end: { x: A4[0] - M, y: M + 26 }, thickness: 0.5, color: INK })
    page.drawText(footer, { x: M, y: M + 8, size: 12, font, color: INK })
    return page
  }
  const top = A4[1] - M - 60
  const bottom = M + 44

  if (l.kind === 'TYPED') {
    let page = newPage()
    let y = top
    page.drawText(formatDate(l.sent_at), { x: M, y, size: 12, font, color: INK })
    y -= 32
    for (const line of wrap(l.body ?? '', font, 13, A4[0] - 2 * M)) {
      if (y < bottom) { page = newPage(); y = top }
      page.drawText(line, { x: M, y, size: 13, font, color: INK })
      y -= 20
    }
  }
  else {
    for (const path of l.image_paths) {
      const { data: blob } = await client.storage.from('letters').download(path)
      if (!blob) continue
      const bytes = new Uint8Array(await blob.arrayBuffer())
      const img = path.endsWith('.png') ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)
      const page = newPage()
      const s = Math.min((A4[0] - 2 * M) / img.width, (top - bottom) / img.height)
      page.drawImage(img, { x: M, y: top - img.height * s, width: img.width * s, height: img.height * s })
    }
  }

  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'content-disposition', `inline; filename="list-${p.pal_kod}.pdf"`)
  return doc.save()
})

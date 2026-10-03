# PenPal Letters Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build screens 11–17 (Home, Korespondencja, Czytanie listu, Napisz list, Wyślij, Status listu, Dodaj zdjęcie), the paper-letter PDF, and the `/admin/skan` PalPoint scan simulator.

**Architecture:** Letters are created only by `POST /api/letters`, which accepts a typed body or photo pages as multipart. The route checks the one-letter-at-a-time rule on the server, and `sent_at`/`deliver_at` come from DB defaults (now, now + 2 days). Photos go to the private `letters` bucket; reads return 1-hour signed URLs. A letter is hidden from its recipient until `deliver_at`. Delivery steps come from the server (`LetterView.steps`). A draft (typed body or photo `File`s) lives in `useState` across Napisz/Zdjęcie → Wyślij, and the typed body is also kept in `localStorage`.

**Tech Stack:** Nuxt 4 pages, Nitro routes, `readMultipartFormData`, Supabase Storage, `pdf-lib` + `@pdf-lib/fontkit` with an embedded Atkinson Hyperlegible TTF for Polish glyphs.

**Spec:** `CLAUDE.md` (screens 11–17, rules 6–9, demo helpers), `docs/SPEC.md` ("Letter channels", "Addressing a letter without a real address"), designs `design/screens/{Home,Korespondencja,CzytanieListu,NapiszList,Wyslij,StatusListu,DodajZdjecie}.html`. Foundation plan: `docs/superpowers/plans/2026-10-03-penpal-01-foundation.md` (read "Global Constraints" and "Conventions").

**Prerequisite:** the foundation plan is complete. This slice runs in parallel with 02, 03, 05 and 06.

## Global Constraints

- Slow mail: `deliver_at = sent_at + 2 days` for every letter, set by the database. The recipient's API calls never return a letter before `deliver_at`.
- One letter at a time: `POST /api/letters` rejects the letter unless `PairingView.canWrite`. Admin scans bypass this, since they model paper already in the post.
- Paper default: if the recipient's channel is PAPER, "Jako list papierowy" is preselected.
- PDF: the sender line is "PenPal", never a home address. Footer exactly `Odpowiadając, napisz na kopercie: Do: <imię nadawcy>, PalKod: <kod>`.
- Photos: JPEG/PNG only, ≤ 8 MB each, ≤ 10 pages, stored in bucket `letters` at `<pairingId>/<letterId>/<n>.<ext>`.
- Polish copy verbatim from the designs; *(new copy)* is marked. Gendered design phrases are made gender-neutral where the name is dynamic.
- Don't edit files owned by foundation or other slices. No new npm dependencies. Manual verification only.

## Files (all new)

```
server/assets/fonts/AtkinsonHyperlegible-Regular.ttf, server/assets/fonts/OFL.txt
server/utils/letters.ts                         readLetterForm(), insertLetter()
server/api/pairings/[id]/letters.get.ts         GET  → LetterView[] (visible, newest first)
server/api/letters/index.post.ts                POST multipart → { id }
server/api/letters/[id]/index.get.ts            GET  → LetterResponse (marks read, signs image URLs)
server/api/letters/[id]/pdf.get.ts              GET  → application/pdf
server/api/admin/scan.post.ts                   POST multipart (code, palKod, from, pages) → { id, to }
app/composables/useLetterDraft.ts
app/components/PenPalCard.vue, LetterCard.vue, DeliveryTimeline.vue
app/pages/listy/index.vue                       11 Home
app/pages/korespondenci/[id]/index.vue          12 Korespondencja
app/pages/listy/[letterId]/index.vue            13 Czytanie listu
app/pages/korespondenci/[id]/napisz.vue         14 Napisz list
app/pages/korespondenci/[id]/wyslij.vue         15 Wyślij
app/pages/listy/[letterId]/status.vue           16 Status listu
app/pages/korespondenci/[id]/zdjecie.vue        17 Dodaj zdjęcie
app/pages/admin/skan.vue                        demo PalPoint scan
```

**Interfaces consumed (foundation):** `db`, `requireUserId`, `fail`, `requirePairing`, `loadPairingView`, `toLetterView`, `signUrls`; types `PairingView`, `LetterView`, `LetterResponse`; `decline`, `plural`, `formatLongDay`, `formatDate`, `formatShortDay`, `formatStepTime`, `onDay`, `initial`, `channelLabel` from `#shared/utils/polish`; `DELIVERY_MS`, `TimelineStep` from `#shared/utils/letters`; `topicFor`; `useProfile()`; components `ScreenTop`, `AppButton`, `RadioCard`, `InfoNote`, `AppIcon`; layout `default` (bottom nav) for Home.
**Links to other slices:** `/zaproszenia/:id`, `/propozycje` (03); `/korespondenci/:id/zglos`, `/profil` (06).

---

### Task 1: Letter API (create, list, read)

**Files:**
- Create: `server/utils/letters.ts`, `server/api/pairings/[id]/letters.get.ts`, `server/api/letters/index.post.ts`, `server/api/letters/[id]/index.get.ts`

**Interfaces:**
- Produces:
  - `readLetterForm(event): Promise<{ field(name: string): string, files: PageFile[] }>`
  - `insertLetter(event, { pairingId, senderId, channel, body, files }): Promise<string>`
  - `GET /api/pairings/:id/letters` → `LetterView[]` (no image URLs)
  - `POST /api/letters` (multipart: `pairingId`, `deliveryChannel` `APP|PAPER`, and either `body` or `pages[]`) → `{ id }`
  - `GET /api/letters/:id` → `LetterResponse` (image URLs signed; sets `read_at` when the recipient opens a delivered letter)

- [ ] **Step 1: `server/utils/letters.ts`**

```ts
import type { H3Event } from 'h3'
import type { DeliveryChannel } from '#shared/utils/letters'

const MAX_PAGES = 10
const MAX_BYTES = 8 * 1024 * 1024
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png' }

export interface PageFile { data: Buffer, type: string }

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
```

- [ ] **Step 2: Routes**

`server/api/pairings/[id]/letters.get.ts`:

```ts
export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const p = await requirePairing(event, getRouterParam(event, 'id')!, me)
  const { data } = await db(event).from('letters').select('*').eq('pairing_id', p.id).order('sent_at', { ascending: false })
  const now = Date.now()
  return (data ?? [])
    .filter(l => l.sender_id === me || Date.parse(l.deliver_at) <= now) // slow mail: hidden until delivered
    .map(l => toLetterView(l, me, [], now))
})
```

`server/api/letters/index.post.ts`:

```ts
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
```

`server/api/letters/[id]/index.get.ts`:

```ts
import type { LetterResponse } from '#shared/types/api'

export default defineEventHandler(async (event): Promise<LetterResponse> => {
  const me = await requireUserId(event)
  const client = db(event)
  const { data: l } = await client.from('letters').select('*').eq('id', getRouterParam(event, 'id')!).maybeSingle()
  if (!l) throw fail(404, 'Nie znaleziono listu.') // (new copy)
  const pairing = await requirePairing(event, l.pairing_id, me)
  const mine = l.sender_id === me
  if (!mine && Date.parse(l.deliver_at) > Date.now()) throw fail(404, 'Nie znaleziono listu.')
  if (!mine && !l.read_at) {
    l.read_at = new Date().toISOString()
    await client.from('letters').update({ read_at: l.read_at }).eq('id', l.id)
  }
  return {
    letter: toLetterView(l, me, await signUrls(event, l.image_paths)),
    pairing: await loadPairingView(event, pairing, me),
  }
})
```

- [ ] **Step 3: Verify**

Run `npx nuxi typecheck`; expect no errors. Then `npm run db:reset`, `npm run dev`, sign in as **kuba** at `/dev/login`, and in the console:

```js
const ps = await $fetch('/api/pairings')
const halina = ps.find(p => p.palKod === 'PP-7K3D'), tadeusz = ps.find(p => p.palKod === 'PP-4MWR')
;(await $fetch(`/api/pairings/${halina.id}/letters`)).length                       // 3
const fd = (body) => { const f = new FormData(); f.append('pairingId', tadeusz.id); f.append('deliveryChannel', 'PAPER'); f.append('body', body); return f }
await $fetch('/api/letters', { method: 'POST', body: fd('Hej') }).catch(e => e.data.message)
// "Odpiszesz, gdy przyjdzie list od Tadeusza."   (Kuba's letter to Tadeusz is still in transit)
const f2 = new FormData(); f2.append('pairingId', halina.id); f2.append('deliveryChannel', 'PAPER'); f2.append('body', 'Droga Halino, test.')
const { id } = await $fetch('/api/letters', { method: 'POST', body: f2 })
const r = await $fetch(`/api/letters/${id}`)
;[r.letter.mine, r.letter.delivered, r.letter.steps.length, r.pairing.canWrite]    // [true, false, 4, false]
```

Then sign in as **halina** and check that Kuba's new letter is hidden from her:

```js
const h = (await $fetch('/api/pairings')).find(p => p.palKod === 'PP-7K3D')
;(await $fetch(`/api/pairings/${h.id}/letters`)).some(l => l.body === 'Droga Halino, test.')   // false
```

- [ ] **Step 4: Commit**

```bash
git add server/utils/letters.ts "server/api/pairings/[id]/letters.get.ts" server/api/letters
git commit -m "feat(letters): create, list and read letters with slow-mail visibility"
```

---

### Task 2: Paper-letter PDF and the admin scan route

**Files:**
- Create: `server/assets/fonts/AtkinsonHyperlegible-Regular.ttf`, `server/assets/fonts/OFL.txt`, `server/api/letters/[id]/pdf.get.ts`, `server/api/admin/scan.post.ts`

**Interfaces:**
- Produces:
  - `GET /api/letters/:id/pdf` → printable A4 PDF (member only; the recipient only once delivered)
  - `POST /api/admin/scan` (multipart: `code`, `palKod`, `from`, `pages[]`) → `{ id, to }`. `code` must equal runtime config `adminCode` (`NUXT_ADMIN_CODE`).

- [ ] **Step 1: Add the font** (the built-in PDF fonts can't render ą, ę, ł…)

```bash
mkdir -p server/assets/fonts
curl -sL -o server/assets/fonts/AtkinsonHyperlegible-Regular.ttf https://github.com/google/fonts/raw/main/ofl/atkinsonhyperlegible/AtkinsonHyperlegible-Regular.ttf
curl -sL -o server/assets/fonts/OFL.txt https://github.com/google/fonts/raw/main/ofl/atkinsonhyperlegible/OFL.txt
ls -l server/assets/fonts   # TTF ≈ 54 KB
```

- [ ] **Step 2: `server/api/letters/[id]/pdf.get.ts`**

```ts
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
  return Buffer.from(await doc.save())
})
```

- [ ] **Step 3: `server/api/admin/scan.post.ts`**

```ts
// Demo helper: simulates a PalPoint scanning a paper letter. The PalKod routes the letter;
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
  if (!p) throw fail(404, 'Nie znaleziono aktywnego PalKodu.') // (new copy)
  const { data: people } = await client.from('profiles').select('id, name, channel').in('id', [p.user_a_id, p.user_b_id])
  const sender = people?.find(x => x.name?.toLocaleLowerCase('pl') === from)
  const recipient = people?.find(x => x.id !== sender?.id)
  if (!sender || !recipient) throw fail(400, 'Imię nadawcy nie pasuje do PalKodu.') // (new copy)

  const id = await insertLetter(event, {
    pairingId: p.id,
    senderId: sender.id,
    channel: recipient.channel ?? 'APP',
    body: null,
    files: form.files,
  })
  return { id, to: recipient.name }
})
```

- [ ] **Step 4: Verify**

Run `npx nuxi typecheck`; expect no errors. Then reset and sign in as **kuba**. Send a PAPER letter to Halina using the console snippet from Task 1, and open `http://localhost:3000/api/letters/<id>/pdf`. Expected: an A4 page headed "PenPal", the line "Nadawca: PenPal · Do: Halina", the date, the body with correct Polish characters, and the footer "Odpowiadając, napisz na kopercie: Do: Kuba, PalKod: PP-7K3D". No address appears anywhere.

Admin scan, from the console on any page:

```js
const png = await (await fetch('/pwa-192x192.png')).blob()
const f = new FormData(); f.append('code', 'skan-demo'); f.append('palKod', 'pp-4mwr'); f.append('from', 'Tadeusz'); f.append('pages', png, 'strona1.png')
await $fetch('/api/admin/scan', { method: 'POST', body: f })                                      // { id, to: "Kuba" }
f.set('from', 'Halina'); await $fetch('/api/admin/scan', { method: 'POST', body: f }).catch(e => e.data.message)   // "Imię nadawcy nie pasuje do PalKodu."
f.set('code', 'zly');    await $fetch('/api/admin/scan', { method: 'POST', body: f }).catch(e => e.data.message)   // "Nieprawidłowy kod."
```

In Supabase Studio → Storage → `letters`, the file is at `<pairingId>/<letterId>/1.png`.

- [ ] **Step 5: Commit**

```bash
git add server/assets server/api/letters server/api/admin
git commit -m "feat(letters): printable PDF with PalKod footer and PalPoint scan simulator"
```

---

### Task 3: Home and Korespondencja (screens 11–12)

**Files:**
- Create: `app/components/PenPalCard.vue`, `app/components/LetterCard.vue`, `app/pages/listy/index.vue`, `app/pages/korespondenci/[id]/index.vue`

**Interfaces:**
- Produces: `<PenPalCard :pairing="PairingView" />`, `<LetterCard :letter="LetterView" :partner-name="string" />`

- [ ] **Step 1: `app/components/PenPalCard.vue`**

Port the pen-pal cards in `design/screens/Home.html` and copy inline styles from there.

```vue
<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { channelLabel, decline, formatDate, formatShortDay, initial } from '#shared/utils/polish'

const props = defineProps<{ pairing: PairingView }>()
const p = computed(() => props.pairing)
const last = computed(() => p.value.lastLetter)
const state = computed(() =>
  last.value && !last.value.mine && !last.value.readAt ? 'new'
    : last.value?.mine && !last.value.delivered ? 'transit'
      : 'idle')
const pct = computed(() => last.value ? Math.round(100 * last.value.steps.filter(s => s.done).length / last.value.steps.length) : 0)
</script>

<template>
  <NuxtLink :to="`/korespondenci/${p.id}`" class="card" style="display: flex; flex-direction: column; gap: 12px">
    <div class="row">
      <div class="avatar" aria-hidden="true">{{ initial(p.partner.name) }}</div>
      <div style="flex: 1; min-width: 0">
        <h2 class="h2">{{ p.partner.name }}</h2>
        <div class="muted">PalKod {{ p.palKod }} · {{ channelLabel(p.partner.channel) }}</div>
      </div>
      <AppIcon name="chevron" :stroke-width="2.2" style="color: #5E667A" />
    </div>
    <div v-if="state === 'new'" class="row" style="color: #A8432A; font-weight: 700; font-size: 17px">
      <AppIcon name="mail" /><span>Nowy list! Przyszedł {{ formatDate(last!.deliverAt) }}</span>
    </div>
    <div v-else-if="state === 'transit'" style="display: flex; flex-direction: column; gap: 8px">
      <div class="row" style="justify-content: space-between; font-size: 17px">
        <span>Twój list jest w drodze</span><span class="muted">dotrze {{ formatShortDay(last!.deliverAt) }}</span>
      </div>
      <div class="progress"><div class="progress-bar" :style="{ width: `${pct}%` }" /></div>
    </div>
    <!-- (new copy) for the idle states -->
    <div v-else class="muted" style="font-size: 17px">
      {{ !last ? 'Napisz pierwszy list' : p.canWrite ? 'Twoja kolej — napisz list' : `Czekasz na list od ${decline(p.partner.name, 'gen')}` }}
    </div>
  </NuxtLink>
</template>
```

- [ ] **Step 2: `app/components/LetterCard.vue`**

Port the letter rows in `design/screens/Korespondencja.html`. Copy the scan-thumbnail `<svg viewBox="0 0 64 80">` verbatim for SCAN letters.

```vue
<script setup lang="ts">
import type { LetterView } from '#shared/types/api'
import { decline, formatDate } from '#shared/utils/polish'

const props = defineProps<{ letter: LetterView, partnerName: string }>()
const l = computed(() => props.letter)
const title = computed(() => l.value.mine ? 'Twój list' : `List od ${decline(props.partnerName, 'gen')}`)
const sub = computed(() => l.value.mine
  ? `${formatDate(l.value.sentAt)} · ${!l.value.delivered ? 'w drodze' : l.value.deliveryChannel === 'PAPER' ? 'dostarczony pocztą' : 'dostarczony w aplikacji'}`
  : `${formatDate(l.value.deliverAt)} · ${l.value.readAt ? 'przeczytany' : l.value.kind === 'SCAN' ? 'zeskanowany w PalPoincie' : 'napisany w aplikacji'}`)
</script>

<template>
  <NuxtLink :to="l.mine ? `/listy/${l.id}/status` : `/listy/${l.id}`" class="card" style="display: flex; gap: 14px; align-items: center">
    <!-- SCAN: copy the 64×80 scan thumbnail <svg> from Korespondencja.html here (width="44" height="56" aria-hidden="true") -->
    <AppIcon v-if="l.kind !== 'SCAN'" name="mail" :size="32" style="color: #A8432A" />
    <div style="flex: 1; min-width: 0">
      <div class="row" style="justify-content: space-between">
        <span style="font-weight: 700; font-size: 18px">{{ title }}</span>
        <span v-if="!l.mine && !l.readAt" class="tag">NOWY</span>
      </div>
      <div class="muted">{{ sub }}</div>
    </div>
    <AppIcon v-if="l.mine && l.delivered" name="check" :stroke-width="2.4" style="color: #2F6B45" />
  </NuxtLink>
</template>
```

Replace the HTML comment with the copied SVG wrapped in `v-if="l.kind === 'SCAN'"`. Copy the NOWY tag's inline style from the design.

- [ ] **Step 3: `app/pages/listy/index.vue`** (Home, default layout)

Port `design/screens/Home.html`, copying the header block's inline styles.

```vue
<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { formatLongDay, initial } from '#shared/utils/polish'

definePageMeta({ layout: 'default' })
const { profile, refreshProfile } = useProfile()
if (!profile.value) await refreshProfile()
const { data: pairings } = await useFetch<PairingView[]>('/api/pairings')

const active = computed(() => (pairings.value ?? []).filter(p => p.status === 'ACTIVE'))
const invites = computed(() => (pairings.value ?? []).filter(p => p.status === 'INVITED' && p.inviterId !== profile.value?.id))
const limit = computed(() => profile.value?.limit ?? 3)
const today = formatLongDay(new Date().toISOString())
const ORDINAL = ['pierwszego', 'drugiego', 'trzeciego', 'czwartego', 'piątego']
</script>

<template>
  <div class="page">
    <header style="padding: 28px 20px 8px">
      <div class="muted">{{ today }}</div>
      <h1 class="h1">Dzień dobry, {{ profile?.name }}</h1>
    </header>
    <main class="body">
      <div class="row" style="justify-content: space-between">
        <h2 class="h2">Moi korespondenci</h2>
        <div class="muted">{{ active.length }} z {{ limit }}</div>
      </div>

      <!-- (new copy) incoming invitation card, styled like a pen-pal card -->
      <NuxtLink v-for="p in invites" :key="p.id" :to="`/zaproszenia/${p.id}`" class="card row">
        <div class="avatar" aria-hidden="true">{{ initial(p.partner.name) }}</div>
        <div style="flex: 1">
          <div class="h2">{{ p.partner.name }}</div>
          <div style="color: #A8432A; font-weight: 700">{{ p.partner.name }} chce z Tobą korespondować</div>
        </div>
        <AppIcon name="chevron" style="color: #5E667A" />
      </NuxtLink>

      <PenPalCard v-for="p in active" :key="p.id" :pairing="p" />

      <NuxtLink v-if="active.length < limit" to="/propozycje" class="card row" style="border-style: dashed">
        <div class="avatar"><AppIcon name="plus" :stroke-width="2.2" /></div>
        <div>
          <div style="font-weight: 700; font-size: 18px">Wolne miejsce</div>
          <div class="muted">Znajdź {{ ORDINAL[active.length] }} korespondenta</div>
        </div>
      </NuxtLink>

      <p v-if="!profile?.isPremium" class="muted">Chcesz pisać z większą liczbą osób? <NuxtLink to="/profil">PenPal Premium</NuxtLink></p>
    </main>
  </div>
</template>
```

Replace the header, slot-card and paragraph styles with the exact inline styles from `Home.html`.

- [ ] **Step 4: `app/pages/korespondenci/[id]/index.vue`**

Port `design/screens/Korespondencja.html`.

```vue
<script setup lang="ts">
import type { LetterView, PairingView } from '#shared/types/api'
import { channelLabel, decline, initial } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const [{ data: p }, { data: letters }] = await Promise.all([
  useFetch<PairingView>(`/api/pairings/${id}`),
  useFetch<LetterView[]>(`/api/pairings/${id}/letters`),
])
</script>

<template>
  <div v-if="p" class="page">
    <ScreenTop back="/listy" :title="p.partner.name" :subtitle="`PalKod ${p.palKod} · ${channelLabel(p.partner.channel)}`">
      <template #lead><div class="avatar" aria-hidden="true" style="width: 44px; height: 44px; font-size: 18px">{{ initial(p.partner.name) }}</div></template>
      <NuxtLink class="back" :to="`/korespondenci/${id}/zglos`" aria-label="Więcej opcji"><AppIcon name="more" /></NuxtLink>
    </ScreenTop>
    <main class="body" style="gap: 12px; padding-top: 12px">
      <LetterCard v-for="l in letters ?? []" :key="l.id" :letter="l" :partner-name="p.partner.name" />
      <NuxtLink v-if="p.canWrite" :to="`/korespondenci/${id}/zdjecie`" class="note" style="text-decoration: none">
        <AppIcon name="camera" /><span>Wolisz napisać ręcznie? <b>Dodaj zdjęcie swojego listu</b></span>
      </NuxtLink>
    </main>
    <div class="foot">
      <AppButton v-if="p.canWrite" variant="stamp" :to="`/korespondenci/${id}/napisz`">
        {{ letters?.length ? `Odpisz ${decline(p.partner.name, 'dat')}` : 'Napisz pierwszy list' }}
      </AppButton>
      <p v-else class="muted" style="text-align: center">Odpiszesz, gdy przyjdzie list od {{ decline(p.partner.name, 'gen') }}.</p>
    </div>
  </div>
</template>
```

The last `<p>` is *(new copy)*.

- [ ] **Step 5: Verify**

`npm run db:reset`, sign in as **kuba**, open `/listy` at 390×844, and compare with `design/previews/Home.png`. Expect: "Moi korespondenci 2 z 3"; an invite card from Stanisław; Halina "Nowy list! Przyszedł <date>"; Tadeusz "Twój list jest w drodze · dotrze <d mmm>" with a progress bar; "Wolne miejsce / Znajdź trzeciego korespondenta"; the Premium hint; and the bottom nav with Listy active. Click Halina, then compare with `Korespondencja.png`: 3 letters, newest first, the top one tagged NOWY, the footer button "Odpisz Halinie". Open Tadeusz: the footer reads "Odpiszesz, gdy przyjdzie list od Tadeusza."

- [ ] **Step 6: Commit**

```bash
git add app/components/PenPalCard.vue app/components/LetterCard.vue app/pages/listy/index.vue "app/pages/korespondenci/[id]/index.vue"
git commit -m "feat(letters): home with pen-pal cards and correspondence timeline"
```

---

### Task 4: Reading a letter (screen 13)

**Files:**
- Create: `app/pages/listy/[letterId]/index.vue`

The design's Skan/Tekst toggle is left out on purpose: scans have no text without OCR, which is out of scope, and typed letters have no scan.

- [ ] **Step 1: Write the page**

Port `design/screens/CzytanieListu.html`.

```vue
<script setup lang="ts">
import type { LetterResponse } from '#shared/types/api'
import { decline, formatDate, plural } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const letterId = useRoute().params.letterId as string
const { data, error } = await useFetch<LetterResponse>(`/api/letters/${letterId}`)
const zoom = ref(100)
const l = computed(() => data.value?.letter)
const name = computed(() => data.value?.pairing.partner.name ?? '')
const title = computed(() => l.value?.mine ? 'Twój list' : `List od ${decline(name.value, 'gen')}`)
const subtitle = computed(() => {
  if (!l.value) return ''
  const date = formatDate(l.value.mine ? l.value.sentAt : l.value.deliverAt)
  const n = l.value.imageUrls.length
  return l.value.kind === 'SCAN' ? `${date} · ${n} ${plural(n, 'strona', 'strony', 'stron')}` : date
})
</script>

<template>
  <div class="page">
    <ScreenTop :back="l ? `/korespondenci/${l.pairingId}` : '/listy'" :title="title" :subtitle="subtitle" />
    <main v-if="l" class="body">
      <div v-if="l.kind === 'SCAN'" style="overflow: auto; display: flex; flex-direction: column; gap: 12px">
        <img
          v-for="(src, i) in l.imageUrls" :key="src" :src="src" :alt="`Strona ${i + 1} listu`"
          :style="{ width: `${zoom}%`, maxWidth: 'none', borderRadius: '6px', border: '1px solid #E3D8C3' }"
        >
      </div>
      <div v-else class="paper" :style="{ whiteSpace: 'pre-wrap', fontSize: `${18 * zoom / 100}px`, lineHeight: 1.75 }">{{ l.body }}</div>
      <div class="row" style="justify-content: center">
        <button class="back" type="button" aria-label="Pomniejsz" :disabled="zoom <= 75" @click="zoom -= 25"><AppIcon name="minus" :stroke-width="2.2" /></button>
        <span class="muted" aria-live="polite" style="min-width: 56px; text-align: center">{{ zoom }}%</span>
        <button class="back" type="button" aria-label="Powiększ" :disabled="zoom >= 200" @click="zoom += 25"><AppIcon name="plus" :stroke-width="2.2" /></button>
      </div>
    </main>
    <p v-else-if="error" class="error" role="alert" style="padding: 20px">{{ errorText(error) }}</p>
    <div v-if="l && !l.mine && data?.pairing.canWrite" class="foot">
      <AppButton variant="stamp" :to="`/korespondenci/${l.pairingId}/napisz`">Odpisz</AppButton>
    </div>
  </div>
</template>
```

Copy the `.paper` inline styles from `CzytanieListu.html` (padding, paper lines), keeping the dynamic `fontSize`.

- [ ] **Step 2: Verify**

As **kuba**, open Halina's newest letter. The letter text is on paper and the zoom buttons scale it from 75 to 200%. The footer shows "Odpisz". Back on `/listy`, Halina's card no longer says "Nowy list!" (`read_at` was set). For a scan: re-run the admin-scan console snippet from Task 2 Step 4 (Tadeusz, `PP-4MWR`), then deliver it with this **time shift** (used again in later tasks):

```bash
docker exec -i supabase_db_pen-pal psql -U postgres -c "update letters set sent_at=sent_at-interval '2 days', deliver_at=deliver_at-interval '2 days'"
```

Open Tadeusz → the new letter: the image shows, and zoom widens it with horizontal scroll.

- [ ] **Step 3: Commit**

```bash
git add "app/pages/listy/[letterId]/index.vue"
git commit -m "feat(letters): letter reading view with zoom"
```

---

### Task 5: Writing and sending (screens 14, 15, 17) and the draft composable

**Files:**
- Create: `app/composables/useLetterDraft.ts`, `app/pages/korespondenci/[id]/napisz.vue`, `app/pages/korespondenci/[id]/zdjecie.vue`, `app/pages/korespondenci/[id]/wyslij.vue`

**Interfaces:**
- Produces: `useLetterDraft(pairingId)` → `{ draft: Ref<{ mode: 'TYPED' | 'SCAN', body: string, pages: File[] }>, persist(), clear() }`

- [ ] **Step 1: `app/composables/useLetterDraft.ts`**

```ts
interface Draft { mode: 'TYPED' | 'SCAN', body: string, pages: File[] }

export function useLetterDraft(pairingId: string) {
  const draft = useState<Draft>(`draft-${pairingId}`, () => ({ mode: 'TYPED', body: '', pages: [] }))
  const key = `penpal-draft-${pairingId}`
  onMounted(() => {
    if (!draft.value.body) {
      try { draft.value.body = localStorage.getItem(key) ?? '' }
      catch { /* storage blocked: draft just won't survive a reload */ }
    }
  })
  function persist() {
    try { localStorage.setItem(key, draft.value.body) }
    catch { /* ignore */ }
  }
  function clear() {
    draft.value = { mode: 'TYPED', body: '', pages: [] }
    try { localStorage.removeItem(key) }
    catch { /* ignore */ }
  }
  return { draft, persist, clear }
}
```

- [ ] **Step 2: `app/pages/korespondenci/[id]/napisz.vue`**

Port `design/screens/NapiszList.html`.

```vue
<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { plural } from '#shared/utils/polish'
import { topicFor } from '#shared/utils/topics'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p } = await useFetch<PairingView>(`/api/pairings/${id}`)
if (p.value && !p.value.canWrite) await navigateTo(`/korespondenci/${id}`, { replace: true })

const { draft, persist } = useLetterDraft(id)
const saved = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
watch(() => draft.value.body, () => {
  saved.value = false
  clearTimeout(timer)
  timer = setTimeout(() => { persist(); saved.value = true }, 600)
})
const words = computed(() => draft.value.body.trim().split(/\s+/).filter(Boolean).length)
const topic = computed(() => p.value ? topicFor(p.value.sharedInterests) : null)

function next() {
  draft.value.mode = 'TYPED'
  return navigateTo(`/korespondenci/${id}/wyslij`)
}
</script>

<template>
  <div v-if="p" class="page">
    <ScreenTop :back="`/korespondenci/${id}`" title="Napisz list" :subtitle="`Do: ${p.partner.name}`">
      <span class="muted" aria-live="polite">{{ saved ? 'Zapisano' : '' }}</span>
    </ScreenTop>
    <main class="body">
      <InfoNote v-if="topic" icon="bulb">Pomysł na temat: <b>{{ topic.prompt }}</b></InfoNote>
      <label for="letter" class="label">Treść listu</label>
      <textarea
        id="letter" v-model="draft.body" class="paper" maxlength="5000"
        style="min-height: 380px; font-family: inherit; font-size: 18px; line-height: 32px; color: #1F2A44; resize: vertical"
      />
      <div class="row" style="justify-content: space-between">
        <span class="muted">{{ words }} {{ plural(words, 'słowo', 'słowa', 'słów') }}</span>
        <span class="muted">Dotrze za 2 dni</span>
      </div>
    </main>
    <div class="foot">
      <AppButton :disabled="!draft.body.trim()" @click="next">Dalej</AppButton>
    </div>
  </div>
</template>
```

Take the textarea's inline style from `NapiszList.html` if it differs, keeping `min-height`.

- [ ] **Step 3: `app/pages/korespondenci/[id]/zdjecie.vue`**

Port `design/screens/DodajZdjecie.html`. The big dashed "Zrób zdjęcie strony" tile is a real `<button>` that opens a hidden file input (no `capture` attribute, so phones offer camera *or* gallery).

```vue
<script setup lang="ts">
import type { PairingView } from '#shared/types/api'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p } = await useFetch<PairingView>(`/api/pairings/${id}`)
if (p.value && !p.value.canWrite) await navigateTo(`/korespondenci/${id}`, { replace: true })

const { draft } = useLetterDraft(id)
const input = ref<HTMLInputElement>()
const urls = computed(() => import.meta.client ? draft.value.pages.map(f => URL.createObjectURL(f)) : [])
watch(urls, (_, old) => old?.forEach(u => URL.revokeObjectURL(u)))

function add(e: Event) {
  const el = e.target as HTMLInputElement
  draft.value.pages = [...draft.value.pages, ...Array.from(el.files ?? [])].slice(0, 10)
  el.value = ''
}
function remove(i: number) {
  draft.value.pages = draft.value.pages.filter((_, j) => j !== i)
}
function next() {
  draft.value.mode = 'SCAN'
  return navigateTo(`/korespondenci/${id}/wyslij`)
}
</script>

<template>
  <div v-if="p" class="page">
    <ScreenTop :back="`/korespondenci/${id}`" title="Dodaj zdjęcie listu" :subtitle="`Do: ${p.partner.name}`" />
    <main class="body">
      <p class="p">Napisałeś list ręcznie? Zrób zdjęcie każdej strony — dostarczymy je jak skan.</p>
      <input ref="input" class="sr-only" type="file" accept="image/jpeg,image/png" multiple tabindex="-1" aria-hidden="true" @change="add">
      <button type="button" style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 28px 16px; border: 2px dashed #CDBF9F; border-radius: 16px; background: #FBF7EE; color: #1F2A44; font-family: inherit; cursor: pointer" @click="input?.click()">
        <AppIcon name="camera" :size="40" :stroke-width="1.8" style="color: #A8432A" />
        <span style="font-size: 18px; font-weight: 700">Zrób zdjęcie strony</span>
        <span class="muted">lub wybierz z galerii</span>
      </button>
      <template v-if="draft.pages.length">
        <div class="label">Dodane strony ({{ draft.pages.length }})</div>
        <div class="row" style="flex-wrap: wrap">
          <div v-for="(u, i) in urls" :key="u" style="position: relative">
            <img :src="u" :alt="`Strona ${i + 1}`" style="width: 96px; height: 124px; object-fit: cover; border-radius: 4px; border: 1px solid #CDBF9F">
            <span class="tag" style="position: absolute; left: 6px; bottom: 6px">{{ i + 1 }}</span>
            <!-- (new copy) -->
            <button type="button" class="back" :aria-label="`Usuń stronę ${i + 1}`" style="position: absolute; right: -10px; top: -10px; width: 36px; height: 36px; min-height: 0" @click="remove(i)">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
        </div>
      </template>
      <InfoNote icon="info">Połóż kartkę na płaskim blacie, w dobrym świetle.</InfoNote>
    </main>
    <div class="foot">
      <AppButton :disabled="!draft.pages.length" @click="next">Dalej</AppButton>
    </div>
  </div>
</template>
```

Copy the upload tile's and thumbnails' inline styles from `DodajZdjecie.html` if they differ. The remove button is 36px plus its padding around the thumbnail corner; keep its hit area at least 44px by adding `padding: 4px` if it measures smaller.

- [ ] **Step 4: `app/pages/korespondenci/[id]/wyslij.vue`**

Port `design/screens/Wyslij.html`.

```vue
<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { DELIVERY_MS } from '#shared/utils/letters'
import { onDay } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p } = await useFetch<PairingView>(`/api/pairings/${id}`)
const { draft, clear } = useLetterDraft(id)
const channel = ref(p.value?.partner.channel === 'PAPER' ? 'PAPER' : 'APP')
// Display estimate only; the server sets deliver_at.
const eta = onDay(new Date(Date.now() + DELIVERY_MS).toISOString())
const error = ref('')
const busy = ref(false)

onMounted(() => {
  const empty = draft.value.mode === 'SCAN' ? !draft.value.pages.length : !draft.value.body.trim()
  if (empty) navigateTo(`/korespondenci/${id}/napisz`, { replace: true })
})

async function send() {
  error.value = ''
  busy.value = true
  try {
    const fd = new FormData()
    fd.append('pairingId', id)
    fd.append('deliveryChannel', channel.value)
    if (draft.value.mode === 'SCAN') draft.value.pages.forEach(f => fd.append('pages', f))
    else fd.append('body', draft.value.body)
    const { id: letterId } = await $fetch<{ id: string }>('/api/letters', { method: 'POST', body: fd })
    clear()
    await navigateTo(`/listy/${letterId}/status`)
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <div v-if="p" class="page">
    <ScreenTop :back="`/korespondenci/${id}/${draft.mode === 'SCAN' ? 'zdjecie' : 'napisz'}`" title="Wyślij" />
    <main class="body">
      <h1 class="h1">Jak dostarczyć list?</h1>
      <RadioCard v-model="channel" name="delivery" value="PAPER">
        <div class="row" style="flex-wrap: wrap; gap: 8px">
          <div class="h2">Jako list papierowy</div>
          <span v-if="p.partner.channel === 'PAPER'" class="tag">{{ p.partner.name }} woli papier</span>
        </div>
        <p class="muted">Wydrukujemy list i wyślemy go pocztą. Na kopercie nadawcą będzie PenPal — Twój adres pozostaje ukryty.</p>
      </RadioCard>
      <RadioCard v-model="channel" name="delivery" value="APP">
        <div class="h2">W aplikacji</div>
        <p class="muted">{{ p.partner.name }} przeczyta list w aplikacji PenPal.</p>
      </RadioCard>
      <div class="card row" style="gap: 16px">
        <div class="postmark" aria-hidden="true" style="width: 64px; height: 64px; flex: none">2 DNI</div>
        <div>
          <div style="font-weight: 700; font-size: 18px">Dotrze {{ eta }}</div>
          <p class="muted">Każdy list idzie 2 dni — jak prawdziwa poczta.</p>
        </div>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton variant="stamp" :disabled="busy" @click="send">Wyślij list</AppButton>
    </div>
  </div>
</template>
```

Copy the postmark and card inline styles from `Wyslij.html`.

- [ ] **Step 5: Verify**

`npm run db:reset`, then as **kuba**:

1. Open Halina → Odpisz Halinie → Napisz. The topic note ("Pomysł na temat: …") shows. Type two words: the counter reads "2 słowa", and "Zapisano" appears after a pause. Reload the page and the text is still there (localStorage).
2. Dalej → Wyślij: "Jako list papierowy" is preselected with the tag "Halina woli papier", and the date reads "Dotrze w <dzień>, <data>". Compare with `design/previews/Wyslij.png`.
3. Wyślij list → `/listy/<id>/status` (404 until Task 6). Going back to Napisz now redirects to Korespondencja, because it's no longer Kuba's turn.
4. Run the time shift from Task 4 Step 2, then use `/admin/skan` (Task 6) or the console from Task 2 to scan a letter from Halina (`PP-7K3D`, "Halina"), and shift time again. Korespondencja → "Dodaj zdjęcie swojego listu" → pick 2 images. "Dodane strony (2)" shows two thumbnails, and the remove button works. Dalej → Wyślij → Wyślij list. The new letter has `kind: 'SCAN'` (check with `GET /api/letters/<id>`).

- [ ] **Step 6: Commit**

```bash
git add app/composables/useLetterDraft.ts "app/pages/korespondenci/[id]/napisz.vue" "app/pages/korespondenci/[id]/zdjecie.vue" "app/pages/korespondenci/[id]/wyslij.vue"
git commit -m "feat(letters): write, photo upload and send with delivery choice"
```

---

### Task 6: Status screen (16) and the admin scan page

**Files:**
- Create: `app/components/DeliveryTimeline.vue`, `app/pages/listy/[letterId]/status.vue`, `app/pages/admin/skan.vue`

**Interfaces:**
- Produces: `<DeliveryTimeline :steps="TimelineStep[]" />`

- [ ] **Step 1: `app/components/DeliveryTimeline.vue`** (styles taken from `StatusListu.html`: done = ink dot with a check, current = stamp ring, future = muted ring)

```vue
<script setup lang="ts">
import type { TimelineStep } from '#shared/utils/letters'
import { formatLongDay, formatStepTime } from '#shared/utils/polish'

const props = defineProps<{ steps: TimelineStep[] }>()
const current = computed(() => props.steps.findIndex(s => !s.done))
</script>

<template>
  <ol class="card" style="display: flex; flex-direction: column; gap: 0; padding: 20px; margin: 0; list-style: none">
    <li v-for="(s, i) in steps" :key="s.label" style="display: flex; gap: 14px" :aria-current="i === current ? 'step' : undefined">
      <div style="display: flex; flex-direction: column; align-items: center" aria-hidden="true">
        <div v-if="s.done" style="width: 26px; height: 26px; border-radius: 13px; background: #1F2A44; display: flex; align-items: center; justify-content: center; color: #FFFDF8">
          <AppIcon name="check" :size="16" :stroke-width="3.5" />
        </div>
        <div v-else-if="i === current" style="width: 26px; height: 26px; border-radius: 13px; border: 3px solid #A8432A; background: #FFFDF8" />
        <div v-else style="width: 26px; height: 26px; border-radius: 13px; border: 2px solid #CDBF9F" />
        <div v-if="i < steps.length - 1" :style="{ width: '2px', height: '36px', background: s.done ? '#1F2A44' : '#D9CDB5' }" />
      </div>
      <div>
        <div :style="{ fontWeight: s.done || i === current ? 700 : 400, fontSize: '17px', color: i === current ? '#8C3520' : undefined }">{{ s.label }}</div>
        <div class="muted">{{ s.done ? formatStepTime(s.at) : formatLongDay(s.at) }}</div>
      </div>
    </li>
  </ol>
</template>
```

- [ ] **Step 2: `app/pages/listy/[letterId]/status.vue`**

Port `design/screens/StatusListu.html`, copying the postmark and header block inline styles.

```vue
<script setup lang="ts">
import type { LetterResponse } from '#shared/types/api'
import { decline, onDay } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const letterId = useRoute().params.letterId as string
const { data } = await useFetch<LetterResponse>(`/api/letters/${letterId}`)
if (data.value && !data.value.letter.mine) await navigateTo(`/listy/${letterId}`, { replace: true })
const l = computed(() => data.value?.letter)
const name = computed(() => data.value?.pairing.partner.name ?? '')
</script>

<template>
  <div v-if="l" class="page">
    <ScreenTop back="/listy" back-icon="close" back-label="Zamknij" title="Status listu" />
    <main class="body">
      <div style="display: flex; flex-direction: column; gap: 10px">
        <div class="postmark" aria-hidden="true">
          <template v-if="l.delivered">DOSTARCZONY</template>
          <template v-else>W DRODZE<br>DO {{ decline(name, 'gen').toUpperCase() }}</template>
        </div>
        <!-- delivered variants are (new copy) -->
        <h1 class="h1">{{ l.delivered ? 'Twój list dotarł' : 'Twój list jest w drodze' }}</h1>
        <p class="p">{{ l.delivered ? `List dotarł ${onDay(l.deliverAt)}.` : `${name} dostanie go ${onDay(l.deliverAt)}.` }}</p>
      </div>
      <DeliveryTimeline :steps="l.steps" />
      <!-- (new copy) -->
      <a v-if="l.deliveryChannel === 'PAPER'" :href="`/api/letters/${l.id}/pdf`" target="_blank" rel="noopener" style="font-size: 17px; min-height: 48px; display: inline-flex; align-items: center">Zobacz wydruk (PDF)</a>
    </main>
    <div class="foot">
      <AppButton to="/listy">Wróć do moich listów</AppButton>
    </div>
  </div>
</template>
```

- [ ] **Step 3: `app/pages/admin/skan.vue`** (demo tool, not designed; reuses the form styles; all copy is *(new copy)*)

```vue
<script setup lang="ts">
definePageMeta({ layout: 'plain' })
const code = ref('')
const palKod = ref('')
const from = ref('')
const files = ref<File[]>([])
const result = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  result.value = ''
  busy.value = true
  try {
    const fd = new FormData()
    fd.append('code', code.value)
    fd.append('palKod', palKod.value)
    fd.append('from', from.value)
    files.value.forEach(f => fd.append('pages', f))
    const r = await $fetch<{ id: string, to: string }>('/api/admin/scan', { method: 'POST', body: fd })
    result.value = `List zeskanowany. Dotrze do: ${r.to} za 2 dni.`
    files.value = []
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <form class="page" @submit.prevent="submit">
    <ScreenTop title="Skan w PalPoincie" subtitle="Narzędzie demo" />
    <main class="body">
      <div class="field">
        <label class="label" for="code">Kod obsługi</label>
        <input id="code" v-model="code" class="input" type="password" autocomplete="off" required>
      </div>
      <div class="field">
        <label class="label" for="kod">PalKod z koperty</label>
        <input id="kod" v-model="palKod" class="input" type="text" placeholder="PP-7K3D" autocapitalize="characters" required>
      </div>
      <div class="field">
        <label class="label" for="from">Od (imię nadawcy)</label>
        <input id="from" v-model="from" class="input" type="text" required>
      </div>
      <div class="field">
        <label class="label" for="pages">Zdjęcia stron</label>
        <input id="pages" class="input" style="padding-top: 14px" type="file" accept="image/jpeg,image/png" multiple required @change="files = Array.from(($event.target as HTMLInputElement).files ?? [])">
      </div>
      <InfoNote v-if="result" icon="check">{{ result }}</InfoNote>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton type="submit" variant="stamp" :disabled="busy || !files.length">Zeskanuj list</AppButton>
    </div>
  </form>
</template>
```

- [ ] **Step 4: Verify**

Run `npx nuxi typecheck`; expect no errors. Then `npm run db:reset`, and as **kuba**:

1. Write to Halina (PAPER) → Wyślij list. The status page shows the postmark "W DRODZE DO HALINY", "Halina dostanie go w <dzień>, <data>.", and 4 steps with "Wysłany" done and "Wydrukowany" as current in red. Compare with `design/previews/StatusListu.png`. "Zobacz wydruk (PDF)" opens the PDF.
2. Run the SQL time shift (Task 4 Step 2). Reload: all steps are done, the postmark reads DOSTARCZONY, and the heading reads "Twój list dotarł".
3. Open `/admin/skan` (signed out works too), and enter `skan-demo`, `pp-7k3d`, `Halina`, and a PNG/JPG. You see "List zeskanowany. Dotrze do: Kuba za 2 dni." Shift time, then on `/listy` as kuba Halina shows "Nowy list!". Open it to see the scanned image.
4. Open `/listy/<Halina's letter id>/status` as kuba. It redirects to the reading view, since it's not Kuba's letter.

- [ ] **Step 5: Commit**

```bash
git add app/components/DeliveryTimeline.vue "app/pages/listy/[letterId]/status.vue" app/pages/admin/skan.vue
git commit -m "feat(letters): delivery status timeline and PalPoint scan demo page"
```

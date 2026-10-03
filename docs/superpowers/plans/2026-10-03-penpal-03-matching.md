# PenPal Matching Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build screens 7–10 (Szukamy, Propozycje, Zaproszenie, Nowy korespondent) and the matching, invite and accept API.

**Architecture:** `server/utils/matching.ts` loads candidates with the service-role client and applies the pure rules from `shared/utils/rules.ts`: hard filters, then a score. Following the user's decision, "Zaproś" creates an **ACTIVE** pairing at once (the senior's acceptance is simulated). `POST /api/demo/invite`, called at the end of onboarding, creates one **INVITED** pairing *from* the best match to the new user, so the accept/decline screen is reachable.

**Tech Stack:** Nuxt 4 pages and Nitro routes, Supabase service client.

**Spec:** `CLAUDE.md` (screens 7–10, rules 3–5), `docs/SPEC.md` ("Matching", "Addressing a letter without a real address"), designs `design/screens/{Szukamy,Propozycje,Zaproszenie,NowyKorespondent}.html`. Foundation plan: `docs/superpowers/plans/2026-10-03-penpal-01-foundation.md` (read "Global Constraints" and "Conventions").

**Prerequisite:** the foundation plan is complete. This slice runs in parallel with 02, 04, 05 and 06.

## Global Constraints

- Candidate filters: other generation (`isOtherGeneration`: 18-25 ↔ 60-75/75+), at least one shared letter language, a finished profile (has channel and ≥3 interests), the candidate below their ACTIVE limit, and no earlier pairing with me in any status (the DB enforces one pairing per pair).
- Score = 2 × shared interests + 1 same city + 1 same channel. Show the top 3.
- Max 3 ACTIVE pairings (Premium 5). When full, show the copy exactly: `Masz już 3 korespondentów. Zakończ jedną znajomość, aby poznać kogoś nowego.` (with the user's limit in place of 3).
- Never send a candidate's city or address to the client. Return `PublicProfile` only.
- PalKod from `generatePalKod()`; retry on a unique clash.
- Polish copy verbatim from the designs; *(new copy)* is marked.
- Don't edit files owned by foundation or other slices. No new dependencies. Manual verification only.

## Files (all new)

```
server/utils/matching.ts                   findMatches(), activeCount(), createPairing()
server/api/matches.get.ts                  GET  /api/matches → MatchesResponse
server/api/pairings/index.post.ts          POST /api/pairings { userId } → { id }
server/api/pairings/[id]/accept.post.ts    POST → { id }
server/api/pairings/[id]/decline.post.ts   POST → { ok: true }
server/api/demo/invite.post.ts             POST → { id: string | null }
app/pages/szukamy.vue                      7
app/pages/propozycje.vue                   8
app/pages/zaproszenia/[id].vue             9
app/pages/korespondenci/[id]/nowy.vue      10
```

**Interfaces consumed (foundation):** `db`, `requireUserId`, `fail`, `toPublicProfile`, `loadMe`, `requirePairing`, `loadPairingView` (server auto-imports); types `MatchView`, `MatchesResponse`, `PairingView`, `PublicProfile`; rules `isOtherGeneration`, `sharesLanguage`, `sharedInterests`, `matchScore`, `pairLimit`, `generatePalKod`; `ageLabel`, `channelLabel`, `initial` from `#shared/utils/polish`; `topicFor` from `#shared/utils/topics`; `GET /api/pairings/:id`; `useProfile()`.
**Produced for other slices:** `POST /api/demo/invite` (called by slice 02's Kanał page).
**Links to other slices:** `/korespondenci/:id/napisz` and `/listy` (slice 04).

---

### Task 1: Matching engine and API

**Files:**
- Create: `server/utils/matching.ts`, `server/api/matches.get.ts`, `server/api/pairings/index.post.ts`, `server/api/pairings/[id]/accept.post.ts`, `server/api/pairings/[id]/decline.post.ts`, `server/api/demo/invite.post.ts`

**Interfaces:**
- Produces:
  - `findMatches(event, me: string): Promise<MatchView[]>`: every candidate, sorted by score desc, then name
  - `activeCount(event, userId: string): Promise<number>`
  - `createPairing(event, inviterId, inviteeId, status: 'ACTIVE' | 'INVITED'): Promise<string>`: returns the new pairing id

- [ ] **Step 1: `server/utils/matching.ts`**

```ts
import type { H3Event } from 'h3'
import type { MatchView } from '#shared/types/api'
import { generatePalKod, isOtherGeneration, matchScore, pairLimit, sharedInterests, sharesLanguage } from '#shared/utils/rules'

export async function activeCount(event: H3Event, userId: string): Promise<number> {
  const { count } = await db(event).from('pairings').select('id', { count: 'exact', head: true })
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`).eq('status', 'ACTIVE')
  return count ?? 0
}

// ponytail: loads every profile and pairing per request; fine for a city pilot, move to a SQL view/RPC past a few thousand users.
export async function findMatches(event: H3Event, me: string): Promise<MatchView[]> {
  const client = db(event)
  const [{ data: profiles }, { data: privs }, { data: pairings }] = await Promise.all([
    client.from('profiles').select('*').not('channel', 'is', null).not('age_range', 'is', null),
    client.from('private_profiles').select('id, city'),
    client.from('pairings').select('user_a_id, user_b_id, status'),
  ])
  const cityOf = new Map((privs ?? []).map(p => [p.id, p.city]))
  const all = pairings ?? []
  const self = (profiles ?? []).find(p => p.id === me)
  if (!self?.age_range || !self.channel) return []

  const pairedWithMe = new Set(all.flatMap(p =>
    p.user_a_id === me ? [p.user_b_id] : p.user_b_id === me ? [p.user_a_id] : []))
  const active = new Map<string, number>()
  for (const p of all.filter(p => p.status === 'ACTIVE'))
    for (const id of [p.user_a_id, p.user_b_id]) active.set(id, (active.get(id) ?? 0) + 1)

  const meInput = { interests: self.interests, channel: self.channel, city: cityOf.get(me) ?? null }
  return (profiles ?? [])
    .filter(p => p.id !== me
      && p.interests.length >= 3
      && isOtherGeneration(self.age_range!, p.age_range!)
      && sharesLanguage(self.languages, p.languages)
      && !pairedWithMe.has(p.id)
      && (active.get(p.id) ?? 0) < pairLimit(p.is_premium))
    .map(p => ({
      profile: toPublicProfile(p),
      sharedInterests: sharedInterests(self.interests, p.interests),
      score: matchScore(meInput, { interests: p.interests, channel: p.channel!, city: cityOf.get(p.id) ?? null }),
    }))
    .sort((a, b) => b.score - a.score || a.profile.name.localeCompare(b.profile.name, 'pl'))
}

export async function createPairing(event: H3Event, inviterId: string, inviteeId: string, status: 'ACTIVE' | 'INVITED'): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await db(event).from('pairings')
      .insert({ user_a_id: inviterId, user_b_id: inviteeId, pal_kod: generatePalKod(), status })
      .select('id').single()
    if (data) return data.id
    // 23505 = unique violation: retry only if the PalKod clashed, not the pair itself
    if (error?.code !== '23505' || !error.message.includes('pal_kod')) break
  }
  throw fail(409, 'Ta osoba nie jest już dostępna.') // (new copy)
}
```

- [ ] **Step 2: Routes**

`server/api/matches.get.ts`:

```ts
import type { MatchesResponse } from '#shared/types/api'

export default defineEventHandler(async (event): Promise<MatchesResponse> => {
  const me = await requireUserId(event)
  const { limit } = await loadMe(event, me)
  if (await activeCount(event, me) >= limit) return { full: true, limit, matches: [] }
  return { full: false, limit, matches: (await findMatches(event, me)).slice(0, 3) }
})
```

`server/api/pairings/index.post.ts`:

```ts
export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const { userId } = await readBody<{ userId?: string }>(event)
  const { limit } = await loadMe(event, me)
  if (await activeCount(event, me) >= limit)
    throw fail(409, `Masz już ${limit} korespondentów. Zakończ jedną znajomość, aby poznać kogoś nowego.`)
  const candidates = await findMatches(event, me)
  if (!userId || !candidates.some(c => c.profile.id === userId)) throw fail(400, 'Ta osoba nie jest już dostępna.')
  // ponytail: invitation is auto-accepted (demo; seniors "accept at the PalPoint"). Real flow = status 'INVITED'.
  return { id: await createPairing(event, me, userId, 'ACTIVE') }
})
```

`server/api/pairings/[id]/accept.post.ts`:

```ts
export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const p = await requirePairing(event, getRouterParam(event, 'id')!, me)
  if (p.status !== 'INVITED' || p.user_b_id !== me) throw fail(400, 'To zaproszenie jest już nieaktualne.') // (new copy)
  const { limit } = await loadMe(event, me)
  if (await activeCount(event, me) >= limit)
    throw fail(409, `Masz już ${limit} korespondentów. Zakończ jedną znajomość, aby poznać kogoś nowego.`)
  const { error } = await db(event).from('pairings').update({ status: 'ACTIVE' }).eq('id', p.id)
  if (error) throw fail(500, 'Nie udało się przyjąć zaproszenia.') // (new copy)
  return { id: p.id }
})
```

`server/api/pairings/[id]/decline.post.ts`:

```ts
export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const p = await requirePairing(event, getRouterParam(event, 'id')!, me)
  if (p.status !== 'INVITED' || p.user_b_id !== me) throw fail(400, 'To zaproszenie jest już nieaktualne.')
  await db(event).from('pairings').update({ status: 'ENDED' }).eq('id', p.id)
  return { ok: true }
})
```

`server/api/demo/invite.post.ts`:

```ts
// Demo helper (hackathon): after onboarding, the best-matching seeded user "invites" the new user,
// so the Zaproszenie screen is part of the journey. Idempotent: one pending invite at most.
export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const { data: pending } = await db(event).from('pairings').select('id')
    .eq('user_b_id', me).eq('status', 'INVITED').limit(1).maybeSingle()
  if (pending) return { id: pending.id }
  const [best] = await findMatches(event, me)
  if (!best) return { id: null }
  return { id: await createPairing(event, best.profile.id, me, 'INVITED') }
})
```

- [ ] **Step 3: Verify the API**

Run `npx nuxi typecheck`; expect no errors. Then `npm run db:reset`, `npm run dev`, sign in as **ola** at `/dev/login` (18-25, Historia/Muzyka/Rękodzieło/Przyroda, APP, Kraków), and in the devtools console:

```js
await $fetch('/api/matches')
```

Expected: `full: false`, `limit: 3`, three matches, all aged `60-75` or `75+`. Stanisław (Historia+Muzyka = 4, +1 Kraków = 5) is first. No `city`/`postalAddress` keys anywhere. Kuba and other 18-25 users are absent. Then:

```js
const inv = await $fetch('/api/demo/invite', { method: 'POST' })                        // { id }
;(await $fetch('/api/demo/invite', { method: 'POST' })).id === inv.id                    // true (idempotent)
;(await $fetch('/api/matches')).matches.some(m => m.profile.name === 'Stanisław')        // false (now paired)
const m = (await $fetch('/api/matches')).matches[0]
const { id } = await $fetch('/api/pairings', { method: 'POST', body: { userId: m.profile.id } })
;(await $fetch(`/api/pairings/${id}`)).status                                            // "ACTIVE"
;(await $fetch(`/api/pairings/${id}`)).palKod                                            // /^PP-[A-HJ-NP-Z2-9]{4}$/
await $fetch('/api/pairings', { method: 'POST', body: { userId: m.profile.id } }).catch(e => e.data.message)
// "Ta osoba nie jest już dostępna."
await $fetch(`/api/pairings/${inv.id}/accept`, { method: 'POST' })                         // { id }
```

Then sign in as **kuba** (2 active plus the Stanisław invite). Accept the seeded invite `00000000-0000-0000-0000-00000000a003`, which makes 3 active. `await $fetch('/api/matches')` → `full: true`. Posting to `/api/pairings` returns the "Masz już 3 korespondentów…" message.

- [ ] **Step 4: Commit**

```bash
git add server/utils/matching.ts server/api/matches.get.ts server/api/pairings server/api/demo/invite.post.ts
git commit -m "feat(matching): candidate scoring, invite, accept/decline and demo invite API"
```

---

### Task 2: Szukamy and Propozycje (screens 7–8)

**Files:**
- Create: `app/pages/szukamy.vue`, `app/pages/propozycje.vue`

- [ ] **Step 1: `app/pages/szukamy.vue`**

Port `design/screens/Szukamy.html`. Copy the dotted-path illustration `<svg>` verbatim.

```vue
<script setup lang="ts">
definePageMeta({ layout: 'plain' })
const { profile, refreshProfile } = useProfile()
if (!profile.value) await refreshProfile()
</script>

<template>
  <div class="page">
    <main class="body" style="justify-content: center; text-align: center; align-items: center">
      <!-- illustration: copy the Szukamy.html <svg> verbatim, with aria-hidden="true" -->
      <div>
        <h1 class="h1">Szukamy dla Ciebie korespondenta</h1>
        <p class="p">Łączymy osoby z innego pokolenia, które lubią to samo co Ty. Damy Ci znać, gdy kogoś znajdziemy.</p>
      </div>
      <div class="chips" style="justify-content: center">
        <span v-for="i in profile?.interests ?? []" :key="i" class="tag">{{ i }}</span>
      </div>
    </main>
    <div class="foot">
      <AppButton to="/propozycje">Zobacz propozycje</AppButton>
      <p class="muted" style="text-align: center">Powiadomimy Cię SMS-em i w aplikacji.</p>
    </div>
  </div>
</template>
```

Replace the HTML comment with the copied SVG. Copy the wrapper inline styles from the design.

- [ ] **Step 2: `app/pages/propozycje.vue`**

Port `design/screens/Propozycje.html`.

```vue
<script setup lang="ts">
import type { MatchesResponse } from '#shared/types/api'
import { ageLabel, channelLabel, initial } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const { data, error: loadError } = await useFetch<MatchesResponse>('/api/matches')
const error = ref('')
const busy = ref('')

async function invite(userId: string) {
  error.value = ''
  busy.value = userId
  try {
    const { id } = await $fetch<{ id: string }>('/api/pairings', { method: 'POST', body: { userId } })
    await navigateTo(`/korespondenci/${id}/nowy`)
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = '' }
}
</script>

<template>
  <div class="page">
    <ScreenTop back="/szukamy" title="Propozycje" />
    <main class="body">
      <template v-if="data?.full">
        <InfoNote icon="info">Masz już {{ data.limit }} korespondentów. Zakończ jedną znajomość, aby poznać kogoś nowego.</InfoNote>
        <AppButton to="/listy">Przejdź do moich listów</AppButton>
      </template>
      <template v-else-if="data?.matches.length">
        <div>
          <h1 class="h1">Znaleźliśmy kogoś dla Ciebie!</h1>
          <p class="muted">Zaproś jedną osobę do korespondencji.</p>
        </div>
        <article v-for="m in data.matches" :key="m.profile.id" class="card" style="display: flex; flex-direction: column; gap: 12px">
          <div class="row">
            <div class="avatar" aria-hidden="true">{{ initial(m.profile.name) }}</div>
            <div>
              <h2 class="h2">{{ m.profile.name }}</h2>
              <div class="muted">{{ ageLabel(m.profile.ageRange) }} · {{ channelLabel(m.profile.channel) }}</div>
            </div>
          </div>
          <p class="p">{{ m.profile.bio }}</p>
          <div class="row" style="justify-content: space-between">
            <div class="chips" aria-label="Wspólne zainteresowania"><span v-for="i in m.sharedInterests" :key="i" class="tag">{{ i }}</span></div>
            <AppButton :disabled="!!busy" style="width: auto; padding: 0 22px" @click="invite(m.profile.id)">Zaproś</AppButton>
          </div>
        </article>
      </template>
      <template v-else>
        <h1 class="h1">Szukamy dla Ciebie korespondenta</h1>
        <p class="p">Damy Ci znać, gdy kogoś znajdziemy.</p>
      </template>
      <p v-if="error || loadError" class="error" role="alert">{{ error || errorText(loadError) }}</p>
    </main>
  </div>
</template>
```

Copy the card and button inline styles from `Propozycje.html` where they differ.

- [ ] **Step 3: Verify**

Sign in as **ola** after `npm run db:reset`. `/szukamy` shows Ola's 4 interests as tags. `/propozycje` shows 3 cards, compared against `design/previews/Propozycje.png`. Clicking Zaproś goes to `/korespondenci/<id>/nowy` (404 until Task 3). As **kuba** with the invite accepted (3 active), `/propozycje` shows the limit note and "Przejdź do moich listów".

- [ ] **Step 4: Commit**

```bash
git add app/pages/szukamy.vue app/pages/propozycje.vue
git commit -m "feat(matching): searching and proposals screens"
```

---

### Task 3: Zaproszenie and Nowy korespondent (screens 9–10)

**Files:**
- Create: `app/pages/zaproszenia/[id].vue`, `app/pages/korespondenci/[id]/nowy.vue`

- [ ] **Step 1: `app/pages/zaproszenia/[id].vue`**

Port `design/screens/Zaproszenie.html`, copying the `.paper` and `.postmark` inline styles (rotation, position).

```vue
<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { ageLabel, channelLabel, initial } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p, error: loadError } = await useFetch<PairingView>(`/api/pairings/${id}`)
const error = ref('')
const busy = ref(false)

async function act(action: 'accept' | 'decline') {
  error.value = ''
  busy.value = true
  try {
    await $fetch(`/api/pairings/${id}/${action}`, { method: 'POST' })
    await navigateTo(action === 'accept' ? `/korespondenci/${id}/nowy` : '/listy')
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <div class="page">
    <ScreenTop back="/listy" title="Zaproszenie" />
    <main v-if="p" class="body">
      <h1 class="h1">{{ p.partner.name }} chce z Tobą korespondować</h1>
      <div class="paper" style="position: relative; display: flex; flex-direction: column; gap: 14px">
        <div class="postmark" aria-hidden="true" style="position: absolute; right: 14px; top: 10px">PENPAL<br>ZAPROSZENIE</div>
        <div class="row">
          <div class="avatar" aria-hidden="true">{{ initial(p.partner.name) }}</div>
          <div>
            <h2 class="h2">{{ p.partner.name }}</h2>
            <div class="muted">{{ ageLabel(p.partner.ageRange) }} · {{ channelLabel(p.partner.channel) }}</div>
          </div>
        </div>
        <p class="p">{{ p.partner.bio }}</p>
        <div v-if="p.sharedInterests.length">
          <div class="label">Wspólne zainteresowania</div>
          <div class="chips"><span v-for="i in p.sharedInterests" :key="i" class="tag">{{ i }}</span></div>
        </div>
      </div>
      <InfoNote icon="lock">Nie zobaczycie nawzajem swoich adresów ani miast.</InfoNote>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <p v-else-if="loadError" class="error" role="alert" style="padding: 20px">{{ errorText(loadError) }}</p>
    <div v-if="p?.status === 'INVITED'" class="foot">
      <AppButton variant="stamp" :disabled="busy" @click="act('accept')">Przyjmij zaproszenie</AppButton>
      <AppButton variant="outline" :disabled="busy" @click="act('decline')">Odrzuć</AppButton>
    </div>
  </div>
</template>
```

- [ ] **Step 2: `app/pages/korespondenci/[id]/nowy.vue`**

Port `design/screens/NowyKorespondent.html`. Gendered phrases in the design ("jej listy", "jej list") are rewritten gender-neutral *(new copy)*.

```vue
<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { initial } from '#shared/utils/polish'
import { topicFor } from '#shared/utils/topics'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p } = await useFetch<PairingView>(`/api/pairings/${id}`)
const { profile, refreshProfile } = useProfile()
if (!profile.value) await refreshProfile()
const topic = computed(() => p.value ? topicFor(p.value.sharedInterests) : null)
const paper = computed(() => p.value?.partner.channel === 'PAPER')
</script>

<template>
  <div v-if="p" class="page">
    <main class="body" style="justify-content: center">
      <div class="row" style="justify-content: center; gap: 0" aria-hidden="true">
        <div class="avatar">{{ initial(profile?.name ?? '') }}</div>
        <div class="postmark">PENPAL</div>
        <div class="avatar">{{ initial(p.partner.name) }}</div>
      </div>
      <div>
        <h1 class="h1">Masz nowego korespondenta!</h1>
        <p class="p">
          Ty i {{ p.partner.name }} zaczynacie korespondencję.
          <template v-if="paper">{{ p.partner.name }} pisze ręcznie — każdy list zeskanujemy dla Ciebie.</template>
        </p>
      </div>
      <div class="card" style="text-align: center">
        <div class="muted">Wasz PalKod</div>
        <div style="font-family: 'Fraunces', Georgia, serif; font-weight: 700; font-size: 40px; letter-spacing: 0.08em; color: #A8432A">{{ p.palKod }}</div>
        <p v-if="paper" class="muted">{{ p.partner.name }} wpisuje go na kopercie zamiast adresu. Dzięki niemu list trafi do Ciebie.</p>
      </div>
      <InfoNote v-if="topic" icon="bulb">Na początek: {{ topic.prompt }}. Oboje lubicie <b>{{ topic.interest }}</b>.</InfoNote>
    </main>
    <div class="foot">
      <AppButton variant="stamp" :to="`/korespondenci/${id}/napisz`">Napisz pierwszy list</AppButton>
      <AppButton variant="outline" to="/listy">Przejdź do moich listów</AppButton>
    </div>
  </div>
</template>
```

Replace the PalKod and avatar-row inline styles with the ones in `NowyKorespondent.html`.

- [ ] **Step 3: Verify**

After `npm run db:reset`, sign in as **kuba** and open `/zaproszenia/00000000-0000-0000-0000-00000000a003`. Expect "Stanisław chce z Tobą korespondować", shared interests Historia and Podróże, and the privacy note. Przyjmij goes to Nowy korespondent with PalKod `PP-9XQT` and a topic note. For a second check, reset and sign in as kuba again, then Odrzuć goes to `/listy` and `GET /api/pairings` no longer lists Stanisław. Compare both screens with `design/previews/{Zaproszenie,NowyKorespondent}.png`.

Then run the full slice check from a fresh sign-up (needs slice 02 merged; if not, use **ola**): Kanał → Szukamy → Propozycje → Zaproś → Nowy korespondent shows a fresh PalKod.

- [ ] **Step 4: Commit**

```bash
git add "app/pages/zaproszenia/[id].vue" "app/pages/korespondenci/[id]/nowy.vue"
git commit -m "feat(matching): invitation and new pen pal screens"
```

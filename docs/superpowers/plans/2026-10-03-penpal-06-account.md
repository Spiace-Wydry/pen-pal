# PenPal Account & Safety Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build screens 20–21 (Profil i ustawienia, Zgłoś / Zablokuj): report and block API, notification toggles, the Premium teaser, and the hidden "Przewiń czas o 2 dni" demo button.

**Architecture:** Settings read and write the profile through foundation's `useProfile()` (`PATCH /api/me`). Reports are inserted with the service client after a membership check. Blocking sets the pairing to `BLOCKED`, which removes it from `GET /api/pairings`, frees a slot, and keeps the pair out of matching (one pairing per pair, ever). Fast-forward is a Postgres function that shifts `sent_at`/`deliver_at` of the caller's letters back 2 days. Delivery state is derived from those timestamps, so nothing else changes.

**Tech Stack:** Nuxt 4 pages, Nitro routes, one SQL migration.

**Spec:** `CLAUDE.md` (screens 20–21, rule 3, demo helpers), `docs/SPEC.md` ("Safety & privacy", Premium in "Matching"), designs `design/screens/{Ustawienia,Zglos}.html`. Foundation plan: `docs/superpowers/plans/2026-10-03-penpal-01-foundation.md` (read "Global Constraints" and "Conventions").

**Prerequisite:** the foundation plan is complete. This slice runs in parallel with 02–05.

## Global Constraints

- Address is shown as "Ukryty · widzi go tylko PenPal" and never echoed on screen.
- Premium: show the screen only, with no payments. Copy: "Pisz z większą liczbą osób — do 5 korespondentów zamiast 3."
- Safety tip copy exactly: "Nigdy nie podawaj danych do konta ani nie wysyłaj pieniędzy. PenPal nigdy o to nie prosi."
- Blocking needs a confirmation step (no browser `confirm()` dialogs).
- The fast-forward button is labelled exactly "Przewiń czas o 2 dni" and is visually low-key.
- Polish copy verbatim from the designs; *(new copy)* is marked.
- Don't edit files owned by foundation or other slices. No new dependencies. Manual verification only.

## Files (all new)

```
supabase/migrations/20261003130000_fast_forward.sql
shared/utils/reports.ts                        REPORT_REASONS
server/api/reports.post.ts                     POST { pairingId, reason, details? } → { ok: true }
server/api/pairings/[id]/block.post.ts         POST → { ok: true }
server/api/demo/fast-forward.post.ts           POST → { moved: number }
app/pages/profil/index.vue                     20 (default layout, bottom nav)
app/pages/korespondenci/[id]/zglos.vue         21
```

**Interfaces consumed (foundation):** `db`, `requireUserId`, `fail`, `requirePairing` (server); `useProfile()`, `errorText()`; types `PairingView`; `ageLabel`, `channelLabel`, `initial`, `decline` from `#shared/utils/polish`; components `ScreenTop`, `AppButton`, `RadioCard`, `InfoNote`, `AppIcon`; `GET /api/pairings`, `GET /api/pairings/:id`.
**Links to other slices:** `/profil/o-mnie?edit=1` (02, edit mode), `/listy` (04).

---

### Task 1: Report, block and fast-forward API

**Files:**
- Create: `supabase/migrations/20261003130000_fast_forward.sql`, `shared/utils/reports.ts`, `server/api/reports.post.ts`, `server/api/pairings/[id]/block.post.ts`, `server/api/demo/fast-forward.post.ts`
- Regenerate: `types/database.ts` (`npm run db:types`; this adds the new function's type)

**Interfaces:**
- Produces: `REPORT_REASONS` (the 4 strings from `Zglos.html`); the SQL function `public.fast_forward_letters(p_user uuid) returns integer`

- [ ] **Step 1: Migration**

`supabase/migrations/20261003130000_fast_forward.sql`:

```sql
-- Demo helper: move every letter in the user's pairings 2 days into the past,
-- so letters "in transit" arrive immediately. Delivery state is derived from these timestamps.
create function public.fast_forward_letters(p_user uuid) returns integer
language sql as $$
  with moved as (
    update public.letters l
       set sent_at = l.sent_at - interval '2 days',
           deliver_at = l.deliver_at - interval '2 days'
      from public.pairings p
     where p.id = l.pairing_id and p_user in (p.user_a_id, p.user_b_id)
    returning 1)
  select count(*)::int from moved
$$;
revoke execute on function public.fast_forward_letters(uuid) from public, anon, authenticated;
```

```bash
npm run db:reset && npm run db:types
grep -n fast_forward_letters types/database.ts   # expect a Functions entry
```

`types/database.ts` is foundation's generated file. Regenerating it is expected here; if another slice also regenerates it, the merge resolves by running `npm run db:types` again.

- [ ] **Step 2: `shared/utils/reports.ts`**

```ts
export const REPORT_REASONS = [
  'Prosi o pieniądze lub dane do konta',
  'Prosi o adres lub numer telefonu',
  'Obraźliwe lub niepokojące treści',
  'Coś innego',
] as const
```

- [ ] **Step 3: Routes**

`server/api/reports.post.ts`:

```ts
import { REPORT_REASONS } from '#shared/utils/reports'

export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const b = await readBody<{ pairingId?: string, reason?: string, details?: string }>(event)
  const p = await requirePairing(event, String(b.pairingId ?? ''), me)
  if (!REPORT_REASONS.includes(b.reason as typeof REPORT_REASONS[number])) throw fail(400, 'Wybierz, co się stało.') // (new copy)
  const details = String(b.details ?? '').trim().slice(0, 1000) || null
  const { error } = await db(event).from('reports').insert({ pairing_id: p.id, reporter_id: me, reason: b.reason!, details })
  if (error) throw fail(500, 'Nie udało się wysłać zgłoszenia.') // (new copy)
  return { ok: true }
})
```

`server/api/pairings/[id]/block.post.ts`:

```ts
export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const p = await requirePairing(event, getRouterParam(event, 'id')!, me)
  // BLOCKED: hidden from lists, frees a slot, the pair can never be matched again.
  const { error } = await db(event).from('pairings').update({ status: 'BLOCKED' }).eq('id', p.id)
  if (error) throw fail(500, 'Nie udało się zablokować.') // (new copy)
  return { ok: true }
})
```

`server/api/demo/fast-forward.post.ts`:

```ts
// Demo helper (hackathon): lets judges see delivery without waiting 2 days.
export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const { data, error } = await db(event).rpc('fast_forward_letters', { p_user: me })
  if (error) throw fail(500, 'Nie udało się przewinąć czasu.') // (new copy)
  return { moved: data ?? 0 }
})
```

- [ ] **Step 4: Verify**

Run `npx nuxi typecheck`; expect no errors. Then `npm run db:reset`, `npm run dev`, sign in as **kuba** at `/dev/login`, and in the console:

```js
const ps = await $fetch('/api/pairings')
const t = ps.find(p => p.palKod === 'PP-4MWR'), h = ps.find(p => p.palKod === 'PP-7K3D')
t.lastLetter.delivered                                                                          // false
await $fetch('/api/demo/fast-forward', { method: 'POST' })                                      // { moved: 4 }
;(await $fetch(`/api/pairings/${t.id}`)).lastLetter.delivered                                    // true
await $fetch('/api/reports', { method: 'POST', body: { pairingId: h.id, reason: 'Coś innego', details: 'test' } })   // { ok: true }
await $fetch('/api/reports', { method: 'POST', body: { pairingId: h.id, reason: 'zzz' } }).catch(e => e.data.message) // "Wybierz, co się stało."
await $fetch(`/api/pairings/${h.id}/block`, { method: 'POST' })                                   // { ok: true }
;(await $fetch('/api/pairings')).some(p => p.id === h.id)                                        // false
```

Signed out, `POST /api/demo/fast-forward` returns 401.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261003130000_fast_forward.sql types/database.ts shared/utils/reports.ts server/api/reports.post.ts "server/api/pairings/[id]/block.post.ts" server/api/demo/fast-forward.post.ts
git commit -m "feat(safety): report, block and demo fast-forward API"
```

---

### Task 2: Profil i ustawienia (screen 20)

**Files:**
- Create: `app/pages/profil/index.vue`

- [ ] **Step 1: Write the page**

Port `design/screens/Ustawienia.html`, copying the header row, card and toggle-row inline styles from the design.

```vue
<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { ageLabel, channelLabel, initial } from '#shared/utils/polish'

definePageMeta({ layout: 'default' })
const { profile, refreshProfile, saveProfile } = useProfile()
await refreshProfile()
const { data: pairings } = await useFetch<PairingView[]>('/api/pairings', { default: () => [] })
const firstActive = computed(() => pairings.value.find(p => p.status === 'ACTIVE'))

const premiumInfo = ref(false)
const ffMessage = ref('')
const error = ref('')

async function toggle(key: 'notifyNewLetter' | 'notifyDelivered', value: boolean) {
  error.value = ''
  try { await saveProfile({ [key]: value }) }
  catch (e) { error.value = errorText(e) }
}

async function fastForward() {
  ffMessage.value = ''
  try {
    const { moved } = await $fetch<{ moved: number }>('/api/demo/fast-forward', { method: 'POST' })
    ffMessage.value = `Gotowe — przesunięto listy: ${moved}.` // (new copy)
  }
  catch (e) { ffMessage.value = errorText(e) }
}
</script>

<template>
  <div v-if="profile" class="page">
    <header class="row" style="padding: 28px 20px 8px">
      <div class="avatar" aria-hidden="true">{{ initial(profile.name ?? '') }}</div>
      <div style="flex: 1; min-width: 0">
        <h1 class="h1">{{ profile.name }}</h1>
        <div class="muted">{{ profile.ageRange ? ageLabel(profile.ageRange) : '' }} · {{ profile.channel ? channelLabel(profile.channel) : '' }}</div>
      </div>
      <NuxtLink class="chip" to="/profil/o-mnie?edit=1">Edytuj</NuxtLink>
    </header>
    <main class="body">
      <section class="card" style="display: flex; flex-direction: column; gap: 12px">
        <div class="label">Zainteresowania</div>
        <div class="chips">
          <span v-for="i in profile.interests" :key="i" class="tag">{{ i }}</span>
          <NuxtLink to="/profil/zainteresowania?edit=1" class="muted" style="align-self: center">Zmień</NuxtLink>
        </div>
        <div class="divider" />
        <div class="row" style="justify-content: space-between">
          <div>
            <div class="label">Adres pocztowy</div>
            <div class="muted">Ukryty · widzi go tylko PenPal</div>
          </div>
          <NuxtLink to="/profil/o-mnie?edit=1" style="min-height: 48px; display: inline-flex; align-items: center">Zmień</NuxtLink>
        </div>
      </section>

      <section class="card" style="display: flex; flex-direction: column; gap: 12px">
        <div class="row" style="justify-content: space-between">
          <h2 class="h2">PenPal Premium</h2>
          <div class="postmark" aria-hidden="true" style="width: 64px; height: 64px">PREMIUM</div>
        </div>
        <p class="p">Pisz z większą liczbą osób — do 5 korespondentów zamiast 3.</p>
        <AppButton :disabled="premiumInfo" @click="premiumInfo = true">Dowiedz się więcej</AppButton>
        <!-- (new copy): payments are out of scope -->
        <InfoNote v-if="premiumInfo" icon="info">Premium uruchomimy wkrótce. Damy Ci znać w aplikacji.</InfoNote>
      </section>

      <section class="card" style="display: flex; flex-direction: column; gap: 4px">
        <div class="label">Powiadomienia</div>
        <label class="row" style="justify-content: space-between; min-height: 52px; font-size: 17px">
          Przyszedł nowy list
          <input type="checkbox" :checked="profile.notifyNewLetter" style="width: 26px; height: 26px; accent-color: #1F2A44" @change="toggle('notifyNewLetter', ($event.target as HTMLInputElement).checked)">
        </label>
        <label class="row" style="justify-content: space-between; min-height: 52px; font-size: 17px">
          Mój list dotarł
          <input type="checkbox" :checked="profile.notifyDelivered" style="width: 26px; height: 26px; accent-color: #1F2A44" @change="toggle('notifyDelivered', ($event.target as HTMLInputElement).checked)">
        </label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </section>

      <NuxtLink v-if="firstActive" class="card row" style="justify-content: space-between" :to="`/korespondenci/${firstActive.id}/zglos`">
        <span class="row"><AppIcon name="shield" />Zgłoś korespondenta</span>
        <AppIcon name="chevron" style="color: #5E667A" />
      </NuxtLink>

      <!-- Demo helper: low-key on purpose -->
      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding-top: 8px">
        <button type="button" class="muted" style="background: none; border: none; text-decoration: underline; min-height: 48px; cursor: pointer; font-family: inherit" @click="fastForward">Przewiń czas o 2 dni</button>
        <p v-if="ffMessage" class="muted" role="status">{{ ffMessage }}</p>
      </div>
    </main>
  </div>
</template>
```

The design has no separate "Zmień" link for interests; it is added *(new copy)* so interests can be edited without walking through O mnie. Drop it if it clutters the screen against `Ustawienia.png`.

- [ ] **Step 2: Verify**

As **kuba**, open `/profil` at 390×844 and compare with `design/previews/Ustawienia.png`. Expected: "Kuba · 18–25 · pisze w aplikacji", 4 interest tags, the address shown as hidden, the Premium card (Dowiedz się więcej shows the note), and the two notification checkboxes. Untick one and reload; it stays unticked. "Zgłoś korespondenta" goes to Halina's report page (404 until Task 3). "Przewiń czas o 2 dni" shows "Gotowe — przesunięto listy: 4.", and on `/listy` Tadeusz no longer shows "w drodze". Edytuj → O mnie in edit mode → Zapisz returns here (needs slice 02).

- [ ] **Step 3: Commit**

```bash
git add app/pages/profil/index.vue
git commit -m "feat(account): profile and settings with Premium teaser and fast-forward"
```

---

### Task 3: Zgłoś / Zablokuj (screen 21)

**Files:**
- Create: `app/pages/korespondenci/[id]/zglos.vue`

- [ ] **Step 1: Write the page**

Port `design/screens/Zglos.html`, copying the card, note (alert icon `#8C3520`) and radio inline styles.

```vue
<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { decline, initial } from '#shared/utils/polish'
import { REPORT_REASONS } from '#shared/utils/reports'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p } = await useFetch<PairingView>(`/api/pairings/${id}`)
const reason = ref<string>(REPORT_REASONS[0])
const details = ref('')
const confirmBlock = ref(false)
const sent = ref(false)
const error = ref('')
const busy = ref(false)

async function report() {
  error.value = ''
  busy.value = true
  try {
    await $fetch('/api/reports', { method: 'POST', body: { pairingId: id, reason: reason.value, details: details.value } })
    sent.value = true
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}

async function block() {
  if (!confirmBlock.value) { confirmBlock.value = true; return }
  error.value = ''
  busy.value = true
  try {
    await $fetch(`/api/pairings/${id}/block`, { method: 'POST' })
    await navigateTo('/listy')
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <div v-if="p" class="page">
    <ScreenTop :back="`/korespondenci/${id}`" title="Zgłoś korespondenta" />
    <main class="body">
      <div class="card row">
        <div class="avatar" aria-hidden="true">{{ initial(p.partner.name) }}</div>
        <div style="flex: 1">
          <div class="muted">Zgłaszasz osobę</div>
          <div style="font-weight: 700; font-size: 18px">{{ p.partner.name }} · {{ p.palKod }}</div>
        </div>
        <NuxtLink to="/listy" style="min-height: 48px; display: inline-flex; align-items: center">Zmień</NuxtLink>
      </div>
      <InfoNote icon="alert">Nigdy nie podawaj danych do konta ani nie wysyłaj pieniędzy. PenPal nigdy o to nie prosi.</InfoNote>

      <!-- (new copy) after a successful report -->
      <InfoNote v-if="sent" icon="check">Dziękujemy. Sprawdzimy zgłoszenie i odezwiemy się w aplikacji.</InfoNote>
      <template v-else>
        <fieldset style="border: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px">
          <legend class="label" style="margin-bottom: 10px">Co się stało?</legend>
          <RadioCard v-for="r in REPORT_REASONS" :key="r" v-model="reason" name="reason" :value="r">
            <span style="font-size: 17px">{{ r }}</span>
          </RadioCard>
        </fieldset>
        <div class="field">
          <label class="label" for="det">Opisz krótko (opcjonalnie)</label>
          <textarea id="det" v-model="details" class="input" maxlength="1000" rows="3" style="padding: 12px 14px; line-height: 1.45" />
        </div>
      </template>

      <!-- (new copy) block confirmation -->
      <InfoNote v-if="confirmBlock" icon="info" alert>Na pewno? Nie dostaniesz już listów od {{ decline(p.partner.name, 'gen') }}, a Wasz PalKod przestanie działać.</InfoNote>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton v-if="!sent" variant="stamp" :disabled="busy" @click="report">Wyślij zgłoszenie</AppButton>
      <AppButton variant="outline" :disabled="busy" @click="block">
        {{ confirmBlock ? 'Tak, zablokuj' : `Zablokuj ${decline(p.partner.name, 'acc')}` }}
      </AppButton>
    </div>
  </div>
</template>
```

"Tak, zablokuj" is *(new copy)*.

- [ ] **Step 2: Verify**

`npm run db:reset`. As **kuba**, open Korespondencja with Halina → ⋯ (Więcej opcji), and compare with `design/previews/Zglos.png`. Expected: "Halina · PP-7K3D", the safety note, 4 reasons with the first selected, and the buttons "Wyślij zgłoszenie" and "Zablokuj Halinę".

1. Pick "Coś innego", type details, and click Wyślij zgłoszenie. The thank-you note shows, and in Studio, `public.reports` has a row with that reason and the details.
2. Click "Zablokuj Halinę". The confirmation note shows and the button reads "Tak, zablokuj". Click again to land on `/listy`: Halina is gone and the count reads "1 z 3".
3. Sign in as **ola**, then `await $fetch('/api/matches')` does not include anyone Ola blocked. To check: block Ola's demo invite pair first, then confirm that person never reappears.

- [ ] **Step 3: Commit**

```bash
git add "app/pages/korespondenci/[id]/zglos.vue"
git commit -m "feat(safety): report and block a pen pal with confirmation"
```

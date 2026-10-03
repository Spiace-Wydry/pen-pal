# PenPal Onboarding Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build screens 1–6 (Powitanie, Jak to działa, Rejestracja, O mnie, Zainteresowania, Kanał) so a new user can sign up and complete their profile.

**Architecture:** Static welcome pages, then a Supabase `auth.signUp` call on Rejestracja, then three profile steps that save through `PATCH /api/me` (`useProfile().saveProfile`). The profile steps double as edit screens: with `?edit=1` they save and return to `/profil` instead of continuing.

**Tech Stack:** Nuxt 4 pages, `@nuxtjs/supabase` (`useSupabaseClient`), foundation components.

**Spec:** `CLAUDE.md` (screens 1–6, rule 2), `docs/SPEC.md` ("Profile & interests"), designs `design/screens/{Powitanie,JakToDziala,Rejestracja,OMnie,Zainteresowania,Kanal}.html`. Foundation plan: `docs/superpowers/plans/2026-10-03-penpal-01-foundation.md` (read its "Global Constraints" and "Conventions").

**Prerequisite:** the foundation plan is complete. This slice runs in parallel with 03–06.

## Global Constraints

- Polish copy verbatim from the designs. *(new copy)* marks strings that are not in the designs.
- 18+ checkbox and RODO checkbox are **required**; the scan-storage consent is optional.
- Interests: 3–8 from `INTERESTS`; at least one language from `LANGUAGES`; bio ≤ 300 chars.
- City and address are labelled as visible only to PenPal.
- Touch targets ≥ 48px; every input has a `<label>`.
- Don't edit files owned by foundation or other slices. No new dependencies.
- Manual verification only.

## Files (all new)

```
app/components/StepProgress.vue
app/components/ChipPicker.vue
app/pages/index.vue                    1 Powitanie
app/pages/jak-to-dziala.vue            2 Jak to działa
app/pages/rejestracja.vue              3 Rejestracja
app/pages/profil/o-mnie.vue            4 O mnie
app/pages/profil/zainteresowania.vue   5 Zainteresowania
app/pages/profil/kanal.vue             6 Kanał
```

**Interfaces consumed (from foundation):** `useProfile()` → `{ profile, refreshProfile, saveProfile(patch: MePatch) }`; `errorText(e)`; components `ScreenTop`, `AppButton`, `RadioCard`, `InfoNote`, `AppIcon`; `AGE_RANGES`, `INTERESTS`, `LANGUAGES` from `#shared/utils/rules`; `ageLabel` from `#shared/utils/polish`.
**Consumed from slice 03 (contract):** `POST /api/demo/invite` → `{ id: string | null }`, plus the page `/szukamy`.
**Produced for slice 06:** `/profil/o-mnie?edit=1` (and the other two steps) save and return to `/profil`.

---

### Task 1: Welcome and explainer (screens 1–2)

**Files:**
- Create: `app/pages/index.vue`, `app/pages/jak-to-dziala.vue`

- [ ] **Step 1: `app/pages/index.vue`**

Port `design/screens/Powitanie.html`. Copy the outer illustration `<div style="position: relative; width: 260px; height: 190px">` block, including its `<svg>` and `.postmark`, **verbatim** from the design.

```vue
<script setup lang="ts">
definePageMeta({ layout: 'plain' })
</script>

<template>
  <div class="page">
    <main style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; padding: 40px 28px 0">
      <!-- illustration: copy verbatim from design/screens/Powitanie.html (envelope svg + postmark KRAKÓW 2026); add aria-hidden="true" to the wrapper -->
      <div style="display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center">
        <h1 style="font-family: 'Fraunces', Georgia, serif; font-weight: 700; font-size: 52px; letter-spacing: -0.02em; line-height: 1; margin: 0">PenPal</h1>
        <p class="p" style="font-size: 20px; max-width: 300px">Łączymy pokolenia, list po liście.</p>
      </div>
    </main>
    <div class="foot">
      <AppButton variant="stamp" to="/jak-to-dziala">Załóż konto</AppButton>
      <!-- /logowanie is deferred (user decision); it 404s until the login plan lands -->
      <AppButton variant="outline" to="/logowanie">Mam już konto</AppButton>
      <p class="muted" style="text-align: center; padding-top: 4px">Nie masz smartfona? Konto założysz też w PalPoincie.</p>
    </div>
  </div>
</template>
```

The HTML comment above is an instruction to replace with the copied markup, not code to keep.

- [ ] **Step 2: `app/pages/jak-to-dziala.vue`**

Port `design/screens/JakToDziala.html`, copying each card's inline styles from the design.

```vue
<script setup lang="ts">
definePageMeta({ layout: 'plain' })
const cards = [
  { icon: 'pen', title: 'Pisz tak, jak lubisz', text: 'Ręcznie na papierze albo w aplikacji. My dostarczymy list w formie, którą woli Twój korespondent.' },
  { icon: 'lock', title: 'Twój adres jest bezpieczny', text: 'Widzimy go tylko my — nigdy Twój korespondent. Nie pokazujemy też Twojego miasta.' },
  { icon: 'clock', title: 'Listy mają swój czas', text: 'Każdy list idzie 2 dni — jak prawdziwa poczta. To nie czat, tylko czekanie na listonosza.' },
]
</script>

<template>
  <div class="page">
    <ScreenTop back="/" />
    <main class="body">
      <h1 class="h1">Jak działa PenPal?</h1>
      <div v-for="c in cards" :key="c.title" class="card" style="display: flex; gap: 14px; align-items: flex-start">
        <div class="avatar"><AppIcon :name="c.icon" :size="26" /></div>
        <div>
          <h2 class="h2">{{ c.title }}</h2>
          <p class="p">{{ c.text }}</p>
        </div>
      </div>
    </main>
    <div class="foot">
      <AppButton to="/rejestracja">Zaczynamy</AppButton>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Verify**

Run `npm run dev`. At 390×844, compare `/` with `design/previews/Powitanie.png` and `/jak-to-dziala` with `JakToDziala.png`. Expected: they look the same, and Załóż konto → Jak to działa → Zaczynamy goes to `/rejestracja` (404 until Task 2). While signed in via `/dev/login`, opening `/` redirects to `/listy`.

- [ ] **Step 4: Commit**

```bash
git add app/pages/index.vue app/pages/jak-to-dziala.vue
git commit -m "feat(onboarding): welcome and how-it-works screens"
```

---

### Task 2: Registration (screen 3) and the step header

**Files:**
- Create: `app/components/StepProgress.vue`, `app/pages/rejestracja.vue`

**Interfaces:**
- Produces: `<StepProgress :step="n" />` → "Krok n z 4" plus a progress bar at n/4.

- [ ] **Step 1: `app/components/StepProgress.vue`**

```vue
<script setup lang="ts">
const props = defineProps<{ step: number }>()
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 6px">
    <div class="muted">Krok {{ props.step }} z 4</div>
    <div class="progress" role="progressbar" :aria-valuenow="props.step" aria-valuemin="1" aria-valuemax="4">
      <div class="progress-bar" :style="{ width: `${props.step * 25}%` }" />
    </div>
  </div>
</template>
```

- [ ] **Step 2: `app/pages/rejestracja.vue`**

Port `design/screens/Rejestracja.html` and copy the checkbox label inline styles from the design. Auth is email only, so the label is "E-mail" rather than the design's "E-mail lub numer telefonu" (deviation: phone sign-up is out of scope).

```vue
<script setup lang="ts">
definePageMeta({ layout: 'plain' })
const supabase = useSupabaseClient()
const { profile } = useProfile()

const email = ref('')
const password = ref('')
const adult = ref(false)
const rodo = ref(false)
const scans = ref(false)
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  if (!adult.value) { error.value = 'PenPal jest tylko dla osób pełnoletnich.'; return } // (new copy)
  if (!rodo.value) { error.value = 'Zaakceptuj regulamin, aby założyć konto.'; return } // (new copy)
  busy.value = true
  const { error: e } = await supabase.auth.signUp({ email: email.value.trim(), password: password.value })
  busy.value = false
  if (e) {
    error.value = /already/i.test(e.message)
      ? 'Konto z tym adresem już istnieje.' // (new copy)
      : 'Nie udało się założyć konta. Sprawdź e-mail i hasło.' // (new copy)
    return
  }
  profile.value = null
  await navigateTo('/profil/o-mnie')
}
</script>

<template>
  <form class="page" novalidate @submit.prevent="submit">
    <ScreenTop back="/jak-to-dziala">
      <template #center><StepProgress :step="1" /></template>
    </ScreenTop>
    <main class="body">
      <h1 class="h1">Załóż konto</h1>
      <div class="field">
        <label class="label" for="email">E-mail</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="email" required>
      </div>
      <div class="field">
        <label class="label" for="pass">Hasło</label>
        <input id="pass" v-model="password" class="input" type="password" autocomplete="new-password" minlength="8" required aria-describedby="pass-hint">
        <p id="pass-hint" class="muted">Co najmniej 8 znaków.</p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px">
        <label style="display: flex; gap: 12px; align-items: flex-start; font-size: 17px; line-height: 1.4; min-height: 48px"><input v-model="adult" type="checkbox" required style="width: 26px; height: 26px; accent-color: #1F2A44; flex: none">Mam ukończone 18 lat</label>
        <label style="display: flex; gap: 12px; align-items: flex-start; font-size: 17px; line-height: 1.4; min-height: 48px"><input v-model="rodo" type="checkbox" required style="width: 26px; height: 26px; accent-color: #1F2A44; flex: none">Akceptuję regulamin i zgadzam się na przetwarzanie moich danych (RODO)</label>
        <label style="display: flex; gap: 12px; align-items: flex-start; font-size: 17px; line-height: 1.4; min-height: 48px"><input v-model="scans" type="checkbox" style="width: 26px; height: 26px; accent-color: #1F2A44; flex: none">Zgadzam się na przechowywanie skanów moich listów</label>
      </div>
      <InfoNote icon="info">Zakładasz konto dla mamy lub taty? Możesz zrobić to w ich imieniu.</InfoNote>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton type="submit" :disabled="busy || !email || password.length < 8 || !adult || !rodo">Dalej</AppButton>
    </div>
  </form>
</template>
```

If the design's checkbox label styles differ from the inline styles above, the design wins.

- [ ] **Step 3: Verify**

1. With 18+ unchecked, Dalej is disabled.
2. With all fields valid, use `test1@penpal.test` / `pisanielistow`. You land on `/profil/o-mnie` (404 until Task 3), and in Supabase Studio (URL from `npx supabase status`) `public.profiles` has a row for `test1@penpal.test` with `name` null.
3. Signing up again with the same email shows "Konto z tym adresem już istnieje.".

- [ ] **Step 4: Commit**

```bash
git add app/components/StepProgress.vue app/pages/rejestracja.vue
git commit -m "feat(onboarding): registration with required 18+ and RODO consent"
```

---

### Task 3: Profile steps (screens 4–6) with edit mode

**Files:**
- Create: `app/components/ChipPicker.vue`, `app/pages/profil/o-mnie.vue`, `app/pages/profil/zainteresowania.vue`, `app/pages/profil/kanal.vue`

**Interfaces:**
- Produces: `<ChipPicker v-model :options :labels? :multiple? :max? :label />`. `modelValue` is a `string[]` when `multiple`, else a `string`; `labels` maps a value to its display text; `max` stops selection beyond n; `label` is the group's accessible name.
- Edit mode: `?edit=1` on any step changes the button to "Zapisz" *(new copy)* and returns to `/profil` after saving.

- [ ] **Step 1: `app/components/ChipPicker.vue`**

```vue
<script setup lang="ts">
const props = defineProps<{
  options: readonly string[]
  labels?: (v: string) => string
  multiple?: boolean
  max?: number
  label: string
}>()
const model = defineModel<string | string[]>({ required: true })

const isOn = (v: string) => props.multiple ? (model.value as string[]).includes(v) : model.value === v
function toggle(v: string) {
  if (!props.multiple) { model.value = v; return }
  const cur = model.value as string[]
  if (cur.includes(v)) model.value = cur.filter(x => x !== v)
  else if (!props.max || cur.length < props.max) model.value = [...cur, v]
}
</script>

<template>
  <div class="chips" role="group" :aria-label="label">
    <button
      v-for="o in options" :key="o" type="button" class="chip" :class="{ 'chip-on': isOn(o) }"
      :aria-pressed="isOn(o)" @click="toggle(o)"
    >
      {{ labels ? labels(o) : o }}
    </button>
  </div>
</template>
```

- [ ] **Step 2: `app/pages/profil/o-mnie.vue`**

Port `design/screens/OMnie.html`.

```vue
<script setup lang="ts">
import { AGE_RANGES, type AgeRange } from '#shared/utils/rules'
import { ageLabel } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const route = useRoute()
const edit = computed(() => route.query.edit === '1')
const { profile, refreshProfile, saveProfile } = useProfile()
if (!profile.value) await refreshProfile()

const name = ref(profile.value?.name ?? '')
const ageRange = ref<string>(profile.value?.ageRange ?? '')
const city = ref(profile.value?.city ?? '')
const address = ref(profile.value?.postalAddress ?? '')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await saveProfile({ name: name.value, ageRange: ageRange.value as AgeRange, city: city.value, postalAddress: address.value })
    await navigateTo(edit.value ? '/profil' : '/profil/zainteresowania')
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <form class="page" @submit.prevent="submit">
    <ScreenTop :back="edit ? '/profil' : '/rejestracja'">
      <template v-if="!edit" #center><StepProgress :step="2" /></template>
    </ScreenTop>
    <main class="body">
      <h1 class="h1">Opowiedz nam o sobie</h1>
      <div class="field">
        <label class="label" for="name">Imię</label>
        <input id="name" v-model="name" class="input" type="text" autocomplete="given-name" maxlength="40" required>
      </div>
      <div class="field">
        <div id="age-label" class="label">Przedział wieku</div>
        <ChipPicker v-model="ageRange" :options="AGE_RANGES" :labels="ageLabel" label="Przedział wieku" />
      </div>
      <div class="field">
        <label class="label" for="city">Miasto</label>
        <input id="city" v-model="city" class="input" type="text" autocomplete="address-level2" maxlength="80">
      </div>
      <div class="field">
        <label class="label" for="addr">Adres pocztowy</label>
        <input id="addr" v-model="address" class="input" type="text" autocomplete="street-address" maxlength="200">
      </div>
      <InfoNote icon="lock">Miasto i adres widzi <b>tylko PenPal</b> — używamy ich do dostarczania listów i dopasowania w regionie.</InfoNote>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton type="submit" :disabled="busy || !name.trim() || !ageRange">{{ edit ? 'Zapisz' : 'Dalej' }}</AppButton>
    </div>
  </form>
</template>
```

- [ ] **Step 3: `app/pages/profil/zainteresowania.vue`**

Port `design/screens/Zainteresowania.html`.

```vue
<script setup lang="ts">
import { INTERESTS, LANGUAGES } from '#shared/utils/rules'

definePageMeta({ layout: 'plain' })
const route = useRoute()
const edit = computed(() => route.query.edit === '1')
const { profile, refreshProfile, saveProfile } = useProfile()
if (!profile.value) await refreshProfile()

const interests = ref<string[]>([...(profile.value?.interests ?? [])])
const languages = ref<string[]>([...(profile.value?.languages ?? ['polski'])])
const error = ref('')
const busy = ref(false)
const valid = computed(() => interests.value.length >= 3 && interests.value.length <= 8 && languages.value.length >= 1)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await saveProfile({ interests: interests.value, languages: languages.value })
    await navigateTo(edit.value ? '/profil' : '/profil/kanal')
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <form class="page" @submit.prevent="submit">
    <ScreenTop :back="edit ? '/profil' : '/profil/o-mnie'">
      <template v-if="!edit" #center><StepProgress :step="3" /></template>
    </ScreenTop>
    <main class="body">
      <div>
        <h1 class="h1">Co lubisz?</h1>
        <p class="p">Wybierz od 3 do 8 zainteresowań. Po nich znajdziemy Ci korespondenta.</p>
      </div>
      <ChipPicker v-model="interests" :options="INTERESTS" multiple :max="8" label="Zainteresowania" />
      <p class="muted" aria-live="polite">Wybrano {{ interests.length }} z 8</p>
      <div class="divider" />
      <div class="field">
        <div class="label">W jakich językach chcesz pisać?</div>
        <ChipPicker v-model="languages" :options="LANGUAGES" multiple label="Języki listów" />
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton type="submit" :disabled="busy || !valid">{{ edit ? 'Zapisz' : 'Dalej' }}</AppButton>
    </div>
  </form>
</template>
```

- [ ] **Step 4: `app/pages/profil/kanal.vue`**

Port `design/screens/Kanal.html`. On a first run, after saving it calls the demo invite endpoint (slice 03), then goes to `/szukamy`. If the endpoint isn't merged yet, the call fails silently and navigation continues.

```vue
<script setup lang="ts">
import type { Channel } from '#shared/utils/rules'

definePageMeta({ layout: 'plain' })
const route = useRoute()
const edit = computed(() => route.query.edit === '1')
const { profile, refreshProfile, saveProfile } = useProfile()
if (!profile.value) await refreshProfile()

const channel = ref<string>(profile.value?.channel ?? 'APP')
const bio = ref(profile.value?.bio ?? '')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await saveProfile({ channel: channel.value as Channel, bio: bio.value })
    if (edit.value) return await navigateTo('/profil')
    // Demo helper: a seeded pen pal invites the new user, so screen 9 is reachable.
    await $fetch('/api/demo/invite', { method: 'POST' }).catch(() => null)
    await navigateTo('/szukamy')
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <form class="page" @submit.prevent="submit">
    <ScreenTop :back="edit ? '/profil' : '/profil/zainteresowania'">
      <template v-if="!edit" #center><StepProgress :step="4" /></template>
    </ScreenTop>
    <main class="body">
      <h1 class="h1">Jak wolisz pisać?</h1>
      <RadioCard v-model="channel" name="channel" value="PAPER">
        <div class="h2">List papierowy</div>
        <p class="muted">Piszesz ręcznie i zanosisz list do PalPointu lub PalBoxa.</p>
      </RadioCard>
      <RadioCard v-model="channel" name="channel" value="APP">
        <div class="h2">Wiadomość w aplikacji</div>
        <p class="muted">Piszesz tutaj. Jeśli Twój korespondent woli papier, wydrukujemy i wyślemy list pocztą.</p>
      </RadioCard>
      <div class="field">
        <label class="label" for="bio">Krótko o mnie</label>
        <textarea id="bio" v-model="bio" class="input" maxlength="300" rows="4" style="padding: 12px 14px; line-height: 1.45; resize: vertical" aria-describedby="bio-count" />
        <p id="bio-count" class="muted">{{ bio.length }} / 300</p>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton variant="stamp" type="submit" :disabled="busy">{{ edit ? 'Zapisz' : 'Znajdź mi korespondenta' }}</AppButton>
    </div>
  </form>
</template>
```

Copy the textarea's inline style from `Kanal.html` if it differs from the one above.

- [ ] **Step 5: Verify**

```bash
npx nuxi typecheck
```

Expected: no errors. Then, at 390×844, starting from a fresh sign-up (`test2@penpal.test`):

1. On O mnie, Dalej stays disabled until a name and age range are chosen. Fill Ola-like data and continue.
2. On Zainteresowania, Dalej is disabled with 2 interests and enabled with 3. A 9th chip can't be selected. The counter reads "Wybrano n z 8".
3. On Kanał, choose List papierowy and type a bio; the counter updates. "Znajdź mi korespondenta" goes to `/szukamy` (404 until slice 03 lands).
4. `GET /api/me` shows `onboardingStep: null`, `channel: "PAPER"`.
5. Open `/listy` with a half-finished profile (a new user who stopped after Rejestracja). The middleware redirects to `/profil/o-mnie`.
6. Open `/profil/zainteresowania?edit=1` as Kuba (`/dev/login`). The button reads "Zapisz", no step header shows, and saving returns to `/profil`.
7. Compare each screen with `design/previews/{OMnie,Zainteresowania,Kanal}.png`.

- [ ] **Step 6: Commit**

```bash
git add app/components/ChipPicker.vue app/pages/profil/o-mnie.vue app/pages/profil/zainteresowania.vue app/pages/profil/kanal.vue
git commit -m "feat(onboarding): profile steps with interests, channel and edit mode"
```

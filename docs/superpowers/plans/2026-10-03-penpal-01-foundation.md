# PenPal Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the Nuxt 4 + local Supabase skeleton that every screen slice builds on: repo layout, dependencies, schema with RLS, seed data, design system, shared domain rules, server helpers, the profile API, auth middleware and PWA.

**Architecture:** One Nuxt 4 app at the repo root (`app/` = client, `server/` = Nitro API, `shared/` = pure rules used by both). The browser only uses Supabase for **auth**. All data reads and writes go through `server/api/*`, which uses the Supabase service-role client and enforces the business rules in code. RLS policies are a second layer of defence. Delivery state is derived from `sent_at` / `deliver_at` on the server and never stored.

**Tech Stack:** Nuxt 4.5, Vue 3 `<script setup lang="ts">`, `@nuxtjs/supabase` 2.x, Supabase CLI 2.x (Docker), `@nuxtjs/leaflet`, `@nuxt/fonts`, `@vite-pwa/nuxt`, `pdf-lib` + `@pdf-lib/fontkit`.

**Spec:** `CLAUDE.md` (implementation brief) and `docs/SPEC.md` (product rules). Visual source: `design/screens/*.html`, `design/penpal.css`. Plan index: `docs/superpowers/plans/2026-10-03-penpal-00-index.md`.

## Global Constraints

- All UI copy is Polish, informal "Ty" form, **verbatim from `design/screens/*.html`**. Strings not in the designs are marked *(new copy)* in plans.
- Body text ≥ 17–18px, touch targets ≥ 48px (buttons 58px), contrast ≥ 4.5:1, real `<button>`/`<a>`/`<label>`, every icon-only control has `aria-label`.
- Never expose another user's `city` or `postal_address`. Profile cards show name, age range, channel, interests, bio only.
- 18+ only; sign-up is blocked without the 18+ checkbox.
- Max 3 ACTIVE pairings per user, Premium 5.
- Generations: `18-25` ↔ `60-75`/`75+` only.
- PalKod: `PP-` + 4 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I).
- Every letter: `deliver_at = sent_at + 2 days`; recipients cannot see it before then.
- One letter at a time: you can write only if there are no letters yet, or the latest letter is the pen pal's and has been delivered.
- Paper delivery: PDF shows PenPal as the sender and the footer `Odpowiadając, napisz na kopercie: Do: <imię>, PalKod: <kod>`.
- No new dependencies beyond those installed in Task 1.
- **Testing is manual only** (user decision). No test framework. Verify each step with the commands given.

## Conventions every slice follows (copy into each slice's context)

- Pages: `<script setup lang="ts">`. Use `definePageMeta({ layout: 'plain' })` unless the screen has the bottom nav (Listy, Mapa, Profil use the `default` layout).
- Page root is always `<div class="page">`, containing `<ScreenTop>` (or the screen's own header), then `<main class="body">`, then `<div class="foot">`.
- **Porting a design screen:** keep the same element structure and classes as `design/screens/<Screen>.html`, copy every inline `style="…"` from the design element verbatim, and replace the sample text (Kuba, Halina, dates…) with data. Use `<AppIcon name>` for 24×24 icons. Copy illustrations (envelope, map, scan thumbnails) **verbatim** from the design file as inline `<svg>`.
- Reads: `const { data, error, refresh } = await useFetch<T>('/api/…')`. Writes: `await $fetch('/api/…', { method, body })` inside `try/catch`, showing `errorText(e)` in `<p class="error" role="alert">`.
- Server routes: `const me = await requireUserId(event)`, then use `db(event)`. Throw `fail(status, 'Polish message')` for errors.
- Types: import from `#shared/types/api` and `#shared/utils/*` explicitly.
- Dates are shown with the helpers in `shared/utils/polish.ts` (Europe/Warsaw).

## File map (owned by this plan)

```
CLAUDE.md, README.md, docs/SPEC.md, design/**     moved from penpal-handoff/
package.json, nuxt.config.ts, tsconfig.json, .env.example, .gitignore
supabase/config.toml
supabase/migrations/20261003120000_init.sql       schema, RLS, trigger, bucket
supabase/seed.sql                                 demo users, pairings, letters, points
types/database.ts                                 generated (npm run db:types)
shared/utils/rules.ts                             enums, limits, matching score, PalKod
shared/utils/letters.ts                           delivery timeline, write-turn rule
shared/utils/polish.ts                            dates, name declension, plurals, labels
shared/utils/topics.ts                            first-letter topic per interest
shared/types/api.ts                               API contract types
server/utils/supabase.ts                          db(), requireUserId(), fail()
server/utils/views.ts                             row → API view mappers, loaders
server/api/me.get.ts, server/api/me.patch.ts
server/api/pairings/index.get.ts
server/api/pairings/[id]/index.get.ts
app/app.vue
app/assets/css/penpal.css                         copy of design/penpal.css
app/assets/css/main.css                           tokens + app overrides
app/layouts/default.vue, app/layouts/plain.vue
app/components/AppIcon.vue, ScreenTop.vue, AppButton.vue, RadioCard.vue, InfoNote.vue, BottomNav.vue
app/composables/useProfile.ts
app/utils/errorText.ts
app/middleware/auth.global.ts
app/pages/dev/login.vue                           dev-only sign-in as a seeded user (404 in production)
public/icon.svg + generated PWA icons
```

---

### Task 1: Repo layout, Nuxt scaffold, dependencies, local Supabase

**Files:**
- Move: `penpal-handoff/*` → repo root
- Create: `package.json`, `package-lock.json`, `nuxt.config.ts`, `tsconfig.json`, `app/app.vue` (temporary), `public/`, `supabase/config.toml`, `.env.example`, `.env` (not committed)
- Modify: `.gitignore`, `CLAUDE.md`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `db:start`, `db:stop`, `db:reset`, `db:types`; runtime config `adminCode` (env `NUXT_ADMIN_CODE`); env vars `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SECRET_KEY`.

- [ ] **Step 1: Move the handoff folder to the root**

`penpal-handoff/` is untracked, so use a plain `mv`:

```bash
cd /home/mromanowski/Projects/pen-pal
mv penpal-handoff/CLAUDE.md penpal-handoff/README.md penpal-handoff/docs penpal-handoff/design .
rmdir penpal-handoff
ls   # expect: CLAUDE.md LICENSE README.md design docs
```

- [ ] **Step 2: Scaffold Nuxt into a temp folder and copy it in**

`nuxi init` won't scaffold into a non-empty folder safely, so scaffold next door and copy:

```bash
npx -y nuxi@latest init .nuxt-scaffold --template minimal --packageManager npm --gitInit false </dev/null
cp -r .nuxt-scaffold/app .nuxt-scaffold/public .nuxt-scaffold/nuxt.config.ts .nuxt-scaffold/tsconfig.json .nuxt-scaffold/package.json .
rm -rf .nuxt-scaffold
npm pkg set name=pen-pal
```

- [ ] **Step 3: Install every dependency the whole project needs**

```bash
npm i @nuxtjs/supabase @supabase/supabase-js @nuxtjs/leaflet leaflet @nuxt/fonts @vite-pwa/nuxt pdf-lib @pdf-lib/fontkit
npm i -D supabase @types/leaflet vue-tsc typescript @vite-pwa/assets-generator
npm pkg set scripts.db:start="supabase start" scripts.db:stop="supabase stop" scripts.db:reset="supabase db reset" scripts.db:types="supabase gen types typescript --local > types/database.ts"
```

- [ ] **Step 4: Write `nuxt.config.ts`**

```ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@nuxtjs/leaflet', '@nuxt/fonts', '@vite-pwa/nuxt'],
  css: ['~/assets/css/penpal.css', '~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'pl' },
      title: 'PenPal',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#F6F0E4' },
        { name: 'description', content: 'Łączymy pokolenia, list po liście.' },
      ],
      link: [{ rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' }],
    },
  },
  // All data goes through server/api; the client only uses Supabase auth. Our own middleware handles redirects.
  supabase: { redirect: false, types: '~~/types/database.ts' },
  runtimeConfig: { adminCode: '' },
  fonts: {
    families: [
      { name: 'Fraunces', weights: [600, 700], provider: 'google' },
      { name: 'Atkinson Hyperlegible', weights: [400, 700], provider: 'google' },
      { name: 'Caveat', weights: [400, 600], provider: 'google' },
    ],
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'PenPal',
      short_name: 'PenPal',
      description: 'Łączymy pokolenia, list po liście.',
      lang: 'pl',
      start_url: '/',
      display: 'standalone',
      theme_color: '#F6F0E4',
      background_color: '#F6F0E4',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    // SSR app: no SPA fallback, only precache static assets.
    workbox: { navigateFallback: null, globPatterns: ['**/*.{js,css,png,svg,ico,woff2}'] },
    devOptions: { enabled: false },
  },
})
```

Create the two CSS files as empty placeholders so the config resolves; Task 4 fills them:

```bash
mkdir -p app/assets/css && touch app/assets/css/penpal.css app/assets/css/main.css
```

- [ ] **Step 5: Init local Supabase and write the env files**

Docker must be running.

```bash
npx supabase init --yes
grep -n '^project_id\|enable_confirmations' supabase/config.toml
# expect project_id = "pen-pal" and every enable_confirmations = false (needed for the demo)
npm run db:start
eval "$(npx supabase status -o env)"
printf 'SUPABASE_URL=%s\nSUPABASE_KEY=%s\nSUPABASE_SECRET_KEY=%s\nNUXT_ADMIN_CODE=skan-demo\n' "$API_URL" "$ANON_KEY" "$SERVICE_ROLE_KEY" > .env
cat > .env.example <<'EOF'
# Values from `npx supabase status -o env` (API_URL, ANON_KEY, SERVICE_ROLE_KEY).
# For phones on the same Wi-Fi, use the laptop's LAN IP instead of 127.0.0.1.
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=
SUPABASE_SECRET_KEY=
# Code required by /admin/skan (PalPoint scan simulator)
NUXT_ADMIN_CODE=skan-demo
EOF
```

`SUPABASE_SECRET_KEY` replaces CLAUDE.md's `SUPABASE_SERVICE_KEY`: `@nuxtjs/supabase` 2.x deprecates the old name.

- [ ] **Step 6: Fix `.gitignore` and update CLAUDE.md for the layout**

The existing `.gitignore` ignores `.env.*`, which would hide `.env.example`.

```bash
for l in '!.env.example' 'dev-dist' 'supabase/.temp' 'supabase/.branches'; do grep -qxF "$l" .gitignore || echo "$l" >> .gitignore; done
```

In `CLAUDE.md`, under "## Stack", add this bullet as the first line:

```markdown
- **Layout (Nuxt 4):** client code lives in `app/` (`app/pages`, `app/components`, …), API in `server/api`, pure shared rules in `shared/`. Page paths in the table below are relative to `app/`. Server env key is `SUPABASE_SECRET_KEY` (not `SUPABASE_SERVICE_KEY`). Plans: `docs/superpowers/plans/`.
```

- [ ] **Step 7: Verify the dev server boots**

```bash
npm run dev
```

Expected: the Nuxt welcome page at http://localhost:3000 and no errors in the terminal. A warning about the missing `types/database.ts` is expected until Task 2. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add -A
git status --short | grep -E '\.env$' && echo 'STOP: .env staged' || true
git commit -m "chore: move handoff to root, scaffold Nuxt 4 with Supabase, Leaflet, fonts, PWA"
```

---

### Task 2: Database schema, RLS, signup trigger, storage bucket

**Files:**
- Create: `supabase/migrations/20261003120000_init.sql`
- Create (generated): `types/database.ts`

**Interfaces:**
- Produces tables: `profiles`, `private_profiles`, `pairings` (`user_a_id` is **always the inviter**), `letters` (no status column; status is derived), `points`, `reports`; enums `age_range`, `channel`, `pairing_status`, `letter_kind`, `point_type`; storage bucket `letters` (private).

- [ ] **Step 1: Write the migration**

`supabase/migrations/20261003120000_init.sql`:

```sql
-- Enums -----------------------------------------------------------------
create type public.age_range as enum ('18-25', '26-40', '41-60', '60-75', '75+');
create type public.channel as enum ('PAPER', 'APP');
create type public.pairing_status as enum ('INVITED', 'ACTIVE', 'ENDED', 'BLOCKED');
create type public.letter_kind as enum ('TYPED', 'SCAN');
create type public.point_type as enum ('PALPOINT', 'PALBOX');

-- Profiles (visible to pen pals) ----------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  name text check (char_length(name) <= 40),
  age_range public.age_range,
  channel public.channel,
  bio text not null default '' check (char_length(bio) <= 300),
  languages text[] not null default '{polski}',
  interests text[] not null default '{}' check (cardinality(interests) <= 8),
  is_premium boolean not null default false,
  notify_new_letter boolean not null default true,
  notify_delivered boolean not null default true,
  created_at timestamptz not null default now()
);

-- Private profile data: owner + service role only -----------------------
create table public.private_profiles (
  id uuid primary key references public.profiles on delete cascade,
  city text,
  postal_address text
);

-- Pairings: user_a_id is the inviter ------------------------------------
create table public.pairings (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles on delete cascade,
  user_b_id uuid not null references public.profiles on delete cascade,
  pal_kod text not null unique check (pal_kod ~ '^PP-[A-HJ-NP-Z2-9]{4}$'),
  status public.pairing_status not null default 'INVITED',
  created_at timestamptz not null default now(),
  check (user_a_id <> user_b_id)
);
-- "Not previously paired": one pairing per pair of people, ever.
create unique index pairings_one_per_pair on public.pairings (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id));

-- Letters: delivery state is derived from sent_at / deliver_at ----------
create table public.letters (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings on delete cascade,
  sender_id uuid not null references public.profiles on delete cascade,
  kind public.letter_kind not null,
  body text check (char_length(body) <= 5000),
  image_paths text[] not null default '{}',
  delivery_channel public.channel not null,
  sent_at timestamptz not null default now(),
  deliver_at timestamptz not null default now() + interval '2 days',
  read_at timestamptz,
  check ((kind = 'TYPED' and body is not null) or (kind = 'SCAN' and cardinality(image_paths) > 0))
);
create index letters_pairing on public.letters (pairing_id, sent_at desc);

-- PalPoints and PalBoxes ------------------------------------------------
-- hours: 7 entries indexed like JS getDay() (0 = Sunday), each ["HH:MM","HH:MM"] or null (closed).
create table public.points (
  id uuid primary key default gen_random_uuid(),
  type public.point_type not null,
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  hours jsonb not null,
  can_send boolean not null default true,
  can_collect boolean not null default false,
  pickup_note text,
  phone text
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings on delete cascade,
  reporter_id uuid not null references public.profiles on delete cascade,
  reason text not null,
  details text check (char_length(details) <= 1000),
  created_at timestamptz not null default now()
);

-- New auth user → empty profile rows ------------------------------------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.private_profiles (id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: defence in depth (the app itself reads through the service role) --
alter table public.profiles enable row level security;
alter table public.private_profiles enable row level security;
alter table public.pairings enable row level security;
alter table public.letters enable row level security;
alter table public.points enable row level security;
alter table public.reports enable row level security;

create policy "read own profile" on public.profiles for select using (id = auth.uid());
create policy "read pen pal profiles" on public.profiles for select using (
  exists (select 1 from public.pairings p
          where p.status in ('INVITED', 'ACTIVE')
            and ((p.user_a_id = auth.uid() and p.user_b_id = profiles.id)
              or (p.user_b_id = auth.uid() and p.user_a_id = profiles.id))));
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "own private profile" on public.private_profiles for all using (id = auth.uid()) with check (id = auth.uid());

create policy "read my pairings" on public.pairings for select using (auth.uid() in (user_a_id, user_b_id));

create policy "read delivered letters in my pairings" on public.letters for select using (
  exists (select 1 from public.pairings p where p.id = letters.pairing_id and auth.uid() in (p.user_a_id, p.user_b_id))
  and (sender_id = auth.uid() or deliver_at <= now()));

create policy "points are public" on public.points for select using (true);

create policy "file own reports" on public.reports for insert with check (reporter_id = auth.uid());

-- Storage: private bucket for scans/photos. No client policies: only the
-- service role (server routes) uploads and signs URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('letters', 'letters', false, 8388608, array['image/jpeg', 'image/png']);
```

- [ ] **Step 2: Apply it and generate types**

```bash
npm run db:reset
npm run db:types
head -5 types/database.ts
```

Expected: `db:reset` ends with `Finished supabase db reset`. If `seed.sql` is missing it just skips seeding. `types/database.ts` starts with `export type Json =`.

- [ ] **Step 3: Verify schema, trigger and RLS**

```bash
PSQL="docker exec -i supabase_db_pen-pal psql -U postgres -At"
$PSQL -c "select string_agg(tablename, ',' order by tablename) from pg_tables where schemaname='public'"
# expect: letters,pairings,points,private_profiles,profiles,reports
$PSQL -c "select count(*) from pg_tables where schemaname='public' and rowsecurity"
# expect: 6
$PSQL -c "select id, public from storage.buckets"
# expect: letters|f
$PSQL -c "insert into public.pairings (user_a_id,user_b_id,pal_kod) values (gen_random_uuid(),gen_random_uuid(),'PP-0O1I')" 2>&1 | grep -o 'check constraint\|foreign key' | head -1
# expect: check constraint   (confusable chars rejected)
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations types/database.ts
git commit -m "feat(db): schema, RLS, signup trigger and letters bucket"
```

---

### Task 3: Seed data

**Files:**
- Create: `supabase/seed.sql`

**Interfaces:**
- Produces seeded users (password `pisanielistow` for all), with fixed ids:

| id suffix | email | name | age | channel | notes |
|---|---|---|---|---|---|
| `…0101` | kuba@penpal.test | Kuba | 18-25 | APP | active with Halina (`PP-7K3D`), Tadeusz (`PP-4MWR`); invited by Stanisław (`PP-9XQT`) |
| `…0102` | ola@penpal.test | Ola | 18-25 | APP | candidate for new senior users |
| `…0201` | halina@penpal.test | Halina | 60-75 | PAPER | |
| `…0202` | tadeusz@penpal.test | Tadeusz | 75+ | PAPER | |
| `…0203` | krystyna@penpal.test | Krystyna | 60-75 | APP | |
| `…0204` | zofia@penpal.test | Zofia | 60-75 | PAPER | |
| `…0205` | stanislaw@penpal.test | Stanisław | 75+ | PAPER | |
| `…0206` | barbara@penpal.test | Barbara | 75+ | PAPER | city Tarnów |

Full ids are `00000000-0000-0000-0000-00000000XXXX`. Plus 7 Kraków points.

- [ ] **Step 1: Write `supabase/seed.sql`**

```sql
-- Demo seed. All accounts use the password: pisanielistow
create function public._seed_user(
  p_id uuid, p_email text, p_name text, p_age public.age_range, p_channel public.channel,
  p_city text, p_address text, p_bio text, p_interests text[], p_languages text[] default '{polski}'
) returns void language plpgsql as $$
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('pisanielistow', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true), 'email', now(), now(), now());
  -- profiles / private_profiles rows were created by the on_auth_user_created trigger
  update public.profiles set name = p_name, age_range = p_age, channel = p_channel, bio = p_bio,
    interests = p_interests, languages = p_languages where id = p_id;
  update public.private_profiles set city = p_city, postal_address = p_address where id = p_id;
end $$;

select public._seed_user('00000000-0000-0000-0000-000000000101', 'kuba@penpal.test', 'Kuba', '18-25', 'APP',
  'Kraków', 'ul. Długa 5/3, 31-147 Kraków',
  'Studiuję historię. Lubię stare zdjęcia Krakowa i podróże pociągiem. Chętnie posłucham, jak kiedyś wyglądało życie.',
  '{Książki,Historia,Podróże,Fotografia}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000102', 'ola@penpal.test', 'Ola', '18-25', 'APP',
  'Kraków', 'ul. Szkolna 2, 30-001 Kraków',
  'Jestem w drużynie harcerskiej, robimy projekt o historii Krakowa.',
  '{Historia,Muzyka,Rękodzieło,Przyroda}');
select public._seed_user('00000000-0000-0000-0000-000000000201', 'halina@penpal.test', 'Halina', '60-75', 'PAPER',
  'Kraków', 'ul. Lipowa 7/2, 30-702 Kraków',
  'Emerytowana polonistka. Lubię wspominać i słuchać.',
  '{Książki,Historia,Ogród,Gotowanie}');
select public._seed_user('00000000-0000-0000-0000-000000000202', 'tadeusz@penpal.test', 'Tadeusz', '75+', 'PAPER',
  'Kraków', 'ul. Józefa 14/1, 31-056 Kraków',
  'Przez 50 lat fotografowałem Kraków. Chętnie opowiem, jak wyglądał Kazimierz, gdy byłem młody.',
  '{Fotografia,Historia,Szachy i gry}');
select public._seed_user('00000000-0000-0000-0000-000000000203', 'krystyna@penpal.test', 'Krystyna', '60-75', 'APP',
  'Kraków', 'ul. Kolejowa 3/9, 31-000 Kraków',
  'Zwiedziłam pół Europy pociągiem.',
  '{Podróże,Książki,Języki obce}', '{polski,niemiecki}');
select public._seed_user('00000000-0000-0000-0000-000000000204', 'zofia@penpal.test', 'Zofia', '60-75', 'PAPER',
  'Kraków', 'ul. Ogrodowa 11, 30-500 Kraków',
  'Hoduję pomidory na balkonie i piekę najlepszy sernik na Podgórzu.',
  '{Ogród,Gotowanie,Muzyka,Książki}');
select public._seed_user('00000000-0000-0000-0000-000000000205', 'stanislaw@penpal.test', 'Stanisław', '75+', 'PAPER',
  'Kraków', 'os. Centrum A 4/12, 31-923 Kraków',
  'Grałem na trąbce w orkiestrze huty. Kibicuję Wiśle od zawsze.',
  '{Historia,Muzyka,Sport,Podróże}');
select public._seed_user('00000000-0000-0000-0000-000000000206', 'barbara@penpal.test', 'Barbara', '75+', 'PAPER',
  'Tarnów', 'ul. Wałowa 1, 33-100 Tarnów',
  'Robię na drutach i oglądam stare filmy.',
  '{Rękodzieło,Przyroda,Film}');

drop function public._seed_user;

-- Pairings (user_a_id = inviter)
insert into public.pairings (id, user_a_id, user_b_id, pal_kod, status, created_at) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'PP-7K3D', 'ACTIVE', now() - interval '30 days'),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202', 'PP-4MWR', 'ACTIVE', now() - interval '20 days'),
  ('00000000-0000-0000-0000-00000000a003', '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000101', 'PP-9XQT', 'INVITED', now() - interval '1 day');

-- Letters, relative to now() so the demo always looks fresh
insert into public.letters (pairing_id, sender_id, kind, body, delivery_channel, sent_at, deliver_at, read_at) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000201', 'TYPED',
   E'Drogi Kubo,\n\nnazywam się Halina i przez czterdzieści lat uczyłam polskiego. Cieszę się, że będziemy do siebie pisać.\n\nCo lubisz czytać?',
   'APP', now() - interval '23 days', now() - interval '21 days', now() - interval '21 days'),
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000101', 'TYPED',
   E'Droga Halino,\n\ndziękuję za list! Wysyłam Ci zdjęcie Wisły o świcie. Jaka jest Twoja ulubiona książka?',
   'PAPER', now() - interval '11 days', now() - interval '9 days', null),
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000201', 'TYPED',
   E'Kraków, 28 września\n\nDrogi Kubo,\n\ndziękuję Ci za list i za zdjęcie Wisły o świcie. Przypomniało mi lato 1968, kiedy z siostrą pływałyśmy łódką aż pod Tyniec.\n\nPytałeś o ulubioną książkę — to „Lalka”. Czytałam ją trzy razy i za każdym razem kibicowałam komuś innemu.\n\nA Ty co teraz czytasz?',
   'APP', now() - interval '4 days', now() - interval '2 days', null),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-000000000101', 'TYPED',
   E'Drogi Tadeuszu,\n\nczy pamiętasz, jak wyglądał plac Nowy w latach sześćdziesiątych?',
   'PAPER', now() - interval '6 hours', now() + interval '2 days' - interval '6 hours', null);

-- Kraków points (fictional names, real coordinates)
insert into public.points (type, name, address, lat, lng, hours, can_send, can_collect, pickup_note, phone) values
  ('PALPOINT', 'Klub Seniora „Pod Lipami”', 'ul. Przykładowa 12, Kraków', 50.0536, 19.9349,
   '[null,["10:00","18:00"],["10:00","18:00"],["10:00","18:00"],["10:00","18:00"],["10:00","18:00"],["10:00","14:00"]]',
   true, true, 'Listy skanujemy codziennie o 17:00.', '+48120000001'),
  ('PALPOINT', 'Biblioteka „Pod Arkadami”', 'ul. Książkowa 3, Kraków', 50.0647, 19.9450,
   '[null,["09:00","19:00"],["09:00","19:00"],["09:00","19:00"],["09:00","19:00"],["09:00","19:00"],["10:00","15:00"]]',
   true, true, 'Listy skanujemy codziennie o 18:00.', '+48120000002'),
  ('PALPOINT', 'Kawiarnia „Pocztówka”', 'ul. Kawowa 8, Kraków', 50.0672, 19.9205,
   '[["10:00","16:00"],["08:00","20:00"],["08:00","20:00"],["08:00","20:00"],["08:00","20:00"],["08:00","20:00"],["09:00","20:00"]]',
   true, false, 'Listy odbieramy codziennie o 16:00.', '+48120000003'),
  ('PALPOINT', 'Dom Kultury „Dębniki”', 'ul. Kulturalna 21, Kraków', 50.0478, 19.9187,
   '[null,["12:00","20:00"],["12:00","20:00"],["12:00","20:00"],["12:00","20:00"],["12:00","20:00"],null]',
   true, true, 'Listy skanujemy codziennie o 19:00.', '+48120000004'),
  ('PALBOX', 'PalBox Rynek Podgórski', 'Rynek Podgórski, Kraków', 50.0443, 19.9495,
   '[["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"]]',
   true, false, 'Opróżniamy codziennie o 15:00.', null),
  ('PALBOX', 'PalBox Kazimierz', 'pl. Nowy, Kraków', 50.0515, 19.9447,
   '[["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"]]',
   true, false, 'Opróżniamy codziennie o 16:00.', null),
  ('PALBOX', 'PalBox Nowa Huta', 'os. Centrum A, Kraków', 50.0717, 20.0377,
   '[["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"]]',
   true, false, 'Opróżniamy codziennie o 14:00.', null);
```

- [ ] **Step 2: Reset and verify**

```bash
npm run db:reset
PSQL="docker exec -i supabase_db_pen-pal psql -U postgres -At"
$PSQL -c "select string_agg(name, ',' order by name) from public.profiles"
# expect: Barbara,Halina,Krystyna,Kuba,Ola,Stanisław,Tadeusz,Zofia
$PSQL -c "select pal_kod, status from public.pairings order by pal_kod"
# expect: PP-4MWR|ACTIVE  PP-7K3D|ACTIVE  PP-9XQT|INVITED
$PSQL -c "select count(*) from public.letters; select count(*) from public.points"
# expect: 4 and 7
set -a; . ./.env; set +a
curl -s "$SUPABASE_URL/auth/v1/token?grant_type=password" -H "apikey: $SUPABASE_KEY" -H 'content-type: application/json' \
  -d '{"email":"kuba@penpal.test","password":"pisanielistow"}' | grep -o '"access_token"' 
# expect: "access_token"   (seeded users can sign in)
```

- [ ] **Step 3: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat(db): demo seed — Kuba, seniors, pairings, letters, Kraków points"
```

---

### Task 4: Design system, layouts, shared components

**Files:**
- Create: `app/assets/css/penpal.css` (copy), `app/assets/css/main.css`, `app/app.vue` (replace), `app/layouts/default.vue`, `app/layouts/plain.vue`, `app/components/AppIcon.vue`, `app/components/ScreenTop.vue`, `app/components/AppButton.vue`, `app/components/RadioCard.vue`, `app/components/InfoNote.vue`, `app/components/BottomNav.vue`

**Interfaces:**
- Produces components (auto-imported):
  - `<AppIcon name size? strokeWidth? />`. `name` is one of `back chevron close plus minus more mail pin user pen lock clock camera info bulb check search locate navigate phone shield alert`; default `size` 22, `strokeWidth` 2; colour follows CSS `color`.
  - `<ScreenTop back? backLabel? backIcon?('back'|'close') title? subtitle?>` with slots `lead` (avatar before the title), `center` (under the title), and default (right side).
  - `<AppButton to? variant?('primary'|'stamp'|'outline') type? disabled?>`
  - `<RadioCard v-model value name>` with a slot for the content
  - `<InfoNote icon? alert?>` with a slot
  - `<BottomNav />`
- CSS classes from `design/penpal.css`, plus `.page`, `.sr-only`, `.error`, `.handwriting`.

- [ ] **Step 1: Copy the design CSS and add the app overrides**

```bash
cp design/penpal.css app/assets/css/penpal.css
```

`app/assets/css/main.css`:

```css
:root {
  --paper: #F6F0E4; --card: #FBF7EE; --sheet: #FFFDF8; --ink: #1F2A44;
  --stamp: #A8432A; --muted: #5E667A; --line: #E3D8C3; --line-strong: #CDBF9F;
}
html, body { background: var(--paper); }
a { color: var(--ink); }
a:hover { color: var(--stamp); }

/* Design frames are a fixed 390×844; the app fills the phone instead and scrolls. */
.scr { width: 100%; max-width: 480px; height: auto; min-height: 100dvh; margin: 0 auto; overflow: visible; }
.page { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.body { overflow: visible; }
.nav { position: sticky; bottom: 0; z-index: 1000; }

.btn[disabled], .btn2[disabled] { opacity: .5; cursor: not-allowed; }
.chip, .radio { cursor: pointer; }
.handwriting { font-family: 'Caveat', cursive; }
.error { color: #8C3520; font-size: 16px; margin: 0; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
:focus-visible, .radio:has(input:focus-visible) { outline: 3px solid var(--stamp); outline-offset: 2px; }
```

- [ ] **Step 2: App shell and layouts**

`app/app.vue`:

```vue
<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

`app/layouts/default.vue` (Listy, Mapa, Profil):

```vue
<template>
  <div class="scr">
    <slot />
    <BottomNav />
  </div>
</template>
```

`app/layouts/plain.vue`:

```vue
<template>
  <div class="scr">
    <slot />
  </div>
</template>
```

- [ ] **Step 3: `AppIcon.vue`** (paths taken from the design files)

```vue
<script setup lang="ts">
const PATHS: Record<string, string> = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  more: '<circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  navigate: '<path d="M3 11l18-8-8 18-2-8z"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  alert: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 9v4M12 16h.01"/>',
}
withDefaults(defineProps<{ name: string, size?: number, strokeWidth?: number }>(), { size: 22, strokeWidth: 2 })
</script>

<template>
  <svg
    :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" focusable="false" style="flex: none" v-html="PATHS[name]"
  />
</template>
```

- [ ] **Step 4: `ScreenTop.vue`, `AppButton.vue`, `RadioCard.vue`, `InfoNote.vue`, `BottomNav.vue`**

`app/components/ScreenTop.vue`:

```vue
<script setup lang="ts">
withDefaults(defineProps<{
  back?: string
  backLabel?: string
  backIcon?: 'back' | 'close'
  title?: string
  subtitle?: string
}>(), { backLabel: 'Wstecz', backIcon: 'back' })
</script>

<template>
  <header class="top">
    <NuxtLink v-if="back" class="back" :to="back" :aria-label="backLabel">
      <AppIcon :name="backIcon" :stroke-width="2.2" />
    </NuxtLink>
    <slot name="lead" />
    <div style="flex: 1; min-width: 0">
      <div v-if="title" class="top-title">{{ title }}</div>
      <div v-if="subtitle" class="muted" style="font-size: 14px">{{ subtitle }}</div>
      <slot name="center" />
    </div>
    <slot />
  </header>
</template>
```

`app/components/AppButton.vue`:

```vue
<script setup lang="ts">
const props = withDefaults(defineProps<{
  to?: string
  variant?: 'primary' | 'stamp' | 'outline'
  type?: 'button' | 'submit'
  disabled?: boolean
}>(), { variant: 'primary', type: 'button' })
const cls = computed(() => props.variant === 'outline' ? 'btn2' : props.variant === 'stamp' ? 'btn btn-stamp' : 'btn')
</script>

<template>
  <NuxtLink v-if="to && !disabled" :class="cls" :to="to"><slot /></NuxtLink>
  <button v-else :class="cls" :type="type" :disabled="disabled"><slot /></button>
</template>
```

`app/components/RadioCard.vue`:

```vue
<script setup lang="ts">
defineProps<{ value: string, name: string }>()
const model = defineModel<string>()
</script>

<template>
  <label class="radio" :class="{ 'radio-on': model === value }">
    <input v-model="model" class="sr-only" type="radio" :name="name" :value="value">
    <span class="ring" :class="{ 'ring-on': model === value }" />
    <span style="flex: 1; min-width: 0"><slot /></span>
  </label>
</template>
```

`app/components/InfoNote.vue`:

```vue
<script setup lang="ts">
withDefaults(defineProps<{ icon?: string, alert?: boolean }>(), { icon: 'info' })
</script>

<template>
  <div class="note" :role="alert ? 'alert' : 'note'">
    <AppIcon :name="icon" :size="22" />
    <span><slot /></span>
  </div>
</template>
```

`app/components/BottomNav.vue`:

```vue
<script setup lang="ts">
const route = useRoute()
const items = [
  { to: '/listy', label: 'Listy', icon: 'mail' },
  { to: '/mapa', label: 'Mapa', icon: 'pin' },
  { to: '/profil', label: 'Profil', icon: 'user' },
]
</script>

<template>
  <nav class="nav" aria-label="Nawigacja">
    <NuxtLink
      v-for="i in items" :key="i.to" :to="i.to" class="nav-a"
      :class="{ 'nav-on': route.path === i.to }" :aria-current="route.path === i.to ? 'page' : undefined"
    >
      <AppIcon :name="i.icon" :size="26" />{{ i.label }}
    </NuxtLink>
  </nav>
</template>
```

- [ ] **Step 5: Verify visually with a throwaway page (do not commit it)**

Create `app/pages/index.vue` temporarily:

```vue
<script setup lang="ts">
definePageMeta({ layout: 'default' })
const pick = ref('APP')
</script>

<template>
  <div class="page">
    <ScreenTop back="/" title="Napisz list" subtitle="Do: Halina" />
    <main class="body">
      <h1 class="h1">Jak wolisz pisać?</h1>
      <RadioCard v-model="pick" name="c" value="PAPER"><div class="h2">List papierowy</div></RadioCard>
      <RadioCard v-model="pick" name="c" value="APP"><div class="h2">Wiadomość w aplikacji</div></RadioCard>
      <InfoNote icon="lock">Miasto i adres widzi <b>tylko PenPal</b>.</InfoNote>
      <p class="handwriting" style="font-size: 26px">Drogi Kubo,</p>
    </main>
    <div class="foot">
      <AppButton variant="stamp">Załóż konto</AppButton>
      <AppButton variant="outline">Mam już konto</AppButton>
    </div>
  </div>
</template>
```

Run `npm run dev` and open http://localhost:3000 in devtools at 390×844. Expected: paper background, Fraunces headings, Atkinson body, Caveat line, 58px buttons, a working radio with a focus ring when you tab to it, and the bottom nav with three items. Then delete the page:

```bash
rm app/pages/index.vue
```

- [ ] **Step 6: Commit**

```bash
git add app/app.vue app/assets app/layouts app/components
git commit -m "feat(ui): port design tokens, layouts and shared components"
```

---

### Task 5: Shared domain rules and API contract types

**Files:**
- Create: `shared/utils/rules.ts`, `shared/utils/letters.ts`, `shared/utils/polish.ts`, `shared/utils/topics.ts`, `shared/types/api.ts`

**Interfaces:**
- Produces (import via `#shared/utils/<file>` / `#shared/types/api`):
  - `rules.ts`: `AGE_RANGES`, `AgeRange`, `CHANNELS`, `Channel`, `INTERESTS`, `LANGUAGES`, `pairLimit(isPremium): number`, `isOtherGeneration(a, b): boolean`, `sharesLanguage(a[], b[]): boolean`, `sharedInterests(a[], b[]): string[]`, `matchScore(me: MatchInput, other: MatchInput): number`, `generatePalKod(): string`, `PALKOD_RE`
  - `letters.ts`: `DELIVERY_MS`, `LetterKind`, `DeliveryChannel`, `TimelineStep`, `deliverySteps(kind, channel, sentAt, deliverAt, now?)`, `canWrite(letters, me, now?)`
  - `polish.ts`: `ageLabel`, `channelLabel`, `decline(name, 'gen'|'dat'|'acc')`, `plural(n, one, few, many)`, `formatLongDay(iso)`, `formatDate(iso)`, `formatShortDay(iso)`, `formatStepTime(iso)`, `onDay(iso)`, `initial(name)`
  - `topics.ts`: `topicFor(sharedInterests): { interest: string, prompt: string } | null`
  - `api.ts`: `PublicProfile`, `Me`, `MePatch`, `PairingStatus`, `PairingView`, `LetterView`, `LetterResponse`, `MatchView`, `MatchesResponse`, `Hours`, `PointView`

- [ ] **Step 1: `shared/utils/rules.ts`**

```ts
export const AGE_RANGES = ['18-25', '26-40', '41-60', '60-75', '75+'] as const
export type AgeRange = typeof AGE_RANGES[number]
export const CHANNELS = ['PAPER', 'APP'] as const
export type Channel = typeof CHANNELS[number]
export const INTERESTS = ['Książki', 'Ogród', 'Gotowanie', 'Historia', 'Podróże', 'Muzyka', 'Sport', 'Zwierzęta', 'Film', 'Rękodzieło', 'Technologia', 'Języki obce', 'Fotografia', 'Przyroda', 'Szachy i gry'] as const
export const LANGUAGES = ['polski', 'angielski', 'niemiecki', 'ukraiński'] as const

export const pairLimit = (isPremium: boolean) => isPremium ? 5 : 3

// User decision: only 18–25 ↔ 60+ are matched.
const YOUNG: readonly string[] = ['18-25']
const SENIOR: readonly string[] = ['60-75', '75+']
export const isOtherGeneration = (a: AgeRange, b: AgeRange) =>
  (YOUNG.includes(a) && SENIOR.includes(b)) || (SENIOR.includes(a) && YOUNG.includes(b))

export const sharesLanguage = (a: readonly string[], b: readonly string[]) => a.some(l => b.includes(l))
export const sharedInterests = (a: readonly string[], b: readonly string[]) => a.filter(i => b.includes(i))

export interface MatchInput { interests: string[], channel: Channel, city: string | null }
/** +2 per shared interest, +1 same region (city), +1 same channel. */
export const matchScore = (me: MatchInput, other: MatchInput) =>
  2 * sharedInterests(me.interests, other.interests).length
  + (me.city && me.city === other.city ? 1 : 0)
  + (me.channel === other.channel ? 1 : 0)

const PALKOD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I
export const PALKOD_RE = /^PP-[A-HJ-NP-Z2-9]{4}$/
export function generatePalKod(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return 'PP-' + Array.from(bytes, b => PALKOD_ALPHABET[b % PALKOD_ALPHABET.length]).join('')
}
```

- [ ] **Step 2: `shared/utils/letters.ts`**

```ts
export type LetterKind = 'TYPED' | 'SCAN'
export type DeliveryChannel = 'APP' | 'PAPER'
export const DELIVERY_MS = 2 * 24 * 60 * 60 * 1000

export interface TimelineStep { label: string, at: string, done: boolean }

// Step label + fraction of the way from sent_at to deliver_at.
const STEPS: Record<`${LetterKind}_${DeliveryChannel}`, [string, number][]> = {
  TYPED_APP: [['Wysłany', 0], ['W drodze', 0.1], ['Dostarczony', 1]],
  TYPED_PAPER: [['Wysłany', 0], ['Wydrukowany', 0.3], ['Nadany na poczcie', 0.5], ['Dostarczony', 1]],
  SCAN_APP: [['Przyjęty w PalPoincie', 0], ['Zeskanowany', 0.2], ['W drodze', 0.3], ['Dostarczony', 1]],
  SCAN_PAPER: [['Przyjęty w PalPoincie', 0], ['Zeskanowany', 0.2], ['Wysłany pocztą', 0.5], ['Dostarczony', 1]],
}

export function deliverySteps(kind: LetterKind, channel: DeliveryChannel, sentAt: string, deliverAt: string, now = Date.now()): TimelineStep[] {
  const s = Date.parse(sentAt)
  const d = Date.parse(deliverAt)
  return STEPS[`${kind}_${channel}`].map(([label, f]) => {
    const at = s + (d - s) * f
    return { label, at: new Date(at).toISOString(), done: at <= now }
  })
}

/** One letter at a time: write if no letters yet, or the latest is the pen pal's and has arrived.
 *  Pass ALL letters of the pairing, including ones still in transit. */
export function canWrite(letters: { senderId: string, sentAt: string, deliverAt: string }[], me: string, now = Date.now()): boolean {
  const last = letters.reduce<typeof letters[number] | undefined>(
    (acc, l) => !acc || Date.parse(l.sentAt) > Date.parse(acc.sentAt) ? l : acc, undefined)
  return !last || (last.senderId !== me && Date.parse(last.deliverAt) <= now)
}
```

- [ ] **Step 3: `shared/utils/polish.ts`**

```ts
const TZ = 'Europe/Warsaw'
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pl-PL', { timeZone: TZ, ...o })
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const ageLabel = (a: string) => a.replace('-', '–')
export const channelLabel = (c: 'PAPER' | 'APP') => c === 'PAPER' ? 'pisze ręcznie' : 'pisze w aplikacji'
export const initial = (name: string) => name.trim().charAt(0).toUpperCase()

/** "Sobota, 3 października" */
export const formatLongDay = (iso: string) => cap(fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso)))
/** "1 października" */
export const formatDate = (iso: string) => fmt({ day: 'numeric', month: 'long' }).format(new Date(iso))
/** "5 paź" */
export const formatShortDay = (iso: string) => fmt({ day: 'numeric', month: 'short' }).format(new Date(iso))
/** "Sobota, 3 paź, 16:20" */
export const formatStepTime = (iso: string) => {
  const d = new Date(iso)
  return `${cap(fmt({ weekday: 'long' }).format(d))}, ${formatShortDay(iso)}, ${fmt({ hour: '2-digit', minute: '2-digit' }).format(d)}`
}
const ON_DAY = ['w niedzielę', 'w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę']
const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** "w poniedziałek, 5 października" */
export const onDay = (iso: string) => {
  const i = EN_DAYS.indexOf(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(new Date(iso)))
  return `${ON_DAY[i]}, ${formatDate(iso)}`
}

export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one
  const d = n % 10
  const h = n % 100
  return d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many
}

// ponytail: heuristic first-name declension; covers common Polish names. Add a per-profile override if a real name comes out wrong.
export function decline(name: string, c: 'gen' | 'dat' | 'acc'): string {
  if (name.endsWith('ia')) return name.slice(0, -1) + (c === 'acc' ? 'ę' : 'i') // Zofia → Zofii, Zofię
  if (name.endsWith('a')) {
    const stem = name.slice(0, -1)
    const last = stem.slice(-1)
    if (c === 'acc') return stem + 'ę' // Halinę
    if (c === 'gen') return stem + ('kglj'.includes(last) ? 'i' : 'y') // Haliny, Oli, Kingi
    if ('lj'.includes(last)) return stem + 'i' // Oli
    const soft: Record<string, string> = { k: 'ce', g: 'dze', r: 'rze', d: 'dzie', t: 'cie', ł: 'le' }
    return soft[last] ? stem.slice(0, -1) + soft[last] : stem + 'ie' // Barbarze, Halinie, Kubie
  }
  const stem = name.endsWith('ek') ? name.slice(0, -2) + 'k' : name // Marek → Mark-
  return stem + (c === 'dat' ? 'owi' : 'a') // Tadeusza, Tadeuszowi
}
```

- [ ] **Step 4: `shared/utils/topics.ts`**

```ts
const PROMPTS: Record<string, string> = {
  'Książki': 'zapytaj o ulubioną książkę z młodości',
  'Ogród': 'zapytaj, co najlepiej rośnie w ogrodzie',
  'Gotowanie': 'zapytaj o przepis zapamiętany z rodzinnego domu',
  'Historia': 'zapytaj, jak wyglądało miasto w czasach młodości',
  'Podróże': 'zapytaj o najpiękniejszą podróż w życiu',
  'Muzyka': 'zapytaj, jakiej muzyki słuchało się na potańcówkach',
  'Sport': 'zapytaj, komu kibicuje od lat',
  'Zwierzęta': 'zapytaj o zwierzę, które pamięta najlepiej',
  'Film': 'zapytaj o film, który warto obejrzeć jeszcze raz',
  'Rękodzieło': 'zapytaj o ulubione robótki ręczne',
  'Technologia': 'zapytaj, jaki wynalazek najbardziej zmienił codzienne życie',
  'Języki obce': 'zapytaj, jakiego języka warto się nauczyć i dlaczego',
  'Fotografia': 'zapytaj o zdjęcie, które ma szczególną historię',
  'Przyroda': 'zapytaj o ulubione miejsce na spacer',
  'Szachy i gry': 'zapytaj, w co grało się kiedyś na podwórku',
}

/** First-letter topic from the first shared interest. (new copy) */
export function topicFor(shared: string[]): { interest: string, prompt: string } | null {
  const interest = shared.find(i => PROMPTS[i])
  return interest ? { interest, prompt: PROMPTS[interest] } : null
}
```

- [ ] **Step 5: `shared/types/api.ts`**

```ts
import type { AgeRange, Channel } from '../utils/rules'
import type { DeliveryChannel, LetterKind, TimelineStep } from '../utils/letters'

export type PairingStatus = 'INVITED' | 'ACTIVE' | 'ENDED' | 'BLOCKED'

/** What a pen pal may see. Never city or postal address. */
export interface PublicProfile {
  id: string
  name: string
  ageRange: AgeRange
  channel: Channel
  bio: string
  languages: string[]
  interests: string[]
}

export interface Me {
  id: string
  email: string
  name: string | null
  ageRange: AgeRange | null
  channel: Channel | null
  bio: string
  languages: string[]
  interests: string[]
  isPremium: boolean
  notifyNewLetter: boolean
  notifyDelivered: boolean
  city: string | null
  postalAddress: string | null
  /** Route of the next unfinished onboarding step, or null when the profile is complete. */
  onboardingStep: string | null
  /** Max ACTIVE pairings (3, Premium 5). */
  limit: number
}

export type MePatch = Partial<{
  name: string
  ageRange: AgeRange
  channel: Channel
  bio: string
  languages: string[]
  interests: string[]
  city: string
  postalAddress: string
  notifyNewLetter: boolean
  notifyDelivered: boolean
}>

export interface LetterView {
  id: string
  pairingId: string
  mine: boolean
  kind: LetterKind
  body: string | null
  /** Signed URLs; empty unless the endpoint says it signs them. */
  imageUrls: string[]
  deliveryChannel: DeliveryChannel
  sentAt: string
  deliverAt: string
  readAt: string | null
  delivered: boolean
  steps: TimelineStep[]
}

export interface PairingView {
  id: string
  palKod: string
  status: PairingStatus
  createdAt: string
  /** user_a_id: who sent the invitation */
  inviterId: string
  partner: PublicProfile
  sharedInterests: string[]
  /** Latest letter visible to me (mine, or theirs once delivered). */
  lastLetter: LetterView | null
  /** ACTIVE and it's my turn (one letter at a time). */
  canWrite: boolean
}

export interface LetterResponse { letter: LetterView, pairing: PairingView }

export interface MatchView { profile: PublicProfile, sharedInterests: string[], score: number }
export interface MatchesResponse { full: boolean, limit: number, matches: MatchView[] }

/** 7 entries indexed like Date.getDay() (0 = Sunday): [open, close] or null. */
export type Hours = ([string, string] | null)[]
export interface PointView {
  id: string
  type: 'PALPOINT' | 'PALBOX'
  name: string
  address: string
  lat: number
  lng: number
  hours: Hours
  canSend: boolean
  canCollect: boolean
  pickupNote: string | null
  phone: string | null
}
```

- [ ] **Step 6: Verify the pure rules with Node (Node 24 runs `.ts` directly)**

```bash
node --input-type=module -e "
import { decline, plural, formatLongDay, onDay, formatShortDay } from './shared/utils/polish.ts'
import { generatePalKod, PALKOD_RE, matchScore, isOtherGeneration } from './shared/utils/rules.ts'
import { canWrite, deliverySteps } from './shared/utils/letters.ts'
console.log(['Halina','Kuba','Ola','Tadeusz','Zofia','Barbara','Marek'].map(n => [decline(n,'gen'),decline(n,'dat'),decline(n,'acc')].join('/')).join(' '))
console.log(plural(1,'słowo','słowa','słów'), plural(3,'słowo','słowa','słów'), plural(12,'słowo','słowa','słów'), plural(22,'słowo','słowa','słów'))
console.log(formatLongDay('2026-10-03T14:20:00Z'), '|', onDay('2026-10-05T10:00:00Z'), '|', formatShortDay('2026-10-05T10:00:00Z'))
console.log(Array.from({length: 500}, generatePalKod).every(k => PALKOD_RE.test(k)))
console.log(matchScore({interests:['Książki','Historia'],channel:'APP',city:'Kraków'},{interests:['Historia','Książki','Ogród'],channel:'PAPER',city:'Kraków'}))
console.log(isOtherGeneration('18-25','75+'), isOtherGeneration('26-40','60-75'), isOtherGeneration('18-25','18-25'))
const t0 = '2026-10-01T00:00:00Z', t2 = '2026-10-03T00:00:00Z', now = Date.parse('2026-10-02T00:00:00Z')
console.log(canWrite([], 'me'), canWrite([{senderId:'pal',sentAt:t0,deliverAt:t2}],'me',now), canWrite([{senderId:'pal',sentAt:t0,deliverAt:t0}],'me',now), canWrite([{senderId:'me',sentAt:t0,deliverAt:t0}],'me',now))
console.log(deliverySteps('TYPED','PAPER',t0,t2,now).map(s => s.label+':'+s.done).join(' '))
"
```

Expected output:

```
Haliny/Halinie/Halinę Kuby/Kubie/Kubę Oli/Oli/Olę Tadeusza/Tadeuszowi/Tadeusza Zofii/Zofii/Zofię Barbary/Barbarze/Barbarę Marka/Markowi/Marka
słowo słowa słów słowa
Sobota, 3 października | w poniedziałek, 5 października | 5 paź
true
5
true false false
true false true false
Wysłany:true Wydrukowany:true Nadany na poczcie:true Dostarczony:false
```

- [ ] **Step 7: Commit**

```bash
git add shared
git commit -m "feat(shared): domain rules, delivery timeline, Polish formatting, API types"
```

---

### Task 6: Server helpers, profile + pairing read API, auth middleware, dev sign-in

**Files:**
- Create: `server/utils/supabase.ts`, `server/utils/views.ts`, `server/api/me.get.ts`, `server/api/me.patch.ts`, `server/api/pairings/index.get.ts`, `server/api/pairings/[id]/index.get.ts`, `app/composables/useProfile.ts`, `app/utils/errorText.ts`, `app/middleware/auth.global.ts`, `app/pages/dev/login.vue`

**Interfaces:**
- Consumes: Task 5 types and rules, `types/database.ts`.
- Produces (server auto-imports from `server/utils`):
  - `db(event)`: typed service-role client
  - `requireUserId(event): Promise<string>` (401 if signed out)
  - `fail(status: number, message: string)`: an `H3Error` to `throw`
  - `toPublicProfile(row): PublicProfile`
  - `loadMe(event, id): Promise<Me>`
  - `requirePairing(event, id, me): Promise<Tables<'pairings'>>` (404 unless I'm a member)
  - `toLetterView(row, me, imageUrls?, now?): LetterView`
  - `loadPairingView(event, pairingRow, me): Promise<PairingView>`
  - `signUrls(event, paths): Promise<string[]>` (1-hour signed URLs from bucket `letters`)
- Produces (client):
  - `useProfile()` → `{ profile: Ref<Me|null>, refreshProfile(), saveProfile(patch: MePatch): Promise<Me> }`
  - `errorText(e): string`
  - Global middleware: public routes `/`, `/jak-to-dziala`, `/rejestracja`, `/admin/skan`, `/dev/login`; signed out → `/`; signed in on `/` → `/listy`; unfinished profile → `profile.onboardingStep` (the three `/profil/o-mnie|zainteresowania|kanal` routes are always allowed).
- API: `GET /api/me` → `Me`; `PATCH /api/me` (body `MePatch`) → `Me`; `GET /api/pairings` → `PairingView[]` (ACTIVE + INVITED); `GET /api/pairings/:id` → `PairingView`.

- [ ] **Step 1: `server/utils/supabase.ts`**

```ts
import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/types/database'

/** Service-role client. Every route must check membership itself (requirePairing). */
export const db = (event: H3Event) => serverSupabaseServiceRole<Database>(event)

export const fail = (statusCode: number, message: string) => createError({ statusCode, message })

export async function requireUserId(event: H3Event): Promise<string> {
  const claims = await serverSupabaseUser(event).catch(() => null)
  if (!claims?.sub) throw fail(401, 'Zaloguj się, aby kontynuować.')
  return claims.sub
}
```

- [ ] **Step 2: `server/utils/views.ts`**

```ts
import type { H3Event } from 'h3'
import type { Tables } from '~~/types/database'
import type { LetterView, Me, PairingView, PublicProfile } from '#shared/types/api'
import { pairLimit, sharedInterests } from '#shared/utils/rules'
import { canWrite, deliverySteps } from '#shared/utils/letters'

export const toPublicProfile = (p: Tables<'profiles'>): PublicProfile => ({
  id: p.id,
  name: p.name ?? '',
  ageRange: p.age_range!,
  channel: p.channel!,
  bio: p.bio,
  languages: p.languages,
  interests: p.interests,
})

const onboardingStep = (p: Tables<'profiles'>) =>
  !p.name || !p.age_range ? '/profil/o-mnie'
    : p.interests.length < 3 ? '/profil/zainteresowania'
      : !p.channel ? '/profil/kanal'
        : null

export async function loadMe(event: H3Event, id: string): Promise<Me> {
  const client = db(event)
  const [{ data: p }, { data: priv }] = await Promise.all([
    client.from('profiles').select('*').eq('id', id).single(),
    client.from('private_profiles').select('*').eq('id', id).maybeSingle(),
  ])
  if (!p) throw fail(404, 'Nie znaleziono profilu.')
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    ageRange: p.age_range,
    channel: p.channel,
    bio: p.bio,
    languages: p.languages,
    interests: p.interests,
    isPremium: p.is_premium,
    notifyNewLetter: p.notify_new_letter,
    notifyDelivered: p.notify_delivered,
    city: priv?.city ?? null,
    postalAddress: priv?.postal_address ?? null,
    onboardingStep: onboardingStep(p),
    limit: pairLimit(p.is_premium),
  }
}

export async function requirePairing(event: H3Event, id: string, me: string) {
  const { data } = await db(event).from('pairings').select('*').eq('id', id).maybeSingle()
  if (!data || (data.user_a_id !== me && data.user_b_id !== me)) throw fail(404, 'Nie znaleziono korespondencji.')
  return data
}

export function toLetterView(l: Tables<'letters'>, me: string, imageUrls: string[] = [], now = Date.now()): LetterView {
  return {
    id: l.id,
    pairingId: l.pairing_id,
    mine: l.sender_id === me,
    kind: l.kind,
    body: l.body,
    imageUrls,
    deliveryChannel: l.delivery_channel,
    sentAt: l.sent_at,
    deliverAt: l.deliver_at,
    readAt: l.read_at,
    delivered: Date.parse(l.deliver_at) <= now,
    steps: deliverySteps(l.kind, l.delivery_channel, l.sent_at, l.deliver_at, now),
  }
}

export async function loadPairingView(event: H3Event, p: Tables<'pairings'>, me: string): Promise<PairingView> {
  const client = db(event)
  const partnerId = p.user_a_id === me ? p.user_b_id : p.user_a_id
  const [{ data: partner }, { data: mine }, { data: letters }] = await Promise.all([
    client.from('profiles').select('*').eq('id', partnerId).single(),
    client.from('profiles').select('interests').eq('id', me).single(),
    client.from('letters').select('*').eq('pairing_id', p.id).order('sent_at', { ascending: false }),
  ])
  if (!partner || !mine) throw fail(404, 'Nie znaleziono korespondencji.')
  const now = Date.now()
  const all = letters ?? []
  const lastVisible = all.find(l => l.sender_id === me || Date.parse(l.deliver_at) <= now)
  return {
    id: p.id,
    palKod: p.pal_kod,
    status: p.status,
    createdAt: p.created_at,
    inviterId: p.user_a_id,
    partner: toPublicProfile(partner),
    sharedInterests: sharedInterests(mine.interests, partner.interests),
    lastLetter: lastVisible ? toLetterView(lastVisible, me, [], now) : null,
    // canWrite must see letters still in transit, so it gets ALL letters.
    canWrite: p.status === 'ACTIVE' && canWrite(all.map(l => ({ senderId: l.sender_id, sentAt: l.sent_at, deliverAt: l.deliver_at })), me, now),
  }
}

export async function signUrls(event: H3Event, paths: string[]): Promise<string[]> {
  if (!paths.length) return []
  const { data, error } = await db(event).storage.from('letters').createSignedUrls(paths, 3600)
  if (error || !data) throw fail(500, 'Nie udało się wczytać skanu.')
  return data.map(d => d.signedUrl ?? '')
}
```

- [ ] **Step 3: Profile and pairing read routes**

`server/api/me.get.ts`:

```ts
export default defineEventHandler(async event => loadMe(event, await requireUserId(event)))
```

`server/api/me.patch.ts`:

```ts
import type { TablesUpdate } from '~~/types/database'
import type { MePatch } from '#shared/types/api'
import { AGE_RANGES, CHANNELS, INTERESTS, LANGUAGES } from '#shared/utils/rules'

const oneOf = (list: readonly string[], v: unknown) => typeof v === 'string' && list.includes(v)
const listOf = (list: readonly string[], v: unknown) =>
  Array.isArray(v) && v.every(x => oneOf(list, x)) && new Set(v).size === v.length

export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const b = await readBody<MePatch>(event)
  const pub: TablesUpdate<'profiles'> = {}
  const priv: TablesUpdate<'private_profiles'> = {}

  if (b.name !== undefined) {
    const name = String(b.name).trim()
    if (!name || name.length > 40) throw fail(400, 'Podaj imię (do 40 znaków).')
    pub.name = name
  }
  if (b.ageRange !== undefined) {
    if (!oneOf(AGE_RANGES, b.ageRange)) throw fail(400, 'Wybierz przedział wieku.')
    pub.age_range = b.ageRange!
  }
  if (b.channel !== undefined) {
    if (!oneOf(CHANNELS, b.channel)) throw fail(400, 'Wybierz, jak wolisz pisać.')
    pub.channel = b.channel!
  }
  if (b.bio !== undefined) {
    const bio = String(b.bio).trim()
    if (bio.length > 300) throw fail(400, 'Opis może mieć najwyżej 300 znaków.')
    pub.bio = bio
  }
  if (b.interests !== undefined) {
    if (!listOf(INTERESTS, b.interests) || b.interests.length < 3 || b.interests.length > 8)
      throw fail(400, 'Wybierz od 3 do 8 zainteresowań.')
    pub.interests = b.interests
  }
  if (b.languages !== undefined) {
    if (!listOf(LANGUAGES, b.languages) || b.languages.length < 1) throw fail(400, 'Wybierz co najmniej jeden język.')
    pub.languages = b.languages
  }
  if (b.notifyNewLetter !== undefined) pub.notify_new_letter = Boolean(b.notifyNewLetter)
  if (b.notifyDelivered !== undefined) pub.notify_delivered = Boolean(b.notifyDelivered)
  if (b.city !== undefined) priv.city = String(b.city).trim().slice(0, 80) || null
  if (b.postalAddress !== undefined) priv.postal_address = String(b.postalAddress).trim().slice(0, 200) || null

  const client = db(event)
  if (Object.keys(pub).length) {
    const { error } = await client.from('profiles').update(pub).eq('id', me)
    if (error) throw fail(500, 'Nie udało się zapisać profilu.')
  }
  if (Object.keys(priv).length) {
    const { error } = await client.from('private_profiles').update(priv).eq('id', me)
    if (error) throw fail(500, 'Nie udało się zapisać adresu.')
  }
  return loadMe(event, me)
})
```

`server/api/pairings/index.get.ts`:

```ts
export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const { data } = await db(event).from('pairings').select('*')
    .or(`user_a_id.eq.${me},user_b_id.eq.${me}`)
    .in('status', ['ACTIVE', 'INVITED'])
    .order('created_at')
  return Promise.all((data ?? []).map(p => loadPairingView(event, p, me)))
})
```

`server/api/pairings/[id]/index.get.ts`:

```ts
export default defineEventHandler(async (event) => {
  const me = await requireUserId(event)
  const pairing = await requirePairing(event, getRouterParam(event, 'id')!, me)
  return loadPairingView(event, pairing, me)
})
```

- [ ] **Step 4: Client composable, error helper, middleware**

`app/composables/useProfile.ts`:

```ts
import type { Me, MePatch } from '#shared/types/api'

export function useProfile() {
  const profile = useState<Me | null>('profile', () => null)
  const fetcher = useRequestFetch() // forwards the auth cookie during SSR
  async function refreshProfile() {
    profile.value = await fetcher<Me>('/api/me')
    return profile.value
  }
  async function saveProfile(patch: MePatch) {
    profile.value = await $fetch<Me>('/api/me', { method: 'PATCH', body: patch })
    return profile.value
  }
  return { profile, refreshProfile, saveProfile }
}
```

`app/utils/errorText.ts`:

```ts
export function errorText(e: unknown): string {
  const msg = (e as { data?: { message?: string } } | null)?.data?.message
  return msg || 'Coś poszło nie tak. Spróbuj ponownie.' // (new copy)
}
```

`app/middleware/auth.global.ts`:

```ts
const PUBLIC = ['/', '/jak-to-dziala', '/rejestracja', '/admin/skan', '/dev/login']
const ONBOARDING = ['/profil/o-mnie', '/profil/zainteresowania', '/profil/kanal']

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  // Right after signUp/signIn the module sets the user asynchronously; ask the client directly.
  if (!user.value && import.meta.client) {
    const { data } = await useSupabaseClient().auth.getClaims()
    user.value = data?.claims ?? null
  }
  if (!user.value) {
    useProfile().profile.value = null
    return PUBLIC.includes(to.path) ? undefined : navigateTo('/')
  }
  if (to.path === '/') return navigateTo('/listy')
  if (PUBLIC.includes(to.path) || ONBOARDING.includes(to.path)) return

  const { profile, refreshProfile } = useProfile()
  if (!profile.value || profile.value.id !== user.value.sub) await refreshProfile()
  const step = profile.value?.onboardingStep
  if (step) return navigateTo(step)
})
```

- [ ] **Step 5: Dev-only sign-in page** (lets every slice verify screens as seeded users until the real login page exists; 404 in production builds)

`app/pages/dev/login.vue`:

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'plain',
  middleware: () => { if (!import.meta.dev) return abortNavigation(createError({ statusCode: 404 })) },
})
const supabase = useSupabaseClient()
const { profile } = useProfile()
const error = ref('')
const users = ['kuba', 'ola', 'halina', 'krystyna']

async function signIn(who: string) {
  error.value = ''
  const { error: e } = await supabase.auth.signInWithPassword({ email: `${who}@penpal.test`, password: 'pisanielistow' })
  if (e) { error.value = e.message; return }
  profile.value = null
  await navigateTo('/listy')
}
async function signOut() {
  await supabase.auth.signOut()
  profile.value = null
  await navigateTo('/')
}
</script>

<template>
  <div class="page">
    <ScreenTop title="Dev: zaloguj jako" />
    <main class="body">
      <AppButton v-for="u in users" :key="u" @click="signIn(u)">{{ u }}</AppButton>
      <AppButton variant="outline" @click="signOut">Wyloguj</AppButton>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
  </div>
</template>
```

- [ ] **Step 6: Verify**

```bash
npx nuxi typecheck
```

Expected: no errors. Then run `npm run dev` and in the browser:

1. Open http://localhost:3000/listy while signed out. You are redirected to `/` (a 404 page for now, since `/` belongs to the onboarding slice; the redirect itself is the check).
2. Open `/dev/login` and click **kuba**. You are redirected to `/listy` (404 until the letters slice lands).
3. Open http://localhost:3000/api/me. The JSON has `"name":"Kuba"`, `"onboardingStep":null`, `"limit":3`, `"city":"Kraków"`.
4. Open `/api/pairings`. There are 3 items; Halina's has `palKod: "PP-7K3D"`, `lastLetter.mine: false`, `canWrite: true`. Tadeusz's has `lastLetter.mine: true`, `lastLetter.delivered: false`, `canWrite: false`. Stanisław's has `status: "INVITED"`. No partner object contains `city` or `postalAddress`.
5. In devtools console run `await $fetch('/api/me', { method: 'PATCH', body: { interests: ['Książki'] } }).catch(e => e.data.message)`. Expect `"Wybierz od 3 do 8 zainteresowań."`.
6. Click **Wyloguj** on `/dev/login`, then open `/api/me`. Expect a 401 JSON with `"message":"Zaloguj się, aby kontynuować."`.

- [ ] **Step 7: Commit**

```bash
git add server app/composables app/utils app/middleware app/pages/dev
git commit -m "feat(api): profile and pairing read API, auth middleware, dev sign-in"
```

---

### Task 7: PWA icons and production build check

**Files:**
- Create: `public/icon.svg`, generated `public/pwa-*.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png`, `public/favicon.ico`

- [ ] **Step 1: Icon source**

`public/icon.svg` (the envelope and heart stamp from `design/screens/Powitanie.html`, simplified):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#F6F0E4"/>
  <rect x="76" y="136" width="360" height="240" rx="18" fill="#FFFDF8" stroke="#1F2A44" stroke-width="12"/>
  <path d="M82 146 L256 270 L430 146" fill="none" stroke="#1F2A44" stroke-width="12" stroke-linejoin="round"/>
  <path d="M256 300 c-14 -18 -32 4 0 28 c32 -24 14 -46 0 -28 z" fill="#A8432A"/>
</svg>
```

- [ ] **Step 2: Generate the PNGs**

```bash
rm -f public/favicon.ico
npx pwa-assets-generator --preset minimal-2023 public/icon.svg
ls public
# expect: apple-touch-icon-180x180.png favicon.ico icon.svg maskable-icon-512x512.png pwa-192x192.png pwa-512x512.png pwa-64x64.png robots.txt
```

- [ ] **Step 3: Production build serves the manifest**

```bash
npm run build
node --env-file=.env .output/server/index.mjs &
sleep 3
curl -s http://localhost:3000/manifest.webmanifest | grep -o '"name":"PenPal"'
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/dev/login
kill %1
```

Expected: `"name":"PenPal"` and `404` (the dev sign-in page is disabled in production).

- [ ] **Step 4: Commit**

```bash
git add public
git commit -m "feat(pwa): app icons and manifest"
```

---

## Self-review notes

- Spec coverage: stack, scripts, migrations, seed, bucket, RLS, privacy split, design tokens and fonts, PWA, auth middleware and the API contract are all here. Screens are in plans 02–06.
- Deviations from CLAUDE.md, on purpose: (1) the env var is `SUPABASE_SECRET_KEY` (module 2.x); (2) there is no stored `letters.status`; it is derived from timestamps on the server, so fast-forward is just a timestamp shift; (3) `PaperSheet`, `Postmark` and `Avatar` are not components, because the `.paper`, `.postmark` and `.avatar` classes are enough; (4) the dev-only `/dev/login` stands in until the deferred login page exists.

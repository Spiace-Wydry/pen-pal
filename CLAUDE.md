# PenPal — implementation brief

PenPal connects older people who write paper letters with young people who write in an app. PenPal sits in the middle: it scans paper letters for app readers and prints app letters for paper readers. Hackathon MVP, pilot city Kraków. **All UI copy is Polish, informal "Ty" form.**

Read before coding:
- `docs/SPEC.md` — full product concept and every decision made so far (source of truth for rules).
- `design/screens/*.html` — the 21 approved screens, open in a browser at 390×844. Match them closely: layout, copy, colours, type.
- `design/previews/*.png` — the same screens as images.
- `design/penpal.css` — design tokens and component classes used by the screens.

## Stack (decided by the team — the team works in Vue)

- **Layout (Nuxt 4):** client code lives in `app/` (`app/pages`, `app/components`, …), API in `server/api`, pure shared rules in `shared/`. Page paths in the table below are relative to `app/`. Server env key is `SUPABASE_SECRET_KEY` (not `SUPABASE_SERVICE_KEY`). Plans: `docs/superpowers/plans/`.
- **Nuxt (latest stable) + TypeScript, Vue 3 Composition API (`<script setup lang="ts">`)**. Mobile-first web app, installable as a PWA via `@vite-pwa/nuxt`. Demo on phones from a public URL.
- **Supabase** via `@nuxtjs/supabase`:
  - **Postgres** for all data, with Row Level Security (users read only their own rows and their active pairings; never another user's `city` / `postal_address`).
  - **Auth**: email + password. No OAuth.
  - **Storage**: bucket `letters` for scans / photos (private, signed URLs).
  - SQL migrations in `supabase/migrations/`, demo data in `supabase/seed.sql`.
- **Server logic** in Nuxt server routes (`server/api/`) using the Supabase service client for anything privileged: matching, PalKod generation, sending letters, delivery status, PDF generation, the demo fast-forward. The client never computes delivery or sees private fields.
- **Map:** Leaflet + OpenStreetMap via `@nuxtjs/leaflet`, centred on Kraków.
- **PDF (paper letter):** generated server-side (e.g. `pdf-lib`), served from a server route.
- **Styling:** port `design/penpal.css` into `assets/css/` as CSS variables + component classes (or a Tailwind theme via `@nuxtjs/tailwindcss` if the team prefers). Fonts via `@nuxt/fonts` or Google Fonts: Fraunces (headings), Atkinson Hyperlegible (body), Caveat (handwriting sample only).
- **State:** `useState` / composables (`composables/usePenPals.ts`, `useLetters.ts`…); add Pinia only if needed.
- **Supabase runs locally in Docker** via the Supabase CLI (decided by the team). No cloud project during development.
  - Add the CLI as a dev dependency (`supabase` npm package) and commit the `supabase/` folder (`config.toml`, `migrations/`, `seed.sql`).
  - Scripts in `package.json`: `db:start` → `supabase start`, `db:stop` → `supabase stop`, `db:reset` → `supabase db reset` (re-runs migrations + `seed.sql`), `db:types` → `supabase gen types typescript --local > types/database.ts`.
  - Create the `letters` storage bucket and its policies in a migration, so `db:reset` rebuilds everything.
  - Env in `.env` (provide `.env.example`): `SUPABASE_URL`, `SUPABASE_KEY` (anon), `SUPABASE_SERVICE_KEY` — values come from `npx supabase status`.
  - Use Supabase Studio (local, URL printed by `supabase status`) to inspect data, and the local email inbox it provides for sign-up emails; disable email confirmation in `config.toml` for the demo.
- **Testing on phones:** run `nuxt dev --host`; set `SUPABASE_URL` to the laptop's LAN IP (e.g. `http://192.168.x.x:54321`), not `localhost`, or phones on the same Wi-Fi can't reach the database. For a public demo link, expose the laptop with a tunnel (e.g. cloudflared) or push the same migrations to a cloud Supabase project later (`supabase link` + `supabase db push`) — no code changes needed.
- Prerequisites: Node.js LTS and Docker Desktop running. `npm run db:start && npm run dev` starts everything.

## Design system (from `design/penpal.css`)

| Token | Value | Use |
| --- | --- | --- |
| paper | `#F6F0E4` | screen background |
| card | `#FBF7EE` | cards |
| sheet | `#FFFDF8` | letter paper, inputs |
| ink | `#1F2A44` | text, primary buttons |
| stamp | `#A8432A` | accent, primary CTA, postmarks |
| muted | `#5E667A` | secondary text |
| line | `#E3D8C3` / `#CDBF9F` | borders |

Accessibility is a feature (seniors): body text ≥ 17–18px, touch targets ≥ 48px (buttons 58px), contrast ≥ 4.5:1, real `<button>`/`<a>`/`<label>`, no icon-only buttons without `aria-label`.

## Screens → routes

| # | Screen file | Route | Nuxt page file | Notes |
| --- | --- | --- | --- | --- |
| 1 | Powitanie | `/` | `pages/index.vue` | Welcome |
| 2 | JakToDziala | `/jak-to-dziala` | `pages/jak-to-dziala.vue` | 3 explainer cards |
| 3 | Rejestracja | `/rejestracja` | `pages/rejestracja.vue` | step 1/4, 18+ and RODO consents required |
| 4 | OMnie | `/profil/o-mnie` | `pages/profil/o-mnie.vue` | step 2/4, address + city private |
| 5 | Zainteresowania | `/profil/zainteresowania` | `pages/profil/zainteresowania.vue` | step 3/4, 3–8 interests, languages |
| 6 | Kanal | `/profil/kanal` | `pages/profil/kanal.vue` | step 4/4, paper vs app, bio ≤ 300 |
| 7 | Szukamy | `/szukamy` | `pages/szukamy.vue` | waiting state |
| 8 | Propozycje | `/propozycje` | `pages/propozycje.vue` | top 3 matches |
| 9 | Zaproszenie | `/zaproszenia/:id` | `pages/zaproszenia/[id].vue` | accept / decline |
| 10 | NowyKorespondent | `/korespondenci/:id/nowy` | `pages/korespondenci/[id]/nowy.vue` | shows PalKod |
| 11 | Home | `/listy` | `pages/listy/index.vue` | pen-pal cards, empty slot, bottom nav |
| 12 | Korespondencja | `/korespondenci/:id` | `pages/korespondenci/[id]/index.vue` | letter timeline |
| 13 | CzytanieListu | `/listy/:letterId` | `pages/listy/[letterId]/index.vue` | scan view with zoom / text |
| 14 | NapiszList | `/korespondenci/:id/napisz` | `pages/korespondenci/[id]/napisz.vue` | editor, topic suggestion |
| 15 | Wyslij | `/korespondenci/:id/wyslij` | `pages/korespondenci/[id]/wyslij.vue` | choose app vs paper delivery |
| 16 | StatusListu | `/listy/:letterId/status` | `pages/listy/[letterId]/status.vue` | delivery timeline |
| 17 | DodajZdjecie | `/korespondenci/:id/zdjecie` | `pages/korespondenci/[id]/zdjecie.vue` | photo upload of handwritten letter |
| 18 | Mapa | `/mapa` | `pages/mapa/index.vue` | Leaflet map, filters, bottom sheet |
| 19 | Punkt | `/mapa/:pointId` | `pages/mapa/[pointId].vue` | PalPoint / PalBox details |
| 20 | Ustawienia | `/profil` | `pages/profil/index.vue` | profile, Premium, notifications |
| 21 | Zglos | `/korespondenci/:id/zglos` | `pages/korespondenci/[id]/zglos.vue` | report / block a pen pal |

Layouts: `layouts/default.vue` with the bottom nav (Listy · Mapa · Profil) for screens 11, 18, 20; `layouts/plain.vue` for onboarding and full-screen flows. Route middleware `middleware/auth.ts` redirects signed-out users to `/`, and users with an unfinished profile to the next onboarding step.

Shared components to extract (they repeat across screens): `BackButton`, `StepProgress`, `AppButton` (primary / stamp / outline), `ChipPicker`, `RadioCard`, `PenPalCard`, `LetterCard`, `PaperSheet`, `Postmark`, `InfoNote`, `BottomNav`, `DeliveryTimeline`.

## Data model (minimum)

Postgres tables in Supabase (snake_case in SQL, camelCase in TS types). Auth users live in `auth.users`; profile data in `profiles` keyed by the auth user id. Keep `city` and `postal_address` in a separate `private_profiles` table that only the owner and the service role can read.

- **User** (`profiles` + `private_profiles`): id, email, name, ageRange (`18-25|26-40|41-60|60-75|75+`), city, postalAddress, channel (`PAPER|APP`), bio, languages[], interests[], isPremium, createdAt.
- **Pairing** (pen-pal relationship): id, userAId, userBId, palKod (unique, e.g. `PP-7K3D`), status (`INVITED|ACTIVE|ENDED|BLOCKED`), createdAt.
- **Letter**: id, pairingId, senderId, kind (`TYPED|SCAN`), body (typed text), imageUrls[] (scans/photos), deliveryChannel (`APP|PAPER`), status (`SENT|PRINTED|SCANNED|IN_TRANSIT|DELIVERED`), sentAt, deliverAt, readAt.
- **Point**: id, type (`PALPOINT|PALBOX`), name, address, lat, lng, hours (json), canSend, canCollect.
- **Report**: id, pairingId, reporterId, reason, details, createdAt.

## Business rules (from SPEC.md — do not change)

1. **Privacy:** never expose another user's city or postal address to pen pals. Profile cards show name, age range, channel, interests, bio only.
2. **Age:** 18+ only; block sign-up without the checkbox.
3. **Pen-pal limit:** max 3 ACTIVE pairings per user, Premium 5. Show the limit copy from SPEC when full.
4. **Matching:** candidates from the other generation (60+ ↔ 18–30 as the default split), share ≥ 1 letter language, under their limit, not previously paired or blocked. Score = 2 × shared interests + 1 same region + 1 same channel. Show top 3.
5. **PalKod:** generated per pairing; 4 chars from an alphabet without confusable characters (no 0/O/1/I), prefix `PP-`.
6. **Slow mail:** every letter, app→app included, has `deliverAt = sentAt + 2 days`. Recipients cannot see it before then. Status shows "Twój list jest w drodze".
7. **One letter at a time:** you can write to a pen pal only after receiving their latest letter (or for the first letter).
8. **Delivery channel:** if the recipient prefers PAPER, default "Jako list papierowy" — generate a printable PDF of the letter with the PenPal reply footer (`Odpowiadając, napisz na kopercie: Do: <imię>, PalKod: <kod>`). Sender shown as PenPal, never a home address.
9. **Scan simulation:** "Dodaj zdjęcie listu" uploads 1+ page photos; stored as a `SCAN` letter and shown to the recipient as the scan.

## Demo helpers (hackathon only)

- Seed: Kuba (18–25, APP) paired with Halina (60–75, PAPER, PalKod `PP-7K3D`) and Tadeusz (75+, PAPER, `PP-4MWR`); a pending invite; candidates Krystyna etc.; ~6 Kraków points (fictional names, real coordinates).
- A hidden **"Przewiń czas o 2 dni"** (fast-forward) button in Profil so judges can see delivery without waiting.
- An admin page `/admin/skan` to simulate a PalPoint scan: pick a PalKod, upload a photo, it lands in the right pairing.

## Out of scope for MVP

Real postal integration, OCR, QR envelopes, PalPoint staff panel, ID verification, payments for Premium (show the screen only), printed envelope designs.

## Definition of done

The full journey works on a phone in Polish: sign up → profile → matches → invite/accept → write → choose paper → status (fast-forward) → read a scanned letter → reply → map → point details → report/block. Screens visually match `design/`.

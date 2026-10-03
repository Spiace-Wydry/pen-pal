# PenPal MVP — plan index

The PenPal MVP build is split into one **foundation** plan and five **slice** plans.

| # | Plan | Screens | Depends on | Can run in parallel with |
|---|------|---------|------------|--------------------------|
| 01 | [Foundation](2026-10-03-penpal-01-foundation.md) | none (infra, schema, seed, design system, contracts) | nothing | nothing; run it first, alone |
| 02 | [Onboarding](2026-10-03-penpal-02-onboarding.md) | 1–6 | 01 | 03, 04, 05, 06 |
| 03 | [Matching](2026-10-03-penpal-03-matching.md) | 7–10 | 01 | 02, 04, 05, 06 |
| 04 | [Letters](2026-10-03-penpal-04-letters.md) | 11–17, `/admin/skan`, PDF | 01 | 02, 03, 05, 06 |
| 05 | [Map](2026-10-03-penpal-05-map.md) | 18–19 | 01 | 02, 03, 04, 06 |
| 06 | [Account & safety](2026-10-03-penpal-06-account.md) | 20–21, fast-forward | 01 | 02, 03, 04, 05 |

## Why the split is safe to parallelise

- Foundation installs **every** dependency and owns `package.json`, `nuxt.config.ts`, the base migration, the seed, `app/app.vue`, the layouts, shared components, `shared/**` and `server/utils/supabase.ts` + `server/utils/views.ts`. Slices never edit those files. If a slice needs a new dependency, that is a plan bug; stop and ask.
- Each slice only **creates** new files: its pages, its `server/api/**` routes, and its own helpers (for example slice 06 adds `shared/utils/reports.ts` and one migration). Slices never edit an existing file. The one exception: slice 06 regenerates `types/database.ts` after its migration. If that conflicts on merge, run `npm run db:reset && npm run db:types`.
- Contracts between slices are fixed in foundation (`shared/types/api.ts`, endpoint list below). A slice that calls another slice's endpoint codes against the contract; the full journey works once all slices land.

## Cross-slice endpoint contract

| Endpoint | Owner | Used by |
|---|---|---|
| `GET /api/me`, `PATCH /api/me` | 01 | all |
| `GET /api/pairings`, `GET /api/pairings/:id` | 01 | 03, 04, 06 |
| `GET /api/matches` | 03 | 03 |
| `POST /api/pairings` (`{ userId }` → `{ id }`) | 03 | 03 |
| `POST /api/pairings/:id/accept` · `/decline` | 03 | 03 |
| `POST /api/demo/invite` (→ `{ id: string \| null }`) | 03 | **02** (Kanał screen) |
| `GET /api/pairings/:id/letters`, `GET /api/letters/:id`, `POST /api/letters`, `GET /api/letters/:id/pdf`, `POST /api/admin/scan` | 04 | 04 |
| `GET /api/points`, `GET /api/points/:id` | 05 | 05 |
| `POST /api/reports`, `POST /api/pairings/:id/block`, `POST /api/demo/fast-forward` | 06 | 06 |

Cross-slice page links, which 404 until their slice lands: 02 → `/szukamy` (03); 03 → `/korespondenci/:id/napisz` (04), `/listy` (04); 04 → `/korespondenci/:id/zglos` (06), `/propozycje` (03), `/profil` (06); 06 → `/profil/o-mnie?edit=1` (02).

## Running with agents

1. Run plan 01 to completion. Review it, then commit.
2. Dispatch plans 02–06 as five agents. Each works on its own branch or worktree from the post-foundation commit and commits only its own files.
3. Merge all five. Expect no conflicts; if one appears, a slice touched a file it doesn't own.
4. Run the **final demo check** below.

## Decisions taken (from the user, 2026-10-03)

- The handoff folder is moved to the repo root. The Nuxt 4 app lives at the root (`app/` srcDir).
- **Testing: manual only.** No test framework. Each task ends with concrete manual checks: `npx nuxi typecheck`, `curl`, `psql`, `node` one-liners on pure TS, and a click-through at 390×844.
- **Generations:** `18-25` ↔ `60-75` / `75+` only. `26-40` and `41-60` get no matches.
- **Login page: deferred.** "Mam już konto" links to `/logowanie`, which 404s until a later plan adds it. Seeded accounts have the password `pisanielistow` so login can use them later.
- **Invites are simulated both ways.** "Zaproś" creates an ACTIVE pairing straight away (the senior "accepts at the PalPoint"). Finishing onboarding creates one INVITED pairing *from* the best-matching seeded user, so screen 9 is reachable in the same journey.

## Deliberately not in these plans

- The login page (`/logowanie`) is deferred by the user. `/dev/login` (dev builds only) signs in as seeded users meanwhile.
- "Zakończ znajomość" (ending a pairing) has no design. Blocking frees a slot for now.
- "Zamów koperty", QR envelopes, OCR, real postage and Premium payments are out of scope per CLAUDE.md.
- No automated tests (user decision).

## Final demo check (after all slices are merged)

At 390×844 in Chrome devtools (and on a phone via `npm run dev -- --host`), on a fresh `npm run db:reset`:

1. `/` → Załóż konto → Jak to działa → Rejestracja (try without the 18+ box: blocked) → O mnie → Zainteresowania → Kanał → Szukamy.
2. Listy shows an invite card → Zaproszenie → Przyjmij → Nowy korespondent with a PalKod.
3. Szukamy → Propozycje shows 3 cards with no city or address → Zaproś → Nowy korespondent.
4. Napisz list → Wyślij (paper preselected for a paper pen pal) → Status "Twój list jest w drodze" → "Zobacz wydruk (PDF)" opens a PDF with Polish letters, "Nadawca: PenPal" and the PalKod footer.
5. Profil → "Przewiń czas o 2 dni" → Status shows Dostarczony.
6. `/admin/skan` with `NUXT_ADMIN_CODE`: PalKod + the senior's name + a photo → Przewiń czas again → Listy shows "Nowy list!" → open it (scan with zoom) → Odpisz.
7. Mapa → filters → pin → Punkt details → Prowadź opens directions.
8. Korespondencja → ⋯ → Zgłoś → send a report; then Zablokuj (two taps) → the pen pal disappears from Listy and the slot frees up.

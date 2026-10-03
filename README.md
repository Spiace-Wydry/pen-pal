# PenPal

**Łączymy pokolenia, list po liście.** PenPal connects older people who write paper letters with young people who write in an app. PenPal sits in the middle: it scans paper letters for app readers and prints app letters for paper readers. Hackathon MVP, pilot city Kraków.

Nuxt 4 + Supabase (local, Docker). UI copy is Polish. Business rules and architecture: [`CLAUDE.md`](CLAUDE.md).

## Run locally

Prerequisites: Node.js LTS and Docker running.

```bash
npm install
npm run db:start            # local Supabase in Docker
cp .env.example .env        # fill in from: npx supabase status -o env (API_URL, ANON_KEY, SERVICE_ROLE_KEY)
npm run db:reset            # migrations + demo seed
npm run dev                 # http://localhost:3000
```

On a phone in the same Wi-Fi: start with your LAN IP so the phone can reach Supabase:

```bash
SUPABASE_URL=http://<lan-ip>:54421 npx nuxi dev --host 0.0.0.0
```

## Demo accounts

All seeded accounts use the password `pisanielistow` (local demo data only).

- `prezentacja@penpal.test` — Marta, ready for a presentation: unread letter, letter in transit, pending invite, free slot.
- `kuba@penpal.test` — Kuba with pen pals Halina and Tadeusz.
- 40 more users: `<name>.s01…s20@penpal.test` (seniors), `<name>.m01…m20@penpal.test` (young).

Demo helpers: **Profil → "Przewiń czas o 2 dni"** delivers letters immediately; **`/admin/skan`** (code from `NUXT_ADMIN_CODE`) simulates a PalPoint scan; **`/dev/login`** signs in as seeded users (dev builds only).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Nuxt dev server |
| `npm run build` | Production build |
| `npm run db:start` / `db:stop` | Start / stop local Supabase |
| `npm run db:reset` | Re-run migrations and `supabase/seed.sql` |
| `npm run db:types` | Regenerate `types/database.ts` |
| `npx pwa-assets-generator` | Regenerate app icons from `public/logo.svg` |

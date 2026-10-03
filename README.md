# PenPal — handoff for Claude Code

This folder is everything Claude Code needs to build the PenPal hackathon MVP.

- `CLAUDE.md` — implementation brief: stack, routes, data model, business rules, demo helpers. Claude Code reads this automatically.
- `docs/SPEC.md` — full product concept (exported from the PenPal concept doc).
- `design/screens/` — 21 approved screens as HTML; open `Powitanie.html` in a browser and click through.
- `design/previews/` — PNG of each screen.
- `design/penpal.css` — design tokens and components.

## How to start

1. Put this folder at the root of a new Git repository (or unzip it into an empty project folder).
2. Open that folder in Claude Code.
3. Paste this prompt:

> Read CLAUDE.md, docs/SPEC.md and the screens in design/. Then plan the build of the PenPal MVP in Nuxt + Supabase as described, show me the plan, and once I approve, implement it screen by screen, starting with the Supabase schema, seed data and the onboarding flow. Keep all UI copy in Polish exactly as in the designs.

Before that, install Docker Desktop and make sure it's running. Supabase runs locally in Docker; Claude Code will set it up with the Supabase CLI. After `npm run db:start`, copy the URL and keys from `npx supabase status` into `.env`.

Tip: build in slices (onboarding → matching → letters → map → account) and test each on a phone-sized browser before moving on.

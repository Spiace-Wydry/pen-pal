# PenPal — koncepcja aplikacji (Hackathon)

Oct 3, 2026 · @Maciej

## Pitch

PenPal pairs older people who love writing paper letters with young people who live in apps, and lets each side write the way they prefer. A senior writes by hand and drops the letter at a PalPoint; we scan it and the young pen pal reads it in the app. The young person types a message; we print it and the senior gets a real letter by post.

**Problem we solve:**

- Loneliness among seniors, many of whom have no one to write to.
- Young people lack contact with older generations and their life experience.
- The two groups use different channels, so they never meet. PenPal translates between paper and digital.

**One-liner (PL):** *PenPal — łączymy pokolenia, list po liście.*

## Who it's for

| Persona | Who | Preferred channel | What they want |
| --- | --- | --- | --- |
| Pani Halina | 74, retired teacher, lives alone | Paper letters | Someone to share stories with, a reason to write |
| Kuba | 19, student | App messages | Authentic connection, life advice, a break from social media |
| Ola | 18, final-year high-school student | App or paper | A school or scout project, learning about history first-hand |
| Caregiver / family member | 45, daughter of a senior | App (on the senior's behalf) | Help set up the account for a parent who doesn't use a phone |

The caregiver persona matters: many seniors won't install an app, so registration on someone's behalf (or at a PalPoint) is likely needed.

## How it works

A new user goes from sign-up to first letter in five steps.

1. **Create an account** — email or phone; a caregiver or PalPoint staff can register a senior.
2. **Fill in the profile** — name, age range, city, postal address (hidden from others), interests picked from a fixed list, preferred channel (paper or app).
3. **Get matched** — the app proposes a pen pal from the other generation with overlapping interests. Both sides accept before anything is shared.
4. **Write** — paper letter dropped at a PalPoint/PalBox, or a message typed in the app.
5. **Deliver** — PenPal converts the letter to the recipient's channel (scan → app, or print → post) and notifies them.

A user can have up to **3 active pen pals** and can end a pen-pal relationship at any time.

## Profile & interests

Every profile field the matcher uses is picked from a fixed list, so we can filter on it; only the bio is free text.

| Field | Type | Example values (PL) | Visible to pen pal? |
| --- | --- | --- | --- |
| Imię | text | Halina | Yes |
| Przedział wieku | single choice | 18–25, 26–40, 41–60, 60–75, 75+ | Yes |
| Miasto / województwo | single choice | Kraków, małopolskie | No — used only by PenPal for regional matching |
| Adres pocztowy | text | ul. Długa 5/3, 31-147 Kraków | **No** — used only by PenPal for delivery |
| Preferowany kanał | single choice | List papierowy, Wiadomość w aplikacji | Yes |
| Zainteresowania | multi choice (3–8) | Książki, Ogród, Gotowanie, Historia, Podróże, Muzyka, Sport, Zwierzęta, Film, Rękodzieło, Technologia, Języki obce, Fotografia, Przyroda, Szachy i gry | Yes |
| Język listów | multi choice | polski, angielski, niemiecki, ukraiński | Yes |
| Krótko o mnie | text, max 300 chars | Uwielbiam wspominać lata 70. | Yes |

Interests double as conversation starters: the app can suggest a first-letter topic from a shared tag.

## Matching

The matcher pairs across generations by shared interests; a simple score is enough for the hackathon.

- **Hard filters:** other generation (e.g. 60+ ↔ 18–30), a shared letter language, fewer than 3 active pen pals on both sides, not previously matched or blocked.
- **Score:** +2 per shared interest, +1 if same region (optional, some users prefer far away), +1 if both chose the same channel.
- **Flow:** show the top 3 candidates as cards (name, age range, shared interests, bio — no city or address). User sends an invitation; the other side accepts or declines.
- **Limit:** max 3 active pen pals per user, the same for paper and app writers. Premium users get a higher limit (e.g. 5 — number to decide). A slow pace (even one letter a month) is expected, not a problem. Ending a pen-pal relationship frees a slot.
- **Waiting list:** seniors will likely outnumber young users or the reverse; whoever waits gets a "we're looking" status and a notification on match.

## Letter channels

PenPal is the bridge in both directions: it scans paper letters for app readers and prints app messages for paper readers.

&#91;embedded content: letter flow · paper to app and app to paper\]

If both pen pals prefer the same channel, the letter skips conversion: app to app is still delayed (see below), paper to paper is forwarded by post with the address masked.

**Slow by design:** PenPal is not a chat app; the waiting is part of the experience. App messages are held and delivered after a delay similar to a posted letter (a fixed 2 days for the MVP, to revisit after), with a "Twój list jest w drodze" status. One letter at a time per pen pal: you can reply only after receiving their letter.

## PalPoint & PalBox

Physical drop-off locations are how paper letters enter the system; the app shows them on a map.

|  | PalPoint | PalBox |
| --- | --- | --- |
| What it is | Staffed spot (library, senior club, café, parish, community centre) | Unstaffed letter box (like a parcel locker or mailbox) |
| Send letters | Yes | Yes |
| Collect letters | Yes — printed replies can be picked up instead of posted | No |
| Help with sign-up | Yes, staff can register a senior | No |
| Scanning | On site or collected daily | Emptied on schedule, scanned centrally |

**Map in the app (Mapa PalPointów):**

- Pins with two icons/colours: PalPoint vs PalBox.
- Filter: "Wyślij" / "Odbierz", open now.
- Each pin: address, opening hours, next pickup time (PalBox), directions.
- "Najbliżej mnie" button using location.

### Addressing a letter without a real address

Every pen-pal pair gets a short **PalKod** (e.g. `PP-7K3D`) that the scanner reads to route the letter; no street address ever appears on the envelope.

**What the senior writes on the envelope:**

```
Do: Kuba
PalKod: PP-7K3D
Od: Halina
```

**How the senior gets the code** — three options, from easiest to most flexible:

1. **Pre-printed PenPal envelopes** — after a match we post the senior a starter pack: envelopes already printed with the pen pal's first name, PalKod and a QR code. The senior just writes and drops it off.
2. **Stickers** — a sheet of QR + PalKod labels, one colour per pen pal (helpful with up to 3 pen pals).
3. **Handwritten code** — the senior copies the PalKod from the last letter received; every letter we deliver ends with a footer: *"Odpowiadając, napisz na kopercie: Do: Kuba, PalKod: PP-7K3D"*.

**How matching works at scan time:**

- Scanner reads the QR first; if there's none, OCR reads the PalKod (short, no confusable characters like 0/O, 1/I).
- The code points to the pen-pal pair, so it identifies both sender and recipient; the first name is a cross-check.
- Unreadable or mismatched → PalPoint staff look it up manually; if still unknown, the letter waits and the sender is notified.
- The code reveals nothing on its own and only works for that pair; ending the pen-pal relationship deactivates it.

## Safety & privacy

Pen pals never see each other's home address; PenPal is always the middleman, and that is a selling point.

- **Address masking:** letters go via PenPal. Posted letters show PenPal as sender; scans are stored in the app.
- **Age limit:** PenPal is 18+ only; age is confirmed at sign-up.
- **Moderation:** scanned and typed letters pass a quick check (automated text check + human review for flagged items) for contact details, money requests, or abuse.
- **Scam protection for seniors:** warn about requests for money or personal data; one-tap "Zgłoś" (report) and "Zablokuj" (block).
- **GDPR / RODO:** consent for storing letter scans and addresses, data export and deletion on request, retention policy for scans.
- **Verification:** optional ID check at a PalPoint gives a "Zweryfikowany" badge.

## App copy (PL) — first draft

All UI text is Polish; tone is warm, simple, large-print friendly. Everyone, seniors included, is addressed with the informal "Ty" form.

| Screen | Copy |
| --- | --- |
| Welcome | **PenPal** — Łączymy pokolenia, list po liście. |
| Welcome CTA | Załóż konto · Mam już konto |
| Onboarding 1 | Napisz list tak, jak lubisz — ręcznie albo w aplikacji. My dostarczymy go dalej. |
| Onboarding 2 | Twój adres jest bezpieczny. Widzimy go tylko my — nigdy Twój korespondent. |
| Profile | Opowiedz nam o sobie · Co lubisz? Wybierz od 3 do 8 zainteresowań. |
| Channel | Jak wolisz pisać? · List papierowy · Wiadomość w aplikacji |
| Matching | Znaleźliśmy kogoś dla Ciebie! · Wspólne zainteresowania: Ogród, Historia |
| Invite | Zaproś do korespondencji · Może później |
| Limit | Masz już 3 korespondentów. Zakończ jedną znajomość, aby poznać kogoś nowego. |
| Write | Napisz list · Wyślij jako list papierowy · Wyślij w aplikacji |
| Delivery status | Przyjęty w PalPoincie · Zeskanowany · Wysłany pocztą · Dostarczony |
| Map | Znajdź PalPoint lub PalBox w pobliżu · Wyślij · Odbierz · Otwarte teraz |
| Safety | Zgłoś · Zablokuj · Nigdy nie podawaj danych do konta ani pieniędzy. |

## Funding & partners

The goal is free letters for users, with postage, printing and locations covered by partners.

| Partner | What they give | What they get |
| --- | --- | --- |
| Local post office (Poczta Polska) | Free or discounted postage, post offices as PalPoints | Letter volume, social-impact story |
| Żabka stores | Shops as PalPoints / space for PalBoxes, dense network | Foot traffic, CSR visibility |
| City / municipality | Funding from senior and social programmes, PalBoxes in public spaces, libraries and community centres | A tool against senior loneliness |
| Churches and parishes | PalPoints, reaching seniors who don't use apps | Community activity |
| Advertisers | Pay for ad space on PalBoxes | Local advertising |
| Premium users | Subscription fee | Higher pen-pal limit |

## Hackathon scope

For the demo, the physical steps (scanning, printing, posting) can be simulated; the app flow must work end to end.

**MVP (demo day):**

- [ ] Sign-up + profile with interest tags
- [ ] Matching: candidate cards, invite / accept, 3-pen-pal limit
- [ ] Write a message in the app; "send as paper letter" generates a printable PDF (simulated post)
- [ ] Upload a photo of a handwritten letter (simulates the PalPoint scan) and show it to the pen pal
- [ ] Map with sample PalPoints and PalBoxes in Kraków
- [ ] Delivery status timeline per letter

### MVP screens for design

The full app journey is 21 mobile screens in 6 stages, plus 2 printed items for the paper side. This is the brief for Claude Design.

| # | Stage | Screen (PL) | What's on it |
| --- | --- | --- | --- |
| 1 | Onboarding | Powitanie | Logo, one-liner, "Załóż konto" / "Mam już konto" |
| 2 | Onboarding | Jak to działa | 3 swipe cards: write your way · your address stays private · slow mail, letters take 2 days |
| 3 | Onboarding | Rejestracja | Email or phone, password, 18+ confirmation, consents (RODO) |
| 4 | Profile | O mnie | Name, age range, city, postal address (marked "widoczny tylko dla PenPal") |
| 5 | Profile | Zainteresowania | Tag picker (3–8), letter languages |
| 6 | Profile | Jak wolisz pisać? | Paper or app, short bio |
| 7 | Matching | Szukamy korespondenta | Waiting state with friendly illustration |
| 8 | Matching | Propozycje | 3 candidate cards: name, age range, shared interests, bio |
| 9 | Matching | Zaproszenie | Received invite: accept / decline |
| 10 | Matching | Nowy korespondent! | Match success, PalKod, "Zamów koperty" for paper writers |
| 11 | Letters | Moi korespondenci (home) | Up to 3 pen-pal cards with last-letter status, empty slot, Premium hint |
| 12 | Letters | Korespondencja | Timeline of letters with one pen pal: scans and typed letters |
| 13 | Letters | Czytanie listu | Scan view with zoom, or typed letter on letter-paper style |
| 14 | Letters | Napisz list | Editor with letter-paper look, topic suggestion from a shared interest |
| 15 | Letters | Wyślij | Choose delivery: in app or as paper letter; note that it arrives in 2 days |
| 16 | Letters | Status listu | Timeline: Przyjęty → Zeskanowany → W drodze → Dostarczony |
| 17 | Letters | Dodaj zdjęcie listu | Photo upload of a handwritten letter (simulates the PalPoint scan in the demo) |
| 18 | Map | Mapa PalPointów | Kraków map, PalPoint vs PalBox pins, filters Wyślij / Odbierz / Otwarte teraz |
| 19 | Map | Szczegóły punktu | Address, hours, next pickup, directions |
| 20 | Account | Profil i ustawienia | Edit profile, Premium (higher limit), notifications |
| 21 | Account | Zgłoś / Zablokuj | Report reasons, block confirmation, scam-safety tip |
| P1 | Paper | Koperta PenPal | Envelope with pen pal's first name, PalKod and QR |
| P2 | Paper | Wydrukowany list | Printed app message with reply footer (PalKod instructions) |

**Design direction:** warm and nostalgic (letter paper, stamps, postmarks) but modern; large type and high contrast for seniors; Polish copy from the App copy section.

**Later:**

- QR envelopes, real postal integration (e.g. Poczta Polska hybrid mail), OCR of handwriting, PalPoint staff panel, moderation tools, ID verification, partnerships with libraries and senior clubs.

**Open questions:**

- Decided: app messages are delayed a fixed 2 days for the MVP; revisit after.
- Decided: the app copy uses "Ty" for everyone.
- Decided: the pilot starts in Kraków; PalPoints and PalBoxes are seeded there first.
- Decided: minimum age is 18.

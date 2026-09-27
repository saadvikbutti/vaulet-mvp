# Vaulet — MVP

A collaborative shared wallet for trips and experiences: create a Vaulet, invite people, everyone
contributes, expenses are logged against the pool, the balance is always derived from the transaction
log (never hand-edited), plus a lightweight photo Memory Vault and a budget-constrained AI trip planner.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Prisma** + **SQLite** for local dev (zero setup — one datasource line to swap to Postgres later)
- **Custom auth**: bcrypt-hashed passwords + a signed JWT in an httpOnly cookie (no third-party auth
  service required)
- **AI Planner**: works out of the box with a deterministic, budget-safe mock. If you set
  `ANTHROPIC_API_KEY`, it calls the real Claude API instead and falls back to the mock if that call
  fails or somehow comes back over budget.

## Getting started

```bash
npm install
npx prisma generate
npx prisma db push      # creates prisma/dev.db with the schema
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/signup`. Create an account, then create your
first Vaulet from the dashboard.

To add a second member to a Vaulet for testing, sign up a second account (in an incognito window) with
a different email, then invite that email from the Vaulet's **Members** tab.

### Moving to Postgres later

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Put a real Postgres connection string in `DATABASE_URL` (e.g. from Neon, Railway, or Supabase).
3. Run `npx prisma migrate dev`.

No application code changes — every query goes through `src/lib/prisma.ts`.

### Enabling the real AI planner

Set `ANTHROPIC_API_KEY` in `.env`. Nothing else changes; `src/lib/planner.ts` picks it up automatically
and keeps the mock as a safety-net fallback.

## What's implemented (MVP scope)

- Sign up / log in / log out / profile
- Create a Vaulet (name, description, currency, optional target budget), invite members by email
- Wallet: add a contribution, add an expense (with category, merchant, optional note) — **balance is
  always `contributions − expenses`, computed at read time, never stored**
- Full chronological transaction feed, grouped by day
- Per-Vaulet dashboard: budget vs. spent vs. remaining, member count, spending by category, recent
  activity — plus a cross-Vaulet dashboard at `/dashboard`
- Memory Vault: upload a photo with caption/location, shown as a gallery
- AI Planner: destination/people/days/budget/interests in → a day-by-day itinerary, hotel suggestions,
  food suggestions, and a budget allocation breakdown out, with the budget enforced as a hard ceiling
- Authorization: every Vaulet-scoped API route checks the session user is actually a member before
  reading or writing anything (`src/lib/vaulet.ts`); the user id always comes from the session, never
  from the request body
- Validation: amounts must be positive, expenses can't push the balance negative, file uploads are
  type/size-checked

## Decisions made where the spec was ambiguous

- **Auth**: rolled a minimal JWT-cookie system instead of pulling in NextAuth, since the spec only
  asked for "a simple authentication system appropriate for the chosen stack" and this keeps the
  dependency footprint small.
- **Storage**: receipts/memory photos are saved to `public/uploads` on the server's filesystem rather
  than S3/Supabase Storage, since no cloud storage credentials were provided. `src/app/api/upload/route.ts`
  is the one place to swap in a real object-storage call later.
- **Invites**: "invite/add members" is implemented as add-by-email against an existing account (no
  email-sending). Inviting someone without an account returns a clear error asking them to sign up
  first, rather than building an email/invite-link flow, which felt like scope creep for an MVP.
- **Expense guard-rail**: added a rule not explicitly in the spec — an expense is rejected if it would
  push the Vaulet's balance below zero, since "prevent negative amounts" plus "balance = contributions
  − expenses" implied the balance itself shouldn't go negative either. This is easy to remove in
  `src/app/api/vaulets/[id]/transactions/route.ts` if you'd rather allow overdrawing.
- **Category chart**: implemented as simple horizontal bars (no charting library) to keep the bundle
  light, per "include a simple spending visualization if it can be implemented cleanly."
- **Roles**: `owner`/`member` are stored per the data model, but for this MVP any member can add another
  member (simplest invite flow). Owner-only actions can be layered in later using the existing
  `ensureOwner()` helper in `src/lib/vaulet.ts`, which isn't called from anywhere yet.

## A note on this environment

I wasn't able to run `npx prisma generate` in this sandbox (its engine binaries are fetched from a
domain not reachable here), so I couldn't do a full `npm run build` end-to-end. I did run `tsc --noEmit`
and confirmed the only errors are ones caused by the Prisma client not being generated yet (everything
touching a Prisma query shows as untyped) — no other type errors surfaced. Run the "Getting started"
steps above locally and it should build cleanly; if anything doesn't, it's most likely worth a second
pass on my part rather than a fundamental design issue.

## Extension points already in place for later phases

- `src/lib/planner.ts` — swap the mock for a real travel API + AI provider
- `src/app/api/upload/route.ts` — swap local disk writes for S3/Supabase Storage
- `src/lib/vaulet.ts` — `ensureOwner()` is ready for owner-only actions (e.g. deleting a Vaulet)
- Prisma `provider` — swap SQLite for Postgres with no code changes

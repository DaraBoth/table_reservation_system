# Project Context (read this before re-exploring the repo)

Lean on this file for orientation. Only re-Read/Grep the actual source when
you need the specifics of the file you're about to change — don't re-derive
this summary from scratch every cycle.

## Stack

- Next.js 16 (App Router), React 19.2.4, TypeScript 5, Tailwind CSS v4
- Supabase (Postgres + Auth) — `@supabase/ssr`, `@supabase/supabase-js`
- Package manager: **pnpm** (`pnpm-lock.yaml` is authoritative — `package-lock.json`
  also exists in the repo but is stale; do not update it)
- i18n: `i18next` / `react-i18next`, 5 locales (`en`, `km`, `zh`, `vi`, `ko`)
- UI: shadcn-style primitives (`src/components/ui/`, built on `@base-ui/react`),
  MUI (`@mui/material`, `@mui/x-charts`, `@mui/x-date-pickers`), `framer-motion`
- PWA: `@ducanh2912/next-pwa`, service worker source in `worker/index.ts`

## Commands

- `pnpm dev` — dev server on port 3001
- `pnpm build` — production build
- `pnpm start` — start production server on port 3001
- `pnpm lint` — ESLint (flat config, `eslint.config.mjs`)
- `pnpm i18n:audit` — fails if hardcoded UI literals are found in `src/app`/`src/components`
  (`scripts/check-i18n-literals.mjs`)
- **No test runner is configured.** Do not invent one. Lint + `i18n:audit` +
  a successful `pnpm build` are the correctness gates available in this repo.

## Architecture (see root `CLAUDE.md` for full detail)

- Multi-tenant SaaS: tenant membership via `account_memberships`
  (`superadmin`|`admin`|`staff`). Active tenant resolved by
  `getActiveRestaurant()` (`src/app/actions/restaurant-context.ts`).
- `src/proxy.ts` replaces `middleware.ts` in this Next.js version — never
  recreate `middleware.ts`.
- One codebase serves 3 business types (restaurant/hotel/guesthouse) via
  `getTerms(businessType)` in `src/lib/business-type.ts` — never hardcode
  "Table"/"Booking" text in new UI.
- Server Actions (`'use server'`, `src/app/actions/*.ts`) are the primary
  mutation path; validate with `zod`; use `createClient()` (RLS-scoped) by
  default, `createAdminClient()` (service role) only when cross-tenant access
  is required.
- All new user-facing strings go in `src/i18n/resources.ts` for every locale —
  the `i18n:audit` script enforces this and will fail CI/build otherwise.
- Migrations are additive, chronological files under `supabase/migrations/` —
  never edit an existing migration file.
- Wall-clock time extraction: never `new Date(isoString)` on reservation
  start/end times (Node shifts to UTC) — follow `extractWallClockTime` in
  `src/app/actions/reservations.ts`.

## Git / deploy

- Default branch: `main`. No git hooks (no husky), no PR template configured.
- Commit style: prefer proper Conventional Commits (`feat:`, `fix:`, `chore:`)
  even though repo history has some inconsistent messages — don't imitate the
  noisy ones.
- **Deploy is Vercel, git-push-to-deploy** — pushing to `main` triggers
  deployment automatically. `code-reviewer` is the sole exception to the
  push/deploy hard stop: on PASS it pushes to `main` itself, fully
  autonomously, no human checkpoint (an explicit, deliberate decision by
  the project owner). `coder`, `qa-agent`, and `advisor` never push or
  deploy under any circumstance (see HARD STOPS in `workflow.md`).
- Dev and prod share the **same Supabase schema** — there's no separate
  prod database to protect. Migrations are still additive-only (new file
  under `supabase/migrations/`, never edit an existing one) — that's about
  traceable history, not a safety boundary here.

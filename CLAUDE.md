# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server on port 3001
- `npm run build` — production build
- `npm run start` — start production server on port 3001
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `npm run i18n:audit` — scans `src/app` and `src/components` for hardcoded UI text (JSX text nodes / placeholders) that should be routed through i18n instead; fails the build if any is found (see `scripts/check-i18n-literals.mjs`)

No test runner is configured in this repo.

## Architecture

Next.js 16 (App Router) multi-tenant SaaS for booking management, backed by Supabase (Postgres + Auth). One codebase serves three business types — restaurant, hotel, guesthouse — via terminology swapping rather than separate code paths.

### Multi-tenancy model

- A user's tenant memberships live in `account_memberships` (role: `superadmin` | `admin` | `staff`, plus `is_active`, `is_special_admin`, `special_features`).
- The active tenant is resolved by `getActiveRestaurant()` in `src/app/actions/restaurant-context.ts` (also mirrored in `src/lib/restaurant-context.ts`): route param (`[restaurantId]`, which can be a real UUID or a slug) takes priority, falling back to the `active_restaurant_id` cookie, falling back to the user's first membership.
- `src/proxy.ts` is this Next.js version's replacement for `middleware.ts` ("Proxy Convention" — do not recreate `middleware.ts`). It refreshes the Supabase session, gates `/superadmin` vs `/dashboard` by role, and enforces `restaurants.is_active` / `subscription_expires_at` on every request.
- Route groups: `(auth)` for `/login` and `/register-superadmin`, `/dashboard/[restaurantId]/...` for tenant-scoped pages, `/superadmin/...` for cross-tenant admin.

### Business-type terminology

`src/lib/business-type.ts` exports `getTerms(businessType)`, returning a `BusinessTerms` object (unit/units labels, booking verbs, check-in vs. check-out, capacity units, icon, etc.) driven by `restaurants.business_type` (`restaurant` | `hotel` | `guesthouse`). UI components consume these terms instead of hardcoding "Table"/"Booking" text so the same screens read correctly for any tenant type.

### Data access pattern

- Server Actions (`'use server'`, in `src/app/actions/*.ts`) are the primary mutation path — e.g. `reservations.ts`, `restaurants.ts`, `tables.ts`, `customers.ts`, `memberships.ts`, `notifications.ts`, `auth.ts`, `booking-intelligence.ts`. They validate input with `zod`, use `createClient()` (RLS-scoped, `src/lib/supabase/server.ts`) for normal reads/writes and `createAdminClient()` (`src/lib/supabase/admin.ts`, service role, bypasses RLS) only where cross-tenant or privileged access is required.
- A few `route.ts` handlers exist under `src/app/api/` for things Server Actions can't do cleanly: push subscribe/unsubscribe/send, and reading the active-restaurant cookie.
- `src/lib/types/database.ts` holds the generated Supabase `Database` type; use it for typed table row/insert/update shapes rather than hand-rolled interfaces.
- Core tables: `restaurants`, `profiles`, `account_memberships`, `physical_tables`, `zones`, `reservations`, `common_customers`, `push_subscriptions`. Migrations live in `supabase/migrations/` — chronological, additive (e.g. `add_zones`, `staff_manage_zones_and_tables`, `push_device_tokens`); add new schema changes as new migration files, don't edit old ones.
- When working with reservation start/end times, don't use `new Date(isoString)` for wall-clock extraction — Node shifts to UTC. Follow the pattern in `src/app/actions/reservations.ts` (`extractWallClockTime`) that regex-extracts `HH:mm` directly from the ISO-like string.

### i18n

- 5 supported locales: `en`, `km`, `zh`, `vi`, `ko` (`src/i18n/settings.ts`). Default is `en`.
- All translation strings live centrally in `src/i18n/resources.ts` (nested by feature: `common`, `nav`, `dashboard`, etc.), not in per-component files.
- `src/i18n/client.ts` / `server.ts` wire up `i18next`/`react-i18next` for client vs. server contexts respectively; `src/components/providers/i18n-provider.tsx` provides it to the tree.
- New user-facing strings must go into `resources.ts` for every locale key and be referenced via `t(...)` — the `i18n:audit` script enforces no hardcoded literal text/placeholders in `src/app` and `src/components`.

### PWA / push notifications

- `worker/index.ts` is the service worker source (push receive + notification click deep-linking); `public/sw.js` / `public/manifest.webmanifest` are the built PWA assets (`@ducanh2912/next-pwa`).
- Push flow: `src/lib/push-client.ts` (subscribe in browser) → `src/app/api/push/subscribe|unsubscribe/route.ts` (persist to `push_subscriptions`) → `src/app/api/push/send/route.ts` / `src/app/actions/notifications.ts` (send via `web-push`).

### UI stack

- Tailwind CSS v4 + shadcn-style primitives in `src/components/ui/` (built on `@base-ui/react`, `class-variance-authority`, `clsx`/`tailwind-merge`), MUI (`@mui/material`, `@mui/x-charts`, `@mui/x-date-pickers`) for charts/date pickers, `framer-motion` for animation.
- Feature components are organized by domain under `src/components/`: `dashboard/`, `restaurant/`, `hotel/`, `layout/`, `account/`, `auth/`, `providers/`.

## Multi-Agent Workflow

This repo runs a 4-agent ORBIT-driven workflow (`coder` → `code-reviewer`,
plus `qa-agent` and `advisor`) coordinated through the DailyGoalMap ORBIT
task API. `coder` is the only agent that edits source; the others are
read-only gates/producers. Full detail lives under `.claude/`:

- `.claude/docs/project-context.md` — repo facts agents lean on instead of
  re-reading the codebase every cycle
- `.claude/docs/workflow.md` — the state machine, the per-agent loop,
  security/escalation rules, and hard stops. `code-reviewer` is the sole,
  explicit exception: on PASS it pushes to `main` itself, fully
  autonomously (Vercel git-push-to-deploy then deploys it, no human
  checkpoint) — a deliberate decision by the project owner, not a default.
  `coder`/`qa-agent`/`advisor` never push, deploy, rotate secrets, or
  force-run destructive git.
- `.claude/docs/orbit-api-notes.md` — the ORBIT task API's tool catalog and
  this project's tagging conventions
- `.claude/agents/{coder,code-reviewer,qa-agent,advisor}.md` — per-agent specs
- `.claude/skills/orbit-task-manager.md` — how to call the ORBIT API
- Entry points: `/implement <task-id>`, `/review-before-pr <task-id>`,
  `/qa-task [task-id]`, `/sync-agent-task <task-id>`

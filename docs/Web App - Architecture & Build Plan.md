# My Time Web App — Architecture & Build Plan

*Decision doc for the Kiro build team. Grounded in `API/openapi.json` (My-Time API 1.0.0). June 2026.*

## Recommendation in one paragraph

Build a **React 18 + TypeScript single-page app** with **Vite**, served as static files (S3 + CloudFront). Generate the API client directly from `openapi.json` so the spec stays the single source of truth. Use **TanStack Query** for all server data, **Tailwind + shadcn/ui** for a minimal, consistent interface, and ship in five phases where **Phase 1 (the timer) is the product** — everything else supports it. Online-only first; the data layer is structured so offline sync (`POST /sync`) can be added in Phase 5 without rework.

## Core decisions

| Decision | Choice | Why |
|---|---|---|
| Rendering model | SPA, no SSR (no Next.js) | Authenticated app behind login — zero SEO need. SPA is simpler, cheapest to host, and the fewest moving parts for Kiro to generate against. Marketing/landing pages live elsewhere. |
| Framework | React 18 + TypeScript (strict) | Team's strongest stack; best ecosystem; best supported by AI coding tools. |
| Build tool | Vite | Fast, zero-config, the default for React SPAs. |
| Routing | React Router v7 (library mode) | Boring and well-known; file-based conventions add nothing here. |
| Server state | TanStack Query | Caching, optimistic updates, request dedup for free. Critically: `persistQueryClient` + a mutation queue is the future offline path — no re-architecture in Phase 5. |
| Client state | Zustand (one small store) | Only the running-timer ticker and UI state (modals, selected date). Everything else is server state. No Redux. |
| API client | Generated: `openapi-typescript` + `openapi-fetch` | Types regenerate when the API changes; compile errors instead of runtime drift. Fits Kiro's spec-driven workflow. |
| UI | Tailwind CSS + shadcn/ui | Minimal aesthetic by default, accessible primitives, fully ownable code (no component-library lock-in). Define tokens (spacing, type scale, the tag color palette) once in Phase 0. |
| Forms/validation | react-hook-form + zod | Standard, light. |
| Testing | Vitest + React Testing Library; Playwright smoke tests for timer + auth flows only | Test the money paths, not everything — this is a viability test, not a fortress. |
| Hosting | S3 + CloudFront (or Amplify Hosting) | Static files, ~$0/month, same AWS account as the API; Kiro/AWS-native. |

## Two product rules the code must respect

1. **The timer is sacred.** Elapsed time is always *derived* (`now − startTime` from the server's `EntryResponse.startTime`), never accumulated by a client-side tick. Survives refresh, tab sleep, clock drift. On app load, `GET /timer/current` rehydrates the running timer. Handle the 409 on `POST /timer/start` (timer already running) as a first-class UI state, not an error toast.
2. **Minimal means one primary action per screen.** The tracker screen has exactly one job: pick an activity, start/stop. Management screens are flat CRUD tables — no dashboards inside settings, no nested wizards. If a screen needs explanation, it's wrong.

## Auth handling

Token triple (`idToken`, `accessToken`, `refreshToken`) from `/auth/login` — Cognito-shaped. Keep tokens in memory + `refreshToken` in storage; a fetch wrapper auto-refreshes via `/auth/refresh` on 401 and retries once. Full flow needed in Phase 0: register → confirm code → login → forgot/reset password.

## Phases

Each phase is one Kiro spec, independently shippable, demo-able at the end. **Phases 0–3 are the beta MVP** — that's what goes in front of test users.

### Phase 0 — Foundation (no user-visible features)
Scaffold, CI, generated API client, design tokens + app shell (nav, layout, empty states), complete auth flow, token refresh, route guards.
*Done when:* a user can register, confirm, log in, log out, and see an empty shell. Deploy pipeline works.

### Phase 1 — Track (the product)
Tracker screen: assigned activities (`GET /projects` + activities), start/stop timer, running-timer rehydration, today/this-week entry list (`GET /entries`), manual entry add/edit/delete, notes on entries.
*Done when:* a solo user can live their whole day in the app. **This phase gets the most design attention — adoption lives or dies here.**

### Phase 2 — Manage
Projects CRUD (client name, billable flag, dates, archive), activities per project, tags with rates/colors, budgets per project/tag, user-to-activity assignments.
*Done when:* an admin can set up a real agency's structure in under 10 minutes.

### Phase 3 — Team & account
Member invite/edit/remove with roles, cost rates, capacity; account settings (name, currency); my-profile. Role-based UI (a plain User never sees management screens).
*Done when:* a 5-person team can onboard and track concurrently.

### Phase 4 — Insight
Dashboard: hours today/this week, billable vs non-billable split, budget-vs-actual per project, simple per-user utilization. CSV export. Computed client-side from `/entries` for now (see API gaps).
*Done when:* a manager can answer "are we over budget?" without a spreadsheet.

### Phase 5 — Offline & multi-device polish
PWA install, persisted query cache, mutation queue draining into `POST /sync`, conflict surfacing from `rejected[]`, timer continuity across devices.
*Decision point:* only build this if beta feedback demands it. Don't pre-build.

## API gaps (minor — spec reviewed June 2026)

Request-body schemas are now fully documented (typed `*Request` models on every POST/PUT except `/timer/stop`, which correctly takes no body), and `GET /entries` supports `from`/`to`/`projectId`/`tagId`/`userId` filters. The contract is solid enough to generate the client and start Phase 0. Remaining nits, none blocking:

1. **No pagination on list endpoints** — `GET /entries` returns a bare array. Date-range filters cap volume for beta; add `limit`/`cursor` (and a `{ items, nextCursor }` envelope) before Phase 4 reporting on real data.
2. **`SyncRequest.operations` items are untyped** (`items: {}`). Define the operation schema when Phase 5 is greenlit — not before.
3. **Timestamps are plain strings** without `format: date-time`, so generated types are `string` rather than validated dates. Cosmetic; frontend will parse with a single date util regardless.
4. **No aggregate/report endpoints.** Client-side aggregation is acceptable for beta scale; plan server-side reports post-validation.

## How the Kiro team should work

Treat `openapi.json` as the contract — regenerate types on every API change, never hand-write API types. Put the design tokens, route map, and the two product rules above into Kiro steering files before Phase 0 so every generated screen inherits them. One spec per phase; each phase's "done when" line is its acceptance test.

---
inclusion: always
description: "Project conventions and standards"
---

# Project Conventions

## Tech Stack
- React 18 + TypeScript (strict)
- Vite 8 (SPA, no SSR)
- Tailwind CSS 4 + shadcn/ui
- React Router v7 (library mode)
- TanStack Query (all server state)
- Zustand (UI-only state: running timer ticker, modals, selected date)
- react-hook-form + Zod (forms/validation)
- openapi-typescript + openapi-fetch (generated API client from docs/openapi.json)
- Vitest + React Testing Library (unit/integration)
- Playwright (smoke tests: auth + timer flows only)

## Path Alias
`@/*` → `./src/*`

## Code Standards
- TypeScript strict mode, no `any`
- Functional components only, hooks for logic
- Server state in TanStack Query, never local state
- Timer elapsed = `now - startTime` (derived, never accumulated)
- One primary action per screen
- No premature abstractions — extract only on second use

## Naming
- Files: kebab-case
- Components: PascalCase
- Functions/hooks: camelCase
- Constants: UPPER_SNAKE_CASE
- API types: generated from schema, never hand-written

## Project Structure
```
src/
  api/          — generated client + schema types
  components/
    ui/         — shadcn primitives
    auth/       — auth-specific components
    layout/     — shell, sidebar, topbar
  hooks/        — custom hooks
  lib/          — utilities (auth, query-client, utils)
  pages/
    auth/       — login, register, confirm, forgot/reset
    app/        — authenticated app pages
  routes.tsx    — route definitions
  app.tsx       — providers + router
  main.tsx      — entry point
```

## Key Rules (from architecture doc)
1. Timer is sacred — elapsed derived from server startTime, never client tick
2. Minimal screens — one primary action per screen, no nested wizards
3. Token refresh — memory tokens + stored refreshToken, auto-refresh on 401
4. API client generated — run `npm run api:generate` when openapi.json changes
5. Roles — 3 hierarchical: user → manager → admin. No "owner" role. Admin = highest.
6. Currency — single per account (AccountResponse.currency). rateCurrency on tags/entries is denormalized, not independent.
7. API date format — no milliseconds in ISO timestamps. Use `YYYY-MM-DDTHH:mm:ssZ`. Strip with `.replace(/\.\d{3}Z$/, "Z")`, never raw `toISOString()` (includes `.SSS`).
8. API error contract — deployed API: 400 `{ type, message, fields? }` (invalid_json, missing_fields, invalid_format). Local dev: FastAPI 422 `{ detail: [...] }`. Code + test against the 400 envelope. Local `GET /me` no-token → 200 (dev user), so the unauthenticated-redirect path can't be exercised locally. `POST /onboarding/example-project` idempotent (409 on second call = success).
9. Auth email — unique per identity, lowercased server-side across all auth calls (register/confirm/login/forgot/reset), so casing never matters. `POST /auth/register` AND `POST /auth/confirm` return `409 { type: "email_exists", message }` on duplicate (case-insensitive). Register/confirm pages surface the server `message` via `extractErrorMessage` (no per-`type` branching). Both 409s in openapi.json.
10. Invited users — invited email register+confirm joins ONLY the invited account (invited role); no auto personal account. Fresh non-invited sign-ups get their own account. `GET /me` for an invitee lists only the invited membership. "Create your own workspace" for invitees is NOT automatic — deliberate frontend flow to build if wanted.

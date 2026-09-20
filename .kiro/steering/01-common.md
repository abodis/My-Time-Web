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
5. Roles — API has 3 roles: user → manager → admin (hierarchical). No "owner" role exists. Admin is the highest privilege level.
6. Currency — single currency per account (AccountResponse.currency). rateCurrency on tags/entries is denormalized, not independent.
7. API date format — API rejects milliseconds in ISO timestamps. Use `YYYY-MM-DDTHH:mm:ssZ` format, never raw `toISOString()` (which includes `.SSS`). Strip with `.replace(/\.\d{3}Z$/, "Z")`.
8. API error contract — deployed API returns 400 `{ type, message, fields? }` (types: invalid_json, missing_fields, invalid_format). Local dev returns FastAPI 422 `{ detail: [...] }`. Code + test error handling against the 400 envelope. Local `GET /me` with no token returns 200 (dev user), not 401 — the unauthenticated-redirect path can't be exercised locally. `POST /onboarding/example-project` is idempotent (409 on second call, treated as success).
9. Auth email rules — email is unique per identity and normalized to lowercase server-side across all auth calls (register/confirm/login/forgot/reset), so casing never matters. `POST /auth/register` AND `POST /auth/confirm` return `409 { type: "email_exists", message: ... }` for a duplicate email (case-insensitive). The register/confirm pages surface the server `message` via `extractErrorMessage` (no per-`type` branching needed — the message is user-appropriate). Both 409s are documented in openapi.json.
10. Invited users — when an invited email registers+confirms, the user joins ONLY the invited account (with the invited role); no auto-created personal "owner" account. Fresh non-invited sign-ups still get their own account. `GET /me` for an invited user lists only the invited membership. A "create your own workspace" action for invited users is NOT automatic — it's a deliberate frontend flow to build if wanted.

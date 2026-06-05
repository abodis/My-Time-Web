# Phase 0 — Foundation Brainstorm

## What We're Building
Vite + React 18 + TypeScript scaffold with generated API client, design system tokens, app shell (layout + nav + empty states), complete auth flow (register → confirm → login → refresh → forgot/reset password), route guards, and deploy-ready static build.

## Key Decisions Made

- **API base URL strategy**: Environment variable via Vite (`VITE_API_BASE_URL` in `.env` files) (🟢 85%) — standard Vite pattern, no runtime cost, rebuild per environment is fine for S3+CF hosting.
- **Routing structure**: Flat route config in one `routes.tsx` file with lazy-loaded pages (🟢 80%) — easy to scan, no magic, 8-10 routes total in MVP don't warrant directory conventions.
- **Token storage**: `refreshToken` in localStorage, `idToken`/`accessToken` in memory (🟢 75%) — matches the API contract (JSON body responses), XSS mitigated by CSP and no innerHTML.
- **State management**: Zustand for UI-only state (running timer ticker, modals, selected date). Auth tokens in module closure + localStorage. Everything else is TanStack Query server state.
- **Design system**: Tailwind CSS + shadcn/ui. Light theme only for Phase 0. Tokens defined once in `tailwind.config.ts`.
- **Testing**: Vitest + RTL for unit; Playwright for smoke (login flow). Test money paths, not everything.
- **Deploy**: Manual `aws s3 sync` + CloudFront invalidation. CI/CD deferred to later.

## Environment Configuration

| Environment | API Base URL |
|---|---|
| Local dev | `http://localhost:8000` |
| AWS (deployed) | `https://ioxrzx7f9h.execute-api.eu-south-2.amazonaws.com` |

## Brand Assets

Logos available in `/Logos` directory:
- `favicon.ico` — browser tab icon
- `myTimeBlocks-LOGO-50px.png` — sidebar/nav logo
- `myTimeBlocks-LOGO-white-200px-top-bottom-padding.png` — auth pages (dark bg variant)
- `My Time Blocks-LOGO-300x300.png` — PWA/manifest icon (Phase 5)
- `MTB-App-Icon-1024.png` — high-res app icon (Phase 5)

## Constraints Discovered

- No mock API layer — generated types provide compile-time safety; testing against real backend.
- No dark mode in Phase 0 — tokens can support it but UI is light-only for beta.
- No SSR/Next.js — authenticated app with zero SEO needs. SPA is simplest.
- The API returns all three tokens (idToken, accessToken, refreshToken) in the login response body — no cookie-based auth.
- `/auth/refresh` accepts `{ refreshToken }` and returns `{ idToken, accessToken }`.

## Integration Points

- **openapi.json** → `openapi-typescript` generates `src/api/schema.d.ts` → `openapi-fetch` client uses those types.
- **Auth interceptor**: fetch wrapper attaches `Authorization: Bearer <accessToken>`, intercepts 401 → calls `/auth/refresh` → retries original request once.
- **Route guards**: check auth state before rendering protected routes; redirect to `/login` if no valid token.
- **TanStack Query**: single `QueryClient` instance, provided at app root. All API calls go through query hooks wrapping the generated client.

## Project Structure

```
src/
├── api/
│   ├── client.ts          # openapi-fetch instance + auth interceptor
│   └── schema.d.ts        # generated from openapi.json
├── lib/
│   ├── auth.ts            # token store, refresh logic
│   └── query-client.ts    # TanStack Query instance
├── hooks/
│   └── use-auth.ts        # login/logout/register mutations
├── pages/
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── confirm.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   └── app/
│       └── dashboard.tsx  # empty state placeholder
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   └── ui/               # shadcn components
├── routes.tsx             # route definitions + guards
├── main.tsx
└── index.css              # tailwind directives + tokens
```

## Implementation Sequence

| # | Step | Verify |
|---|------|--------|
| 1 | Vite scaffold + deps (react-router, tanstack-query, zustand, tailwind, react-hook-form, zod, openapi-typescript, openapi-fetch) | `npm run dev` compiles clean |
| 2 | Tailwind + shadcn/ui init, design tokens in `tailwind.config.ts` | Shell renders with correct font/spacing |
| 3 | Generate API client from `docs/openapi.json` | Types exist, imports compile |
| 4 | Auth module: token store + fetch wrapper with 401 → refresh → retry | Unit: refresh retry returns new token |
| 5 | Auth pages: Register, Confirm, Login, Forgot Password, Reset Password (zod validation, wired to API client) | Full flow works against real API |
| 6 | Route config + guards: public vs protected routes | Unauthenticated → `/login` redirect |
| 7 | App shell: sidebar nav, top bar (user + logout), main content area with empty state | Logged-in user sees shell |
| 8 | Vitest + RTL + Playwright setup | `npm test` passes |
| 9 | Build config: `vite build` produces static dist | `npm run build` exits 0, dist/ < 1MB |

## Open Questions (Resolved)

- ~~API base URL~~ → localhost:8000 (dev), AWS execute-api (prod)
- ~~Deploy pipeline~~ → manual for now
- ~~Brand assets~~ → available in `/Logos`

## Next Steps

1. Create Kiro spec with requirements, design, and tasks for Phase 0.
2. Execute tasks sequentially — scaffold through deployed shell.

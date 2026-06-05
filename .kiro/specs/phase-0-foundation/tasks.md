# Implementation Plan

## Overview
Phase 0 foundation scaffold for My Time Blocks web app: Vite + React 18 + TypeScript project with generated API client, design system, auth flow, route guards, and app shell.

## References
- #[[file:.kiro/specs/phase-0-foundation/requirements.md]]
- #[[file:.kiro/specs/phase-0-foundation/design.md]]
- #[[file:docs/openapi.json]]

## Tasks

- [x] 1. Create Vite project with React 18 + TypeScript + SWC template, install production deps (react-router-dom, @tanstack/react-query, zustand, openapi-fetch, react-hook-form, @hookform/resolvers, zod) and dev deps (tailwindcss, postcss, autoprefixer, openapi-typescript, vitest, @testing-library/react, @testing-library/jest-dom, jsdom, playwright, eslint, prettier), enable TypeScript strict mode, create `.env.development` with `VITE_API_BASE_URL=http://localhost:8000`, create `.env.production` with `VITE_API_BASE_URL=https://ioxrzx7f9h.execute-api.eu-south-2.amazonaws.com`, add `api:generate` script to package.json. Verify: `npm run dev` starts clean, `npm run build` produces `dist/`.
  - **Requirement:** #1 (Project Scaffold & Tooling)
  - **Dependencies:** None
- [x] 2. Initialize Tailwind CSS (`tailwind.config.ts`, `postcss.config.js`, directives in `index.css`), define design tokens (brand colors, surface colors, text colors, font family Inter), initialize shadcn/ui (CLI, `components.json`, path aliases), add base shadcn components (Button, Input, Card, Form, Label, Separator), copy `favicon.ico` and `myTimeBlocks-LOGO-50px.png` to `public/`. Verify: app renders with correct font and brand colors.
  - **Requirement:** #2 (Design System & Tokens)
  - **Dependencies:** 1
- [x] 3. Run `openapi-typescript docs/openapi.json -o src/api/schema.d.ts`, create `src/api/client.ts` with `openapi-fetch` instance configured with `VITE_API_BASE_URL`, add auth middleware (token attachment + 401 refresh + retry). Verify: types import cleanly, TypeScript compiles without errors.
  - **Requirement:** #3 (Generated API Client)
  - **Dependencies:** 2
- [x] 4. Create `src/lib/auth.ts` with token store (accessToken/idToken in memory, refreshToken in localStorage), implement `setTokens`, `getAccessToken`, `clearAuth`, `hasStoredSession`, implement `refreshAccessToken` that calls `/auth/refresh` directly (bypasses interceptor). Verify: unit test with mock fetch asserts refresh stores new tokens.
  - **Requirement:** #4 (Authentication Module)
  - **Dependencies:** 3
- [x] 5. Create `src/components/auth/auth-layout.tsx` (centered card with logo), create auth pages (`src/pages/auth/login.tsx`, `register.tsx`, `confirm.tsx`, `forgot-password.tsx`, `reset-password.tsx`) with react-hook-form + zod validation wired to API client, create `src/hooks/use-auth.ts` with TanStack mutations wrapping each auth endpoint. All pages display API error messages below the form. Verify: manual test of full auth flow against local API.
  - **Requirement:** #5 (Auth Pages UI)
  - **Dependencies:** 4
- [x] 6. Create `src/routes.tsx` with route definitions (public + protected), implement `<ProtectedRoute>` (checks session, attempts silent refresh, shows loader, redirects to `/login` if invalid), implement `<PublicOnlyRoute>` (redirects authenticated users to `/`), create `src/app.tsx` wrapping app in `QueryClientProvider` + `RouterProvider`, update `src/main.tsx` to render `<App />`. Verify: unauthenticated → `/login` redirect; authenticated → skip auth pages.
  - **Requirement:** #6 (Routing & Guards)
  - **Dependencies:** 5
- [x] 7. Create `src/components/layout/sidebar.tsx` (logo, nav links: Timer, Projects, Team, Reports — all disabled, collapse on mobile), create `src/components/layout/topbar.tsx` (user email from `GET /account/me`, logout button), create `src/components/layout/app-shell.tsx` (sidebar + topbar + Outlet), create `src/hooks/use-profile.ts` (TanStack query for `GET /account/me`), create `src/pages/app/dashboard.tsx` (empty state: "Welcome to My Time Blocks"). Verify: logged-in user sees shell with sidebar, topbar, empty dashboard.
  - **Requirement:** #7 (App Shell)
  - **Dependencies:** 6
- [x] 8. Configure Vitest (jsdom environment), write auth module unit test (refresh logic with mock fetch), configure Playwright (`playwright.config.ts` with base URL), write Playwright smoke test (login → assert app shell visible). Verify: `npm test` passes, `npm run build` exits 0, `dist/` is self-contained SPA.
  - **Requirement:** #8 (Testing & Build)
  - **Dependencies:** 7

---
inclusion: fileMatch
fileMatchPattern: "**/*.test.*,**/*.spec.*,e2e/**"
description: "Testing conventions"
---

# Testing Conventions

## Unit/Integration (Vitest + RTL)
- Test money paths, not everything. This is a viability test.
- Co-locate tests: `src/lib/__tests__/auth.test.ts` pattern.
- Use `vitest --run` (no watch mode in CI or scripts).
- Mock API calls at the fetch level, not component level.
- Test behavior, not implementation. Query by role/label, not test-id.

## E2E (Playwright)
- Smoke tests only: auth flow + timer flow.
- Located in `e2e/` directory.
- Run against local dev server or preview build.
- Keep thin — if unit tests cover it, don't duplicate in e2e.

## What to Test
- Auth: login, register, token refresh, logout, route guards
- Timer: start, stop, rehydrate running timer, 409 handling
- Critical mutations: entry create/edit/delete

## What NOT to Test
- Static UI rendering without logic
- shadcn/ui primitives (already tested upstream)
- Trivial utility functions

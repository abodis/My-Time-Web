# My Time Web

Web client for My Time Blocks — a time-tracking app built around a running timer, activities, and reporting. See [docs/My Time Blocks - Application Summary.md](docs/My%20Time%20Blocks%20-%20Application%20Summary.md) for product context.

## Tech Stack

- React 18 + TypeScript (strict)
- Vite 8 (SPA)
- Tailwind CSS 4 + shadcn/ui
- React Router v7, TanStack Query, Zustand
- react-hook-form + Zod
- openapi-typescript + openapi-fetch (generated API client)
- Vitest + React Testing Library, Playwright

## Prerequisites

- Node 22 (pinned via `.nvmrc`)

```bash
nvm use
```

If Node 22 is not installed: `nvm install`.

## Getting Started

```bash
nvm use
npm install
cp .env.example .env.development   # set VITE_API_BASE_URL
npm run dev
```

The dev server proxies `/api` to the backend defined by `VITE_API_BASE_URL`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run unit tests (Vitest) |
| `npm run lint` | Lint with ESLint |
| `npm run api:generate` | Regenerate API types from `docs/openapi.json` |

## Project Structure

```
src/
  api/          generated client + schema types
  components/   ui/ (shadcn), auth/, layout/
  hooks/        custom hooks
  lib/          utilities (auth, query-client, utils)
  pages/        auth/, app/
  routes.tsx    route definitions
  app.tsx       providers + router
  main.tsx      entry point
```

## API Client

The API client types are generated from `docs/openapi.json` (the contract source of truth). After the spec changes, regenerate:

```bash
npm run api:generate
```

Never hand-edit `src/api/schema.d.ts`.

## Testing

- Unit / integration: `npm run test` (Vitest + React Testing Library)
- E2E smoke tests: Playwright (`e2e/`), covering auth and timer flows

## Deployment

Deployed as a static SPA to AWS (S3 + CloudFront). Full deploy:

```bash
./deploy.sh prod
```

This builds the app, deploys the CDK stacks in `infra/`, syncs to S3, and invalidates the CloudFront cache.

## Documentation

- [Architecture & Build Plan](docs/Web%20App%20-%20Architecture%20%26%20Build%20Plan.md)
- [Application Summary](docs/My%20Time%20Blocks%20-%20Application%20Summary.md)
- [Roadmap](docs/roadmap.md)

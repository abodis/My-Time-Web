---
inclusion: always
description: "Project-specific configuration"
---

# Project Config

## Cloud
- Profile: mcp
- Region: eu-south-2
- Hosting: S3 + CloudFront (static SPA)
- Naming: my-time-web-[resource]-[env]

## Build
- Dev: `npm run dev`
- Build: `npm run build` (tsc + vite build)
- Test: `npm run test` (vitest --run)
- Lint: `npm run lint`
- API types: `npm run api:generate`

## Environments
- Development: `.env.development` (local Vite dev server)
- Production: `.env.production` (deployed build)

# Task Dispatch Rules

## Bash Commands in Sub-Agents
When dispatching tasks to sub-agents, always include this instruction:

"CRITICAL BASH RULE: When running bash commands, ALWAYS use the `cwd` parameter set to `/Users/abodis/Projects/My-Time-Web`. Do NOT use `cd /path && command` — command chaining (&&, ||, ;) is NOT supported by the bash tool. Use the `cwd` parameter for working directory."

This prevents sub-agents from using unsupported command chaining syntax.

## New API Endpoints
When a task references API endpoints not yet in `src/api/schema.d.ts`, run `npm run api:generate` BEFORE dispatching implementation sub-agents. The openapi-fetch client requires generated types — calling untyped paths causes TS2554 errors.

## Post-Task QA Hooks
When a post-task hook requests E2E tests + visual UX review:
1. Run `npx playwright install` before `npx playwright test` (browsers may be outdated)
2. Start dev server and use Playwright MCP for visual verification — never skip with "code review only"
3. Dev server may run on 5174/5175 if 5173 is taken — check process output for actual port

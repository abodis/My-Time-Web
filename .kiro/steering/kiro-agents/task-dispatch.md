# Task Dispatch Rules

## Bash Commands in Sub-Agents
When dispatching tasks to sub-agents, always include this instruction:

"CRITICAL BASH RULE: When running bash commands, ALWAYS use the `cwd` parameter set to `/Users/abodis/Projects/My-Time-Web`. Do NOT use `cd /path && command` — command chaining (&&, ||, ;) is NOT supported by the bash tool. Do NOT use pipes (|) — they trigger separate approval prompts in the IDE. If you need to limit output, use the `timeout` parameter or read only the relevant portion of output. Use the `cwd` parameter for working directory."

This prevents sub-agents from using unsupported command chaining syntax.

## New API Endpoints
When a task references API endpoints not yet in `src/api/schema.d.ts`, run `npm run api:generate` BEFORE dispatching implementation sub-agents. The openapi-fetch client requires generated types — calling untyped paths causes TS2554 errors.

## Regenerated Schema: X-Account-Id Required Header
`npm run api:generate` types `X-Account-Id` as a REQUIRED header on all account-scoped routes. The header is injected at RUNTIME by client.ts middleware, so hooks must NOT pass it. Fix centrally: the `AccountHeaderOptional<paths>` mapped type in `src/api/client.ts` relaxes it — never add headers per-hook. If a schema regen breaks the build, check for this first (`tsc -b`, not bare `tsc --noEmit` — root tsconfig has `files: []` and checks nothing).

Also: openapi-typescript emits request-body fields that have a spec `default` as REQUIRED (non-optional) in the generated type — e.g. `assignCreator` (default false) becomes `assignCreator: boolean`, not `assignCreator?:`. So adding an "optional with default" field to a request schema is a BREAKING typecheck change: every existing caller must now pass it explicitly. After `npm run api:generate`, grep all callers of the affected create/update hook and add the field (choosing the semantically-correct value per call site), then `tsc -b`.

## Post-Task QA Hooks
When a post-task hook requests E2E tests + visual UX review:
1. Run `npx playwright install` before `npx playwright test` (browsers may be outdated)
2. Start dev server and use Playwright MCP for visual verification — never skip with "code review only"
3. Dev server may run on 5174/5175 if 5173 is taken — check process output for actual port

## Dev Server Launch — Hard Block In This Agent
Tested exhaustively: `npm run dev` is refused by a built-in execute_bash safeguard in EVERY form — plain, `&`, `nohup`, and run_in_background=true. The guard names two bypasses — `ignoreWarning: true` and the `control_bash_process` tool — but NEITHER is in this agent's tool schema, so the agent cannot self-unblock. Not a repo/hook fix: editing .kiro/hooks or steering does nothing. Fix is agent/IDE settings only (user-side): grant process-control tools or expose ignoreWarning via a custom agent config (kiro.dev/docs/custom-agents). Do NOT retry variants — conclude "capability gap, needs settings change" immediately and ask the user to run `npm run dev` + share the port, then drive Playwright against it. AWS MCP docs tools do NOT cover Kiro IDE tooling internals (wrong corpus); kiro.dev docs are client-rendered (empty to web_fetch) — use search snippets.

## Reporting Verification Honestly
When a subagent reports E2E/visual results, the orchestrator has NOT personally verified them. In summaries, say "the smoke subagent verified X (screenshots at …)" — never "I verified X" — unless you re-ran it or viewed the artifacts yourself. Re-run the build + unit tests directly after any subagent fix (those are cheap to confirm firsthand). Flag what a smoke does NOT cover (untested paths, env-specific branches) so the user knows the real coverage boundary.
When live verification uncovers a defect fixable in the frontend OR the backend/API contract (missing auto-assignment, error-envelope mismatch, etc.), STOP and present the fix-location choice with tradeoffs before editing — do not default to the frontend. If frontend code/comments already assume server-side behavior that doesn't exist, the contract is likely the right fix site.

## Local Auth for Live Testing (read before driving flows)
Full recipe + verified details are in `.kiro/steering/decisions.md` → "[2026-09-20] Local dev auth model" (manual-inclusion; open it before testing). Essentials:
- Backend must be running: `python3 local_server.py` (localhost:8000). If Vite `/api` returns 502, the backend is down — ask the user to start it. The agent cannot start `npm run dev` (see Dev Server Launch above) — ask the user for the port.
- The SPA uses real register/login (bearer token), NOT the backend's `X-User-Id` default-user override. To get a FRESH owner into the wizard: `localStorage.clear()` → reload → **Register** with a UNIQUE, VALID-FORMAT email (must have a TLD — `dev@localhost` FAILS `z.email()`; use `owner+<ts>@example.com`) + password ≥8 → **Confirm** (any code locally) → **Login**. An already-onboarded email routes to `/` not the wizard, so always register a new email per wizard run.
- A distinct second user (e.g. a non-owner invitee) = a separate register+login with its own email; there is no in-UI user switch.
- Data IS isolated per registered user. Assert via the APP's OWN network requests (bearer + `X-Account-Id`) and response bodies — NOT agent `fetch('/api/...')` probes, which have no headers and resolve to the default `dev@localhost` user (wrong account, misleading).

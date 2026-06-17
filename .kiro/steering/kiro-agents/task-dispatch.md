# Task Dispatch Rules

## Bash Commands in Sub-Agents
When dispatching tasks to sub-agents, always include this instruction:

"CRITICAL BASH RULE: When running bash commands, ALWAYS use the `cwd` parameter set to `/Users/abodis/Projects/My-Time-Web`. Do NOT use `cd /path && command` — command chaining (&&, ||, ;) is NOT supported by the bash tool. Use the `cwd` parameter for working directory."

This prevents sub-agents from using unsupported command chaining syntax.

## New API Endpoints
When a task references API endpoints not yet in `src/api/schema.d.ts`, run `npm run api:generate` BEFORE dispatching implementation sub-agents. The openapi-fetch client requires generated types — calling untyped paths causes TS2554 errors.

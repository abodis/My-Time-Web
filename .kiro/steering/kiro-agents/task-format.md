# Task File Format Rules

## tasks.md Parser Requirements
- Heading must be `# Implementation Plan` (NO trailing colon)
- Each task needs metadata lines indented with 2 spaces:
  - `- **Requirement:** #N`
  - `- **Dependencies:** N, M` or `- **Dependencies:** None`
- MUST include a `## Task Dependency Graph` section with a JSON code block containing wave definitions:
  ```json
  {
    "waves": [
      {"tasks": [1, 3, 5]},
      {"tasks": [2, 4]}
    ]
  }
  ```
- Each wave contains tasks that can run in parallel; waves execute sequentially
- The parser requires this section — omitting it causes a diagnostic error
- The parser also uses `**Dependencies:**` lines on each task for ordering
- A `.meta.json` file is auto-created by the system; you don't need to create it manually

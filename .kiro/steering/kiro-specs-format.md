---
inclusion: manual
---
# Kiro Spec Format Reference

## Design Doc
- Required section: `## Components and Interfaces`
- Required section: `## Correctness Properties` with `### Property N:` subheadings
  - Each property needs: `**Validates: Requirements X.Y**`
- Recommended: `## Testing Strategy`

## Tasks Doc
- Title: `# Implementation Plan:`
- Sections: `## Overview`, `## Tasks`, `## Task Dependency Graph`, `## Notes`
- Tasks: flat checkbox list `- [ ] N. Description` (no sub-headings per task)
- Dependency graph: JSON code block with `{ "waves": [["1"], ["2","3"], ...] }`

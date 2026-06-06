---
inclusion: auto
---
# Color Palette

The API returns a color **name** (e.g., "blue", "teal", "purple"). The web app maps names to hex values. These are the only colors used for activity blocks/time blocks.

## Block Colors (tag colors from API)

| Name | Default | Light | Dark |
|---|---|---|---|
| blue | #12aaff | #88d4ff | #0b6699 |
| green | #89e02d | #c4ef96 | #52861b |
| red | #ff0000 | #ff7f7f | #990000 |
| yellow | #fbd31f | #fde98f | #977f13 |
| orange | #ff9000 | #ffc77f | #995600 |
| teal | #2cdba5 | #95edd2 | #1a8363 |
| purple | #8358ed | #c1abf6 | #4f358e |
| lavender | #f75aff | #fbacff | #943699 |

## Neutral Colors

| Name | Hex |
|---|---|
| black | #000000 |
| white | #ffffff |
| grey | #b2b2b2 |
| grey-dark | #747474 |
| grey-darker | #4d4d4d |
| grey-light | #e2e2e2 |
| grey-lighter | #efefef |
| grey-lightest | #f6f6f6 |

## Priority Colors

| Priority | On (active) | Off (muted) |
|---|---|---|
| critical | #ff4000 | #ffc5b2 |
| high | #ff9900 | #ffe0b2 |
| medium | #ffdd00 | #fff5b2 |
| low | #5195ce | #cadff0 |

## Usage Rules

- Activity blocks use the **light** variant as background, **dark** variant for text/badge, **default** for accents
- Colors are set per-activity by the user (future API: activity-level color field). Default color configurable in user preferences (future API).
- **Phase 1**: API has no color fields yet. Assign colors from the palette based on activity index (deterministic per-session, cycles through the 8 colors). No hashing by tag name.
- When API adds color support, the app will read the color name from the activity response and map it to these hex values.
- If color is null/unknown, fall back to `grey-light` background
- Never use arbitrary colors outside this palette for time blocks

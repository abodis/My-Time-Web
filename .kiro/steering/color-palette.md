# Color Palette

The application uses a fixed color palette for tags and UI elements. Colors are provided as hex values without the `#` prefix in this reference; the API stores them with the `#` prefix (e.g., `#12AAFF`).

## Chromatic Colors

| Color  | Dark   | Normal | Light  |
|--------|--------|--------|--------|
| Blue   | 0B6699 | 12AAFF | 88D4FF |
| Green  | 52861B | 89E02D | C4EF96 |
| Red    | 990000 | FF0000 | FF7F7F |
| Yellow | 977F13 | FBD31F | FDE98F |
| Orange | 995600 | FF9000 | FFC77F |
| Teal   | 1A8363 | 2CDBA5 | 95EDD2 |
| Purple | 4F358E | 8358ED | C1ABF6 |

## Grey Scale

| Darkest | Dark   | Normal | Light  | Lighter | Lightest |
|---------|--------|--------|--------|---------|----------|
| 4D4D4D  | 747474 | B2B2B2 | E2E2E2 | EFEFEF  | F6F6F6   |

## Usage

- **Tags:** Store a color name token (e.g., `"blue"`, `"teal"`) — NOT hex values. If no color is set, the tag has `null` which represents the grey default.
- **Activity colors:** Per-user overrides in settings also store color name tokens (not hex).
- **Grey is reserved:** Signals "unset/default". Users cannot intentionally select grey.
- **Selectable palette:** 7 chromatic names only (blue, green, red, yellow, orange, teal, purple).
- **Inheritance chain:** Activity color = user override > tag color > grey (default).
- **Palette endpoint:** `GET /palette` returns the full name-to-hex mapping so frontends resolve tokens at runtime.
- The frontend presents the 7 chromatic colors as selectable swatches and uses shade variants (dark/normal/light) contextually for rendering.

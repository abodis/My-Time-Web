# Frontend Color Token Migration Guide

## Summary

The API now uses **color token names** instead of hex values. Tags and activity color overrides store strings like `"blue"` or `"teal"` — never `#12AAFF`. A new `GET /palette` endpoint provides the hex mapping for rendering.

## What Changed

| Before | After |
|--------|-------|
| `tag.color = "#3B82F6"` | `tag.color = "blue"` |
| `activityColors = {"<id>": "#12AAFF"}` | `activityColors = {"<id>": "blue"}` |
| No palette endpoint | `GET /palette` returns token → hex map |
| No validation on color values | Only 7 allowed tokens + null |

## Palette Endpoint

**`GET /palette`** — unauthenticated, cacheable.

Returns the full color-to-hex mapping. See `openapi.json` for the response schema.

```json
{
  "blue": { "dark": "#0B6699", "normal": "#12AAFF", "light": "#88D4FF" },
  "green": { "dark": "#52861B", "normal": "#89E02D", "light": "#C4EF96" },
  "red": { "dark": "#990000", "normal": "#FF0000", "light": "#FF7F7F" },
  "yellow": { "dark": "#977F13", "normal": "#FBD31F", "light": "#FDE98F" },
  "orange": { "dark": "#995600", "normal": "#FF9000", "light": "#FFC77F" },
  "teal": { "dark": "#1A8363", "normal": "#2CDBA5", "light": "#95EDD2" },
  "purple": { "dark": "#4F358E", "normal": "#8358ED", "light": "#C1ABF6" },
  "grey": { "darkest": "#4D4D4D", "dark": "#747474", "normal": "#B2B2B2", "light": "#E2E2E2", "lighter": "#EFEFEF", "lightest": "#F6F6F6" }
}
```

Fetch once on app init and cache locally. The palette is static and will not change between requests.

## Allowed Colors

7 selectable tokens: `blue`, `green`, `red`, `yellow`, `orange`, `teal`, `purple`

`grey` is reserved — it represents "no color set" (the default). Users cannot select it.

## Color Resolution (Activity Display)

When displaying an activity's color, resolve in this order:

1. **User override** — check `activityColors[activityId]` from user settings
2. **Tag color** — use `tag.color` from the activity's tag
3. **Default** — use `"grey"` (i.e., palette.grey.normal for the hex)

Use the first non-null value. Then look up the hex shade from the cached palette.

### Shade Usage

Each color has three shades. Suggested usage:

| Shade | Use for |
|-------|---------|
| `dark` | Text on light backgrounds, contrast |
| `normal` | Primary fill, swatches, badges |
| `light` | Backgrounds, hover states, subtle fills |

Grey has additional shades (`darkest`, `lighter`, `lightest`) for UI chrome.

## Frontend Changes Required

### 1. Fetch and cache palette

On app startup, call `GET /palette` and store the result. This is your lookup table for token → hex.

### 2. Update tag color picker

The color picker should show 7 swatches (use `palette[color].normal` for each). When the user selects one, send the **token name** (e.g., `"blue"`) in the request body — not the hex value.

### 3. Update tag create/update requests

```
POST /tags     { "name": "...", "color": "blue", ... }
PUT /tags/{id} { "color": "teal" }
```

Omitting `color` on create → stored as null (grey default). Sending `null` or empty string on update → 400 error.

### 4. Update activity color override requests

```
PATCH /settings/activity-colors { "colors": { "<activityId>": "orange" } }
```

Values must be token names, not hex.

### 5. Update rendering logic

Anywhere you previously used `tag.color` directly as a CSS color (e.g., `style={{ color: tag.color }}`), change to:

```js
const hex = palette[tag.color]?.normal ?? palette.grey.normal;
```

### 6. Handle null/missing colors

- `tag.color === null` → render as grey
- Activity with no override and null tag color → grey
- Archived tags may have null color — treat same as grey

## Error Handling

If the API returns `400` with `"type": "invalid_color"`, the submitted color value wasn't one of the 7 allowed tokens. The error message includes the allowed list.

## OpenAPI Reference

See `openapi.json` for full schema details:
- `ColorToken` enum (components/schemas)
- `GET /palette` endpoint
- `TagCreateRequest.color` / `TagUpdateRequest.color` (nullable ColorToken)
- `ActivityColorsPatchRequest.colors` (additionalProperties: ColorToken)

---
inclusion: fileMatch
fileMatchPattern: "src/pages/app/**,src/components/manage/**"
description: "Management page patterns - lists, forms, tables for CRUD screens"
---

# Management Pages

## Responsive Philosophy

Management pages (Projects, Tags, Team, Account) are **desktop-only** (≥1024px).
- Mobile + tablet-portrait: show only Timer, Entries, simple Reports. No management nav items.
- Tablet-landscape (≥1024px) and above: full management UI available.
- Gate management routes with a breakpoint check or hide nav items below `desktop:`.
- Never build responsive mobile variants of tables/forms — it's wasted effort for this product.

## List Page Anatomy

```
┌─────────────────────────────────────────────────┐
│ [Search input]     [Filters ▾]   [+ New Resource] │  ← toolbar (outside card)
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Page Title (e.g., "All Projects")           │ │  ← inside content card
│ │                                             │ │
│ │ Column  Column  Column  ...  Actions        │ │  ← table header
│ │ ─────────────────────────────────────────── │ │
│ │ Row 1 (white)                               │ │
│ │ Row 2 (striped)                             │ │
│ │ ...                                         │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Rules
- Page wrapper: `p-6 wide:pt-0` (shell handles top alignment).
- Toolbar sits above the content card: search (left, `w-64`), filters (center-left), primary action button (`ml-auto` right).
- Primary action button: `rounded-full bg-[hsl(var(--primary))] text-white` pill with `+ ` prefix on label.
- Content card: `rounded-2xl bg-white shadow-lg p-6`.
- Table: no visible cell borders. Header row: `text-xs font-medium uppercase text-text-muted`. Rows: `border-b border-surface-border`.
- Zebra striping: odd rows `bg-gray-50/50` for readability.
- Actions column (rightmost): icon buttons — edit (navigates to form page), archive/unarchive (toggle).
- Archive icon: `Archive` (default) for active items, `ArchiveRestore` (green) for archived items.
- Inline status indicators on the name column instead of separate columns:
  - Archived: `Archive` icon (gray) before name + gray text (`text-gray-400`).
  - Billable: `CircleDollarSign` icon (green) after name.
- Keep columns minimal — fold boolean states into the name column with icons.
- Empty state: centered muted message inside the card.
- Loading state: centered spinner inside the card.
- Error state: centered message + retry button.
- Filter dropdowns MUST close on outside click.

## Form Page Anatomy

```
┌─────────────────────────────────────────────────┐
│ ← Back to [List]              [Mode indicator]  │  ← top bar
│                                                 │
│                    (mt-4)                        │
│ Page Title                                      │
│ Subtitle (mt-1, tight)                          │  ← only on create, not edit
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Field Label *                               │ │  ← form card
│ │ [full-width input]                          │ │
│ │                                             │ │
│ │ [Field]           [Field]                   │ │  ← 2-col grid
│ │                                             │ │
│ │ [Toggle]          [Toggle]                  │ │  ← 2-col grid, side by side
│ │                                             │ │
│ │ ─────────────────────────────────────────── │ │
│ │                    [Cancel]  [Primary Action]│ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Rules
- Page wrapper: `p-6 wide:pt-0`.
- "← Back to [List]" link: top-left. Mode indicator: top-right, muted text.
- Title `mt-4` below back link (clear separation). Subtitle `mt-1` below title (tight coupling).
- Edit mode: no subtitle (the name is already in the form). Create mode: descriptive subtitle.
- Form card: `rounded-2xl bg-white shadow-lg p-6`.
- Fields: label above input, required marked with `*`.
- Layout: primary field (name) full-width, secondary pairs in `grid grid-cols-1 sm:grid-cols-2 gap-4`.
- Boolean toggles: ALWAYS side by side in 2-col grid, not stacked vertically.
- Separator (`border-t pt-4`) before footer actions.
- Footer: Cancel (ghost button as Link), Primary action (`bg-[hsl(var(--primary))]` rounded-md button).
- Validation: inline errors below fields (`text-xs text-red-500`). No toasts for validation.

## Form Behavior
- Create mode: empty fields, primary button says "Create [Resource]".
- Edit mode: pre-populated fields, primary button says "Save Changes".
- Unsaved changes: no browser-blocking prompt. Cancel navigates back.
- Submit (edit): stay on page, update originalValues ref, show toast "saved successfully" (auto-dismiss 3s).
- Submit (create): on success, navigate to `/resource/:id/edit` (replace) so user stays on form in edit mode. Show toast "created successfully".
- Toast: `fixed bottom-6 right-6 z-50 rounded-lg bg-gray-800 px-4 py-3 text-sm text-white shadow-lg`. Auto-dismiss via `useEffect` + `setTimeout(3000)`.
- Optimistic updates: not required for management pages (low frequency). Invalidate query on success.

## Shared Visual Rules
- Rounded corners: `rounded-2xl` on cards, `rounded-full` on primary action buttons, `rounded-lg` on inputs.
- Shadow: `shadow-lg` on ALL content cards (same as nav card). Single elevation level, no hierarchy.
- Consistent spacing: `p-6` inside cards, `gap-6` between sections.
- Color system: `--primary` (green) = action buttons, switches. `--color-brand` (blue) = nav highlight. Always use `bg-[hsl(var(--primary))]` syntax, never bare `bg-primary`.
- Icons: Lucide React. Used sparingly — in field labels, action buttons, nav items, inline status indicators.

## Switch / Toggle Styling
- Track: `h-7 w-12 rounded-full`. Checked = `bg-[hsl(var(--primary))]` (green). Unchecked = `bg-gray-300`.
- Thumb: `h-5 w-5 rounded-full bg-white shadow-md`. Translates `x-1` (off) to `x-6` (on).
- Must be clearly visible on white card backgrounds — never use `bg-input` for unchecked state.
- Use `@radix-ui/react-switch` primitive, wrapped in shadcn `Switch` component.

## Archive, Not Delete
- No delete action on management resources (projects, tags, activities).
- Archive toggle: moves resource off active lists but retains data.
- Archived items hidden by default, shown via "include archived" filter toggle.
- Active items: `Archive` icon (default color). Archived items: `ArchiveRestore` icon (green, indicating restoration).
- In table name column: archived items get gray text + small archive icon prefix.

## Navigation & Routing
- List pages: `/projects`, `/team`, `/tags` (flat routes).
- Form pages: `/projects/new`, `/projects/:id/edit` (nested routes, same component with mode prop).
- Sub-resources (activities, budgets): tabs or sections on the edit page, not separate routes.
- Route guard: management routes accessible only at `≥desktop` breakpoint.

## Component Structure

```
src/components/manage/
  data-table.tsx         — reusable table (columns config, data, actions, zebra striping)
  search-toolbar.tsx     — search input (w-64) + filters + primary action slot
  form-page-header.tsx   — back link + title (mt-4) + subtitle (mt-1) + mode indicator
  form-card.tsx          — rounded-2xl bg-white shadow-lg p-6
  toggle-field.tsx       — label + description + switch (side by side layout)
```

Pages compose these. Don't over-abstract — if a component is used once, inline it. Extract on second use.

## Primitives Needed (from shadcn/ui)
- Switch (installed — `@radix-ui/react-switch`)
- Select (for filters, if needed)
- Tooltip (for icon-only action buttons)

## Common Mistakes to Avoid
1. Don't use `bg-primary` — use `bg-[hsl(var(--primary))]` (Tailwind 4 issue).
2. Don't stack toggles vertically — always side-by-side in 2-col grid.
3. Don't add top padding to pages on wide — shell handles it with `wide:pt-6`.
4. Don't show subtitle in edit mode — the resource name is already in the form.
5. Don't navigate away on save — stay on page, show toast.
6. Don't use `shadow-sm` — always `shadow-lg` to match nav card.
7. Don't forget outside-click dismissal on dropdowns/popovers.
8. Don't create separate columns for boolean flags — use inline icons on the name column.
9. Don't import from `react-router` — always use `react-router-dom`.
10. Don't send `false` for optional boolean API params — send `undefined` to omit them.

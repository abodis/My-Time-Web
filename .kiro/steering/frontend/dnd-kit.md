---
inclusion: fileMatch
fileMatchPattern: "src/**/*dnd*,src/**/*sortable*,src/**/*drag*"
description: "@dnd-kit/react v0.x patterns and gotchas"
---

# @dnd-kit/react v0.x

## Sortable Setup
- Default sensors (PointerSensor) work out of the box — no `sensors` prop needed for basic drag.
- `OptimisticSortingPlugin` is registered per-sortable-item by default. Do NOT pass it to `DragDropProvider`'s `plugins` prop.
- Use `isSortable(source)` type guard in `onDragEnd` to access `source.index` and `source.initialIndex`.
- Or use `move` helper from `@dnd-kit/helpers` in `onDragOver` for optimistic reordering.

## Drag Handle Pattern (Required when buttons cover the sortable area)
When a `<button>` with `absolute inset-0` covers the sortable element, the PointerSensor CANNOT activate — the button captures pointer events.

Fix: use `handleRef` from `useSortable` on a dedicated drag handle element:
```tsx
const { ref, handleRef } = useSortable({ id, index })

return (
  <div ref={ref}>
    <div ref={handleRef} className="touch-none cursor-grab">
      <GripVertical />
    </div>
    <button onClick={onClick}>...</button>
  </div>
)
```

The handle element needs `touch-none` (CSS `touch-action: none`). The outer wrapper does NOT need it.

## Minimal Working Pattern
```tsx
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'

function SortableItem({ id, index }) {
  const { ref } = useSortable({ id, index })
  return <div ref={ref} className="touch-none">...</div>
}

function List() {
  const [items, setItems] = useState([...])
  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      {items.map((id, index) => <SortableItem key={id} id={id} index={index} />)}
    </DragDropProvider>
  )
}
```

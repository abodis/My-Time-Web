import type { components } from "@/api/schema"

type ReorderItem = components["schemas"]["ReorderItem"]

export const SORT_GAP = 1000
export const MAX_SORT_ORDER = 999_999_999

/** Compute integer midpoint between two adjacent sort orders */
export function computeMidpoint(before: number, after: number): number {
  return Math.floor((before + after) / 2)
}

/** Returns true if any adjacent pair of sort orders differs by less than 2 */
export function needsRebalance(sortedOrders: number[]): boolean {
  for (let i = 0; i < sortedOrders.length - 1; i++) {
    if (sortedOrders[i + 1] - sortedOrders[i] < 2) return true
  }
  return false
}

/** Produce fresh 1000-step gap sort orders for all activity IDs */
export function rebalance(activityIds: string[]): ReorderItem[] {
  return activityIds.map((id, i) => ({
    activityId: id,
    sortOrder: (i + 1) * SORT_GAP,
  }))
}

/**
 * Compute new sort orders after moving an item to newIndex.
 * Returns only items whose sort order changed.
 * If gaps collapse after the move, returns a full rebalance instead.
 */
export function computeReorderPayload(
  items: { id: string; sortOrder: number | null }[],
  movedId: string,
  newIndex: number
): ReorderItem[] {
  const sourceIndex = items.findIndex((item) => item.id === movedId)
  if (sourceIndex === -1) return []

  // Build the new visual order
  const reordered = items.filter((item) => item.id !== movedId)
  const movedItem = items[sourceIndex]
  reordered.splice(newIndex, 0, movedItem)

  // Assign sort orders: use existing values where possible, compute midpoints for moved item
  const ids = reordered.map((item) => item.id)

  // Determine what sort order the moved item needs
  const before = newIndex > 0 ? reordered[newIndex - 1].sortOrder ?? 0 : 0
  const after =
    newIndex < reordered.length - 1
      ? reordered[newIndex + 1].sortOrder ?? (before + SORT_GAP * 2)
      : before + SORT_GAP * 2

  const newSortOrder = computeMidpoint(before, after)

  // Build the candidate orders array to check for collapsed gaps
  const candidateOrders = reordered.map((item, i) => {
    if (i === newIndex) return newSortOrder
    return item.sortOrder ?? (i + 1) * SORT_GAP
  })

  // If gaps collapsed, do a full rebalance
  if (needsRebalance(candidateOrders)) {
    return rebalance(ids)
  }

  // Otherwise return only items whose sort order changed
  const changed: ReorderItem[] = []
  for (let i = 0; i < reordered.length; i++) {
    const original = reordered[i].sortOrder
    const candidate = candidateOrders[i]
    if (candidate !== original) {
      changed.push({ activityId: reordered[i].id, sortOrder: candidate })
    }
  }

  return changed
}

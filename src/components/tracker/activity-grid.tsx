import { useState, useCallback, useEffect } from 'react'
import { DragDropProvider } from '@dnd-kit/react'
import { move } from '@dnd-kit/helpers'
import { useActivities } from '@/hooks/use-activities'
import { useReorderActivities } from '@/hooks/use-reorder-activities'
import { useMarkActivityDone } from '@/hooks/use-mark-activity-done'
import { useActivityColors } from '@/hooks/use-activity-colors'
import { ActivityBlock } from '@/components/tracker/activity-block'
import { SortableActivityCard } from '@/components/tracker/sortable-activity-card'
import { resolveColor } from '@/lib/color-utils'
import { computeReorderPayload } from '@/lib/sort-order-utils'
import { Button } from '@/components/ui/button'
import type { Palette } from '@/hooks/use-palette'
import type { DragEndEvent } from '@dnd-kit/react'

export interface ActivityGridProps {
  onTimerClick: (activityId: string) => void
  timerActivityId: string | null
  timerIsRunning: boolean
  timerElapsed: number
  activityElapsedMap: Map<string, number>
  palette: Palette | undefined
  tagMap: Map<string, string>
  tagColorMap: Map<string, string | null>
  loadingActivityId: string | null
}

export function ActivityGrid({
  onTimerClick,
  timerActivityId,
  timerIsRunning,
  timerElapsed,
  activityElapsedMap,
  palette,
  tagMap,
  tagColorMap,
  loadingActivityId,
}: ActivityGridProps) {
  const [includeDone, setIncludeDone] = useState(false)
  const { activities, doneCount, isLoading, isError, refetch } = useActivities({ includeDone })
  const reorderMutation = useReorderActivities()
  const markDone = useMarkActivityDone()
  const { data: activityColorOverrides } = useActivityColors()

  const [reactivateToast, setReactivateToast] = useState<string | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (!reactivateToast) return
    const timer = setTimeout(() => setReactivateToast(null), 3000)
    return () => clearTimeout(timer)
  }, [reactivateToast])

  const [isDragActive, setIsDragActive] = useState(false)

  // Split activities into active and done
  const activeActivities = activities.filter((a) => !a.isDone)
  const doneActivities = activities.filter((a) => a.isDone)

  // Items for dnd-kit (active only — done activities aren't draggable)
  const [items, setItems] = useState<string[]>([])
  // Keep items in sync with fetched active activities — but NOT during a drag
  const activeIds = activeActivities.map((a) => a.id)
  if (!isDragActive && JSON.stringify(items) !== JSON.stringify(activeIds)) {
    setItems(activeIds)
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled || !event.operation.source) {
        setIsDragActive(false)
        return
      }

      // Compute payload from current visual order (items) vs original sort orders
      const itemsWithSort = activeActivities.map((a) => ({
        id: a.id,
        sortOrder: a.sortOrder ?? null,
      }))
      const movedId = String(event.operation.source.id)
      const newIndex = items.indexOf(movedId)
      if (newIndex === -1) {
        setIsDragActive(false)
        return
      }

      const payload = computeReorderPayload(itemsWithSort, movedId, newIndex)
      if (payload.length > 0) {
        // Keep isDragActive true until optimistic update propagates,
        // preventing the sync block from resetting items to the pre-drag order.
        reorderMutation.mutate(payload, {
          onSettled: () => setIsDragActive(false),
        })
      } else {
        setIsDragActive(false)
      }
    },
    [activeActivities, items, reorderMutation],
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-gutter-xs tablet:grid-cols-[repeat(auto-fill,248px)] tablet:justify-center tablet:gap-gutter-sm desktop:gap-gutter-md wide:gap-gutter-lg">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="relative w-full pb-[50%] tablet:w-[248px] tablet:h-[248px] tablet:pb-0"
          >
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-[hsl(var(--muted))]" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-[hsl(var(--destructive))]">Failed to load activities.</p>
        <Button variant="default" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  if (activeActivities.length === 0 && doneCount === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[hsl(var(--muted-foreground))]">No activities available.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <DragDropProvider
        onDragStart={() => setIsDragActive(true)}
        onDragOver={(event) => {
          setItems((currentItems) => move(currentItems, event))
        }}
        onDragEnd={handleDragEnd}
      >

        <div className="grid grid-cols-1 gap-gutter-xs tablet:grid-cols-[repeat(auto-fill,248px)] tablet:justify-center tablet:gap-gutter-sm desktop:gap-gutter-md wide:gap-gutter-lg">
          {items.map((id, index) => {
            const activity = activeActivities.find((a) => a.id === id)
            if (!activity) return null
            const isRunning = timerIsRunning && timerActivityId === activity.id
            const accumulated = activityElapsedMap.get(activity.id) ?? 0
            const elapsed = isRunning ? timerElapsed + accumulated : accumulated
            const tagColor = tagColorMap.get(activity.tagId) ?? null
            const colorOverride = activityColorOverrides?.[activity.id] ?? undefined
            return (
              <SortableActivityCard
                key={activity.id}
                activity={activity}
                color={resolveColor(palette, colorOverride, tagColor)}
                elapsed={elapsed}
                isRunning={isRunning}
                isLoading={loadingActivityId === activity.id}
                isDragActive={isDragActive}
                index={index}
                onTimerClick={onTimerClick}
              />
            )
          })}
        </div>
      </DragDropProvider>

      {/* Done toggle */}
      {!includeDone && doneCount > 0 && (
        <button
          type="button"
          className="mx-auto text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          onClick={() => setIncludeDone(true)}
        >
          Show {doneCount} done
        </button>
      )}

      {/* Done section */}
      {includeDone && doneActivities.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[hsl(var(--border))]" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              Done ({doneActivities.length})
            </span>
            <div className="h-px flex-1 bg-[hsl(var(--border))]" />
          </div>
          <div className="grid grid-cols-1 gap-gutter-xs opacity-50 tablet:grid-cols-[repeat(auto-fill,248px)] tablet:justify-center tablet:gap-gutter-sm desktop:gap-gutter-md wide:gap-gutter-lg">
            {doneActivities.map((activity) => {
              const tagColor = tagColorMap.get(activity.tagId) ?? null
              const doneColorOverride = activityColorOverrides?.[activity.id] ?? undefined
              return (
                <div key={activity.id} data-activity-id={activity.id}>
                  <ActivityBlock
                    tagName={tagMap.get(activity.tagId) ?? 'Unknown'}
                    color={resolveColor(palette, doneColorOverride, tagColor)}
                    projectName={activity.projectName}
                    activityName={activity.name}
                    elapsed={0}
                    isRunning={false}
                    isLoading={false}
                    onClick={() => {
                      markDone.mutate(
                        { id: activity.id, isDone: false },
                        { onError: () => setReactivateToast("Failed to reactivate") }
                      )
                    }}
                  />
                </div>
              )
            })}
          </div>
          <button
            type="button"
            className="mx-auto text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            onClick={() => setIncludeDone(false)}
          >
            Hide done
          </button>
        </>
      )}

      {reactivateToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-gray-800 px-4 py-3 text-sm text-white shadow-lg animate-[fadeIn_0.2s_ease-out]">
          {reactivateToast}
        </div>
      )}
    </div>
  )
}

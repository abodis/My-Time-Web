import { ActivityGrid } from '@/components/tracker/activity-grid'
import { ActivityBlock } from '@/components/tracker/activity-block'
import { useTrackerData } from '@/hooks/use-tracker-data'
import { useTimerTick } from '@/hooks/use-timer-tick'
import { useBlockClick } from '@/hooks/use-block-click'
import { useTimerStore } from '@/stores/timer-store'
import { getBlockColor } from '@/lib/tag-colors'
import { Button } from '@/components/ui/button'

export default function TrackerPage() {
  const {
    isLoading,
    isError,
    allActivities,
    tagMap,
    activityElapsedMap,
    currentTimer,
    refetchProjects,
  } = useTrackerData()

  const timerControls = useTimerTick(currentTimer)
  const { handleBlockClick, loadingActivityId } = useBlockClick(timerControls)

  // Read reactive state with selectors
  const timerIsRunning = useTimerStore((s) => s.isRunning)
  const timerActivityId = useTimerStore((s) => s.activityId)
  const timerElapsed = useTimerStore((s) => s.elapsed)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-[hsl(var(--muted-foreground))]">Loading activities…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-[hsl(var(--destructive))]">Failed to load activities.</p>
        <Button variant="default" size="sm" onClick={() => refetchProjects()}>
          Retry
        </Button>
      </div>
    )
  }

  if (allActivities.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[hsl(var(--muted-foreground))]">No activities available.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <ActivityGrid>
        {allActivities.map((activity, index) => {
          const isRunning = timerIsRunning && timerActivityId === activity.id
          const accumulated = activityElapsedMap.get(activity.id) ?? 0
          const elapsed = isRunning ? timerElapsed + accumulated : accumulated
          return (
            <ActivityBlock
              key={activity.id}
              tagName={tagMap.get(activity.tagId) ?? 'Unknown'}
              color={getBlockColor(index)}
              projectName={activity.projectName}
              activityName={activity.name}
              elapsed={elapsed}
              isRunning={isRunning}
              isLoading={loadingActivityId === activity.id}
              onClick={() => handleBlockClick(activity.id)}
            />
          )
        })}
      </ActivityGrid>
    </div>
  )
}

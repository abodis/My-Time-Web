import { useEffect } from 'react'
import { ActivityGrid } from '@/components/tracker/activity-grid'
import { TrackerPointer } from '@/components/tracker/tracker-pointer'
import { useTrackerData } from '@/hooks/use-tracker-data'
import { useTimerTick } from '@/hooks/use-timer-tick'
import { useBlockClick } from '@/hooks/use-block-click'
import { useTimerStore } from '@/stores/timer-store'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { usePalette } from '@/hooks/use-palette'
import { Button } from '@/components/ui/button'

export default function TrackerPage() {
  const {
    isLoading,
    isError,
    tagMap,
    tagColorMap,
    activityElapsedMap,
    currentTimer,
    refetchProjects,
  } = useTrackerData()

  const timerControls = useTimerTick(currentTimer)
  const { handleBlockClick, loadingActivityId } = useBlockClick(timerControls)
  const { data: palette } = usePalette()

  // Read reactive state with selectors
  const timerIsRunning = useTimerStore((s) => s.isRunning)
  const timerActivityId = useTimerStore((s) => s.activityId)
  const timerElapsed = useTimerStore((s) => s.elapsed)

  // Auto-dismiss the first-run hint once the user starts their first timer.
  // Guard on the reactive `showTrackerPointer` flag so this is a no-op after
  // dismissal; write imperatively via getState() (Zustand-in-effects rules).
  const showTrackerPointer = useOnboardingStore((s) => s.showTrackerPointer)
  useEffect(() => {
    if (timerIsRunning && showTrackerPointer) {
      useOnboardingStore.getState().dismissTrackerPointer()
    }
  }, [timerIsRunning, showTrackerPointer])

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

  return (
    <div className="flex flex-col gap-6 p-6 wide:pt-0">
      <TrackerPointer />
      <ActivityGrid
        onTimerClick={handleBlockClick}
        timerActivityId={timerActivityId}
        timerIsRunning={timerIsRunning}
        timerElapsed={timerElapsed}
        activityElapsedMap={activityElapsedMap}
        palette={palette}
        tagMap={tagMap}
        tagColorMap={tagColorMap}
        loadingActivityId={loadingActivityId}
      />
    </div>
  )
}

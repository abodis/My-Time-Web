import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useStartTimer, useStopTimer } from "@/hooks/use-timer"
import { useTimerStore } from "@/stores/timer-store"
import type { TimerTickControls } from "@/hooks/use-timer-tick"

export interface BlockClickResult {
  handleBlockClick: (activityId: string) => void
  loadingActivityId: string | null
}

/**
 * Encapsulates activity block click handling: start/stop mutations,
 * loading state, store updates, and query invalidation.
 */
export function useBlockClick(controls: TimerTickControls): BlockClickResult {
  const [loadingActivityId, setLoadingActivityId] = useState<string | null>(null)
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
  const queryClient = useQueryClient()

  const handleBlockClick = useCallback(
    (activityId: string) => {
      const store = useTimerStore.getState()

      if (store.isRunning && store.activityId === activityId) {
        // Clicking the running block → stop it
        setLoadingActivityId(activityId)
        stopTimer.mutate(undefined, {
          onSuccess: () => {
            useTimerStore.getState().stop()
            controls.stopTicking()
            queryClient.invalidateQueries({ queryKey: ["timer", "current"] })
            queryClient.invalidateQueries({ queryKey: ["entries"] })
          },
          onSettled: () => setLoadingActivityId(null),
        })
      } else {
        // Start the clicked activity (API auto-stops any active timer)
        setLoadingActivityId(activityId)
        startTimer.mutate(activityId, {
          onSuccess: (data) => {
            if (data) {
              useTimerStore.getState().start(data.id, data.activityId, data.startTime)
              controls.startTicking()
            }
            queryClient.invalidateQueries({ queryKey: ["timer", "current"] })
            queryClient.invalidateQueries({ queryKey: ["entries"] })
          },
          onSettled: () => setLoadingActivityId(null),
        })
      }
    },
    [startTimer, stopTimer, controls, queryClient],
  )

  return { handleBlockClick, loadingActivityId }
}

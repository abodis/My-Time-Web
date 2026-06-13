import { useRef, useCallback, useEffect } from "react"
import { useTimerStore } from "@/stores/timer-store"
import type { components } from "@/api/schema"

type EntryResponse = components["schemas"]["EntryResponse"]

export interface TimerTickControls {
  startTicking: () => void
  stopTicking: () => void
}

/**
 * Manages interval-based timer ticking and rehydration from server state.
 * Starts a 1-second interval calling tick() when currentTimer indicates
 * an active timer (no endTime). Clears interval on stop or unmount.
 */
export function useTimerTick(
  currentTimer: EntryResponse | null | undefined,
): TimerTickControls {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTicking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => useTimerStore.getState().tick(), 1000)
  }, [])

  const stopTicking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTicking()
  }, [stopTicking])

  // Rehydrate from currentTimer data
  useEffect(() => {
    if (currentTimer && !currentTimer.endTime) {
      useTimerStore.getState().start(currentTimer.id, currentTimer.activityId, currentTimer.startTime)
      startTicking()
    } else if (currentTimer === null) {
      useTimerStore.getState().stop()
      stopTicking()
    }
  }, [currentTimer, startTicking, stopTicking])

  return { startTicking, stopTicking }
}

import { create } from 'zustand'

interface TimerState {
  isRunning: boolean
  activityId: string | null
  entryId: string | null
  startTime: string | null
  elapsed: number
  start: (entryId: string, activityId: string, startTime: string) => void
  stop: () => void
  tick: () => void
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  activityId: null,
  entryId: null,
  startTime: null,
  elapsed: 0,

  start: (entryId, activityId, startTime) => {
    set({
      isRunning: true,
      entryId,
      activityId,
      startTime,
      elapsed: Date.now() - Date.parse(startTime),
    })
  },

  stop: () => {
    set({
      isRunning: false,
      activityId: null,
      entryId: null,
      startTime: null,
      elapsed: 0,
    })
  },

  tick: () => {
    const { startTime } = get()
    if (startTime) {
      set({ elapsed: Date.now() - Date.parse(startTime) })
    }
  },
}))

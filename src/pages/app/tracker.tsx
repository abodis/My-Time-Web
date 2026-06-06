import { useMemo, useRef, useEffect, useCallback, useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { ActivityGrid } from '@/components/tracker/activity-grid'
import { ActivityBlock } from '@/components/tracker/activity-block'
import { useProjects } from '@/hooks/use-projects'
import { useTags } from '@/hooks/use-tags'
import { useCurrentTimer, useStartTimer, useStopTimer } from '@/hooks/use-timer'
import { useEntries } from '@/hooks/use-entries'
import { useTimerStore } from '@/stores/timer-store'
import { getBlockColor } from '@/lib/tag-colors'
import { getStartOfDay, getEndOfDay } from '@/lib/time-utils'
import { client } from '@/api/client'
import { Button } from '@/components/ui/button'

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}h${String(m).padStart(2, '0')}m${String(sec).padStart(2, '0')}s`
}

export default function TrackerPage() {
  const [loadingActivityId, setLoadingActivityId] = useState<string | null>(null)

  const { data: projects, isLoading: projectsLoading, isError: projectsError, refetch: refetchProjects } = useProjects()
  const { data: tags, isLoading: tagsLoading, isError: tagsError } = useTags()
  const { data: currentTimer, isLoading: timerLoading } = useCurrentTimer()
  const { data: todayEntries } = useEntries({
    from: getStartOfDay(),
    to: getEndOfDay(),
  })

  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
  const queryClient = useQueryClient()

  // Read reactive state with selectors
  const timerIsRunning = useTimerStore((s) => s.isRunning)
  const timerActivityId = useTimerStore((s) => s.activityId)
  const timerElapsed = useTimerStore((s) => s.elapsed)

  // Interval management
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const accumulatedRef = useRef<Map<string, number>>(new Map())

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

  // Rehydrate from useCurrentTimer data
  useEffect(() => {
    if (currentTimer && !currentTimer.endTime) {
      useTimerStore.getState().start(currentTimer.id, currentTimer.activityId, currentTimer.startTime)
      startTicking()
    } else if (currentTimer === null) {
      useTimerStore.getState().stop()
      stopTicking()
    }
  }, [currentTimer, startTicking, stopTicking])

  // Click handler for activity blocks
  const handleBlockClick = useCallback((activityId: string) => {
    const store = useTimerStore.getState()

    if (store.isRunning && store.activityId === activityId) {
      // Clicking the running block → stop it
      console.log(`[Timer] STOP clicked | elapsed: ${fmt(store.elapsed)}`)
      setLoadingActivityId(activityId)
      stopTimer.mutate(undefined, {
        onSuccess: () => {
          useTimerStore.getState().stop()
          stopTicking()
          console.log('[Timer] STOPPED')
          queryClient.invalidateQueries({ queryKey: ["timer", "current"] })
          queryClient.invalidateQueries({ queryKey: ["entries"] })
        },
        onSettled: () => setLoadingActivityId(null),
      })
    } else {
      // Start the clicked activity (API auto-stops any active timer)
      const prev = store.isRunning ? `switching from ${store.activityId} (${fmt(store.elapsed)})` : 'idle'
      const accum = accumulatedRef.current.get(activityId) ?? 0
      console.log(`[Timer] START clicked | ${prev} → ${activityId} | accumulated=${fmt(accum)}`)
      setLoadingActivityId(activityId)
      startTimer.mutate(activityId, {
        onSuccess: (data) => {
          if (data) {
            const now = new Date().toISOString()
            const liveElapsed = Date.now() - Date.parse(data.startTime)
            console.log(`[Timer] STARTED | entry=${data.id} | startTime=${data.startTime} | now=${now} | liveElapsed=${fmt(liveElapsed)}`)
            useTimerStore.getState().start(data.id, data.activityId, data.startTime)
            startTicking()
          }
          queryClient.invalidateQueries({ queryKey: ["timer", "current"] })
          queryClient.invalidateQueries({ queryKey: ["entries"] })
        },
        onSettled: () => setLoadingActivityId(null),
      })
    }
  }, [startTimer, stopTimer, startTicking, stopTicking, queryClient])

  // Fetch activities for each non-archived project
  const nonArchivedProjects = useMemo(
    () => (projects ?? []).filter((p) => !p.isArchived),
    [projects],
  )

  const activityQueries = useQueries({
    queries: nonArchivedProjects.map((project) => ({
      queryKey: ['activities', project.id],
      queryFn: async () => {
        const { data, error } = await client.GET('/projects/{id}/activities', {
          params: { path: { id: project.id } },
        })
        if (error) throw error
        return data
      },
      enabled: !!project.id,
    })),
  })

  const activitiesLoading = activityQueries.some((q) => q.isLoading)
  const activitiesError = activityQueries.some((q) => q.isError)

  const isLoading = projectsLoading || tagsLoading || timerLoading || activitiesLoading
  const isError = projectsError || tagsError || activitiesError

  // Build a flat list of activities with their project name
  const allActivities = useMemo(() => {
    const result: Array<{
      id: string
      name: string
      tagId: string
      projectId: string
      projectName: string
    }> = []

    for (let i = 0; i < nonArchivedProjects.length; i++) {
      const project = nonArchivedProjects[i]
      const activities = activityQueries[i]?.data
      if (activities) {
        for (const activity of activities) {
          result.push({
            id: activity.id,
            name: activity.name,
            tagId: activity.tagId,
            projectId: activity.projectId,
            projectName: project.name,
          })
        }
      }
    }

    return result
  }, [nonArchivedProjects, activityQueries])

  // Tag lookup map
  const tagMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const tag of tags ?? []) {
      map.set(tag.id, tag.name)
    }
    return map
  }, [tags])

  // Accumulated time per activity from today's completed entries
  const activityElapsedMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of todayEntries ?? []) {
      if (entry.startTime && entry.endTime) {
        const duration = Date.parse(entry.endTime) - Date.parse(entry.startTime)
        map.set(entry.activityId, (map.get(entry.activityId) ?? 0) + duration)
      }
    }
    if (map.size > 0) {
      const readable = Object.fromEntries([...map].map(([k, v]) => [k, fmt(v)]))
      console.log('[Timer] accumulated updated:', readable)
    }
    accumulatedRef.current = map
    return map
  }, [todayEntries])

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

import { useMemo } from "react"
import { useProjects } from "@/hooks/use-projects"
import { useTags } from "@/hooks/use-tags"
import { useCurrentTimer } from "@/hooks/use-timer"
import { useEntries } from "@/hooks/use-entries"
import { getStartOfDay, getEndOfDay } from "@/lib/time-utils"
import type { components } from "@/api/schema"

type EntryResponse = components["schemas"]["EntryResponse"]

/**
 * Pure function: computes accumulated elapsed milliseconds per activity
 * from a list of completed time entries.
 */
export function computeElapsedMap(entries: EntryResponse[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const entry of entries) {
    if (entry.startTime && entry.endTime) {
      const duration = Date.parse(entry.endTime) - Date.parse(entry.startTime)
      map.set(entry.activityId, (map.get(entry.activityId) ?? 0) + duration)
    }
  }
  return map
}

export interface TrackerData {
  isLoading: boolean
  isError: boolean
  tagMap: Map<string, string>
  tagColorMap: Map<string, string | null>
  activityElapsedMap: Map<string, number>
  currentTimer: EntryResponse | null | undefined
  refetchProjects: () => void
}

export function useTrackerData(): TrackerData {
  const {
    isLoading: projectsLoading,
    isError: projectsError,
    refetch: refetchProjects,
  } = useProjects()
  const { data: tags, isLoading: tagsLoading, isError: tagsError } = useTags()
  const { data: currentTimer, isLoading: timerLoading } = useCurrentTimer()
  const { data: todayEntries } = useEntries({
    from: getStartOfDay(),
    to: getEndOfDay(),
  })

  const isLoading = projectsLoading || tagsLoading || timerLoading
  const isError = projectsError || tagsError

  const tagMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const tag of tags ?? []) {
      map.set(tag.id, tag.name)
    }
    return map
  }, [tags])

  const tagColorMap = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const tag of tags ?? []) {
      map.set(tag.id, tag.color ?? null)
    }
    return map
  }, [tags])

  const activityElapsedMap = useMemo(
    () => computeElapsedMap(todayEntries ?? []),
    [todayEntries],
  )

  return {
    isLoading,
    isError,
    tagMap,
    tagColorMap,
    activityElapsedMap,
    currentTimer,
    refetchProjects,
  }
}

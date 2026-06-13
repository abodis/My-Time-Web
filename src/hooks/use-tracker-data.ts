import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import { useProjects } from "@/hooks/use-projects"
import { useTags } from "@/hooks/use-tags"
import { useCurrentTimer } from "@/hooks/use-timer"
import { useEntries } from "@/hooks/use-entries"
import { getStartOfDay, getEndOfDay } from "@/lib/time-utils"
import { client } from "@/api/client"
import type { components } from "@/api/schema"

type EntryResponse = components["schemas"]["EntryResponse"]
type ActivityResponse = components["schemas"]["ActivityResponse"]
type ProjectResponse = components["schemas"]["ProjectResponse"]

export interface FlatActivity {
  id: string
  name: string
  tagId: string
  projectId: string
  projectName: string
}

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

/**
 * Pure function: flattens per-project activity arrays into a single list
 * with project name attached to each activity.
 */
export function flattenActivities(
  projects: ProjectResponse[],
  activityResults: Array<ActivityResponse[] | undefined>,
): FlatActivity[] {
  const result: FlatActivity[] = []
  for (let i = 0; i < projects.length; i++) {
    const activities = activityResults[i]
    if (activities) {
      for (const activity of activities) {
        result.push({
          id: activity.id,
          name: activity.name,
          tagId: activity.tagId,
          projectId: activity.projectId,
          projectName: projects[i].name,
        })
      }
    }
  }
  return result
}

export interface TrackerData {
  isLoading: boolean
  isError: boolean
  allActivities: FlatActivity[]
  tagMap: Map<string, string>
  activityElapsedMap: Map<string, number>
  currentTimer: EntryResponse | null | undefined
  refetchProjects: () => void
}

export function useTrackerData(): TrackerData {
  const {
    data: projects,
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

  // Fetch activities for each non-archived project
  const nonArchivedProjects = useMemo(
    () => (projects ?? []).filter((p) => !p.isArchived),
    [projects],
  )

  const activityQueries = useQueries({
    queries: nonArchivedProjects.map((project) => ({
      queryKey: ["activities", project.id],
      queryFn: async () => {
        const { data, error } = await client.GET("/projects/{id}/activities", {
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

  const allActivities = useMemo(
    () => flattenActivities(nonArchivedProjects, activityQueries.map((q) => q.data)),
    [nonArchivedProjects, activityQueries],
  )

  const tagMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const tag of tags ?? []) {
      map.set(tag.id, tag.name)
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
    allActivities,
    tagMap,
    activityElapsedMap,
    currentTimer,
    refetchProjects,
  }
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import { queryKeys } from "@/api/query-keys"
import type { components } from "@/api/schema"

export function useProjects(options?: { includeArchived?: boolean }) {
  const includeArchived = options?.includeArchived ?? false
  return useQuery({
    queryKey: queryKeys.projects.list({ includeArchived }),
    queryFn: async () => {
      const { data, error } = await client.GET("/projects", {
        params: { query: { includeArchived: includeArchived || undefined } },
      })
      if (error) throw error
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useActivities(projectId: string) {
  return useQuery({
    queryKey: queryKeys.activities.byProject(projectId),
    queryFn: async () => {
      const { data, error } = await client.GET("/projects/{id}/activities", {
        params: { path: { id: projectId } },
      })
      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

type ProjectCreateRequest = components["schemas"]["ProjectCreateRequest"]

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: ProjectCreateRequest) => {
      const { data, error } = await client.POST("/projects", { body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() })
    },
  })
}

type ProjectUpdateRequest = components["schemas"]["ProjectUpdateRequest"]

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: ProjectUpdateRequest }) => {
      const { data, error } = await client.PUT("/projects/{id}", {
        params: { path: { id } },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() })
    },
  })
}

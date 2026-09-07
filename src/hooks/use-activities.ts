import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import { queryKeys } from "@/api/query-keys"
import type { components } from "@/api/schema"

type ActivityCreateRequest = components["schemas"]["ActivityCreateRequest"]
type ActivityUpdateRequest = components["schemas"]["ActivityUpdateRequest"]

export function useActivities({ includeDone }: { includeDone?: boolean } = {}) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.activities.list({ includeDone }),
    queryFn: async () => {
      const { data, error } = await client.GET("/activities", {
        params: {
          query: { includeDone: includeDone ? true : undefined },
        },
      })
      if (error) throw error
      return data
    },
    placeholderData: (prev) => prev,
  })

  return {
    activities: data?.activities ?? [],
    doneCount: data?.meta.doneCount ?? 0,
    isLoading,
    isError,
    refetch,
  }
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, body }: { projectId: string; body: ActivityCreateRequest }) => {
      const { data, error } = await client.POST("/projects/{id}/activities", {
        params: { path: { id: projectId } },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all() })
    },
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId: _projectId, body }: { id: string; projectId: string; body: ActivityUpdateRequest }) => {
      const { data, error } = await client.PUT("/activities/{id}", {
        params: { path: { id } },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all() })
    },
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId: _projectId }: { id: string; projectId: string }) => {
      const { error } = await client.DELETE("/activities/{id}", {
        params: { path: { id } },
      })
      if (error) throw error
    },
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all() })
    },
  })
}

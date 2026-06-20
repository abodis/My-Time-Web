import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import type { components } from "@/api/schema"

type AssignmentResponse = components["schemas"]["AssignmentResponse"]

export function useAssignments(activityId: string) {
  return useQuery({
    queryKey: ["assignments", activityId],
    queryFn: async () => {
      const { data, error } = await client.GET("/activities/{id}/assignments", {
        params: { path: { id: activityId } },
      })
      if (error) throw error
      return data as AssignmentResponse[]
    },
  })
}

export function useAssignActivity(activityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await client.POST("/activities/{id}/assignments", {
        params: { path: { id: activityId } },
        body: { userId },
      })
      if (error) throw error
      return data
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["assignments", activityId] })
      const previous = queryClient.getQueryData<AssignmentResponse[]>(["assignments", activityId])
      queryClient.setQueryData<AssignmentResponse[]>(
        ["assignments", activityId],
        (old) => [...(old ?? []), { activityId, userId, assignedAt: new Date().toISOString() }]
      )
      return { previous }
    },
    onError: (_err, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["assignments", activityId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", activityId] })
    },
  })
}

export function useUnassignActivity(activityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await client.DELETE("/activities/{id}/assignments/{userId}", {
        params: { path: { id: activityId, userId } },
      })
      if (error) throw error
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["assignments", activityId] })
      const previous = queryClient.getQueryData<AssignmentResponse[]>(["assignments", activityId])
      queryClient.setQueryData<AssignmentResponse[]>(
        ["assignments", activityId],
        (old) => (old ?? []).filter((a) => a.userId !== userId)
      )
      return { previous }
    },
    onError: (_err, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["assignments", activityId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", activityId] })
    },
  })
}

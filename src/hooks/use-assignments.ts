import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import { listAppend, listRemove } from "@/lib/optimistic"
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
      const { previousData, rollback } = await listAppend<AssignmentResponse>(
        queryClient,
        ["assignments", activityId],
        { activityId, userId, assignedAt: new Date().toISOString() },
      )
      return { previousData, rollback }
    },
    onError: (_err, _userId, context) => {
      context?.rollback()
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
      const { previousData, rollback } = await listRemove<AssignmentResponse>(
        queryClient,
        ["assignments", activityId],
        (a) => a.userId === userId,
      )
      return { previousData, rollback }
    },
    onError: (_err, _userId, context) => {
      context?.rollback()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", activityId] })
    },
  })
}

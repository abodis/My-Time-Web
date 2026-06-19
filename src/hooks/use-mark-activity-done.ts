import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import type { components } from "@/api/schema"

export function useMarkActivityDone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isDone }: { id: string; isDone: boolean }) => {
      const { data, error, response } = await client.PATCH(
        "/activities/{id}/done",
        {
          params: { path: { id } },
          body: { isDone },
        }
      )

      if (error) {
        if (response.status === 409) {
          throw { code: "timer_running", message: "Stop the timer first" }
        }
        if (response.status === 404) {
          // Treat as success — activity already gone (stale)
          return { activityId: id, isDone, doneAt: null }
        }
        throw error
      }

      return data
    },
    onMutate: async ({ id, isDone }) => {
      await queryClient.cancelQueries({ queryKey: ["activities"] })

      const previousQueries = queryClient.getQueriesData<
        components["schemas"]["EnrichedActivitiesResponse"]
      >({ queryKey: ["activities"], exact: false })

      if (isDone) {
        // Optimistically remove from cached activities arrays
        previousQueries.forEach(([key, data]) => {
          if (!data || !data.activities || !data.meta) return
          queryClient.setQueryData(key, {
            ...data,
            activities: data.activities.filter((a) => a.id !== id),
            meta: { ...data.meta, doneCount: data.meta.doneCount + 1 },
          })
        })
      }

      return { previousQueries }
    },
    onError: (_err, _vars, context) => {
      // Don't rollback for timer_running — the card stays visible anyway
      // (component handles showing toast)
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}

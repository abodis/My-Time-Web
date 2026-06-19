import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import type { components } from "@/api/schema"

type ReorderItem = components["schemas"]["ReorderItem"]

export function useReorderActivities() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (order: ReorderItem[]) => {
      const { data, error } = await client.PATCH("/activities/reorder", {
        body: { order },
      })
      if (error) throw error
      return data
    },
    onMutate: async (order) => {
      await queryClient.cancelQueries({ queryKey: ["activities"] })

      const previousQueries = queryClient.getQueriesData<
        components["schemas"]["EnrichedActivitiesResponse"]
      >({ queryKey: ["activities"] })

      // Build a map of activityId → new sortOrder from the payload
      const sortOrderMap = new Map(
        order.map((item) => [item.activityId, item.sortOrder])
      )

      // Optimistically update each matching query cache
      previousQueries.forEach(([key, data]) => {
        if (!data) return
        const updated = data.activities.map((activity) => {
          const newSort = sortOrderMap.get(activity.id)
          if (newSort !== undefined) {
            return { ...activity, sortOrder: newSort }
          }
          return activity
        })
        // Re-sort by sortOrder ascending (null last)
        updated.sort((a, b) => {
          const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER
          const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER
          return aOrder - bOrder
        })
        queryClient.setQueryData(key, { ...data, activities: updated })
      })

      return { previousQueries }
    },
    onError: (_err, _vars, context) => {
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

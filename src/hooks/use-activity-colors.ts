import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import type { ColorToken } from "@/lib/color-utils"

/** Fetch per-activity color overrides */
export function useActivityColors() {
  return useQuery({
    queryKey: ["settings", "activity-colors"],
    queryFn: async () => {
      const { data, error } = await client.GET("/settings/activity-colors")
      if (error) throw error
      return data as Record<string, string>
    },
  })
}

export function useUpdateActivityColor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      activityId,
      color,
    }: {
      activityId: string
      color: ColorToken
    }) => {
      const { data, error } = await client.PATCH("/settings/activity-colors", {
        body: { colors: { [activityId]: color } },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "activity-colors"] })
    },
  })
}

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import type { ColorToken } from "@/lib/color-utils"

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
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    },
  })
}

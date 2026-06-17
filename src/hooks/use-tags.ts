import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import type { ColorToken } from "@/lib/color-utils"

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await client.GET("/tags")
      if (error) throw error
      return data
    },
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      name,
      color,
    }: {
      name: string
      color?: ColorToken | null
    }) => {
      const { data, error } = await client.POST("/tags", {
        body: { name, color },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      name,
      color,
    }: {
      id: string
      name?: string | null
      color?: ColorToken | null
    }) => {
      const { data, error } = await client.PUT("/tags/{id}", {
        params: { path: { id } },
        body: { name, color },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}

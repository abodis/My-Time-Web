import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import type { components } from "@/api/schema"

type EntryCreateRequest = components["schemas"]["EntryCreateRequest"]
type EntryUpdateRequest = components["schemas"]["EntryUpdateRequest"]

export function useEntries({ from, to }: { from: string; to: string }) {
  return useQuery({
    queryKey: ["entries", { from, to }],
    queryFn: async () => {
      const { data, error } = await client.GET("/entries", {
        params: { query: { from, to } },
      })
      if (error) throw error
      return data
    },
  })
}

export function useCreateEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: EntryCreateRequest) => {
      const { data, error } = await client.POST("/entries", {
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] })
    },
  })
}

export function useUpdateEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: EntryUpdateRequest }) => {
      const { data, error } = await client.PUT("/entries/{id}", {
        params: { path: { id } },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] })
    },
  })
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await client.DELETE("/entries/{id}", {
        params: { path: { id } },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/api/client"
import type { components } from "@/api/schema"

type EntryNoteCreateRequest = components["schemas"]["EntryNoteCreateRequest"]

export function useEntryNotes(entryId: string) {
  return useQuery({
    queryKey: ["entry-notes", entryId],
    queryFn: async () => {
      const { data, error } = await client.GET("/entries/{id}/notes", {
        params: { path: { id: entryId } },
      })
      if (error) throw error
      return data
    },
    enabled: !!entryId,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ entryId, body }: { entryId: string; body: EntryNoteCreateRequest }) => {
      const { data, error } = await client.POST("/entries/{id}/notes", {
        params: { path: { id: entryId } },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["entry-notes", variables.entryId] })
    },
  })
}
